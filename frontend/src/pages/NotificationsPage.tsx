import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle,
  Megaphone,
  UserCheck,
  CheckSquare
} from 'lucide-react';

interface AlertItem {
  id: number;
  type: 'LEAD' | 'CAMPAIGN' | 'TASK' | 'SYSTEM';
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AlertItem[]>([
    { id: 1, type: 'LEAD', title: 'New Meta Lead Qualified', desc: 'Aarav Sharma was auto-qualified from Facebook Leads integration with an estimated revenue potential of ₹14,000.', time: '5m ago', read: false },
    { id: 2, type: 'TASK', title: 'Task Review Assigned', desc: 'Arjun Mehta assigned you a task: "Review Google Ads Spring ROAS Metrics Report".', time: '1h ago', read: false },
    { id: 3, type: 'CAMPAIGN', title: 'Meta Ads Auto-Sync Success', desc: 'Successfully fetched campaign conversions stats. 850 total leads matched, updated dashboard metrics.', time: '3h ago', read: true },
    { id: 4, type: 'SYSTEM', title: 'API Integration Alert', desc: 'Google Analytics API keys are nearing expiration. Please refresh credentials in integrations console.', time: '1d ago', read: true },
    { id: 5, type: 'LEAD', title: 'New Google Search Lead', desc: 'Vikram Malhotra filled out landing contact request. Assigned to Team Management queue.', time: '2d ago', read: true },
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markSingleRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAD': return <UserCheck size={18} className="text-emerald-500" />;
      case 'CAMPAIGN': return <Megaphone size={18} className="text-blue-500" />;
      case 'TASK': return <CheckSquare size={18} className="text-amber-500" />;
      default: return <AlertCircle size={18} className="text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-theme-card border border-theme-border rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Workspace Notifications</h2>
            <p className="text-[10px] text-theme-text-muted mt-0.5">{notifications.filter(n => !n.read).length} unread updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-theme-border hover:bg-theme-bg-alt/30 text-theme-text/80 px-3 py-1.5 text-xs font-semibold"
          >
            <Check size={14} />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-3 py-1.5 text-xs font-semibold"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <motion.div
              layout
              key={item.id}
              className={`flex items-start justify-between rounded-3xl border p-5 shadow-sm transition-all ${
                !item.read
                  ? 'border-theme-primary/30 bg-theme-primary/5'
                  : 'border-theme-border bg-theme-card hover:border-theme-primary/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-bg-alt/50 border border-theme-border/20 shadow-sm mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-theme-text">{item.title}</span>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-theme-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">{item.desc}</p>
                  <span className="text-[10px] text-theme-text-muted font-mono mt-2 block">{item.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!item.read && (
                  <button
                    onClick={() => markSingleRead(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-theme-bg-alt text-theme-text-muted hover:text-theme-text"
                    title="Mark as Read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-rose-500/10 text-theme-text-muted hover:text-rose-500"
                  title="Delete Alert"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-3xl border border-theme-border bg-theme-card p-12 text-center shadow-sm">
            <Bell size={36} className="mx-auto text-theme-text-muted opacity-55 animate-bounce" />
            <h3 className="text-sm font-bold text-theme-text mt-4">All Caught Up!</h3>
            <p className="text-xs text-theme-text-muted mt-1">There are no new notifications or alerts in this workspace.</p>
          </div>
        )}
      </div>
    </div>
  );
}
