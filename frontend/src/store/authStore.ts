import { create } from 'zustand';
import { api } from '../api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { email, password, firstName, lastName });
      localStorage.setItem('token', res.data.token);
      set({ user: res.data.user, token: res.data.token, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch (err) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));