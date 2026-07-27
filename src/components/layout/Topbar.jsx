import { formatDate } from '../../utils/date'

export function Topbar({ today }) {
  const todayLabel = formatDate(today, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="topbar">
      <div>
        <p className="date-kicker">{todayLabel}</p>
        <h1>Buenos días, Administración</h1>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notificaciones">
          <span aria-hidden="true">●</span>
          <i />
        </button>
        <div className="profile">
          <span className="avatar">AD</span>
          <span>
            <strong>Administrador</strong>
            <small>Control escolar</small>
          </span>
        </div>
      </div>
    </header>
  )
}
