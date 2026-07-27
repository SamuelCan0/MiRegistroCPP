import { useEffect, useState } from 'react'
import { AppIcon } from '../ui/AppIcon'

const emptyForm = {
  email: '',
  password: '',
  confirmPassword: '',
}

export function AuthScreen({
  error,
  isChecking,
  isSubmitting,
  onCancelPasswordSetup,
  onClearError,
  onCompletePasswordSetup,
  onSignIn,
  setupEmail,
}) {
  const [form, setForm] = useState(emptyForm)
  const [localError, setLocalError] = useState('')
  const isPasswordSetup = Boolean(setupEmail)

  useEffect(() => {
    if (setupEmail) {
      setForm({ ...emptyForm, email: setupEmail })
    }
  }, [setupEmail])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setLocalError('')
    onClearError()
  }

  function cancelSetup() {
    setForm(emptyForm)
    setLocalError('')
    onCancelPasswordSetup()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    if (isPasswordSetup && form.password !== form.confirmPassword) {
      setLocalError('Las contraseñas no coinciden.')
      return
    }

    const credentials = {
      email: isPasswordSetup ? setupEmail : form.email,
      password: form.password,
    }
    if (isPasswordSetup) {
      await onCompletePasswordSetup(credentials)
    } else {
      await onSignIn(credentials)
    }
  }

  if (isChecking) {
    return (
      <main className="auth-page auth-loading" aria-live="polite">
        <span className="auth-spinner">
          <AppIcon name="spinner" spin />
        </span>
        <p>Verificando tu sesión…</p>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-labelledby="auth-brand-title">
        <div className="auth-brand">
          <span className="auth-logo">
            <img src="/logo.png" alt="Escudo del Colegio Pedro Palacios" />
          </span>
          <span>
            <strong>Colegio Pedro Palacios</strong>
            <small>Sistema de reservaciones</small>
          </span>
        </div>
        <div className="auth-message">
          <p className="eyebrow">Acceso institucional</p>
          <h1 id="auth-brand-title">
            Los espacios del colegio, organizados en un solo lugar.
          </h1>
          <p>
            Consulta disponibilidad, registra solicitudes y da seguimiento al
            calendario escolar desde cualquier dispositivo.
          </p>
        </div>
        <div className="auth-permissions">
          <span><AppIcon name="check" /> Personal: crear y consultar</span>
          <span><AppIcon name="check" /> Administración: editar y eliminar</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-icon" aria-hidden="true">
            <AppIcon name={isPasswordSetup ? 'user' : 'lock'} />
          </div>
          <p className="eyebrow">
            {isPasswordSetup ? 'Cuenta autorizada' : 'Bienvenido de nuevo'}
          </p>
          <h2>
            {isPasswordSetup ? 'Crea tu contraseña' : 'Inicia sesión'}
          </h2>
          <p className="auth-intro">
            {isPasswordSetup
              ? 'Administración ya autorizó tu cuenta. Elige una contraseña personal para terminar.'
              : 'Usa el correo institucional autorizado por Administración.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Correo institucional
              <span className="auth-input">
                <AppIcon name="email" />
                <input
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isPasswordSetup}
                  inputMode="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="usuario@colegiopedropalacios.edu.mx"
                  required
                  type="email"
                  value={isPasswordSetup ? setupEmail : form.email}
                />
              </span>
            </label>
            <label>
              {isPasswordSetup ? 'Nueva contraseña' : 'Contraseña'}
              <span className="auth-input">
                <AppIcon name="lock" />
                <input
                  autoComplete={isPasswordSetup ? 'new-password' : 'current-password'}
                  minLength={isPasswordSetup ? 10 : undefined}
                  name="password"
                  onChange={handleChange}
                  placeholder={isPasswordSetup ? 'Mínimo 10 caracteres' : 'Tu contraseña'}
                  required
                  type="password"
                  value={form.password}
                />
              </span>
            </label>
            {isPasswordSetup && (
              <label>
                Confirmar contraseña
                <span className="auth-input">
                  <AppIcon name="lock" />
                  <input
                    autoComplete="new-password"
                    minLength="10"
                    name="confirmPassword"
                    onChange={handleChange}
                    placeholder="Escríbela de nuevo"
                    required
                    type="password"
                    value={form.confirmPassword}
                  />
                </span>
              </label>
            )}

            {(localError || error) && (
              <p className="auth-error" role="alert">
                <AppIcon name="warning" />
                {localError || error}
              </p>
            )}

            <button
              className="primary-button auth-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <AppIcon name="spinner" spin />
              ) : (
                <AppIcon name={isPasswordSetup ? 'check' : 'arrowRight'} />
              )}
              {isPasswordSetup ? 'Guardar contraseña y entrar' : 'Entrar al sistema'}
            </button>
            {isPasswordSetup && (
              <button
                className="auth-cancel-button"
                onClick={cancelSetup}
                type="button"
              >
                Usar otro correo
              </button>
            )}
          </form>

          <p className="auth-help">
            El acceso se limita a las cuentas que Administración agregue
            previamente con el dominio{' '}
            <strong>@colegiopedropalacios.edu.mx</strong>.
          </p>
        </div>
      </section>
    </main>
  )
}
