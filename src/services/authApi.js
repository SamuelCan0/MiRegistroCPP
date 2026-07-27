export class AuthRequestError extends Error {
  constructor(message, code = '') {
    super(message)
    this.name = 'AuthRequestError'
    this.code = code
  }
}

async function authRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new AuthRequestError(
      payload?.error || 'No fue posible completar la autenticación.',
      payload?.code,
    )
  }
  return payload
}

export async function getSession() {
  const payload = await authRequest('/api/auth/session')
  return payload.user
}

export async function login(credentials) {
  const payload = await authRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return payload.user
}

export async function setupPassword(credentials) {
  const payload = await authRequest('/api/auth/setup-password', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return payload.user
}

export async function logout() {
  await authRequest('/api/auth/logout', { method: 'POST' })
}
