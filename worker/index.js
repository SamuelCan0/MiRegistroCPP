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
  created_at AS createdAt,
  updated_at AS updatedAt
`

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

async function parsePayload(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
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

async function createRequest(request, db) {
  const payload = await parsePayload(request)
  if (!payload) return json({ error: 'La solicitud no contiene datos válidos.' }, 400)

  const validation = validatePayload(payload)
  if (validation.error) return json({ error: validation.error }, 400)

  const value = validation.value
  const id = crypto.randomUUID()
  const created = await db
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
    .bind(
      id,
      value.title,
      value.type,
      value.date,
      value.startTime,
      value.endTime,
      value.responsible,
      value.notes,
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
  if (!payload) return json({ error: 'La solicitud no contiene datos válidos.' }, 400)

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

async function handleApiRequest(request, env, url) {
  if (!env.DB) {
    return json({ error: 'El almacenamiento permanente no está disponible.' }, 503)
  }

  const collectionPath = '/api/requests'
  if (url.pathname === collectionPath) {
    if (request.method === 'GET') return listRequests(env.DB)
    if (request.method === 'POST') return createRequest(request, env.DB)
    return json({ error: 'Método no permitido.' }, 405)
  }

  if (url.pathname.startsWith(`${collectionPath}/`)) {
    const id = decodeURIComponent(url.pathname.slice(collectionPath.length + 1))
    if (!id) return json({ error: 'Solicitud no encontrada.' }, 404)
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
    if (response.status !== 404) return response

    url.pathname = '/'
    return env.ASSETS.fetch(new Request(url, request))
  },
}
