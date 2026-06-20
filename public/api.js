function apiUrl(path) {
  const base = (window.API_BASE || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: window.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY || ''}`,
    ...options.headers,
  };

  const adminToken = sessionStorage.getItem('admin_token');
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken;
  }

  return fetch(apiUrl(path), {
    ...options,
    headers,
  });
}
