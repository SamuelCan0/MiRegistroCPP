import './App.css'

const modules = [
  {
    title: 'Salón de actos',
    description: 'Reserva el espacio, mobiliario, sonido y equipo de proyección.',
  },
  {
    title: 'Centro de cómputo',
    description: 'Administra horarios y actividades en el centro de cómputo.',
  },
  {
    title: 'Biblioteca',
    description: 'Registra reservaciones, mobiliario y equipo de cómputo.',
  },
  {
    title: 'Mobiliario y materiales',
    description: 'Controla préstamos, cantidades y fechas de devolución.',
  },
]

function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Colegio Pedro Palacios</p>
        <h1>Mi Registro</h1>
        <p className="hero-copy">
          Sistema de préstamos y reservaciones de espacios, mobiliario y equipo.
        </p>
        <button type="button">Nueva solicitud</button>
      </header>

      <section className="modules" aria-labelledby="modules-title">
        <div className="section-heading">
          <p className="eyebrow">Módulos</p>
          <h2 id="modules-title">¿Qué deseas registrar?</h2>
        </div>

        <div className="card-grid">
          {modules.map((module) => (
            <article className="module-card" key={module.title}>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <a href="#solicitud">Abrir módulo</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
