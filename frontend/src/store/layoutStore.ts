import { create } from 'zustand';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

const DEFAULT_NAV_ITEMS = [
  '/dashboard',
  '/leads',
  '/my-work',
  '/analytics',
  '/campaigns',
  '/reports',
  '/notifications-page',
  '/settings'
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
  const saved = localStorage.getItem('leadgrowth_enabled_nav_items_v4');
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
  return DEFAULT_NAV_ITEMS;
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
        if (state.enabledNavItems.length <= 1) return state;
        updated = state.enabledNavItems.filter((p) => p !== path);
      } else {
        updated = [...state.enabledNavItems, path];
      }
      localStorage.setItem('leadgrowth_enabled_nav_items_v4', JSON.stringify(updated));
      return { enabledNavItems: updated };
    });
  },
  resetNavItems: () => {
    localStorage.setItem('leadgrowth_enabled_nav_items_v4', JSON.stringify(DEFAULT_NAV_ITEMS));
    set({ enabledNavItems: DEFAULT_NAV_ITEMS });
  },
}));

