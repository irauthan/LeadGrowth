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
  Building,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLayoutStore } from '../store/layoutStore';

export default function Sidebar() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, sidebarPosition, enabledNavItems } = useLayoutStore();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';

  const getSidebarPlacement = () => {
    if (isMobileOpen) {
      return 'left-4 top-4 bottom-4 w-[280px] max-w-[85vw] flex-col';
    }
    const baseMobile = '-translate-x-full lg:translate-x-0';
    if (sidebarPosition === 'right') {
      return `${baseMobile} lg:right-4 lg:left-auto lg:top-4 lg:bottom-4 lg:flex-col`;
    }
    if (sidebarPosition === 'top') {
      return `-translate-x-full lg:top-[88px] lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:bottom-auto lg:flex-row lg:h-16 lg:w-max lg:max-w-[95vw]`;
    }
    if (sidebarPosition === 'bottom') {
      return `-translate-x-full lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:top-auto lg:flex-row lg:h-16 lg:w-max lg:max-w-[95vw]`;
    }
    return `${baseMobile} lg:left-4 lg:right-auto lg:top-4 lg:bottom-4 lg:flex-col`;
  };

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

  const visibleGeneralMenu = generalMenu.filter(item => enabledNavItems.includes(item.path));
  const visibleAdminMenu = adminMenu.filter(item => enabledNavItems.includes(item.path));

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const tooltipPositionClass = sidebarPosition === 'top' ? 'top-full pt-2' : 'bottom-full pb-2';

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <motion.div
        animate={
          isHorizontal && !isMobileOpen 
            ? { width: 'auto' } 
            : { width: isCollapsed ? '88px' : '280px' }
        }
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed z-50 rounded-3xl border border-theme-border bg-theme-card/90 shadow-2xl backdrop-blur-xl transition-all duration-300 ${getSidebarPlacement()}`}
      >
        {/* ========================================================================= */}
        {/* DESKTOP HORIZONTAL DOCK (Used when sidebarPosition is top or bottom)       */}
        {/* ========================================================================= */}
        {isHorizontal && (
          <div className="hidden lg:flex items-center gap-1.5 p-2 overflow-x-auto max-w-full no-scrollbar">
            {/* App Logo Button */}
            <div className="relative group flex-shrink-0">
              <Link 
                to="/dashboard" 
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-white shadow-md nav-glow transition-transform hover:scale-105"
              >
                <TrendingUp size={20} />
              </Link>
              {/* Tooltip */}
              <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                  Lead Growth
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            {/* Workspace Info Icon */}
            <div className="relative group flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt/80 border border-theme-border/30 text-theme-primary shadow-xs">
                <Building size={18} />
              </div>
              {/* Tooltip */}
              <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                <div className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700 text-center">
                  <p className="text-xs font-bold">{user?.workspaceName || 'Default Workspace'}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Code: {user?.inviteCode || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            {/* General Menu Items (Icons Only) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {visibleGeneralMenu.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.name} className="relative group flex-shrink-0">
                    <Link
                      to={item.path}
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-theme-primary to-indigo-500 text-white shadow-lg shadow-theme-primary/20 nav-glow scale-105'
                          : 'text-theme-text/80 hover:bg-theme-bg-alt hover:text-theme-text hover:scale-105'
                      }`}
                    >
                      <item.icon size={18} />
                    </Link>
                    {/* Tooltip */}
                    <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                      <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                        {item.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Menu Items (Icons Only) */}
            {isAdmin && visibleAdminMenu.length > 0 && (
              <>
                <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />
                <div className="flex items-center gap-1 bg-amber-500/5 p-1 rounded-2xl border border-amber-500/10 flex-shrink-0">
                  {visibleAdminMenu.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <div key={item.name} className="relative group flex-shrink-0">
                        <Link
                          to={item.path}
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-theme-primary to-indigo-500 text-white shadow-lg shadow-theme-primary/20 nav-glow scale-105'
                              : 'text-theme-text/80 hover:bg-theme-bg-alt hover:text-theme-text hover:scale-105'
                          }`}
                        >
                          <item.icon size={18} />
                        </Link>
                        {/* Tooltip */}
                        <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                          <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                            {item.name} (Admin)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="relative group flex-shrink-0">
                <Link to="/settings" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt/50 border border-theme-border/20">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Avatar" className="h-8 w-8 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-xs font-bold text-white shadow-sm">
                      {getInitials(user?.fullName)}
                    </div>
                  )}
                </Link>
                {/* Tooltip */}
                <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                  <div className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700 text-center">
                    <p className="text-xs font-bold">{user?.fullName}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{user?.roles[0]?.replace('ROLE_', '') || 'USER'}</p>
                  </div>
                </div>
              </div>

              <div className="relative group flex-shrink-0">
                <button
                  onClick={logout}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={18} />
                </button>
                {/* Tooltip */}
                <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                  <span className="whitespace-nowrap rounded-xl bg-rose-950 px-3 py-1.5 text-xs font-bold text-rose-200 shadow-2xl border border-rose-800">
                    Logout
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VERTICAL SIDEBAR CONTENT (Used for Left / Right position or Mobile Drawer) */}
        {/* ========================================================================= */}
        <div className={`flex flex-col h-full w-full ${isHorizontal ? 'lg:hidden' : 'flex'}`}>
          {/* Header Logo & Mobile Close */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-theme-border/30">
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-white shadow-lg nav-glow">
                <TrendingUp size={22} className="animate-pulse-slow" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-r from-theme-primary to-indigo-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent"
                >
                  Lead Growth
                </motion.span>
              )}
            </Link>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-bg-alt text-theme-text-muted hover:text-theme-text lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Collapse Toggle for Desktop (Only when Left or Right position) */}
          {!isHorizontal && (
            <button
              onClick={toggleCollapsed}
              className={`absolute top-24 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-theme-border bg-theme-bg text-theme-text/80 shadow-md transition-all hover:bg-theme-bg-alt ${
                sidebarPosition === 'right' ? '-left-3' : '-right-3'
              }`}
            >
              {sidebarPosition === 'right' 
                ? (isCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />)
                : (isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />)
              }
            </button>
          )}

          {/* Workspace Selector Block */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center gap-3 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/20 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-primary/10 text-theme-primary">
                <Building size={16} />
              </div>
              {(!isCollapsed || isMobileOpen) && (
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
              {(!isCollapsed || isMobileOpen) && (
                <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">General</span>
              )}
              {visibleGeneralMenu.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
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
                    {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Admin only items */}
            {isAdmin && visibleAdminMenu.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-theme-border/30">
                {(!isCollapsed || isMobileOpen) && (
                  <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Admin Only</span>
                )}
                {visibleAdminMenu.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
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
                      {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
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
              {(!isCollapsed || isMobileOpen) && (
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
              onClick={() => { setMobileOpen(false); logout(); }}
              className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={18} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
