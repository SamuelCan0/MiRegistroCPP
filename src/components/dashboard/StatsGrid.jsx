import { formatDate, fromDateKey } from '../../utils/date'
import { AppIcon } from '../ui/AppIcon'

export function StatsGrid({
  nextRequest,
  pendingCount,
  visibleRequestCount,
}) {
  const nextRequestDate = nextRequest
    ? formatDate(fromDateKey(nextRequest.date), {
        day: 'numeric',
        month: 'short',
      })
    : '—'

  return (
    <section className="stats-grid" aria-label="Resumen de solicitudes">
      <article className="stat-card">
        <span className="stat-icon navy" aria-hidden="true">
          <AppIcon name="calendarCheck" />
        </span>
        <div>
          <p>Solicitudes este mes</p>
          <strong>{visibleRequestCount}</strong>
        </div>
        <span className="stat-note">Calendario actual</span>
      </article>

      <article className="stat-card">
        <span className="stat-icon red" aria-hidden="true">
          <AppIcon name="clock" />
        </span>
        <div>
          <p>Programadas</p>
          <strong>{pendingCount}</strong>
        </div>
        <span className="stat-note warning">Por revisar</span>
      </article>

      <article className="stat-card next-activity-card">
        <span className="stat-icon gold" aria-hidden="true">
          <AppIcon name="arrowRight" />
        </span>
        <div>
          <p>Próxima actividad</p>
          <strong>{nextRequest?.title || 'Sin actividades'}</strong>
        </div>
        <span className="stat-note">{nextRequestDate}</span>
      </article>
    </section>
  )
}
