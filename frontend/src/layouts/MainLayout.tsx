import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import { useLayoutStore } from '../store/layoutStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Hoossh Lead Growth | Dashboard',
  '/my-work': 'Hoossh Lead Growth | My Work & Tasks',
  '/leads': 'Hoossh Lead Growth | Leads & CRM',
  '/campaigns': 'Hoossh Lead Growth | Campaigns & Ads',
  '/analytics': 'Hoossh Lead Growth | Analytics & Growth',
  '/reports': 'Hoossh Lead Growth | Reports & Exports',
  '/scheduler': 'Hoossh Lead Growth | Scheduler & Calendar',
  '/followups': 'Hoossh Lead Growth | Follow-ups',
  '/users': 'Hoossh Lead Growth | Team & Members',
  '/settings': 'Hoossh Lead Growth | Settings',
  '/billing': 'Hoossh Lead Growth | Billing & Subscriptions',
  '/integrations': 'Hoossh Lead Growth | Integrations',
  '/profile': 'Hoossh Lead Growth | Profile',
  '/admin/work-monitor': 'Hoossh Lead Growth | Executive Monitor',
  '/admin/users': 'Hoossh Lead Growth | User Management',
  '/admin/workspace': 'Hoossh Lead Growth | Workspace Management',
  '/admin/api': 'Hoossh Lead Growth | API Management',
  '/admin/system': 'Hoossh Lead Growth | System Monitoring',
  '/admin/security': 'Hoossh Lead Growth | Security Center',
  '/admin/audit-logs': 'Hoossh Lead Growth | Audit Logs'
};

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { isCollapsed, sidebarPosition } = useLayoutStore();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || 'Hoossh Lead Growth CRM';
    document.title = title;
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated but has no workspace, redirect to onboarding flow
  if (!user?.workspaceId && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has a workspace and goes to onboarding, redirect back to dashboard
  if (user?.workspaceId && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  const isFullScreen = location.pathname.startsWith('/scheduler') || location.pathname.startsWith('/calendar');

  const getMainDesktopPadding = () => {
    if (sidebarPosition === 'right') {
      return isCollapsed ? 'lg:pr-[72px] lg:pl-0' : 'lg:pr-[260px] lg:pl-0';
    }
    if (sidebarPosition === 'top' || sidebarPosition === 'bottom') {
      return 'lg:pl-0 lg:pr-0';
    }
    return isCollapsed ? 'lg:pl-[72px] lg:pr-0' : 'lg:pl-[260px] lg:pr-0';
  };

  const getMainContentPadding = () => {
    if (isFullScreen) {
      if (sidebarPosition === 'top') return 'pt-24 pb-0';
      if (sidebarPosition === 'bottom') return 'pt-16 pb-16';
      return 'pt-16 pb-0';
    }
    if (sidebarPosition === 'top') {
      return 'pt-28 pb-24 lg:pb-8';
    }
    if (sidebarPosition === 'bottom') {
      return 'pt-16 pb-24 lg:pb-20';
    }
    return 'pt-16 pb-24 lg:pb-8';
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-theme-bg text-theme-text transition-colors duration-300">
      <Sidebar />
      <div className={`flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ${getMainDesktopPadding()}`}>
        <Navbar />
        <main className={`flex-1 max-w-full ${isFullScreen ? 'p-0 overflow-hidden flex flex-col' : 'overflow-x-hidden px-4 sm:px-8 py-6'} ${getMainContentPadding()}`}>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
