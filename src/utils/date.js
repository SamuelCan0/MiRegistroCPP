const spanishDateFormatter = (options) =>
  new Intl.DateTimeFormat('es-MX', options)

export function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(date, options) {
  return spanishDateFormatter(options).format(date)
}

export function getCalendarDays(currentMonth) {
  const firstDayOffset = (currentMonth.getDay() + 6) % 7
  const gridStart = addDays(currentMonth, -firstDayOffset)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function isDateInMonth(dateKey, month) {
  const date = fromDateKey(dateKey)
  return (
    date.getMonth() === month.getMonth() &&
    date.getFullYear() === month.getFullYear()
  )
}
