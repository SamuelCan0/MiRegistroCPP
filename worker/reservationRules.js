export const ACTIVITY_TYPES = new Set([
  'Salón de actos',
  'Centro de cómputo',
  'Biblioteca',
  'Mobiliario y materiales',
])

export function getMinimumDateKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  const minimumDate = new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)),
  )

  minimumDate.setUTCDate(minimumDate.getUTCDate() + 2)
  return minimumDate.toISOString().slice(0, 10)
}

export function validatePayload(payload) {
  const requiredFields = [
    'title',
    'type',
    'date',
    'startTime',
    'endTime',
    'responsible',
  ]

  for (const field of requiredFields) {
    if (typeof payload[field] !== 'string' || !payload[field].trim()) {
      return { error: `El campo ${field} es obligatorio.` }
    }
  }

  if (!ACTIVITY_TYPES.has(payload.type)) {
    return { error: 'El espacio o recurso seleccionado no es válido.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    return { error: 'La fecha no tiene un formato válido.' }
  }
  if (payload.date < getMinimumDateKey()) {
    return { error: 'La reservación requiere al menos 2 días de anticipación.' }
  }
  if (
    !/^\d{2}:\d{2}$/.test(payload.startTime) ||
    !/^\d{2}:\d{2}$/.test(payload.endTime) ||
    payload.endTime <= payload.startTime
  ) {
    return { error: 'El horario seleccionado no es válido.' }
  }

  return {
    value: {
      title: payload.title.trim(),
      type: payload.type,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      responsible: payload.responsible.trim(),
      notes:
        typeof payload.notes === 'string' && payload.notes.trim()
          ? payload.notes.trim()
          : 'Sin indicaciones adicionales.',
    },
  }
}
