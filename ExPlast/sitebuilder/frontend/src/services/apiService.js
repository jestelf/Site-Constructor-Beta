async function api(method, path, body) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!r.ok) throw await r.text()
  return r.json()
}

export const apiService = {
  get: path => api('GET', path),
  post: (path, body) => api('POST', path, body),
  put: (path, body) => api('PUT', path, body),
  delete: path => api('DELETE', path)
}
