import { ACTIVITY_TYPES } from '../../config/activities'
import { ModalShell } from './ModalShell'

export function RequestFormModal({
  error,
  form,
  isOpen,
  minimumDateKey,
  minimumDateLabel,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null

  return (
    <ModalShell labelledBy="form-title" onClose={onClose}>
      <div className="modal-header">
        <div>
          <p className="eyebrow">Nueva reservación</p>
          <h2 id="form-title">Registrar solicitud</h2>
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

      <div className="advance-notice">
        <span aria-hidden="true">i</span>
        <p>
          <strong>Anticipación obligatoria</strong>
          La primera fecha disponible es el {minimumDateLabel}.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <label className="full-field">
          Nombre de la actividad
          <input
            autoFocus
            name="title"
            onChange={onChange}
            placeholder="Ej. Consejo técnico escolar"
            value={form.title}
          />
        </label>

        <label className="full-field">
          Espacio o recurso
          <select name="type" onChange={onChange} value={form.type}>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label>
            Fecha
            <input
              min={minimumDateKey}
              name="date"
              onChange={onChange}
              type="date"
              value={form.date}
            />
            <small>Mínimo 2 días de anticipación</small>
          </label>
          <label>
            Responsable
            <input
              name="responsible"
              onChange={onChange}
              placeholder="Nombre o área"
              value={form.responsible}
            />
          </label>
          <label>
            Hora de inicio
            <input
              name="startTime"
              onChange={onChange}
              type="time"
              value={form.startTime}
            />
          </label>
          <label>
            Hora de término
            <input
              name="endTime"
              onChange={onChange}
              type="time"
              value={form.endTime}
            />
          </label>
        </div>

        <label className="full-field">
          Indicaciones o materiales
          <textarea
            name="notes"
            onChange={onChange}
            placeholder="Describe el mobiliario, equipo o apoyo necesario"
            rows="3"
            value={form.notes}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            Registrar solicitud
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
