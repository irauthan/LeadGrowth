import { useAuthStore } from '../store/authStore';
import AdminDashboard from './dashboards/AdminDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import UserDashboard from './dashboards/UserDashboard';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isManager) {
    return <ManagerDashboard />;
  }

  return <UserDashboard />;
}
