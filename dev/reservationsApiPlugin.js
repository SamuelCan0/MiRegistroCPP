import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import process from 'node:process'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  getAdminEmails,
  hashPassword,
  hashSessionToken,
  isInstitutionalEmail,
  normalizeEmail,
  PASSWORD_ITERATIONS,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
  publicUser,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  sessionExpiry,
  validatePassword,
  verifyPassword,
} from '../worker/auth.js'
import { validatePayload } from '../worker/reservationRules.js'

const requestColumns = `
  id,
  title,
  type,
  date,
  start_time AS startTime,
  end_time AS endTime,
  responsible,
  notes,
  status,
  created_by_user_id AS createdByUserId,
  created_at AS createdAt,
  updated_at AS updatedAt
`

const userColumns = `
  id,
  email,
  display_name AS displayName,
  role,
  password_hash AS passwordHash,
  password_salt AS passwordSalt,
  password_iterations AS passwordIterations
`

function sendJson(response, payload, status = 200, headers = {}) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value)
  }
  response.end(JSON.stringify(payload))
}

function readJson(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) {
        rejectBody(new Error('La solicitud es demasiado grande.'))
        request.destroy()
      }
    })
    request.on('end', () => {
      try {
        resolveBody(JSON.parse(body || '{}'))
      } catch {
        rejectBody(new Error('La solicitud no contiene datos válidos.'))
      }
    })
    request.on('error', rejectBody)
  })
}

function createDatabase() {
  const dataDirectory = resolve('.data')
  mkdirSync(dataDirectory, { recursive: true })
  const database = new DatabaseSync(resolve(dataDirectory, 'reservations.sqlite'))

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      password_hash TEXT,
      password_salt TEXT,
      password_iterations INTEGER NOT NULL DEFAULT ${PASSWORD_ITERATIONS},
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at);
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      responsible TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Programada',
      created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS requests_schedule_idx
      ON requests (type, date, start_time, end_time);
    INSERT OR IGNORE INTO users (
      id, email, display_name, role, password_hash,
      password_salt, password_iterations
    ) VALUES (
      '${PRIMARY_ADMIN_ID}',
      'samuel-sistemas@colegiopedropalacios.edu.mx',
      'Samuel Sistemas',
      'admin',
      'Kh84Zym1dU1UNOAOf1GuVOCFDStWbdTFPSA1Cr6vcHY',
      'TRFXVnSMJBVXI4Yart1FLA',
      210000
    );
  `)

  const userColumnsInfo = database.prepare('PRAGMA table_info(users)').all()
  const passwordHashColumn = userColumnsInfo.find(
    (column) => column.name === 'password_hash',
  )
  if (passwordHashColumn?.notnull) {
    database.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        password_hash TEXT,
        password_salt TEXT,
        password_iterations INTEGER NOT NULL DEFAULT ${PASSWORD_ITERATIONS},
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login_at TEXT
      );
      INSERT INTO users_new
      SELECT * FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
      COMMIT;
      PRAGMA foreign_keys = ON;
    `)
  }

  const requestColumnsInfo = database.prepare('PRAGMA table_info(requests)').all()
  if (!requestColumnsInfo.some((column) => column.name === 'created_by_user_id')) {
    database.exec(
      'ALTER TABLE requests ADD COLUMN created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL',
    )
  }
  database
    .prepare("UPDATE requests SET status = 'Programada' WHERE status = 'Pendiente'")
    .run()
  return database
}

function readSessionToken(request) {
  const cookie = request.headers.cookie || ''
  const item = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return item ? decodeURIComponent(item.slice(SESSION_COOKIE.length + 1)) : ''
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}`
}

async function getCurrentUser(database, request) {
  const token = readSessionToken(request)
  if (!token) return null
  return (
    database
      .prepare(
        `SELECT ${userColumns}
         FROM sessions
         INNER JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ?1
           AND sessions.expires_at > CURRENT_TIMESTAMP`,
      )
      .get(await hashSessionToken(token)) || null
  )
}

async function createSession(database, request, response, user) {
  const credentials = await hashPassword(randomUUID())
  const token = `${randomUUID()}${credentials.hash}`
  database
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?1, ?2, ?3)`,
    )
    .run(await hashSessionToken(token), user.id, sessionExpiry())
  sendJson(
    response,
    { user: publicUser(user) },
    200,
    { 'Set-Cookie': sessionCookie(token) },
  )
}

async function setupPassword(database, request, response) {
  const payload = await readJson(request)
  const email = normalizeEmail(payload.email)
  const passwordError = validatePassword(payload.password)

  if (!isInstitutionalEmail(email)) {
    return sendJson(
      response,
      { error: 'Usa tu correo institucional @colegiopedropalacios.edu.mx.' },
      400,
    )
  }
  if (passwordError) return sendJson(response, { error: passwordError }, 400)

  const user = database
    .prepare(`SELECT ${userColumns} FROM users WHERE email = ?1`)
    .get(email)
  if (!user) {
    return sendJson(
      response,
      { error: 'Este correo no está autorizado. Contacta a Administración.' },
      403,
    )
  }
  if (user.passwordHash) {
    return sendJson(
      response,
      { error: 'Esta cuenta ya tiene contraseña. Inicia sesión normalmente.' },
      409,
    )
  }

  const credentials = await hashPassword(payload.password)
  user.passwordHash = credentials.hash
  user.passwordSalt = credentials.salt
  user.passwordIterations = credentials.iterations
  database
    .prepare(
      `UPDATE users
       SET password_hash = ?1, password_salt = ?2, password_iterations = ?3,
           last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`,
    )
    .run(
      credentials.hash,
      credentials.salt,
      credentials.iterations,
      user.id,
    )
  return createSession(database, request, response, user)
}

async function login(database, request, response) {
  const payload = await readJson(request)
  const email = normalizeEmail(payload.email)
  let user = database
    .prepare(`SELECT ${userColumns} FROM users WHERE email = ?1`)
    .get(email)

  if (!user && getAdminEmails(process.env).has(email)) {
    user = {
      id: randomUUID(),
      email,
      displayName: 'Administración',
      role: 'admin',
      passwordHash: null,
      passwordSalt: null,
      passwordIterations: PASSWORD_ITERATIONS,
    }
    database
      .prepare(
        `INSERT INTO users (
           id, email, display_name, role, password_hash,
           password_salt, password_iterations
         )
         VALUES (?1, ?2, ?3, 'admin', NULL, NULL, ?4)`,
      )
      .run(user.id, user.email, user.displayName, user.passwordIterations)
  }
  if (user && !user.passwordHash) {
    return sendJson(
      response,
      {
        error: 'Debes crear tu contraseña para completar el acceso.',
        code: 'PASSWORD_SETUP_REQUIRED',
      },
      409,
    )
  }

  if (
    !user ||
    !(await verifyPassword(
      payload.password,
      user.passwordHash,
      user.passwordSalt,
      user.passwordIterations,
    ))
  ) {
    return sendJson(response, { error: 'Correo o contraseña incorrectos.' }, 401)
  }

  if (getAdminEmails(process.env).has(user.email) && user.role !== 'admin') {
    user.role = 'admin'
    database
      .prepare(
        `UPDATE users
         SET role = 'admin', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?1`,
      )
      .run(user.id)
  }
  database
    .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?1')
    .run(user.id)
  return createSession(database, request, response, user)
}

async function handleAuth(database, request, response, url) {
  if (url.pathname === '/api/auth/session' && request.method === 'GET') {
    const user = await getCurrentUser(database, request)
    return sendJson(response, { user: user ? publicUser(user) : null })
  }
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    return login(database, request, response)
  }
  if (url.pathname === '/api/auth/setup-password' && request.method === 'POST') {
    return setupPassword(database, request, response)
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const token = readSessionToken(request)
    if (token) {
      database
        .prepare('DELETE FROM sessions WHERE token_hash = ?1')
        .run(await hashSessionToken(token))
    }
    return sendJson(
      response,
      { success: true },
      200,
      {
        'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      },
    )
  }
  return sendJson(response, { error: 'Ruta de autenticación no encontrada.' }, 404)
}

function listRequests(database, response) {
  const rows = database
    .prepare(
      `SELECT ${requestColumns}
       FROM requests
       ORDER BY date ASC, start_time ASC, created_at ASC`,
    )
    .all()
  sendJson(response, { requests: rows })
}

async function createRequest(database, request, response, user) {
  const validation = validatePayload(await readJson(request))
  if (validation.error) return sendJson(response, { error: validation.error }, 400)

  const value = validation.value
  const created = database
    .prepare(
      `INSERT INTO requests (
         id, title, type, date, start_time, end_time,
         responsible, notes, status, created_by_user_id
       )
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'Programada', ?9
       WHERE NOT EXISTS (
         SELECT 1 FROM requests
         WHERE type = ?3 AND date = ?4
           AND start_time < ?6 AND end_time > ?5
       )
       RETURNING ${requestColumns}`,
    )
    .get(
      randomUUID(),
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
      user.id,
    )

  return created
    ? sendJson(response, { request: created }, 201)
    : sendJson(
        response,
        {
          error:
            'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
          code: 'SCHEDULE_CONFLICT',
        },
        409,
      )
}

async function updateRequest(database, request, response, id) {
  const validation = validatePayload(await readJson(request))
  if (validation.error) return sendJson(response, { error: validation.error }, 400)

  const value = validation.value
  const updated = database
    .prepare(
      `UPDATE requests
       SET title = ?1, type = ?2, date = ?3, start_time = ?4,
           end_time = ?5, responsible = ?6, notes = ?7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?8
         AND NOT EXISTS (
           SELECT 1 FROM requests AS conflicting
           WHERE conflicting.id <> ?8
             AND conflicting.type = ?2 AND conflicting.date = ?3
             AND conflicting.start_time < ?5
             AND conflicting.end_time > ?4
         )
       RETURNING ${requestColumns}`,
    )
    .get(
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
      id,
    )

  if (updated) return sendJson(response, { request: updated })
  const existing = database.prepare('SELECT id FROM requests WHERE id = ?1').get(id)
  return existing
    ? sendJson(
        response,
        {
          error:
            'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
          code: 'SCHEDULE_CONFLICT',
        },
        409,
      )
    : sendJson(response, { error: 'La solicitud ya no existe.' }, 404)
}

function deleteRequest(database, response, id) {
  const result = database.prepare('DELETE FROM requests WHERE id = ?1').run(id)
  return result.changes
    ? sendJson(response, { success: true })
    : sendJson(response, { error: 'La solicitud ya no existe.' }, 404)
}

const managedUserColumns = `
  id,
  email,
  display_name AS displayName,
  role,
  CASE WHEN password_hash IS NULL THEN 0 ELSE 1 END AS isActive,
  CASE WHEN email = '${PRIMARY_ADMIN_EMAIL}' THEN 1 ELSE 0 END AS isProtected,
  created_at AS createdAt,
  last_login_at AS lastLoginAt
`

function listUsers(database, response) {
  const users = database
    .prepare(
      `SELECT ${managedUserColumns}
       FROM users
       ORDER BY role ASC, display_name COLLATE NOCASE ASC`,
    )
    .all()
  sendJson(response, { users })
}

async function createManagedUser(database, request, response) {
  const payload = await readJson(request)
  const email = normalizeEmail(payload.email)
  const displayName = String(payload.displayName || '').trim()
  const role = payload.role === 'admin' ? 'admin' : 'user'

  if (!isInstitutionalEmail(email)) {
    return sendJson(
      response,
      { error: 'Usa un correo @colegiopedropalacios.edu.mx.' },
      400,
    )
  }
  if (displayName.length < 2 || displayName.length > 80) {
    return sendJson(
      response,
      { error: 'Escribe el nombre completo del usuario.' },
      400,
    )
  }
  if (database.prepare('SELECT id FROM users WHERE email = ?1').get(email)) {
    return sendJson(response, { error: 'Este correo ya está registrado.' }, 409)
  }

  const user = database
    .prepare(
      `INSERT INTO users (
         id, email, display_name, role, password_hash, password_salt
       )
       VALUES (?1, ?2, ?3, ?4, NULL, NULL)
       RETURNING ${managedUserColumns}`,
    )
    .get(randomUUID(), email, displayName, role)
  return sendJson(response, { user }, 201)
}

async function updateManagedUser(
  database,
  request,
  response,
  id,
  currentUser,
) {
  const payload = await readJson(request)
  const displayName = String(payload.displayName || '').trim()
  const role = payload.role === 'admin' ? 'admin' : 'user'
  if (displayName.length < 2 || displayName.length > 80) {
    return sendJson(
      response,
      { error: 'Escribe el nombre completo del usuario.' },
      400,
    )
  }
  const target = database
    .prepare('SELECT email FROM users WHERE id = ?1')
    .get(id)
  if (
    (id === currentUser.id ||
      id === PRIMARY_ADMIN_ID ||
      target?.email === PRIMARY_ADMIN_EMAIL) &&
    role !== 'admin'
  ) {
    return sendJson(
      response,
      { error: 'No puedes quitar tu propio permiso de administrador.' },
      400,
    )
  }

  const user = database
    .prepare(
      `UPDATE users
       SET display_name = ?1, role = ?2, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?3
       RETURNING ${managedUserColumns}`,
    )
    .get(displayName, role, id)
  return user
    ? sendJson(response, { user })
    : sendJson(response, { error: 'El usuario ya no existe.' }, 404)
}

function deleteManagedUser(database, response, id, currentUser) {
  const target = database
    .prepare('SELECT email FROM users WHERE id = ?1')
    .get(id)
  if (
    id === currentUser.id ||
    id === PRIMARY_ADMIN_ID ||
    target?.email === PRIMARY_ADMIN_EMAIL
  ) {
    return sendJson(
      response,
      { error: 'La cuenta administradora principal no se puede eliminar.' },
      400,
    )
  }
  const result = database.prepare('DELETE FROM users WHERE id = ?1').run(id)
  return result.changes
    ? sendJson(response, { success: true })
    : sendJson(response, { error: 'El usuario ya no existe.' }, 404)
}

async function handleUsers(database, request, response, url, currentUser) {
  if (currentUser.role !== 'admin') {
    return sendJson(
      response,
      { error: 'Sólo Administración puede gestionar usuarios.' },
      403,
    )
  }
  const collectionPath = '/api/users'
  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listUsers(database, response)
    if (request.method === 'POST') {
      return createManagedUser(database, request, response)
    }
  }

  const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
  if (!id) return sendJson(response, { error: 'Usuario no encontrado.' }, 404)
  if (request.method === 'PUT') {
    return updateManagedUser(database, request, response, id, currentUser)
  }
  if (request.method === 'DELETE') {
    return deleteManagedUser(database, response, id, currentUser)
  }
  return sendJson(response, { error: 'Método no permitido.' }, 405)
}

async function handleRequest(database, request, response) {
  const url = new URL(request.url, 'http://localhost')
  if (url.pathname.startsWith('/api/auth/')) {
    return handleAuth(database, request, response, url)
  }

  const user = await getCurrentUser(database, request)
  if (!user) return sendJson(response, { error: 'Inicia sesión para continuar.' }, 401)

  if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/')) {
    return handleUsers(database, request, response, url, user)
  }

  const collectionPath = '/api/requests'
  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listRequests(database, response)
    if (request.method === 'POST') {
      return createRequest(database, request, response, user)
    }
  }
  if (url.pathname.startsWith(`${collectionPath}/`)) {
    const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
    if (request.method === 'PUT' || request.method === 'DELETE') {
      if (user.role !== 'admin') {
        return sendJson(
          response,
          { error: 'Sólo Administración puede editar o eliminar solicitudes.' },
          403,
        )
      }
    }
    if (request.method === 'PUT') {
      return updateRequest(database, request, response, id)
    }
    if (request.method === 'DELETE') {
      return deleteRequest(database, response, id)
    }
  }
  sendJson(response, { error: 'Ruta o método no permitido.' }, 404)
}

export function reservationsApi() {
  return {
    name: 'reservations-local-api',
    apply: 'serve',
    configureServer(server) {
      const database = createDatabase()
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/')) {
          next()
          return
        }
        handleRequest(database, request, response).catch((error) => {
          sendJson(
            response,
            { error: error.message || 'No fue posible completar la operación.' },
            500,
          )
        })
      })
      server.httpServer?.once('close', () => database.close())
    },
  }
}
