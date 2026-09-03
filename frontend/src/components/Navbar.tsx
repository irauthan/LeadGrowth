import { useState, useEffect, useRef } from 'react';
import { HoosshLogo } from './HoosshLogo';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import type { AppTheme } from '../store/themeStore';
import { useClickOutside } from '../hooks/useClickOutside';
import { useWebSocket } from '../hooks/useWebSocket';
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
  Menu,
  X,
  Layers,
  Compass,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLayoutStore } from '../store/layoutStore';
import { getProfileImageUrl } from '../utils/imageUrl';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const navbarActionsRef = useRef<HTMLDivElement>(null);
  useClickOutside(navbarActionsRef, () => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    setShowThemeMenu(false);
    setShowQuickActions(false);
    setShowSearchResults(false);
  });

  const [showStatusReasonModal, setShowStatusReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [statusReasonInput, setStatusReasonInput] = useState<string>('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', color: 'bg-emerald-500' },
    { value: 'BUSY', label: 'Busy', color: 'bg-amber-500' },
    { value: 'ON_BREAK', label: 'On Break', color: 'bg-blue-400' },
    { value: 'OFFLINE', label: 'Offline', color: 'bg-slate-400' },
    { value: 'ON_LEAVE', label: 'On Leave', color: 'bg-purple-500' }
  ];

  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = userRoles.some(r => typeof r === 'string' ? r.toUpperCase().includes('ADMIN') : (r as any)?.name?.toUpperCase().includes('ADMIN'));

  const handleSelectStatus = (newStatus: string) => {
    setShowProfileMenu(false);
    if (newStatus === user?.availabilityStatus) return;

    if (newStatus === 'AVAILABLE' || isAdmin) {
      changeAvailability(newStatus);
    } else {
      setPendingStatus(newStatus);
      setStatusReasonInput('');
      setShowStatusReasonModal(true);
    }
  };

  const changeAvailability = async (newStatus: string, reason?: string) => {
    setStatusUpdating(true);
    try {
      const url = reason && reason.trim()
        ? `/api/users/availability?status=${newStatus}&reason=${encodeURIComponent(reason.trim())}`
        : `/api/users/availability?status=${newStatus}`;
      await api.put(url);
      updateUser({ 
        availabilityStatus: newStatus as any,
        manualStatusReason: reason?.trim() || undefined
      });
      window.dispatchEvent(new Event('leadgrowth-status-updated'));
      setShowStatusReasonModal(false);
      setPendingStatus('');
      setStatusReasonInput('');
    } catch (err: any) {
      console.error('Failed to change availability status', err);
      alert(err.response?.data?.message || 'Failed to change status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusSuggestions = (status: string) => {
    switch (status) {
      case 'BUSY':
        return ['Client Demo / Call', 'Prospect Follow-up', 'Proposal Preparation', 'Internal Team Sync'];
      case 'ON_BREAK':
        return ['Lunch Break', 'Tea / Coffee Break', 'Quick Rest', 'Personal Call'];
      case 'OFFLINE':
        return ['Shift Completed', 'Network / Power Issue', 'System Restart', 'Stepping Away'];
      case 'ON_LEAVE':
        return ['Half Day Leave', 'Medical / Sick Leave', 'Family Emergency', 'Planned Leave'];
      default:
        return ['Meeting', 'Personal Break'];
    }
  };

  // Global layout and search state
  const { toggleMobileOpen } = useLayoutStore();
  const navigate = useNavigate();
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<{title: string, type: string, subtitle: string, url: string}[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'LEAD' | 'USER' | 'CAMPAIGN' | 'PAGE' | 'FOLLOWUP'>('ALL');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/dashboard/search?q=${encodeURIComponent(globalSearchQuery)}`);
        setGlobalSearchResults(res.data || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Global search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  const filteredSearchResults = globalSearchResults.filter(r => {
    if (searchCategory === 'ALL') return true;
    if (searchCategory === 'LEAD') return r.type === 'LEAD';
    if (searchCategory === 'USER') return r.type === 'USER';
    if (searchCategory === 'CAMPAIGN') return r.type === 'CAMPAIGN';
    if (searchCategory === 'PAGE') return r.type === 'PAGE';
    if (searchCategory === 'FOLLOWUP') return r.type === 'FOLLOWUP' || r.type === 'TASK' || r.type === 'EVENT';
    return r.type === searchCategory;
  });

  const getSearchTypeBadge = (type: string) => {
    switch (type) {
      case 'LEAD':
        return {
          icon: <UserIcon size={12} className="text-emerald-500" />,
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          label: 'Lead'
        };
      case 'USER':
        return {
          icon: <UserCheck size={12} className="text-cyan-400" />,
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          label: 'Team'
        };
      case 'CAMPAIGN':
        return {
          icon: <Layers size={12} className="text-blue-400" />,
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          label: 'Campaign'
        };
      case 'FOLLOWUP':
        return {
          icon: <Clock size={12} className="text-indigo-400" />,
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          label: 'Follow-up'
        };
      case 'EVENT':
        return {
          icon: <CalendarIcon size={12} className="text-pink-400" />,
          bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          label: 'Event'
        };
      case 'TASK':
        return {
          icon: <CheckSquare size={12} className="text-amber-400" />,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Task'
        };
      case 'PAGE':
      default:
        return {
          icon: <Compass size={12} className="text-purple-400" />,
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          label: 'Page'
        };
    }
  };

  const handleSearchResultClick = (url: string) => {
    setShowSearchResults(false);
    setShowMobileSearch(false);
    setGlobalSearchQuery('');
    navigate(url);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSearchResults(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const closeAllMenus = () => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    setShowThemeMenu(false);
    setShowQuickActions(false);
  };

  // Real Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  useWebSocket({
    workspaceId: user?.workspaceId,
    userId: user?.id,
    onNotificationReceived: () => {
      fetchNavbarNotifications();
    },
    onLeadReceived: () => {
      fetchNavbarNotifications();
    }
  });

  useEffect(() => {
    fetchNavbarNotifications();
    const interval = setInterval(fetchNavbarNotifications, 15000);
    const handleNotificationUpdate = () => {
      fetchNavbarNotifications();
    };
    window.addEventListener('leadgrowth-notification-updated', handleNotificationUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('leadgrowth-notification-updated', handleNotificationUpdate);
    };
  }, [user?.id, user?.workspaceId]);

  const fetchNavbarNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      const list = (res.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message || n.desc || '',
        time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (n.time || 'Recent'),
        read: n.isRead ?? n.read ?? false,
        type: n.type
      }));
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch navbar notifications', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all').catch(() => {});
    } catch (e) {}
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationTargetUrl = (title?: string, message?: string) => {
    const t = (title || '').toLowerCase();
    const m = (message || '').toLowerCase();
    const text = t + ' ' + m;

    const leadIdMatch = text.match(/lead\s*#?\s*(\d+)/i) || text.match(/#(\d+)/);
    const taskIdMatch = text.match(/task\s*#?\s*(\d+)/i);

    if (t.includes('lead') || m.includes('lead') || t.includes('pipeline') || m.includes('pipeline')) {
      if (leadIdMatch && leadIdMatch[1]) {
        return `/my-work?leadId=${leadIdMatch[1]}`;
      }
      return '/my-work';
    }
    if (t.includes('task') || m.includes('task')) {
      if (taskIdMatch && taskIdMatch[1]) {
        return `/tasks?taskId=${taskIdMatch[1]}`;
      }
      return '/tasks';
    }
    if (t.includes('campaign') || m.includes('campaign')) {
      return '/campaigns';
    }
    if (t.includes('follow') || m.includes('follow')) {
      return '/followups';
    }
    if (t.includes('report') || m.includes('report')) {
      return '/reports';
    }
    if (t.includes('user') || t.includes('team') || m.includes('user')) {
      return '/users';
    }
    return '/dashboard';
  };

  const handleNotificationClick = async (item: any) => {
    setShowNotifications(false);
    if (!item.read) {
      try {
        await api.patch(`/api/notifications/${item.id}/read`).catch(() => {});
      } catch (e) {}
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    }
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
      else if (seg === 'my-work') label = 'Pipelines';
      else if (seg === 'campaigns') label = 'Campaigns';
      else if (seg === 'leads') label = 'Workspace';
      else if (seg === 'followups') label = 'Follow-ups';
      else if (seg === 'analytics') label = 'Analytics';
      else if (seg === 'reports') label = 'Reports';
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
    <>
      {/* Mobile Search Modal Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 flex flex-col bg-theme-bg/95 backdrop-blur-xl p-4 md:hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-theme-border/30">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
              <input
                type="text"
                autoFocus
                placeholder="Search leads, users, campaigns, pages..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowMobileSearch(false);
                    setGlobalSearchQuery('');
                  } else if (e.key === 'Enter' && filteredSearchResults.length > 0) {
                    handleSearchResultClick(filteredSearchResults[0].url);
                  }
                }}
                className="w-full rounded-2xl border border-theme-border bg-theme-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-theme-primary text-theme-text"
              />
            </div>
            <button
              onClick={() => { setShowMobileSearch(false); setGlobalSearchQuery(''); }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt text-theme-text"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Filter Chips (Mobile) */}
          {globalSearchQuery.trim() && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar border-b border-theme-border/20">
              {[
                { id: 'ALL', label: 'All Results' },
                { id: 'LEAD', label: 'Leads' },
                { id: 'USER', label: 'Team' },
                { id: 'CAMPAIGN', label: 'Campaigns' },
                { id: 'PAGE', label: 'Pages' },
                { id: 'FOLLOWUP', label: 'Follow-ups' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSearchCategory(c.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    searchCategory === c.id
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pt-3 space-y-2">
            {searchLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-theme-text-muted">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-theme-primary border-t-transparent" />
                <span className="text-xs">Searching records...</span>
              </div>
            ) : filteredSearchResults.length > 0 ? (
              filteredSearchResults.map((r, idx) => {
                const badge = getSearchTypeBadge(r.type);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearchResultClick(r.url)}
                    className="w-full text-left flex items-start gap-3 rounded-2xl border border-theme-border/40 bg-theme-card p-3 shadow-xs active:bg-theme-bg-alt hover:border-theme-primary/40 transition-all"
                  >
                    <div className="p-2 rounded-xl bg-theme-bg-alt flex-shrink-0 mt-0.5">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-theme-text truncate">{r.title}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-theme-text-muted truncate mt-0.5">{r.subtitle}</p>
                    </div>
                  </button>
                );
              })
            ) : globalSearchQuery.trim() ? (
              <p className="py-10 text-center text-xs text-theme-text-muted italic">No matching records found for "{globalSearchQuery}"</p>
            ) : (
              <div className="py-8 text-center text-xs text-theme-text-muted space-y-1">
                <p className="font-semibold text-theme-text">Search anything across your workspace</p>
                <p>Type above to search leads, team members, campaigns, pages & follow-ups.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Top Header Navbar (Always fixed edge-to-edge at top) */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-theme-border/80 bg-theme-card/85 px-3 sm:px-6 backdrop-blur-md transition-all duration-300">
        {/* Left Section: Mobile Sidebar Toggle, Brand Icon & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMobileOpen(); }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/60 text-theme-text shadow-sm hover:bg-theme-bg-alt active:scale-95 transition-all lg:hidden"
            title="Open Menu"
          >
            <Menu size={18} />
          </button>

          {/* Compact App Brand Icon */}
          <Link to="/dashboard" className="flex items-center transition-transform hover:scale-105" title="Hoossh Lead Growth">
            <HoosshLogo size={28} variant="full" animated />
          </Link>

          {/* Subtle Vertical Divider */}
          <div className="h-5 w-[1px] bg-theme-border/60 mx-0.5 sm:mx-1" />

          {/* Page Title */}
          <div className="flex items-center">
            <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-theme-text tracking-tight truncate">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Section: Global Actions */}
        <div ref={navbarActionsRef} className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/60 text-theme-text shadow-sm hover:bg-theme-bg-alt md:hidden active:scale-95 transition-all"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* Desktop Search Bar */}
          <div className="relative hidden w-64 md:w-72 lg:w-80 md:block" onClick={(e) => e.stopPropagation()}>
            <span className="absolute inset-y-0 left-3.5 flex items-center text-theme-text-muted">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search leads, users, campaigns, pages..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearchResults(false);
                } else if (e.key === 'Enter' && filteredSearchResults.length > 0) {
                  handleSearchResultClick(filteredSearchResults[0].url);
                }
              }}
              className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/60 py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all placeholder:text-theme-text-muted focus:border-theme-primary focus:bg-theme-card text-theme-text shadow-2xs"
            />
            {showSearchResults && globalSearchQuery.trim() && (
              <div className="absolute left-0 mt-2.5 w-96 rounded-2xl border border-theme-border bg-theme-card p-3 shadow-2xl z-50 max-h-[480px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-theme-border/30 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-theme-primary" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-theme-text">Search Results ({filteredSearchResults.length})</span>
                  </div>
                  <button
                    onClick={() => { setGlobalSearchQuery(''); setShowSearchResults(false); }}
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    Clear
                  </button>
                </div>

                {/* Category Chips (Desktop) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1.5 no-scrollbar">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'LEAD', label: 'Leads' },
                    { id: 'USER', label: 'Team' },
                    { id: 'CAMPAIGN', label: 'Campaigns' },
                    { id: 'PAGE', label: 'Pages' },
                    { id: 'FOLLOWUP', label: 'Follow-ups' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSearchCategory(c.id as any)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                        searchCategory === c.id
                          ? 'bg-theme-primary text-white shadow-2xs'
                          : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  {searchLoading ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-theme-text-muted text-xs">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-theme-primary border-t-transparent" />
                      <span>Searching...</span>
                    </div>
                  ) : filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((r, idx) => {
                      const badge = getSearchTypeBadge(r.type);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSearchResultClick(r.url)}
                          className="w-full text-left flex items-start gap-2.5 rounded-xl px-2.5 py-2 hover:bg-theme-bg-alt/70 transition-all group"
                        >
                          <div className="p-1.5 rounded-lg bg-theme-bg-alt group-hover:bg-theme-primary/10 transition-colors flex-shrink-0 mt-0.5">
                            {badge.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-bold text-theme-text truncate group-hover:text-theme-primary transition-colors">
                                {r.title}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-theme-text-muted truncate mt-0.5">{r.subtitle}</p>
                          </div>
                          <ArrowRight size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-xs text-theme-text-muted italic">No records found matching "{globalSearchQuery}"</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                const state = !showQuickActions;
                closeAllMenus();
                setShowQuickActions(state);
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-theme-primary text-white shadow-md hover:bg-theme-primary-hover active:scale-95 transition-all"
              title="Quick Action"
            >
              <Plus size={18} />
            </button>

            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden" onClick={() => setShowQuickActions(false)} />
                <div className="max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:bottom-auto sm:absolute sm:right-0 sm:mt-3 w-auto sm:w-52 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted border-b border-theme-border/20 flex items-center justify-between">
                    <span>Quick Actions</span>
                    <button onClick={() => setShowQuickActions(false)} className="sm:hidden text-theme-text-muted">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/campaigns"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                    >
                      <Megaphone size={16} className="text-theme-primary" />
                      <span>New Campaign</span>
                    </Link>
                    <Link
                      to="/leads"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                    >
                      <UserCheck size={16} className="text-emerald-500" />
                      <span>Add Lead</span>
                    </Link>
                    <Link
                      to="/followups"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-theme-text/80 hover:bg-theme-bg-alt"
                    >
                      <CheckSquare size={16} className="text-amber-500" />
                      <span>Schedule Follow-up</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Switcher Button */}
          <div className="relative">
            <button
              onClick={() => {
                const state = !showThemeMenu;
                closeAllMenus();
                setShowThemeMenu(state);
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/60 text-theme-text shadow-sm hover:bg-theme-bg-alt active:scale-95 transition-all"
              title="Theme Palette"
            >
              <Palette size={18} />
            </button>

            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden" onClick={() => setShowThemeMenu(false)} />
                <div className="max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:bottom-auto sm:absolute sm:right-0 sm:mt-3 w-auto sm:w-56 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted border-b border-theme-border/20 flex items-center justify-between">
                    <span>Select Theme</span>
                    <button onClick={() => setShowThemeMenu(false)} className="sm:hidden text-theme-text-muted">
                      <X size={14} />
                    </button>
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
              </>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                const state = !showNotifications;
                closeAllMenus();
                setShowNotifications(state);
              }}
              className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-theme-border bg-theme-card/60 text-theme-text shadow-sm hover:bg-theme-bg-alt active:scale-95 transition-all"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden" onClick={() => setShowNotifications(false)} />
                <div className="max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:bottom-auto sm:absolute sm:right-0 sm:mt-3 w-auto sm:w-80 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50">
                  <div className="flex items-center justify-between border-b border-theme-border/20 px-3 py-2">
                    <span className="text-xs font-bold">Workspace Alerts</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-bold text-theme-primary hover:underline">
                          Mark read
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="sm:hidden text-theme-text-muted">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          to={getNotificationTargetUrl(item.title, item.message)}
                          onClick={() => handleNotificationClick(item)}
                          className={`flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors cursor-pointer block hover:bg-theme-bg-alt/60 ${
                            !item.read ? 'bg-theme-bg-alt/40 font-semibold' : 'opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-theme-text">{item.title}</span>
                            <span className="text-[9px] text-theme-text-muted">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-theme-text-muted mt-0.5 line-clamp-2">{item.message}</p>
                        </Link>
                      ))
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <Bell size={22} className="mx-auto text-theme-text-muted/40 mb-1.5" />
                        <p className="text-xs font-bold text-theme-text">No New Alerts</p>
                        <p className="text-[10px] text-theme-text-muted mt-0.5">You are caught up on everything!</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-theme-border/20 p-2 text-center">
                    <Link to="/notifications-page" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-theme-primary hover:underline">
                      View Notifications Center
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Button */}
          <div className="relative">
            <button
              onClick={() => {
                const state = !showProfileMenu;
                closeAllMenus();
                setShowProfileMenu(state);
              }}
              className="flex items-center gap-2.5 rounded-2xl border border-theme-border bg-theme-card/60 p-1 pr-2 sm:pr-3 shadow-sm hover:bg-theme-bg-alt active:scale-95 transition-all"
            >
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={getProfileImageUrl(user.profileImage)}
                    alt="profile"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl object-cover shadow"
                  />
                ) : (
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-xs font-extrabold text-white shadow">
                    {getInitials(user?.fullName || '')}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-theme-card ${
                  statusOptions.find(o => o.value === user?.availabilityStatus)?.color || 'bg-emerald-500'
                }`} />
              </div>
              <div className="hidden text-left text-xs md:block">
                <p className="font-bold leading-tight truncate max-w-[100px]">{user?.fullName}</p>
                <p className="text-[10px] text-theme-text-muted font-semibold">{user?.roles[0]?.replace('ROLE_', '') || 'MEMBER'}</p>
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden" onClick={() => setShowProfileMenu(false)} />
                <div className="max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:bottom-auto sm:absolute sm:right-0 sm:mt-3 w-auto sm:w-56 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50">
                  <div className="border-b border-theme-border/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate leading-none">{user?.fullName}</p>
                      <button onClick={() => setShowProfileMenu(false)} className="sm:hidden text-theme-text-muted">
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-[10px] text-theme-text-muted truncate mt-1">{user?.email}</p>
                    
                    {/* Active Availability Badge */}
                    <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-bg-alt/50 px-2.5 py-1">
                      <span className={`h-2 w-2 rounded-full ${
                        statusOptions.find(o => o.value === user?.availabilityStatus)?.color || 'bg-emerald-500'
                      }`} />
                      <span className="text-[9px] font-extrabold text-theme-text uppercase tracking-wider">
                        {user?.availabilityStatus || 'AVAILABLE'}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggler Options */}
                  <div className="p-1 border-b border-theme-border/20 grid grid-cols-1 gap-0.5">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectStatus(opt.value)}
                        className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[10px] font-bold transition-all ${
                          user?.availabilityStatus === opt.value 
                            ? 'bg-theme-bg-alt text-theme-primary' 
                            : 'text-theme-text-muted hover:bg-theme-bg-alt/50 hover:text-theme-text'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                        <span>{opt.label}</span>
                      </button>
                    ))}
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Availability Status Reason Modal */}
      {showStatusReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${statusOptions.find(o => o.value === pendingStatus)?.color || 'bg-amber-500'}`} />
                <h3 className="text-sm font-bold text-theme-text">
                  Update Status: {statusOptions.find(o => o.value === pendingStatus)?.label || pendingStatus}
                </h3>
              </div>
              <button 
                onClick={() => setShowStatusReasonModal(false)}
                className="text-theme-text-muted hover:text-theme-text p-1 rounded-lg hover:bg-theme-bg-alt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-theme-text-muted">
                Admin ke liye reason enter karein (Why are you setting status to <strong className="text-theme-text">{statusOptions.find(o => o.value === pendingStatus)?.label}</strong>?):
              </p>

              {/* Quick suggestions chips */}
              <div className="flex flex-wrap gap-1.5">
                {getStatusSuggestions(pendingStatus).map(sugg => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setStatusReasonInput(sugg)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      statusReasonInput === sugg
                        ? 'bg-theme-primary text-white border-theme-primary'
                        : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text border-theme-border hover:border-theme-primary/50'
                    }`}
                  >
                    {sugg}
                  </button>
                ))}
              </div>

              <textarea
                value={statusReasonInput}
                onChange={(e) => setStatusReasonInput(e.target.value)}
                placeholder="Reason type karein (e.g. In a demo with client, lunch break, urgent task...)"
                rows={3}
                maxLength={200}
                className="w-full rounded-xl border border-theme-border bg-theme-bg-alt/50 p-2.5 text-xs text-theme-text outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border/40">
              <button
                type="button"
                onClick={() => setShowStatusReasonModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!statusReasonInput.trim() || statusUpdating}
                onClick={() => changeAvailability(pendingStatus, statusReasonInput)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
              >
                {statusUpdating ? 'Updating...' : 'Confirm Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
