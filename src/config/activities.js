export const ACTIVITIES = [
  { name: 'Salón de actos', tone: 'acts' },
  { name: 'Centro de cómputo', tone: 'computer' },
  { name: 'Biblioteca', tone: 'gold' },
  { name: 'Mobiliario y materiales', tone: 'red' },
]

export const ACTIVITY_TYPES = ACTIVITIES.map((activity) => activity.name)

export const ACTIVITY_META = Object.fromEntries(
  ACTIVITIES.map((activity) => [activity.name, { tone: activity.tone }]),
)

export const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
