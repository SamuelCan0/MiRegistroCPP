import {
  clearSessionCookie,
  createSessionCookie,
  createSessionToken,
  getAdminEmails,
  hashPassword,
  hashSessionToken,
  isInstitutionalEmail,
  normalizeEmail,
  publicUser,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
  readSessionToken,
  sessionExpiry,
  validatePassword,
  verifyPassword,
} from './auth.js'
import { validatePayload } from './reservationRules.js'

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

function json(payload, status = 200, headers = {}) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

async function parsePayload(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function isSameOrigin(request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

async function getCurrentUser(request, db) {
  const token = readSessionToken(request)
  if (!token) return null

  const user = await db
    .prepare(
      `SELECT ${userColumns}
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?1
         AND sessions.expires_at > CURRENT_TIMESTAMP`,
    )
    .bind(await hashSessionToken(token))
    .first()

  return user || null
}

async function createAuthenticatedSession(request, db, user) {
  const token = createSessionToken()
  await db
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?1, ?2, ?3)`,
    )
    .bind(await hashSessionToken(token), user.id, sessionExpiry())
    .run()

  return json(
    { user: publicUser(user) },
    200,
    { 'Set-Cookie': createSessionCookie(token, request) },
  )
}

async function setupPassword(request, env) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const email = normalizeEmail(payload.email)
  const passwordError = validatePassword(payload.password)

  if (!isInstitutionalEmail(email)) {
    return json(
      { error: 'Usa tu correo institucional @colegiopedropalacios.edu.mx.' },
      400,
    )
  }
  if (passwordError) return json({ error: passwordError }, 400)

  const user = await env.DB
    .prepare(`SELECT ${userColumns} FROM users WHERE email = ?1`)
    .bind(email)
    .first()
  if (!user) {
    return json(
      { error: 'Este correo no está autorizado. Contacta a Administración.' },
      403,
    )
  }
  if (user.passwordHash) {
    return json(
      { error: 'Esta cuenta ya tiene contraseña. Inicia sesión normalmente.' },
      409,
    )
  }

  const credentials = await hashPassword(payload.password)
  user.passwordHash = credentials.hash
  user.passwordSalt = credentials.salt
  user.passwordIterations = credentials.iterations
  await env.DB
    .prepare(
      `UPDATE users
       SET password_hash = ?1,
           password_salt = ?2,
           password_iterations = ?3,
           last_login_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?4`,
    )
    .bind(
      credentials.hash,
      credentials.salt,
      credentials.iterations,
      user.id,
    )
    .run()

  return createAuthenticatedSession(request, env.DB, user)
}

async function provisionConfiguredAdmin(env, email) {
  if (!getAdminEmails(env).has(email)) return null

  const user = {
    id: crypto.randomUUID(),
    email,
    displayName: 'Administración',
    role: 'admin',
    passwordHash: null,
    passwordSalt: null,
    passwordIterations: 210000,
  }
  await env.DB
    .prepare(
      `INSERT OR IGNORE INTO users (
         id, email, display_name, role, password_hash,
         password_salt, password_iterations
       )
       VALUES (?1, ?2, ?3, 'admin', NULL, NULL, ?4)`,
    )
    .bind(user.id, user.email, user.displayName, user.passwordIterations)
    .run()
  return user
}

async function login(request, env) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const email = normalizeEmail(payload.email)
  let user = await env.DB
    .prepare(`SELECT ${userColumns} FROM users WHERE email = ?1`)
    .bind(email)
    .first()

  if (!user) user = await provisionConfiguredAdmin(env, email)
  if (user && !user.passwordHash) {
    return json(
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
    return json({ error: 'Correo o contraseña incorrectos.' }, 401)
  }

  if (getAdminEmails(env).has(user.email) && user.role !== 'admin') {
    user.role = 'admin'
    await env.DB
      .prepare(
        `UPDATE users
         SET role = 'admin', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?1`,
      )
      .bind(user.id)
      .run()
  }

  await env.DB
    .prepare(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP
       WHERE id = ?1`,
    )
    .bind(user.id)
    .run()

  return createAuthenticatedSession(request, env.DB, user)
}

async function logout(request, env) {
  const token = readSessionToken(request)
  if (token) {
    await env.DB
      .prepare('DELETE FROM sessions WHERE token_hash = ?1')
      .bind(await hashSessionToken(token))
      .run()
  }

  return json(
    { success: true },
    200,
    { 'Set-Cookie': clearSessionCookie(request) },
  )
}

async function handleAuthRequest(request, env, url) {
  if (url.pathname === '/api/auth/session' && request.method === 'GET') {
    const user = await getCurrentUser(request, env.DB)
    return json({ user: user ? publicUser(user) : null })
  }
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    return login(request, env)
  }
  if (url.pathname === '/api/auth/setup-password' && request.method === 'POST') {
    return setupPassword(request, env)
  }
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return logout(request, env)
  }
  return json({ error: 'Ruta de autenticación no encontrada.' }, 404)
}

async function listRequests(db) {
  const result = await db
    .prepare(
      `SELECT ${requestColumns}
       FROM requests
       ORDER BY date ASC, start_time ASC, created_at ASC`,
    )
    .all()

  return json({ requests: result.results })
}

async function createRequest(request, db, user) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const validation = validatePayload(payload)
  if (validation.error) return json({ error: validation.error }, 400)

  const value = validation.value
  const created = await db
    .prepare(
      `INSERT INTO requests (
         id, title, type, date, start_time, end_time,
         responsible, notes, status, created_by_user_id
       )
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'Programada', ?9
       WHERE NOT EXISTS (
         SELECT 1
         FROM requests
         WHERE type = ?3
           AND date = ?4
           AND start_time < ?6
           AND end_time > ?5
       )
       RETURNING ${requestColumns}`,
    )
    .bind(
      crypto.randomUUID(),
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
      user.id,
    )
    .first()

  if (!created) {
    return json(
      {
        error:
          'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
        code: 'SCHEDULE_CONFLICT',
      },
      409,
    )
  }

  return json({ request: created }, 201)
}

async function updateRequest(request, db, id) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const validation = validatePayload(payload)
  if (validation.error) return json({ error: validation.error }, 400)

  const value = validation.value
  const updated = await db
    .prepare(
      `UPDATE requests
       SET title = ?1,
           type = ?2,
           date = ?3,
           start_time = ?4,
           end_time = ?5,
           responsible = ?6,
           notes = ?7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?8
         AND NOT EXISTS (
           SELECT 1
           FROM requests AS conflicting
           WHERE conflicting.id <> ?8
             AND conflicting.type = ?2
             AND conflicting.date = ?3
             AND conflicting.start_time < ?5
             AND conflicting.end_time > ?4
         )
       RETURNING ${requestColumns}`,
    )
    .bind(
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
      id,
    )
    .first()

  if (updated) return json({ request: updated })

  const existing = await db
    .prepare('SELECT id FROM requests WHERE id = ?1')
    .bind(id)
    .first()

  if (!existing) return json({ error: 'La solicitud ya no existe.' }, 404)
  return json(
    {
      error:
        'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
      code: 'SCHEDULE_CONFLICT',
    },
    409,
  )
}

async function deleteRequest(db, id) {
  const result = await db
    .prepare('DELETE FROM requests WHERE id = ?1')
    .bind(id)
    .run()

  if (!result.meta.changes) {
    return json({ error: 'La solicitud ya no existe.' }, 404)
  }
  return json({ success: true })
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

async function listUsers(db) {
  const result = await db
    .prepare(
      `SELECT ${managedUserColumns}
       FROM users
       ORDER BY role ASC, display_name COLLATE NOCASE ASC`,
    )
    .all()
  return json({ users: result.results })
}

async function createUser(request, db) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const email = normalizeEmail(payload.email)
  const displayName = String(payload.displayName || '').trim()
  const role = payload.role === 'admin' ? 'admin' : 'user'
  if (!isInstitutionalEmail(email)) {
    return json(
      { error: 'Usa un correo @colegiopedropalacios.edu.mx.' },
      400,
    )
  }
  if (displayName.length < 2 || displayName.length > 80) {
    return json({ error: 'Escribe el nombre completo del usuario.' }, 400)
  }

  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ?1')
    .bind(email)
    .first()
  if (existing) return json({ error: 'Este correo ya está registrado.' }, 409)

  const created = await db
    .prepare(
      `INSERT INTO users (
         id, email, display_name, role, password_hash, password_salt
       )
       VALUES (?1, ?2, ?3, ?4, NULL, NULL)
       RETURNING ${managedUserColumns}`,
    )
    .bind(crypto.randomUUID(), email, displayName, role)
    .first()

  return json({ user: created }, 201)
}

async function updateUser(request, db, id, currentUser) {
  const payload = await parsePayload(request)
  if (!payload) {
    return json({ error: 'La solicitud no contiene datos válidos.' }, 400)
  }

  const displayName = String(payload.displayName || '').trim()
  const role = payload.role === 'admin' ? 'admin' : 'user'
  if (displayName.length < 2 || displayName.length > 80) {
    return json({ error: 'Escribe el nombre completo del usuario.' }, 400)
  }
  const target = await db
    .prepare('SELECT email FROM users WHERE id = ?1')
    .bind(id)
    .first()
  if (
    (id === currentUser.id ||
      id === PRIMARY_ADMIN_ID ||
      target?.email === PRIMARY_ADMIN_EMAIL) &&
    role !== 'admin'
  ) {
    return json(
      { error: 'No puedes quitar tu propio permiso de administrador.' },
      400,
    )
  }

  const updated = await db
    .prepare(
      `UPDATE users
       SET display_name = ?1,
           role = ?2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?3
       RETURNING ${managedUserColumns}`,
    )
    .bind(displayName, role, id)
    .first()

  return updated
    ? json({ user: updated })
    : json({ error: 'El usuario ya no existe.' }, 404)
}

async function deleteUser(db, id, currentUser) {
  const target = await db
    .prepare('SELECT email FROM users WHERE id = ?1')
    .bind(id)
    .first()
  if (
    id === currentUser.id ||
    id === PRIMARY_ADMIN_ID ||
    target?.email === PRIMARY_ADMIN_EMAIL
  ) {
    return json(
      { error: 'La cuenta administradora principal no se puede eliminar.' },
      400,
    )
  }
  const result = await db
    .prepare('DELETE FROM users WHERE id = ?1')
    .bind(id)
    .run()
  return result.meta.changes
    ? json({ success: true })
    : json({ error: 'El usuario ya no existe.' }, 404)
}

async function handleUsersRequest(request, db, url, currentUser) {
  if (currentUser.role !== 'admin') {
    return json(
      { error: 'Sólo Administración puede gestionar usuarios.' },
      403,
    )
  }
  const collectionPath = '/api/users'
  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listUsers(db)
    if (request.method === 'POST') return createUser(request, db)
    return json({ error: 'Método no permitido.' }, 405)
  }

  const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
  if (!id) return json({ error: 'Usuario no encontrado.' }, 404)
  if (request.method === 'PUT') {
    return updateUser(request, db, id, currentUser)
  }
  if (request.method === 'DELETE') {
    return deleteUser(db, id, currentUser)
  }
  return json({ error: 'Método no permitido.' }, 405)
}

async function handleApiRequest(request, env, url) {
  if (!env.DB) {
    return json({ error: 'El almacenamiento permanente no está disponible.' }, 503)
  }
  if (!isSameOrigin(request)) {
    return json({ error: 'Origen de solicitud no permitido.' }, 403)
  }
  if (url.pathname.startsWith('/api/auth/')) {
    return handleAuthRequest(request, env, url)
  }

  const user = await getCurrentUser(request, env.DB)
  if (!user) return json({ error: 'Inicia sesión para continuar.' }, 401)

  if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/')) {
    return handleUsersRequest(request, env.DB, url, user)
  }

  const collectionPath = '/api/requests'
  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listRequests(env.DB)
    if (request.method === 'POST') {
      return createRequest(request, env.DB, user)
    }
    return json({ error: 'Método no permitido.' }, 405)
  }

  if (url.pathname.startsWith(`${collectionPath}/`)) {
    const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
    if (!id) return json({ error: 'Solicitud no encontrada.' }, 404)

    if (request.method === 'PUT' || request.method === 'DELETE') {
      if (user.role !== 'admin') {
        return json(
          { error: 'Sólo Administración puede editar o eliminar solicitudes.' },
          403,
        )
      }
    }
    if (request.method === 'PUT') return updateRequest(request, env.DB, id)
    if (request.method === 'DELETE') return deleteRequest(env.DB, id)
    return json({ error: 'Método no permitido.' }, 405)
  }

  return json({ error: 'Ruta no encontrada.' }, 404)
}

function toDatabaseError(error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('no such table')) {
    return json(
      { error: 'La base de datos todavía no ha aplicado su migración.' },
      503,
    )
  }
  return json({ error: 'No fue posible completar la operación.' }, 500)
}

async function withRequestOrigin(response, url) {
  const contentType = response.headers.get('Content-Type') || ''
  if (!contentType.includes('text/html')) return response

  const headers = new Headers(response.headers)
  headers.delete('Content-Length')
  const html = (await response.text()).replaceAll('__SITE_ORIGIN__', url.origin)
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApiRequest(request, env, url)
      } catch (error) {
        return toDatabaseError(error)
      }
    }

    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404) return withRequestOrigin(response, url)

    url.pathname = '/'
    return withRequestOrigin(
      await env.ASSETS.fetch(new Request(url, request)),
      url,
    )
  },
}
