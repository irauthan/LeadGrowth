import { create } from 'zustand';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

const ALL_DEFAULT_ITEMS = [
  '/dashboard',
  '/campaigns',
  '/leads',
  '/analytics',
  '/reports',
  '/tasks',
  '/users',
  '/activity-logs',
  '/notifications-page',
  '/settings',
  '/admin/users',
  '/admin/workspace',
  '/admin/api',
  '/admin/system'
];

interface LayoutState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  sidebarPosition: SidebarPosition;
  enabledNavItems: string[];
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  toggleNavItem: (path: string) => void;
  resetNavItems: () => void;
}

const getSavedPosition = (): SidebarPosition => {
  const saved = localStorage.getItem('leadgrowth_sidebar_position');
  if (saved === 'left' || saved === 'right' || saved === 'top' || saved === 'bottom') {
    return saved;
  }
  return 'left';
};

const getSavedNavItems = (): string[] => {
  const saved = localStorage.getItem('leadgrowth_enabled_nav_items');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return ALL_DEFAULT_ITEMS;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  sidebarPosition: getSavedPosition(),
  enabledNavItems: getSavedNavItems(),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  setSidebarPosition: (position) => {
    localStorage.setItem('leadgrowth_sidebar_position', position);
    set({ sidebarPosition: position });
  },
  toggleNavItem: (path) => {
    set((state) => {
      let updated: string[];
      if (state.enabledNavItems.includes(path)) {
        // Prevent removing everything (at least keep dashboard)
        if (state.enabledNavItems.length <= 1) return state;
        updated = state.enabledNavItems.filter((p) => p !== path);
      } else {
        updated = [...state.enabledNavItems, path];
      }
      localStorage.setItem('leadgrowth_enabled_nav_items', JSON.stringify(updated));
      return { enabledNavItems: updated };
    });
  },
  resetNavItems: () => {
    localStorage.setItem('leadgrowth_enabled_nav_items', JSON.stringify(ALL_DEFAULT_ITEMS));
    set({ enabledNavItems: ALL_DEFAULT_ITEMS });
  },
}));

