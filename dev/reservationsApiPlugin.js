import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
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
  created_at AS createdAt,
  updated_at AS updatedAt
`

const createTableSql = `
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    responsible TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pendiente',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`

const createIndexSql = `
  CREATE INDEX IF NOT EXISTS requests_schedule_idx
  ON requests (type, date, start_time, end_time)
`

function sendJson(response, payload, status = 200) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
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

  const database = new DatabaseSync(
    resolve(dataDirectory, 'reservations.sqlite'),
  )
  database.prepare(createTableSql).run()
  database.prepare(createIndexSql).run()
  return database
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

async function createRequest(database, request, response) {
  const validation = validatePayload(await readJson(request))
  if (validation.error) return sendJson(response, { error: validation.error }, 400)

  const value = validation.value
  const created = database
    .prepare(
      `INSERT INTO requests (
         id, title, type, date, start_time, end_time,
         responsible, notes, status
       )
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'Pendiente'
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
    .get(
      randomUUID(),
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
    )

  if (!created) {
    return sendJson(
      response,
      {
        error:
          'Ese espacio ya está reservado durante parte o la totalidad del horario seleccionado.',
        code: 'SCHEDULE_CONFLICT',
      },
      409,
    )
  }

  sendJson(response, { request: created }, 201)
}

async function updateRequest(database, request, response, id) {
  const validation = validatePayload(await readJson(request))
  if (validation.error) return sendJson(response, { error: validation.error }, 400)

  const value = validation.value
  const updated = database
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

  const existing = database
    .prepare('SELECT id FROM requests WHERE id = ?1')
    .get(id)

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
  const result = database
    .prepare('DELETE FROM requests WHERE id = ?1')
    .run(id)

  return result.changes
    ? sendJson(response, { success: true })
    : sendJson(response, { error: 'La solicitud ya no existe.' }, 404)
}

async function handleRequest(database, request, response) {
  const url = new URL(request.url, 'http://localhost')
  const collectionPath = '/api/requests'

  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listRequests(database, response)
    if (request.method === 'POST') {
      return createRequest(database, request, response)
    }
  }

  if (url.pathname.startsWith(`${collectionPath}/`)) {
    const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
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
