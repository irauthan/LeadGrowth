import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

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

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
      <Sidebar />
      <div className="flex flex-col pl-24 md:pl-28 lg:pl-[280px]">
        <Navbar />
        <main className="flex-1 px-6 pb-8 pt-28">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
