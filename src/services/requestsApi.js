async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      payload?.error || 'No fue posible comunicarse con el servidor.',
    )
  }

  return payload
}

export async function listRequests() {
  const payload = await apiRequest('/api/requests')
  return payload.requests
}

export async function createRequest(request) {
  const payload = await apiRequest('/api/requests', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  return payload.request
}

export async function updateRequest(id, request) {
  const payload = await apiRequest(`/api/requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
  return payload.request
}

export async function deleteRequest(id) {
  await apiRequest(`/api/requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
