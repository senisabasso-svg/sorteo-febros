function apiUrl(path) {
  const base = (window.API_BASE || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...options,
  });
}
