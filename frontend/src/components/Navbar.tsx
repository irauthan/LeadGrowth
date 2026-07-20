import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import type { AppTheme } from '../store/themeStore';
import { 
  Bell, 
  Search, 
  User as UserIcon,
  Shield,
  Plus,
  Palette,
  Settings,
  Megaphone,
  UserCheck,
  CheckSquare,
  Menu
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useLayoutStore } from '../store/layoutStore';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Global layout and search state
  const { isCollapsed, toggleMobileOpen } = useLayoutStore();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<{title: string, type: string, subtitle: string, url: string}[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/dashboard/search?q=${encodeURIComponent(globalSearchQuery)}`);
        setGlobalSearchResults(res.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Global search failed', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSearchResults(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New lead qualified', message: 'Aarav Sharma was qualified from Meta campaign.', time: '5m ago', read: false },
    { id: 2, title: 'Task assigned', message: 'You have been assigned to review Google Ads campaign metrics.', time: '1h ago', read: false },
    { id: 3, title: 'Campaign Synced', message: 'Meta & Google Marketing APIs synced successfully.', time: '2h ago', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  // Build Breadcrumbs
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Dashboard', path: '/dashboard' }];
    
    return segments.map((seg, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      let label = seg.charAt(0).toUpperCase() + seg.slice(1);
      if (seg === 'dashboard') label = 'Dashboard';
      else if (seg === 'campaigns') label = 'Campaigns';
      else if (seg === 'leads') label = 'Leads';
      else if (seg === 'analytics') label = 'Analytics';
      else if (seg === 'reports') label = 'Reports';
      else if (seg === 'tasks') label = 'Tasks';
      else if (seg === 'users') label = 'Team Management';
      else if (seg === 'activity-logs') label = 'Activity Logs';
      else if (seg === 'notifications-page') label = 'Notifications';
      else if (seg === 'settings') label = 'Settings';
      else if (seg === 'admin') label = 'Admin';
      
      return { label, path };
    });
  };

  const getPageTitle = () => {
    const breadcrumbs = getBreadcrumbs();
    return breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';
  };

  const themesList: { id: AppTheme; name: string; color: string }[] = [
    { id: 'light', name: 'Light Slate', color: 'bg-white border-slate-300' },
    { id: 'dark', name: 'Dark Charcoal', color: 'bg-slate-800 border-slate-700' },
    { id: 'midnight', name: 'Midnight Neon', color: 'bg-slate-950 border-indigo-500' },
    { id: 'ocean', name: 'Deep Ocean', color: 'bg-cyan-950 border-cyan-400' },
    { id: 'purple', name: 'Royal Velvet', color: 'bg-purple-950 border-purple-400' },
  ];

  return (
    <header className={`fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-theme-border bg-theme-bg/85 px-6 backdrop-blur-md transition-all duration-300 ${isCollapsed ? 'lg:pl-[110px]' : 'lg:pl-[300px]'} pl-4`}>
      {/* Mobile Toggle & Breadcrumbs Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); toggleMobileOpen(); }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/50 text-theme-text shadow-sm hover:bg-theme-bg-alt lg:hidden"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-text-muted">
            <span>Home</span>
            {getBreadcrumbs().map((b) => (
              <span key={b.path} className="flex items-center gap-1.5">
                <span className="text-[10px] opacity-70">/</span>
                <Link to={b.path} className="hover:text-theme-primary transition-colors">{b.label}</Link>
              </span>
            ))}
          </div>
          <h1 className="text-lg font-bold text-theme-text mt-0.5">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Global Actions Right */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden w-64 md:block" onClick={(e) => e.stopPropagation()}>
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Quick search..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all placeholder:text-theme-text-muted focus:border-theme-primary focus:bg-theme-card text-theme-text"
          />
          {showSearchResults && globalSearchQuery.trim() && (
            <div className="absolute left-0 mt-3 w-80 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-theme-border/20 px-3 py-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Search Results</span>
                <button
                  onClick={() => { setGlobalSearchQuery(''); setShowSearchResults(false); }}
                  className="text-[10px] text-rose-500 font-bold hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {globalSearchResults.length > 0 ? (
                  globalSearchResults.map((r, idx) => (
                    <Link
                      key={idx}
                      to={r.url}
                      onClick={() => {
                        setShowSearchResults(false);
                        setGlobalSearchQuery('');
                      }}
                      className="flex flex-col gap-0.5 rounded-xl px-3 py-2 hover:bg-theme-bg-alt/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-theme-text truncate max-w-[180px]">{r.title}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                          r.type === 'LEAD' ? 'bg-emerald-500/10 text-emerald-500' :
                          r.type === 'CAMPAIGN' ? 'bg-blue-500/10 text-theme-primary' :
                          r.type === 'USER' ? 'bg-cyan-500/10 text-cyan-400' :
                          r.type === 'REPORT' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>{r.type}</span>
                      </div>
                      <p className="text-[10px] text-theme-text-muted truncate mt-0.5">{r.subtitle}</p>
                    </Link>
                  ))
                ) : (
                  <p className="p-3 text-center text-xs text-theme-text-muted italic">No records found matching "{globalSearchQuery}"</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickActions(!showQuickActions);
              setShowNotifications(false);
              setShowThemeMenu(false);
              setShowProfileMenu(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-primary text-white shadow-md hover:bg-theme-primary-hover transition-all"
            title="Quick Action"
          >
            <Plus size={18} />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted border-b border-theme-border/20">
                Quick Actions
              </div>
              <div className="py-1">
                <Link
                  to="/campaigns"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                >
                  <Megaphone size={14} className="text-theme-primary" />
                  <span>New Campaign</span>
                </Link>
                <Link
                  to="/leads"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                >
                  <UserCheck size={14} className="text-emerald-500" />
                  <span>Add Lead</span>
                </Link>
                <Link
                  to="/tasks"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                >
                  <CheckSquare size={14} className="text-amber-500" />
                  <span>Assign Task</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowNotifications(false);
              setShowProfileMenu(false);
              setShowQuickActions(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/50 text-theme-text shadow-sm hover:bg-theme-bg-alt transition-all"
            title="Theme Palette"
          >
            <Palette size={18} />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted border-b border-theme-border/20">
                Select Theme
              </div>
              <div className="py-1 space-y-1">
                {themesList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold hover:bg-theme-bg-alt ${
                      theme === t.id ? 'bg-theme-bg-alt text-theme-primary' : 'text-theme-text/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full border ${t.color}`} />
                      {t.name}
                    </span>
                    {theme === t.id && <span className="h-1.5 w-1.5 rounded-full bg-theme-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              setShowThemeMenu(false);
              setShowQuickActions(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/50 text-theme-text shadow-sm hover:bg-theme-bg-alt transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl">
              <div className="flex items-center justify-between border-b border-theme-border/20 px-3 py-2">
                <span className="text-xs font-bold">Workspace Alerts</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-theme-primary hover:underline">
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors ${
                      !item.read ? 'bg-theme-bg-alt/40' : 'hover:bg-theme-bg-alt/25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-theme-text">{item.title}</span>
                      <span className="text-[9px] text-theme-text-muted">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">{item.message}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-theme-border/20 p-2 text-center">
                <Link to="/notifications-page" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-theme-primary hover:underline">
                  View All Activity
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile switcher dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowThemeMenu(false);
              setShowQuickActions(false);
            }}
            className="flex items-center gap-3 rounded-2xl border border-theme-border bg-theme-card/50 p-1 pr-3 shadow-sm hover:bg-theme-bg-alt transition-all"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="profile"
                className="h-8 w-8 rounded-xl object-cover shadow"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-xs font-extrabold text-white shadow">
                {getInitials(user?.fullName || '')}
              </div>
            )}
            <div className="hidden text-left text-xs md:block">
              <p className="font-bold leading-tight">{user?.fullName}</p>
              <p className="text-[10px] text-theme-text-muted font-semibold">{user?.roles[0]?.replace('ROLE_', '') || 'MEMBER'}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl">
              <div className="border-b border-theme-border/20 p-3">
                <p className="text-xs font-bold truncate leading-none">{user?.fullName}</p>
                <p className="text-[10px] text-theme-text-muted truncate mt-1">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                >
                  <UserIcon size={14} />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>
                {user?.roles.includes('ROLE_ADMIN') && (
                  <Link
                    to="/admin/workspace"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                  >
                    <Shield size={14} className="text-theme-primary" />
                    <span>Workspace Control</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
