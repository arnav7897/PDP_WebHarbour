import axios from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const normalizeToken = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return null;
  }
  return trimmed;
};

export const getStoredAccessToken = () => normalizeToken(localStorage.getItem(ACCESS_TOKEN_KEY));
export const getStoredRefreshToken = () => normalizeToken(localStorage.getItem(REFRESH_TOKEN_KEY));

export const clearStoredSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const storeSessionTokens = (data = {}) => {
  const accessToken = normalizeToken(data.accessToken || data.token);
  const refreshToken = normalizeToken(data.refreshToken);

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  return { accessToken, refreshToken };
};

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

const refreshSession = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const { data } = await axios.post('/auth/refresh', { refreshToken });
  const { accessToken } = storeSessionTokens(data);

  if (!accessToken) {
    throw new Error('Refresh response did not include an access token');
  }

  return {
    accessToken,
    user: data.user || null,
  };
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        refreshPromise = refreshPromise || refreshSession();
        const { accessToken } = await refreshPromise;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        clearStoredSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
