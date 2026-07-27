import { ACTIVITY_META } from '../../config/activities'
import { formatDate, fromDateKey } from '../../utils/date'
import { ModalShell } from './ModalShell'

export function RequestDetailModal({ onClose, request }) {
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
          ×
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
      <button
        className="primary-button full-button"
        type="button"
        onClick={onClose}
      >
        Cerrar detalle
      </button>
    </ModalShell>
  )
}
