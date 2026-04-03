import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const { data } = await api.get('/auth/me');
    set({ user: data });
    return data;
  },
}));
