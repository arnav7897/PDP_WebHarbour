import { create } from 'zustand';
import api, {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeSessionTokens,
} from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!accessToken && !refreshToken) {
      set({ loading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, loading: false });
    } catch {
      clearStoredSession();
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken } = storeSessionTokens(data);
    set({ user: accessToken ? data.user : null, isAuthenticated: Boolean(accessToken), loading: false });
    return data;
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    const { accessToken } = storeSessionTokens(data);
    set({ user: accessToken ? data.user : null, isAuthenticated: Boolean(accessToken), loading: false });
    return data;
  },

  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      void error;
    }
    clearStoredSession();
    set({ user: null, isAuthenticated: false, loading: false });
  },

  refreshUser: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data });
    return data;
  },

  updateUser: (user) => {
    set((state) => ({ user: user ? { ...state.user, ...user } : state.user }));
  },
}));
