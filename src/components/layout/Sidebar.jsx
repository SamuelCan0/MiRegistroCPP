import { AppIcon } from '../ui/AppIcon'

const navigationItems = [
  { id: 'inicio', icon: 'home', label: 'Dashboard' },
  { id: 'calendario', icon: 'calendar', label: 'Calendario' },
  { id: 'solicitudes', icon: 'requests', label: 'Solicitudes' },
]

export function Sidebar({
  activeSection,
  isDark,
  onSectionSelect,
  onThemeToggle,
  pendingCount,
  theme,
}) {
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#inicio"
        aria-label="Ir al inicio"
        onClick={() => onSectionSelect('inicio')}
      >
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
        {navigationItems.map(({ id, icon, label }) => {
          const isActive = activeSection === id

          return (
            <a
              className={`nav-item${isActive ? ' active' : ''}`}
              href={`#${id}`}
              key={id}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSectionSelect(id)}
            >
              <span aria-hidden="true">
                <AppIcon name={icon} />
              </span>
              {label}
              {id === 'solicitudes' && <small>{pendingCount}</small>}
            </a>
          )
        })}
      </nav>

      <button
        className="theme-toggle"
        type="button"
        aria-label={`Activar modo ${isDark ? 'claro' : 'oscuro'}`}
        aria-pressed={isDark}
        onClick={onThemeToggle}
      >
        <span className="theme-icon" aria-hidden="true">
          <AppIcon name={isDark ? 'sun' : 'moon'} />
        </span>
        <span className="theme-copy">
          <strong>{isDark ? 'Modo claro' : 'Modo oscuro'}</strong>
          <small>Tema {theme === 'dark' ? 'oscuro' : 'claro'} activo</small>
        </span>
        <span className="theme-switch" aria-hidden="true">
          <i />
        </span>
      </button>

      <div className="sidebar-help">
        <span className="help-icon" aria-hidden="true">
          <AppIcon name="help" />
        </span>
        <div>
          <strong>¿Necesitas ayuda?</strong>
          <p>Contacta a Administración para modificar una solicitud.</p>
        </div>
      </div>
    </aside>
  )
}
