async function usersRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || 'No fue posible gestionar los usuarios.')
  }
  return payload
}

export async function listUsers() {
  const payload = await usersRequest('/api/users')
  return payload.users
}

export async function createUser(user) {
  const payload = await usersRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
  return payload.user
}

export async function updateUser(id, user) {
  const payload = await usersRequest(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  })
  return payload.user
}

export async function deleteUser(id) {
  await usersRequest(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
