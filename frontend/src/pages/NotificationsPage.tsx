import { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Megaphone, 
  CheckSquare, 
  AlertCircle, 
  Check, 
  Loader2,
  Bell
} from 'lucide-react';
import api from '../services/api';

interface AlertItem {
  id: number;
  type?: 'LEAD' | 'CAMPAIGN' | 'TASK' | 'SYSTEM' | string;
  title: string;
  message?: string;
  desc?: string;
  createdAt?: string;
  time?: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'LEAD': return <UserCheck size={18} className="text-emerald-500" />;
      case 'CAMPAIGN': return <Megaphone size={18} className="text-blue-500" />;
      case 'TASK': return <CheckSquare size={18} className="text-amber-500" />;
      default: return <AlertCircle size={18} className="text-indigo-500" />;
    }
  };

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
      {/* Action Header */}
      <div className="flex justify-between items-center bg-theme-card border border-theme-border rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-theme-primary/10 text-theme-primary">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-theme-text">Notifications Center</h2>
            <p className="text-xs text-theme-text-muted">Real-time alerts, lead assignments, and task updates.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-xs font-bold text-theme-text border border-theme-border transition-colors"
          >
            <Check size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <div 
            key={item.id}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              item.read 
                ? 'bg-theme-card/50 border-theme-border/40 opacity-75' 
                : 'bg-theme-card border-theme-primary/30 shadow-sm'
            }`}
          >
            <div className="p-2.5 rounded-2xl bg-theme-bg-alt border border-theme-border/60">
              {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-theme-text truncate">{item.title}</h4>
                <span className="text-[10px] font-semibold text-theme-text-muted">
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.time || 'Just now')}
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">{item.message || item.desc}</p>
            </div>

            {!item.read && (
              <button 
                onClick={() => markSingleRead(item.id)}
                className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-theme-text-muted hover:text-emerald-500 transition-colors"
                title="Mark as Read"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center rounded-3xl border border-theme-border bg-theme-card text-theme-text-muted font-bold text-xs">
            No notifications yet. You are completely caught up!
          </div>
        )}
      </div>
    </div>
  );
}
