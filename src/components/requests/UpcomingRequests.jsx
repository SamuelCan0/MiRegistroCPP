import { ACTIVITY_META } from '../../config/activities'
import { formatDate, fromDateKey } from '../../utils/date'

function RequestRow({ onSelect, request }) {
  const requestDate = fromDateKey(request.date)
  const month = formatDate(requestDate, { month: 'short' }).replace('.', '')

  return (
    <button
      className="request-row"
      type="button"
      onClick={() => onSelect(request)}
    >
      <span className={`request-date ${ACTIVITY_META[request.type].tone}`}>
        <strong>{requestDate.getDate()}</strong>
        <small>{month}</small>
      </span>
      <span className="request-main">
        <strong>{request.title}</strong>
        <small>
          {request.type} · {request.startTime}–{request.endTime}
        </small>
      </span>
      <span className={`status ${request.status.toLowerCase()}`}>
        {request.status}
      </span>
      <span className="row-arrow" aria-hidden="true">›</span>
    </button>
  )
}

export function UpcomingRequests({ onRequestSelect, requests }) {
  return (
    <section
      className="request-strip"
      id="solicitudes"
      aria-labelledby="requests-title"
    >
      <div>
        <p className="eyebrow">Seguimiento</p>
        <h2 id="requests-title">Solicitudes próximas</h2>
      </div>
      <div className="request-list">
        {requests.map((request) => (
          <RequestRow
            key={request.id}
            onSelect={onRequestSelect}
            request={request}
          />
        ))}
      </div>
    </section>
  )
}
