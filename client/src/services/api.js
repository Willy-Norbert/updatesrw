import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const AUTH_CLEARED_EVENT = 'updaterw:auth-cleared';

let accessToken = localStorage.getItem('updaterw_token');
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
  if (token) localStorage.setItem('updaterw_token', token);
  else localStorage.removeItem('updaterw_token');
}

export function getAccessToken() {
  return accessToken;
}

function clearSession() {
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  }
}

function setAuthHeader(headers, token) {
  const value = `Bearer ${token}`;
  if (headers && typeof headers.set === 'function') {
    headers.set('Authorization', value);
    return headers;
  }
  return { ...(headers || {}), Authorization: value };
}

function restoreJsonBody(config) {
  if (typeof config.data !== 'string') return;
  const contentType = config.headers?.['Content-Type'] || config.headers?.['content-type'] || '';
  const headerValue = typeof contentType === 'string' ? contentType : String(contentType);
  if (!headerValue.includes('application/json')) return;
  try {
    config.data = JSON.parse(config.data);
  } catch {
    /* leave as-is */
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers = setAuthHeader(config.headers, token);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const url = original.url || '';
    const skip = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !skip) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').then((res) => {
            const token = res.data.data.accessToken;
            setAccessToken(token);
            return token;
          }).finally(() => {
            refreshPromise = null;
          });
        }
        const token = await refreshPromise;
        original.headers = setAuthHeader(original.headers, token);
        restoreJsonBody(original);
        return api(original);
      } catch (refreshError) {
        clearSession();
        throw refreshError;
      }
    }
    throw error;
  }
);

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  const details = Array.isArray(data?.errors)
    ? data.errors.map((item) => item.message).filter(Boolean)
    : [];
  if (details.length) return [...new Set(details)].join('. ');
  return data?.message || error.message || fallback;
}

export default api;
