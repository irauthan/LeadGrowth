import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCheck, 
  Megaphone, 
  CheckSquare, 
  AlertCircle, 
  Check, 
  Loader2,
  Bell,
  Clock,
  Sparkles,
  Trophy,
  Search,
  CheckCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../hooks/useWebSocket';

interface AlertItem {
  id: number;
  type?: 'LEAD' | 'CAMPAIGN' | 'TASK' | 'FOLLOWUP' | 'CONVERTED' | 'SYSTEM' | string;
  title: string;
  message?: string;
  desc?: string;
  createdAt?: string;
  time?: string;
  isRead?: boolean;
  read?: boolean;
}

export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'LEADS' | 'FOLLOWUPS' | 'TASKS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useWebSocket({
    workspaceId: user?.workspaceId,
    userId: user?.id,
    onNotificationReceived: () => {
      fetchNotifications();
    },
    onLeadReceived: () => {
      fetchNotifications();
    }
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    const handleNotificationUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('leadgrowth-notification-updated', handleNotificationUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('leadgrowth-notification-updated', handleNotificationUpdate);
    };
  }, [user?.id, user?.workspaceId]);

  const detectType = (n: any): string => {
    if (n.type) return n.type.toUpperCase();
    const t = (n.title || '').toLowerCase();
    const m = (n.message || n.desc || '').toLowerCase();
    if (t.includes('convert') || m.includes('convert') || t.includes('won')) return 'CONVERTED';
    if (t.includes('lead') || m.includes('lead') || t.includes('pipeline') || t.includes('accept') || m.includes('accept')) return 'LEAD';
    if (t.includes('follow') || m.includes('follow') || t.includes('schedule') || t.includes('calendar')) return 'FOLLOWUP';
    if (t.includes('task') || m.includes('task')) return 'TASK';
    if (t.includes('campaign') || m.includes('campaign')) return 'CAMPAIGN';
    return 'SYSTEM';
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      const raw = Array.isArray(res.data) ? res.data : [];
      const list: AlertItem[] = raw.map((n: any) => ({
        id: n.id,
        title: n.title || 'Notification',
        message: n.message || n.desc || '',
        createdAt: n.createdAt,
        time: n.createdAt ? formatTimeAgo(n.createdAt) : (n.time || 'Just now'),
        isRead: n.isRead ?? n.read ?? false,
        read: n.isRead ?? n.read ?? false,
        type: detectType(n)
      }));
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all').catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationTargetUrl = (title?: string, message?: string) => {
    const t = (title || '').toLowerCase();
    const m = (message || '').toLowerCase();
    const text = t + ' ' + m;

    const leadIdMatch = text.match(/lead\s*#?\s*(\d+)/i) || text.match(/#(\d+)/);
    const taskIdMatch = text.match(/task\s*#?\s*(\d+)/i);

    if (t.includes('lead') || m.includes('lead') || t.includes('pipeline') || m.includes('pipeline') || t.includes('convert')) {
      if (leadIdMatch && leadIdMatch[1]) {
        return `/my-work?leadId=${leadIdMatch[1]}`;
      }
      return '/leads';
    }
    if (t.includes('follow') || m.includes('follow')) {
      return '/followups';
    }
    if (t.includes('calendar') || t.includes('reminder') || t.includes('event')) {
      return '/scheduler';
    }
    if (t.includes('task') || m.includes('task')) {
      if (taskIdMatch && taskIdMatch[1]) {
        return `/tasks?taskId=${taskIdMatch[1]}`;
      }
      return '/my-work';
    }
    if (t.includes('campaign') || m.includes('campaign')) {
      return '/campaigns';
    }
    if (t.includes('report') || m.includes('report')) {
      return '/reports';
    }
    return '/dashboard';
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'CONVERTED': return <Trophy size={18} className="text-amber-400" />;
      case 'LEAD': return <UserCheck size={18} className="text-emerald-400" />;
      case 'FOLLOWUP': return <Clock size={18} className="text-purple-400" />;
      case 'TASK': return <CheckSquare size={18} className="text-cyan-400" />;
      case 'CAMPAIGN': return <Megaphone size={18} className="text-blue-400" />;
      default: return <AlertCircle size={18} className="text-indigo-400" />;
    }
  };

  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'CONVERTED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LEAD': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FOLLOWUP': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TASK': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CAMPAIGN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  // Filter and search
  const filteredNotifications = notifications.filter(item => {
    const isUnread = !(item.isRead ?? item.read);
    if (activeTab === 'UNREAD' && !isUnread) return false;
    if (activeTab === 'LEADS' && item.type !== 'LEAD' && item.type !== 'CONVERTED') return false;
    if (activeTab === 'FOLLOWUPS' && item.type !== 'FOLLOWUP') return false;
    if (activeTab === 'TASKS' && item.type !== 'TASK') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchMsg = (item.message || item.desc || '').toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !(n.isRead ?? n.read)).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Workspace Notifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-card border border-theme-border rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-theme-primary/10 text-theme-primary shadow-xs">
            <Bell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-theme-text">Notifications Center</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-theme-text-muted mt-0.5">Real-time alerts for lead assignments, scheduled follow-ups, and converted milestones.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-xs font-bold text-theme-text border border-theme-border transition-all active:scale-95 shadow-xs"
            >
              <CheckCheck size={14} className="text-emerald-400" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 bg-theme-bg-alt/70 p-1 rounded-2xl border border-theme-border/60 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'LEADS', label: 'Leads & Conversions' },
            { id: 'FOLLOWUPS', label: 'Follow-ups' },
            { id: 'TASKS', label: 'Tasks' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/80'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs bg-theme-card border border-theme-border text-theme-text outline-none focus:border-theme-primary transition-all placeholder:text-theme-text-muted"
          />
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-2.5">
        {filteredNotifications.map((item) => {
          const isUnread = !(item.isRead ?? item.read);
          const targetUrl = getNotificationTargetUrl(item.title, item.message || item.desc);

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative group ${
                isUnread 
                  ? 'bg-theme-card border-theme-primary/30 shadow-xs ring-1 ring-theme-primary/10' 
                  : 'bg-theme-card/60 border-theme-border/50 opacity-80 hover:opacity-100 hover:bg-theme-card'
              }`}
            >
              {/* Type Icon Container */}
              <div className="p-2.5 rounded-2xl bg-theme-bg-alt border border-theme-border/60 shrink-0">
                {getIcon(item.type)}
              </div>
              
              {/* Content Box */}
              <Link 
                to={targetUrl}
                onClick={() => markSingleRead(item.id)}
                className="flex-1 min-w-0 block pr-8"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold text-theme-text flex items-center gap-1.5 ${isUnread ? 'font-extrabold' : ''}`}>
                      {item.title}
                    </h3>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${getBadgeStyle(item.type)}`}>
                      {item.type || 'SYSTEM'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-theme-text-muted">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-theme-text-muted mt-1 leading-relaxed line-clamp-2">
                  {item.message || item.desc}
                </p>
              </Link>

              {/* Action Buttons */}
              <div className="absolute right-3.5 top-3.5 flex items-center gap-1">
                {isUnread ? (
                  <button 
                    onClick={() => markSingleRead(item.id)}
                    className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-theme-text-muted hover:text-emerald-400 transition-colors"
                    title="Mark as Read"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500/30 mr-1.5" title="Read" />
                )}
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="p-14 text-center rounded-3xl border border-theme-border/60 bg-theme-card/60 text-theme-text-muted space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 text-theme-primary flex items-center justify-center mx-auto">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-theme-text">No Notifications Found</h4>
              <p className="text-xs text-theme-text-muted mt-0.5">
                {activeTab === 'UNREAD' 
                  ? 'Great job! You have read all your notifications.' 
                  : searchQuery 
                  ? `No alerts match "${searchQuery}".` 
                  : 'You are completely caught up with all workspace events!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
