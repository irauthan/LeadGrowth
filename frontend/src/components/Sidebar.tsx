import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HoosshLogo } from './HoosshLogo';
import { 
  LayoutDashboard, 
  Megaphone, 
  UserCheck, 
  BarChart3, 
  FileSpreadsheet, 
  Users, 
  History,
  Bell,
  Settings, 
  Building2,
  Key,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building,
  Clock,
  ShieldAlert,
  CreditCard,
  ShieldCheck,
  Briefcase,
  Calendar,
  ChevronDown,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLayoutStore } from '../store/layoutStore';

export default function Sidebar() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, sidebarPosition, enabledNavItems } = useLayoutStore();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');
  const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';

  const getSidebarPlacement = () => {
    if (isMobileOpen) {
      return 'left-0 top-0 bottom-0 w-[280px] max-w-[85vw] flex-col rounded-r-2xl rounded-l-none z-50 border-r border-theme-border/60 shadow-2xl';
    }
    const baseMobile = '-translate-x-full lg:translate-x-0';
    if (sidebarPosition === 'right') {
      return `${baseMobile} lg:right-0 lg:left-auto lg:top-16 lg:bottom-0 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-r-0 lg:border-l lg:border-theme-border/60 z-40`;
    }
    if (sidebarPosition === 'top') {
      return `-translate-x-full lg:top-16 lg:left-0 lg:right-0 lg:bottom-auto lg:flex-row lg:h-12 lg:w-full lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-theme-border/60 z-30`;
    }
    if (sidebarPosition === 'bottom') {
      return `-translate-x-full lg:bottom-0 lg:left-0 lg:right-0 lg:top-auto lg:flex-row lg:h-12 lg:w-full lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t lg:border-theme-border/60 z-30`;
    }
    return `${baseMobile} lg:left-0 lg:right-auto lg:top-16 lg:bottom-0 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:border-theme-border/60 z-40`;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    management: true,
    settings: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generalMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Workspace', icon: UserCheck, path: '/leads' },
    { name: 'Pipelines', icon: Briefcase, path: '/my-work' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Scheduler', icon: Calendar, path: '/scheduler' },
    { name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { name: 'Reports', icon: FileSpreadsheet, path: '/reports' },
    { name: 'Notifications', icon: Bell, path: '/notifications-page' },
    { name: 'Follow-ups', icon: Clock, path: '/followups' },
    { name: 'Activity Logs', icon: History, path: '/activity-logs' },
    { name: 'SaaS Billing', icon: CreditCard, path: '/billing' },
  ];

  const managementMenu = [
    { name: 'Executive Work Monitor', icon: Activity, path: '/admin/work-monitor', adminOnly: false },
    { name: 'Team Management', icon: Users, path: '/admin/users', adminOnly: false },
    { name: 'Workspace Management', icon: Building2, path: '/admin/workspace', adminOnly: true },
    { name: 'API Management', icon: Key, path: '/admin/api', adminOnly: true },
  ];

  const settingsMenu = [
    { name: 'General Settings', icon: Settings, path: '/settings', adminOnly: false },
    { name: 'System Monitoring', icon: Activity, path: '/admin/system', adminOnly: true },
    { name: 'Security Center', icon: ShieldCheck, path: '/admin/security', adminOnly: true },
    { name: 'Audit Logs', icon: ShieldAlert, path: '/admin/audit-logs', adminOnly: true },
  ];

  const isUserOnly = user?.roles.includes('ROLE_USER') && !isAdmin && !isManager;
  const restrictedPaths = isUserOnly ? ['/billing', '/users', '/admin/users', '/activity-logs'] : (!isAdmin ? ['/billing'] : []);
  
  const filterMenuItems = (menu: any[]) => {
    return menu.filter(item => {
      // Check restricted paths
      if (restrictedPaths.includes(item.path)) return false;
      // Check adminOnly flag
      if (item.adminOnly && !isAdmin) return false;
      // Check if feature is enabled
      const isSettingsOrGeneral = item.path === '/settings' || item.path === '/notifications-page';
      return isSettingsOrGeneral || enabledNavItems.includes(item.path) || (item.path === '/scheduler' && enabledNavItems.includes('/calendar'));
    }).sort((a, b) => {
      const indexA = enabledNavItems.indexOf(a.path);
      const indexB = enabledNavItems.indexOf(b.path);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      return 0;
    });
  };

  const visibleGeneralMenu = filterMenuItems(generalMenu);
  const visibleManagementMenu = filterMenuItems(managementMenu);
  const visibleSettingsMenu = filterMenuItems(settingsMenu);

  // For horizontal dock compatibility
  const horizontalGeneralItems = [...visibleGeneralMenu, ...visibleSettingsMenu.filter(i => !i.adminOnly)];
  const horizontalAdminItems = [...visibleManagementMenu, ...visibleSettingsMenu.filter(i => i.adminOnly)];

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
        animate={
          isHorizontal && !isMobileOpen 
            ? { width: '100%' } 
            : { width: isMobileOpen ? '280px' : (isCollapsed ? '72px' : '260px') }
        }
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed bg-theme-card/95 backdrop-blur-xl transition-all duration-300 ${getSidebarPlacement()}`}
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt/80 text-white shadow-md nav-glow transition-transform hover:scale-105"
              >
                <HoosshLogo size={24} variant="icon-only" animated />
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

            {/* General Menu Items (Icons Only) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {horizontalGeneralItems.map((item) => {
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
            {horizontalAdminItems.length > 0 && (
              <>
                <div className="h-6 w-[1px] bg-theme-border/40 mx-1 flex-shrink-0" />
                <div className="flex items-center gap-1 bg-amber-500/5 p-1 rounded-2xl border border-amber-500/10 flex-shrink-0">
                  {horizontalAdminItems.map((item) => {
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
              <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={() => setMobileOpen(false)}>
                <HoosshLogo size={28} variant="with-text" animated />
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
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarPosition === 'right' 
                ? (isCollapsed ? <ChevronLeft size={14} className="stroke-[2.5]" /> : <ChevronRight size={14} className="stroke-[2.5]" />)
                : (isCollapsed ? <ChevronRight size={14} className="stroke-[2.5]" /> : <ChevronLeft size={14} className="stroke-[2.5]" />)
              }
            </button>
          )}

          {/* Workspace Selector Block */}
          <div className="px-2.5 pt-3 pb-1">
            <div className={`flex items-center gap-2.5 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 ${
              isCollapsed && !isMobileOpen ? 'p-2 justify-center' : 'p-2.5'
            }`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary flex-shrink-0">
                <Building size={16} />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 overflow-hidden"
                >
                  <h4 className="text-xs font-bold truncate text-theme-text">{user?.workspaceName || 'Default Workspace'}</h4>
                  <p className="text-[9px] font-semibold text-theme-text-muted truncate">Code: {user?.inviteCode || 'N/A'}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation Scrollable Area */}
          <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3 custom-scrollbar">
            {/* General Section */}
            <div className="space-y-1">
              {(!isCollapsed || isMobileOpen) && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">General</span>
              )}
              {visibleGeneralMenu.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.name} className="relative group">
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`relative flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                        isCollapsed && !isMobileOpen 
                          ? 'h-10 w-10 mx-auto justify-center' 
                          : 'px-3.5 py-2.5'
                      } ${
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
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate text-xs font-semibold">{item.name}</span>
                      )}
                    </Link>

                    {/* Tooltip for Collapsed Mode */}
                    {isCollapsed && !isMobileOpen && (
                      <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none ${sideTooltipClass}`}>
                        <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                          {item.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Management Section */}
            {visibleManagementMenu.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-theme-border/30">
                {(!isCollapsed || isMobileOpen) ? (
                  <button 
                    onClick={() => toggleSection('management')}
                    className="w-full flex items-center justify-between px-3 py-1 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-text transition-colors">Management</span>
                    <ChevronDown size={14} className={`text-theme-text-muted transition-transform duration-200 ${openSections.management ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="h-4" />
                )}
                
                {((openSections.management && (!isCollapsed || isMobileOpen)) || (isCollapsed && !isMobileOpen)) && (
                  <div className="space-y-1">
                    {visibleManagementMenu.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <div key={item.name} className="relative group">
                          <Link
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`relative flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                              isCollapsed && !isMobileOpen 
                                ? 'h-10 w-10 mx-auto justify-center' 
                                : 'px-3.5 py-2.5 ml-2'
                            } ${
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
                            {(!isCollapsed || isMobileOpen) && (
                              <span className="truncate text-xs font-semibold">{item.name}</span>
                            )}
                          </Link>
                          {isCollapsed && !isMobileOpen && (
                            <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none ${sideTooltipClass}`}>
                              <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                                {item.name} {item.adminOnly ? '(Admin)' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Settings Section */}
            {visibleSettingsMenu.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-theme-border/30 pb-4">
                {(!isCollapsed || isMobileOpen) ? (
                  <button 
                    onClick={() => toggleSection('settings')}
                    className="w-full flex items-center justify-between px-3 py-1 group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-text transition-colors">Settings</span>
                    <ChevronDown size={14} className={`text-theme-text-muted transition-transform duration-200 ${openSections.settings ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="h-4" />
                )}
                
                {((openSections.settings && (!isCollapsed || isMobileOpen)) || (isCollapsed && !isMobileOpen)) && (
                  <div className="space-y-1">
                    {visibleSettingsMenu.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <div key={item.name} className="relative group">
                          <Link
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`relative flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                              isCollapsed && !isMobileOpen 
                                ? 'h-10 w-10 mx-auto justify-center' 
                                : 'px-3.5 py-2.5 ml-2'
                            } ${
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
                            {(!isCollapsed || isMobileOpen) && (
                              <span className="truncate text-xs font-semibold">{item.name}</span>
                            )}
                          </Link>
                          {isCollapsed && !isMobileOpen && (
                            <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none ${sideTooltipClass}`}>
                              <span className="whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl border border-slate-700">
                                {item.name} {item.adminOnly ? '(Admin)' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Session Logout */}
          <div className="p-2 border-t border-theme-border/30">
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className={`group flex items-center rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors ${
                isCollapsed && !isMobileOpen ? 'h-10 w-10 mx-auto justify-center p-0' : 'w-full gap-2.5 px-3.5 py-2.5'
              }`}
              title="Logout"
            >
              <LogOut size={17} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
