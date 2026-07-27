import {
  ACTIVITIES,
  ACTIVITY_META,
  WEEK_DAYS,
} from '../../config/activities'
import { toDateKey } from '../../utils/date'
import { AppIcon } from '../ui/AppIcon'

function CalendarDay({
  currentMonth,
  day,
  onRequestSelect,
  requests,
  today,
}) {
  const dateKey = toDateKey(day)
  const dayRequests = requests
    .filter((request) => request.date === dateKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const isOutsideMonth = day.getMonth() !== currentMonth.getMonth()
  const isToday = dateKey === toDateKey(today)

  return (
    <div
      className={`calendar-day${isOutsideMonth ? ' outside' : ''}${
        isToday ? ' today' : ''
      }`}
    >
      <div className="day-number">
        <span>{day.getDate()}</span>
        {isToday && <small>Hoy</small>}
      </div>
      <div className="day-events">
        {dayRequests.map((request) => (
          <button
            className={`calendar-event ${ACTIVITY_META[request.type].tone}`}
            type="button"
            key={request.id}
            onClick={() => onRequestSelect(request)}
            aria-label={`${request.title}, de ${request.startTime} a ${request.endTime}`}
            title={`${request.startTime}–${request.endTime} · ${request.title}`}
          >
            <span>{request.startTime}–{request.endTime}</span>
            {request.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Calendar({
  calendarDays,
  currentMonth,
  monthLabel,
  onMoveMonth,
  onRequestSelect,
  onReturnToToday,
  requests,
  today,
}) {
  return (
    <section
      className="calendar-card"
      id="calendario"
      aria-labelledby="calendar-title"
    >
      <div className="calendar-header">
        <div>
          <p className="eyebrow">Agenda institucional</p>
          <h2 id="calendar-title">Calendario de solicitudes</h2>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={onReturnToToday}>Hoy</button>
          <div className="month-navigation">
            <button
              type="button"
              onClick={() => onMoveMonth(-1)}
              aria-label="Mes anterior"
            >
              <AppIcon name="chevronLeft" />
            </button>
            <h3>{monthLabel}</h3>
            <button
              type="button"
              onClick={() => onMoveMonth(1)}
              aria-label="Mes siguiente"
            >
              <AppIcon name="chevronRight" />
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-legend" aria-label="Tipos de actividad">
        {ACTIVITIES.map(({ name, tone }) => (
          <span key={name}>
            <i className={tone} />
            {name}
          </span>
        ))}
      </div>

      <div className="calendar-scroll">
        <div className="calendar-grid">
          {WEEK_DAYS.map((day) => (
            <div className="weekday" key={day}>{day}</div>
          ))}
          {calendarDays.map((day) => (
            <CalendarDay
              currentMonth={currentMonth}
              day={day}
              key={toDateKey(day)}
              onRequestSelect={onRequestSelect}
              requests={requests}
              today={today}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
