import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HoosshLogo } from './HoosshLogo';
import { 
  LayoutDashboard, 
  Megaphone, 
  UserCheck, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building,
  Briefcase,
  Calendar,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLayoutStore } from '../store/layoutStore';

export default function Sidebar() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, sidebarPosition, enabledNavItems } = useLayoutStore();
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isExpanded = isMobileOpen || !isCollapsed || isHovered;

  const handleNavClick = () => {
    setMobileOpen(false);
    setIsHovered(false);
  };

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');
  const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';

  const getSidebarPlacement = () => {
    if (isMobileOpen) {
      return 'left-0 top-0 bottom-0 w-[280px] max-w-[85vw] flex-col rounded-r-2xl rounded-l-none z-50 border-r border-theme-border/60 shadow-2xl';
    }
    const baseMobile = '-translate-x-full lg:translate-x-0';
    if (sidebarPosition === 'right') {
      return `${baseMobile} lg:right-0 lg:left-auto lg:top-16 lg:bottom-0 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l lg:border-theme-border/60 ${isHovered ? 'z-50 shadow-2xl' : 'z-40'}`;
    }
    if (sidebarPosition === 'top') {
      return `-translate-x-full lg:top-16 lg:left-0 lg:right-0 lg:bottom-auto lg:flex-row lg:h-12 lg:w-full lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-theme-border/60 z-30`;
    }
    if (sidebarPosition === 'bottom') {
      return `-translate-x-full lg:bottom-0 lg:left-0 lg:right-0 lg:top-auto lg:flex-row lg:h-12 lg:w-full lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:border-theme-border/60 z-30`;
    }
    return `${baseMobile} lg:left-0 lg:right-auto lg:top-16 lg:bottom-0 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:border-theme-border/60 ${isHovered ? 'z-50 shadow-2xl' : 'z-40'}`;
  };

  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Leads', icon: UserCheck, path: '/leads' },
    { name: 'Pipelines', icon: Briefcase, path: '/my-work' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Scheduler', icon: Calendar, path: '/scheduler' },
    { name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { name: 'Reports', icon: FileSpreadsheet, path: '/reports' },
    { name: 'Workspace', icon: Building2, path: '/admin/workspace', adminOnly: true },
    { name: 'Settings', icon: Settings, path: '/settings', adminOnly: false },
  ];

  const isUserOnly = user?.roles.includes('ROLE_USER') && !isAdmin && !isManager;
  const restrictedPaths = isUserOnly 
    ? ['/billing', '/users', '/admin/users', '/campaigns', '/notifications-page'] 
    : (isAdmin || isManager ? ['/followups', '/notifications-page', ...(!isAdmin ? ['/billing'] : [])] : ['/notifications-page', !isAdmin ? '/billing' : '']);
  
  const filterMenuItems = (menu: any[]) => {
    return menu.filter(item => {
      // Check restricted paths
      if (restrictedPaths.includes(item.path)) return false;
      // Check adminOnly flag
      if (item.adminOnly && !isAdmin) return false;
      // Check if feature is enabled
      const isAlwaysAllowed = item.path === '/settings';
      return isAlwaysAllowed || enabledNavItems.includes(item.path) || (item.path === '/scheduler' && enabledNavItems.includes('/calendar'));
    }).sort((a, b) => {
      // Always guarantee Settings is at the last position for both Admin and User
      if (a.path === '/settings') return 1;
      if (b.path === '/settings') return -1;
      const indexA = enabledNavItems.indexOf(a.path);
      const indexB = enabledNavItems.indexOf(b.path);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      return 0;
    });
  };

  const visibleMenuItems = filterMenuItems(allMenuItems);

  const tooltipPositionClass = sidebarPosition === 'top' ? 'top-full pt-2' : 'bottom-full pb-2';
  const sideTooltipClass = sidebarPosition === 'right' ? 'right-full mr-2' : 'left-full ml-2';

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
        onMouseEnter={() => {
          if (!isHorizontal && !isMobileOpen) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!isHorizontal && !isMobileOpen) {
            setIsHovered(false);
          }
        }}
        animate={
          isHorizontal && !isMobileOpen 
            ? { width: '100%' } 
            : { width: isMobileOpen ? '280px' : (isExpanded ? '260px' : '72px') }
        }
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`fixed bg-theme-card/95 backdrop-blur-xl transition-all duration-200 ${getSidebarPlacement()}`}
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
                onClick={handleNavClick}
                className="flex items-center justify-center p-1.5 rounded-2xl bg-theme-bg-alt/80 shadow-md nav-glow transition-transform hover:scale-105"
              >
                <HoosshLogo size={34} variant="full" animated />
              </Link>
              <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                  Hoossh Lead Growth
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            <div className="relative group flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt/80 border border-theme-border/30 text-theme-primary shadow-xs">
                <Building size={18} />
              </div>
              <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                <div className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700 text-center">
                  <p className="text-xs font-bold">{user?.workspaceName || 'Default Workspace'}</p>
                  <p className="text-[9px] text-slate-400 font-semibold">Code: {user?.inviteCode || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            {/* Menu Items (Icons Only) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {visibleMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.name} className="relative group flex-shrink-0">
                    <Link
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-theme-primary text-white shadow-xs'
                          : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
                      }`}
                    >
                      <item.icon size={17} />
                    </Link>
                    {/* Tooltip */}
                    <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none ${tooltipPositionClass}`}>
                      <span className="whitespace-nowrap rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl border border-slate-700">
                        {item.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />

            {/* User Logout */}
            <div className="flex items-center gap-1 flex-shrink-0">
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
        {/* VERTICAL SIDEBAR (Desktop Left/Right or Mobile Drawer)                     */}
        {/* ========================================================================= */}
        <div className={`flex flex-col h-full w-full ${isHorizontal ? 'lg:hidden' : 'flex'}`}>
          {/* Mobile Only Header (Logo + Close X) */}
          {isMobileOpen && (
            <div className="flex h-16 items-center justify-between px-4 border-b border-theme-border/40">
              <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={handleNavClick}>
                <HoosshLogo size={36} variant="full" animated />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-bg-alt text-theme-text-muted hover:text-theme-text"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Desktop Collapse Toggle Button (Fixed on edge of sidebar rail) */}
          {!isHorizontal && !isMobileOpen && (
            <button
              onClick={toggleCollapsed}
              className={`absolute top-5 hidden lg:flex h-7 w-7 items-center justify-center rounded-full border-2 border-theme-border bg-theme-card text-theme-text shadow-xl transition-all duration-200 hover:bg-theme-primary hover:text-white hover:border-theme-primary hover:scale-110 z-50 cursor-pointer ${
                sidebarPosition === 'right' ? '-left-3.5' : '-right-3.5'
              }`}
              title={isCollapsed ? 'Pin Open Sidebar' : 'Collapse to Hover Mode'}
              aria-label={isCollapsed ? 'Pin Open Sidebar' : 'Collapse to Hover Mode'}
            >
              {sidebarPosition === 'right' 
                ? (isExpanded ? <ChevronRight size={14} className="stroke-[2.5]" /> : <ChevronLeft size={14} className="stroke-[2.5]" />)
                : (isExpanded ? <ChevronLeft size={14} className="stroke-[2.5]" /> : <ChevronRight size={14} className="stroke-[2.5]" />)
              }
            </button>
          )}

          {/* Workspace Selector Block */}
          <div className="px-2.5 pt-3 pb-1">
            <div className={`flex items-center gap-2.5 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 transition-all ${
              !isExpanded ? 'p-2 justify-center' : 'p-2.5'
            }`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary flex-shrink-0">
                <Building size={16} />
              </div>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-hidden"
                >
                  <h4 className="text-xs font-bold truncate text-theme-text">{user?.workspaceName || 'Default Workspace'}</h4>
                  <p className="text-[9px] font-semibold text-theme-text-muted truncate">Code: {user?.inviteCode || 'N/A'}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar">
            {visibleMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      !isExpanded 
                        ? 'h-10 w-10 mx-auto justify-center' 
                        : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-theme-primary text-white shadow-xs font-semibold'
                        : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
                    }`}
                  >
                    <item.icon
                      size={17}
                      className={`flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : 'text-theme-text-muted group-hover:text-theme-text'
                      }`}
                    />
                    {isExpanded && (
                      <motion.span 
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate text-xs font-medium"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </Link>

                  {/* Tooltip for Compact Rail Mode */}
                  {!isExpanded && (
                    <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none ${sideTooltipClass}`}>
                      <span className="whitespace-nowrap rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-xl border border-slate-700">
                        {item.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Session Logout */}
          <div className="p-2 border-t border-theme-border/30">
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className={`group flex items-center rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors ${
                !isExpanded ? 'h-10 w-10 mx-auto justify-center p-0' : 'w-full gap-2.5 px-3.5 py-2.5'
              }`}
              title="Logout"
            >
              <LogOut size={17} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              {isExpanded && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
