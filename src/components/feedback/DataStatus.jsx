import { AppIcon } from '../ui/AppIcon'

export function DataStatus({ error, isLoading, onRetry }) {
  if (isLoading) {
    return (
      <div className="data-status loading" role="status">
        <span aria-hidden="true">
          <AppIcon name="spinner" spin />
        </span>
        Cargando solicitudes…
      </div>
    )
  }

  if (!error) return null

  return (
    <div className="data-status error" role="alert">
      <AppIcon className="data-status-icon" name="warning" />
      <div>
        <strong>No se pudieron cargar las solicitudes</strong>
        <p>{error}</p>
      </div>
      <button type="button" onClick={onRetry}>
        <AppIcon name="retry" />
        Reintentar
      </button>
    </div>
  )
}
