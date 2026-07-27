import { formatDate } from '../../utils/date'
import { AppIcon } from '../ui/AppIcon'

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function Topbar({ onSignOut, today, user }) {
  const todayLabel = formatDate(today, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="topbar">
      <div>
        <p className="date-kicker">{todayLabel}</p>
        <h1>Buenos días, {user.displayName.split(' ')[0]}</h1>
      </div>
      <div className="topbar-actions">
        <div className="profile">
          <span className="avatar">{initials(user.displayName)}</span>
          <span>
            <strong>{user.displayName}</strong>
            <small>
              {user.role === 'admin' ? 'Administrador' : 'Personal autorizado'}
            </small>
          </span>
        </div>
        <button
          aria-label="Cerrar sesión"
          className="sign-out-button"
          onClick={onSignOut}
          type="button"
        >
          <AppIcon name="signOut" />
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
