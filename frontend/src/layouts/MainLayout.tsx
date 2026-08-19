import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { useLayoutStore } from '../store/layoutStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Hoossh | Dashboard',
  '/my-work': 'Hoossh | My Work & Tasks',
  '/leads': 'Hoossh | Leads',
  '/campaigns': 'Hoossh | Campaigns',
  '/analytics': 'Hoossh | Analytics',
  '/reports': 'Hoossh | Reports',
  '/scheduler': 'Hoossh | Scheduler',
  '/followups': 'Hoossh | Follow-ups',
  '/users': 'Hoossh | Team',
  '/settings': 'Hoossh | Settings',
  '/billing': 'Hoossh | Billing',
  '/integrations': 'Hoossh | Integrations',
  '/profile': 'Hoossh | Profile',
  '/admin/work-monitor': 'Hoossh | Executive Monitor',
  '/admin/users': 'Hoossh | User Management',
  '/admin/workspace': 'Hoossh | Workspace Management',
  '/admin/api': 'Hoossh | API Management',
  '/admin/system': 'Hoossh | System Monitoring',
  '/admin/security': 'Hoossh | Security Center',
  '/admin/audit-logs': 'Hoossh | Audit Logs'
};

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { isCollapsed, sidebarPosition } = useLayoutStore();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || 'Hoossh Lead Management';
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

  const getMainDesktopPadding = () => {
    if (sidebarPosition === 'right') {
      return isCollapsed ? 'lg:pr-[110px] lg:pl-0' : 'lg:pr-[300px] lg:pl-0';
    }
    if (sidebarPosition === 'top' || sidebarPosition === 'bottom') {
      return 'lg:pl-0 lg:pr-0';
    }
    return isCollapsed ? 'lg:pl-[110px]' : 'lg:pl-[300px]';
  };

  const getMainContentPadding = () => {
    if (sidebarPosition === 'top') {
      return 'pt-20 sm:pt-44 pb-24 lg:pb-8';
    }
    if (sidebarPosition === 'bottom') {
      return 'pt-20 sm:pt-28 pb-24 lg:pb-28';
    }
    return 'pt-20 sm:pt-28 pb-24 lg:pb-8';
  };

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-theme-bg text-theme-text transition-colors duration-300">
      <Sidebar />
      <div className={`flex flex-col min-h-screen max-w-full overflow-x-hidden transition-all duration-300 ${getMainDesktopPadding()}`}>
        <Navbar />
        <main className={`flex-1 max-w-full overflow-x-hidden px-3 sm:px-6 ${getMainContentPadding()}`}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
