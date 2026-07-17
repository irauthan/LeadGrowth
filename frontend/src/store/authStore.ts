import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  setWorkspace: (workspaceId: number | undefined, workspaceName: string | undefined, workspaceSlug: string | undefined, inviteCode: string | undefined, roleName?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (updatedUser) => set((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            ...updatedUser,
          },
        };
      }),
      setWorkspace: (workspaceId, workspaceName, workspaceSlug, inviteCode, roleName) => set((state) => {
        if (!state.user) return state;
        const currentRoles = roleName ? [roleName] : state.user.roles;
        return {
          user: {
            ...state.user,
            workspaceId,
            workspaceName,
            workspaceSlug,
            inviteCode,
            roles: currentRoles,
          },
        };
      }),
    }),
    {
      name: 'leadgrowth-auth',
    }
  )
);
