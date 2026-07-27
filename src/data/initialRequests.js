import { addDays, toDateKey } from '../utils/date'

export function getInitialRequests(today) {
  return [
    {
      id: 1,
      title: 'Reunión de padres de familia',
      type: 'Salón de actos',
      date: toDateKey(addDays(today, 3)),
      startTime: '09:00',
      endTime: '11:00',
      responsible: 'Dirección académica',
      status: 'Confirmada',
      notes: 'Proyector, sonido y 120 sillas.',
    },
    {
      id: 2,
      title: 'Evaluación de informática',
      type: 'Centro de cómputo',
      date: toDateKey(addDays(today, 5)),
      startTime: '08:00',
      endTime: '10:00',
      responsible: 'Prof. Mariana López',
      status: 'Programada',
      notes: 'Uso de 25 equipos.',
    },
    {
      id: 3,
      title: 'Club de lectura',
      type: 'Biblioteca',
      date: toDateKey(addDays(today, 8)),
      startTime: '12:30',
      endTime: '14:00',
      responsible: 'Lic. Javier Ruiz',
      status: 'Confirmada',
      notes: 'Mesa de trabajo para 18 alumnos.',
    },
    {
      id: 4,
      title: 'Apoyo para feria de ciencias',
      type: 'Mobiliario y materiales',
      date: toDateKey(addDays(today, 11)),
      startTime: '07:30',
      endTime: '13:30',
      responsible: 'Coordinación de ciencias',
      status: 'Programada',
      notes: '10 mesas plegables y 20 sillas.',
    },
  ]
}
