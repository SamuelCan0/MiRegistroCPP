import { ACTIVITY_META } from '../../config/activities'
import { formatDate, fromDateKey } from '../../utils/date'
import { AppIcon } from '../ui/AppIcon'
import { ModalShell } from './ModalShell'

export function RequestDetailModal({
  canManage,
  onClose,
  onDelete,
  onEdit,
  request,
}) {
  if (!request) return null

  const requestDate = formatDate(fromDateKey(request.date), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <ModalShell
      className="detail-modal"
      labelledBy="detail-title"
      onClose={onClose}
    >
      <div className={`detail-accent ${ACTIVITY_META[request.type].tone}`} />
      <div className="modal-header">
        <div>
          <p className="eyebrow">{request.type}</p>
          <h2 id="detail-title">{request.title}</h2>
        </div>
        <button
          className="close-button"
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <AppIcon name="xmark" />
        </button>
      </div>
      <dl className="detail-list">
        <div>
          <dt>Fecha</dt>
          <dd>{requestDate}</dd>
        </div>
        <div>
          <dt>Horario</dt>
          <dd>{request.startTime}–{request.endTime}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{request.responsible}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span className={`status ${request.status.toLowerCase()}`}>
              {request.status}
            </span>
          </dd>
        </div>
        <div className="detail-notes">
          <dt>Indicaciones</dt>
          <dd>{request.notes}</dd>
        </div>
      </dl>
      {!canManage && (
        <p className="permission-note">
          Puedes consultar esta solicitud. Para modificarla o eliminarla,
          contacta a Administración.
        </p>
      )}
      <div className="detail-actions">
        {canManage && (
          <>
            <button
              className="danger-button"
              type="button"
              onClick={() => onDelete(request)}
            >
              <AppIcon name="delete" />
              Eliminar
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onEdit(request)}
            >
              <AppIcon name="edit" />
              Editar
            </button>
          </>
        )}
        <button className="primary-button" type="button" onClick={onClose}>
          <AppIcon name="xmark" />
          Cerrar detalle
        </button>
      </div>
    </ModalShell>
  )
}
