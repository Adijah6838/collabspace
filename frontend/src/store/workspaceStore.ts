import { create } from 'zustand';
import { api } from '../api';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number };
}

interface WorkspaceState {
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/workspaces');
      set({ workspaces: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to load workspaces', isLoading: false });
    }
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/workspaces', { name });
      set((state) => ({
        workspaces: [res.data, ...state.workspaces],
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create workspace', isLoading: false });
      return false;
    }
  },
}));