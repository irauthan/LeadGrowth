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
      login: (token, user) => {
        const normalizedRoles = (user.roles || []).map((r: any) =>
          typeof r === 'string' ? r : r.name || 'ROLE_USER'
        );
        set({ token, user: { ...user, roles: normalizedRoles }, isAuthenticated: true });
      },
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (updatedUser) => set((state) => {
        if (!state.user) return state;
        const current = { ...state.user, ...updatedUser };
        if (current.roles) {
          current.roles = current.roles.map((r: any) => typeof r === 'string' ? r : r.name || 'ROLE_USER');
        }
        return { user: current };
      }),
      setWorkspace: (workspaceId, workspaceName, workspaceSlug, inviteCode, roleName) => set((state) => {
        if (!state.user) return state;
        const normalizedRoleName = typeof roleName === 'string' ? roleName : (roleName as any)?.name;
        const currentRoles = normalizedRoleName
          ? [normalizedRoleName]
          : state.user.roles.map((r: any) => typeof r === 'string' ? r : r.name || 'ROLE_USER');
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
