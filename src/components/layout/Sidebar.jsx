import { ACTIVITIES } from '../../config/activities'

export function Sidebar({ pendingCount }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#inicio" aria-label="Ir al inicio">
        <span className="logo-frame">
          <img src="/logo.png" alt="Escudo del Colegio Pedro Palacios" />
        </span>
        <span className="brand-copy">
          <strong>Colegio</strong>
          <span>Pedro Palacios</span>
        </span>
      </a>

      <nav className="main-nav" aria-label="Navegación principal">
        <p className="nav-label">Administración</p>
        <a className="nav-item active" href="#inicio">
          <span aria-hidden="true">⌂</span>
          Dashboard
        </a>
        <a className="nav-item" href="#calendario">
          <span aria-hidden="true">□</span>
          Calendario
        </a>
        <a className="nav-item" href="#solicitudes">
          <span aria-hidden="true">≡</span>
          Solicitudes
          <small>{pendingCount}</small>
        </a>

        <p className="nav-label spaces-label">Espacios y recursos</p>
        {ACTIVITIES.map(({ name, tone }) => (
          <a className="nav-item resource-link" href="#calendario" key={name}>
            <span className={`resource-dot ${tone}`} aria-hidden="true" />
            {name}
          </a>
        ))}
      </nav>

      <div className="sidebar-help">
        <span className="help-icon" aria-hidden="true">i</span>
        <div>
          <strong>¿Necesitas ayuda?</strong>
          <p>Contacta a Administración para modificar una solicitud.</p>
        </div>
      </div>
    </aside>
  )
}
