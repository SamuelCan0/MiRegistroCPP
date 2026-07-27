import { AppIcon } from '../ui/AppIcon'
import { ModalShell } from './ModalShell'

export function DeleteRequestModal({
  error,
  isDeleting,
  onCancel,
  onConfirm,
  request,
}) {
  if (!request) return null

  return (
    <ModalShell
      className="confirmation-modal"
      labelledBy="delete-title"
      onClose={onCancel}
    >
      <div className="confirmation-icon" aria-hidden="true">
        <AppIcon name="warning" />
      </div>
      <p className="eyebrow">Acción irreversible</p>
      <h2 id="delete-title">Eliminar solicitud</h2>
      <p className="confirmation-copy">
        ¿Deseas eliminar <strong>{request.title}</strong>? Se retirará del
        calendario y no podrás recuperar esta solicitud.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="confirmation-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={isDeleting}
          onClick={onCancel}
        >
          <AppIcon name="xmark" />
          Conservar solicitud
        </button>
        <button
          className="danger-button"
          type="button"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          <AppIcon name="delete" />
          {isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </div>
    </ModalShell>
  )
}
