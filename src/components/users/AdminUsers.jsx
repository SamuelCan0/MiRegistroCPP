import { useEffect, useState } from 'react'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../../services/usersApi'
import { AppIcon } from '../ui/AppIcon'

const emptyForm = {
  displayName: '',
  email: '',
  role: 'user',
}

export function AdminUsers({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [busyUserId, setBusyUserId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setNotice('')
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (isCreating) return
    setIsCreating(true)
    setError('')
    setNotice('')
    try {
      const created = await createUser(form)
      setUsers((current) =>
        [...current, created].sort((a, b) =>
          a.displayName.localeCompare(b.displayName, 'es'),
        ),
      )
      setForm(emptyForm)
      setNotice(
        'Usuario autorizado. Al iniciar sesión podrá crear su contraseña.',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRoleChange(user, role) {
    setBusyUserId(user.id)
    setError('')
    setNotice('')
    try {
      const updated = await updateUser(user.id, {
        displayName: user.displayName,
        role,
      })
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setNotice(`Permisos de ${updated.displayName} actualizados.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyUserId('')
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `¿Eliminar el acceso de ${user.displayName}? Esta acción cerrará sus sesiones.`,
    )
    if (!confirmed) return

    setBusyUserId(user.id)
    setError('')
    setNotice('')
    try {
      await deleteUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setNotice(`Acceso de ${user.displayName} eliminado.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyUserId('')
    }
  }

  return (
    <section className="users-panel" id="usuarios" aria-labelledby="users-title">
      <div className="users-header">
        <div>
          <p className="eyebrow">Control de acceso</p>
          <h2 id="users-title">Administrar usuarios</h2>
          <p>
            Autoriza correos institucionales y define qué personas pueden
            administrar las solicitudes.
          </p>
        </div>
        <span className="users-count">
          <strong>{users.length}</strong>
          usuarios
        </span>
      </div>

      <form className="user-create-form" onSubmit={handleCreate}>
        <label>
          Nombre completo
          <input
            name="displayName"
            onChange={handleFieldChange}
            placeholder="Ej. María López"
            required
            value={form.displayName}
          />
        </label>
        <label>
          Correo institucional
          <input
            autoCapitalize="none"
            inputMode="email"
            name="email"
            onChange={handleFieldChange}
            placeholder="usuario@colegiopedropalacios.edu.mx"
            required
            type="email"
            value={form.email}
          />
        </label>
        <label>
          Permisos
          <select name="role" onChange={handleFieldChange} value={form.role}>
            <option value="user">Personal: crear y visualizar</option>
            <option value="admin">Administrador: control total</option>
          </select>
        </label>
        <button
          className="primary-button"
          disabled={isCreating}
          type="submit"
        >
          <AppIcon name={isCreating ? 'spinner' : 'plus'} spin={isCreating} />
          Agregar usuario
        </button>
      </form>

      {error && <p className="users-feedback error" role="alert">{error}</p>}
      {notice && <p className="users-feedback success">{notice}</p>}

      <div className="users-list" aria-live="polite">
        {isLoading ? (
          <p className="users-empty">
            <AppIcon name="spinner" spin /> Cargando usuarios…
          </p>
        ) : users.length === 0 ? (
          <p className="users-empty">Todavía no hay usuarios autorizados.</p>
        ) : (
          users.map((user) => {
            const isSelf = user.id === currentUserId
            const isBusy = busyUserId === user.id
            const isLocked = isSelf || Boolean(user.isProtected)
            return (
              <article className="user-row" key={user.id}>
                <span className="user-avatar" aria-hidden="true">
                  {user.displayName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <span className="user-identity">
                  <strong>
                    {user.displayName}
                    {isSelf ? (
                      <small>Tu cuenta</small>
                    ) : user.isProtected ? (
                      <small>Principal</small>
                    ) : null}
                  </strong>
                  <span>{user.email}</span>
                </span>
                <span
                  className={`account-status ${user.isActive ? 'active' : 'invited'}`}
                >
                  {user.isActive ? 'Cuenta activa' : 'Contraseña pendiente'}
                </span>
                <label className="role-control">
                  <span className="sr-only">Permisos de {user.displayName}</span>
                  <select
                    disabled={isBusy || isLocked}
                    onChange={(event) =>
                      handleRoleChange(user, event.target.value)
                    }
                    value={user.role}
                  >
                    <option value="user">Personal</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <button
                  aria-label={`Eliminar acceso de ${user.displayName}`}
                  className="user-delete-button"
                  disabled={isBusy || isLocked}
                  onClick={() => handleDelete(user)}
                  title={
                    isLocked
                      ? 'La cuenta principal está protegida'
                      : 'Eliminar usuario'
                  }
                  type="button"
                >
                  <AppIcon name={isBusy ? 'spinner' : 'delete'} spin={isBusy} />
                </button>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
