/**
 * apiClient Utility
 * Standard wrapper for authenticated API requests attaching JWT tokens automatically.
 */
export async function apiFetch(url, options = {}) {
  let token = null;
  try {
    const userStr = sessionStorage.getItem('medxpert_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      token = user.token;
    }
  } catch (e) {
    console.error('Error reading session token:', e);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
