import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Megaphone, 
  UserCheck, 
  BarChart3, 
  FileSpreadsheet, 
  CheckSquare, 
  Users, 
  History,
  Bell,
  Settings, 
  UserCog,
  Building2,
  Key,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Building
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  const generalMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { name: 'Leads', icon: UserCheck, path: '/leads' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Reports', icon: FileSpreadsheet, path: '/reports' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Team Management', icon: Users, path: '/users' },
    { name: 'Activity Logs', icon: History, path: '/activity-logs' },
    { name: 'Notifications', icon: Bell, path: '/notifications-page' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const adminMenu = [
    { name: 'User Management', icon: UserCog, path: '/admin/users' },
    { name: 'Workspace Management', icon: Building2, path: '/admin/workspace' },
    { name: 'API Management', icon: Key, path: '/admin/api' },
    { name: 'System Monitoring', icon: Activity, path: '/admin/system' },
  ];

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? '88px' : '280px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed bottom-4 left-4 top-4 z-40 flex flex-col rounded-3xl border border-theme-border bg-theme-card/75 shadow-2xl backdrop-blur-xl"
    >
      {/* Header Logo */}
      <div className="flex h-20 items-center justify-between px-6 border-b border-theme-border/30">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-white shadow-lg nav-glow">
            <TrendingUp size={22} className="animate-pulse-slow" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-r from-theme-primary to-indigo-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
            >
              Lead Growth
            </motion.span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-theme-border bg-theme-bg text-theme-text/80 shadow-md transition-all hover:bg-theme-bg-alt"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Workspace Selector Block */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/20 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-primary/10 text-theme-primary">
            <Building size={16} />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-hidden"
            >
              <h4 className="text-xs font-bold truncate">{user?.workspaceName || 'Default Workspace'}</h4>
              <p className="text-[9px] font-semibold text-theme-text-muted truncate">Code: {user?.inviteCode || 'N/A'}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* General items */}
        <div className="space-y-1">
          {!isCollapsed && (
            <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">General</span>
          )}
          {generalMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-theme-primary to-indigo-500 text-white shadow-lg shadow-theme-primary/20 nav-glow'
                    : 'text-theme-text/80 hover:bg-theme-bg-alt hover:text-theme-text'
                }`}
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-theme-text-muted group-hover:text-theme-text'
                  }`}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Admin only items */}
        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-theme-border/30">
            {!isCollapsed && (
              <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Admin Only</span>
            )}
            {adminMenu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-theme-primary to-indigo-500 text-white shadow-lg shadow-theme-primary/20 nav-glow'
                      : 'text-theme-text/80 hover:bg-theme-bg-alt hover:text-theme-text'
                  }`}
                >
                  <item.icon
                    size={18}
                    className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-theme-text-muted group-hover:text-theme-text'
                    }`}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer User Profile & Session Logout */}
      <div className="p-3 border-t border-theme-border/30 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/10">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Avatar"
              className="h-8 w-8 rounded-xl object-cover shadow-sm border border-theme-border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-xs font-bold text-white shadow-sm">
              {getInitials(user?.fullName)}
            </div>
          )}
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-hidden"
            >
              <h5 className="text-xs font-bold truncate leading-none">{user?.fullName}</h5>
              <span className="text-[9px] font-semibold text-theme-text-muted truncate leading-none mt-1 block">
                {user?.roles[0]?.replace('ROLE_', '') || 'USER'}
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.div>
  );
}
