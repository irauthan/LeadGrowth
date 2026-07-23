import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import { useLayoutStore } from '../store/layoutStore';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { isCollapsed, sidebarPosition } = useLayoutStore();

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
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
      <Sidebar />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${getMainDesktopPadding()}`}>
        <Navbar />
        <main className={`flex-1 px-3 sm:px-6 ${getMainContentPadding()}`}>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
