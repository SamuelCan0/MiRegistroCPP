export function WelcomePanel({ onNewRequest }) {
  return (
    <section className="welcome-panel" aria-labelledby="welcome-title">
      <div>
        <p className="eyebrow">Panel de reservaciones</p>
        <h2 id="welcome-title">
          Organiza cada espacio, sin cruces ni contratiempos.
        </h2>
        <p>
          Consulta las actividades del colegio y registra nuevas solicitudes
          con al menos 2 días de anticipación.
        </p>
      </div>
      <button className="primary-button" type="button" onClick={onNewRequest}>
        <span aria-hidden="true">＋</span>
        Nueva solicitud
      </button>
    </section>
  )
}
