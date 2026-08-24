import { create } from 'zustand';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DashboardCardConfig {
  id: string;
  label: string;
  category: 'User' | 'Manager' | 'Admin' | 'All';
  description: string;
  enabled: boolean;
}

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: 'kpis_summary', label: 'Primary KPI Stat Cards', category: 'All', description: 'Pipeline, Follow-ups, Conversions & Revenue summary cards', enabled: true },
  { id: 'workflow_queue', label: 'Workflow Steps Queue', category: 'User', description: 'Active lead counts across workflow stages (New, Interaction, Proposal, Negotiation, Converted)', enabled: true },
  { id: 'pending_leads', label: 'Pending Assigned Leads', category: 'User', description: 'Lead queue acceptance & pipeline addition list', enabled: true },
  { id: 'today_followups', label: 'Today\'s Follow-up Schedule', category: 'User', description: 'Reminders list for scheduled client touchpoints', enabled: true },
  { id: 'call_metrics', label: 'Call & Outreach Analytics', category: 'All', description: 'Call logs, talk time & communication summary', enabled: true },
  { id: 'team_workload', label: 'Team Workload & Smart Scores', category: 'Manager', description: 'Workload distribution & executive scoring metrics', enabled: true },
  { id: 'pipeline_health', label: 'Pipeline Intake & Conversion Funnel', category: 'Manager', description: 'Stage distribution & lead intake breakdown', enabled: true },
  { id: 'unassigned_queue', label: 'Unassigned Queue & Auto-Sweep', category: 'Manager', description: 'Queue monitoring & automated lead distribution', enabled: true },
  { id: 'revenue_trends', label: 'Revenue & Campaign Growth Trends', category: 'Admin', description: 'Revenue chart & platform marketing trends', enabled: true },
  { id: 'system_metrics', label: 'System Health & Infrastructure Telemetry', category: 'Admin', description: 'CPU, RAM, DB connection & API latency stats', enabled: true },
  { id: 'audit_logs', label: 'Security & Real-time Audit Trail', category: 'Admin', description: 'Security alerts, login attempts & audit event stream', enabled: true }
];

const DEFAULT_NAV_ITEMS = [
  '/dashboard',
  '/leads',
  '/my-work',
  '/analytics',
  '/scheduler',
  '/calendar',
  '/campaigns',
  '/reports',
  '/notifications-page',
  '/settings',
  '/followups',
  '/users',
  '/activity-logs',
  '/billing',
  '/admin/work-monitor',
  '/admin/users',
  '/admin/workspace',
  '/admin/api',
  '/admin/system',
  '/admin/security',
  '/admin/audit-logs'
];

interface LayoutState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  sidebarPosition: SidebarPosition;
  enabledNavItems: string[];
  dashboardCards: DashboardCardConfig[];
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  setSidebarPosition: (position: SidebarPosition) => void;
  toggleNavItem: (path: string) => void;
  resetNavItems: () => void;
  toggleDashboardCard: (id: string) => void;
  moveDashboardCard: (id: string, direction: 'up' | 'down') => void;
  resetDashboardCards: () => void;
}

const getSavedPosition = (): SidebarPosition => {
  const saved = localStorage.getItem('leadgrowth_sidebar_position');
  if (saved === 'left' || saved === 'right' || saved === 'top' || saved === 'bottom') {
    return saved;
  }
  return 'left';
};

const getSavedNavItems = (): string[] => {
  const saved = localStorage.getItem('leadgrowth_enabled_nav_items_v5');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const missing = DEFAULT_NAV_ITEMS.filter((item) => !parsed.includes(item));
        return [...parsed, ...missing];
      }
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_NAV_ITEMS;
};

const getSavedDashboardCards = (): DashboardCardConfig[] => {
  const saved = localStorage.getItem('leadgrowth_dashboard_cards_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const savedIds = new Set(parsed.map((p: any) => p.id));
        const orderedSaved = parsed
          .filter((p: any) => DEFAULT_DASHBOARD_CARDS.some((d) => d.id === p.id))
          .map((p: any) => {
            const def = DEFAULT_DASHBOARD_CARDS.find((d) => d.id === p.id)!;
            return { ...def, enabled: p.enabled };
          });
        DEFAULT_DASHBOARD_CARDS.forEach((d) => {
          if (!savedIds.has(d.id)) orderedSaved.push(d);
        });
        return orderedSaved;
      }
    } catch (e) {
      console.error('Error loading dashboard cards preferences', e);
    }
  }
  return DEFAULT_DASHBOARD_CARDS;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  sidebarPosition: getSavedPosition(),
  enabledNavItems: getSavedNavItems(),
  dashboardCards: getSavedDashboardCards(),
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
  toggleDashboardCard: (id) => {
    set((state) => {
      const updated = state.dashboardCards.map((card) =>
        card.id === id ? { ...card, enabled: !card.enabled } : card
      );
      localStorage.setItem('leadgrowth_dashboard_cards_v1', JSON.stringify(updated));
      return { dashboardCards: updated };
    });
  },
  moveDashboardCard: (id, direction) => {
    set((state) => {
      const index = state.dashboardCards.findIndex((c) => c.id === id);
      if (index === -1) return state;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.dashboardCards.length) return state;

      const updated = [...state.dashboardCards];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      localStorage.setItem('leadgrowth_dashboard_cards_v1', JSON.stringify(updated));
      return { dashboardCards: updated };
    });
  },
  resetDashboardCards: () => {
    localStorage.setItem('leadgrowth_dashboard_cards_v1', JSON.stringify(DEFAULT_DASHBOARD_CARDS));
    set({ dashboardCards: DEFAULT_DASHBOARD_CARDS });
  },
}));

