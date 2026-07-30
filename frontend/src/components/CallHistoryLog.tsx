import { useState, useEffect } from 'react';
import { PhoneCall, Calendar, Clock, User, RefreshCw } from 'lucide-react';
import api from '../services/api';
import type { CallSession } from '../types';

interface CallHistoryLogProps {
  leadId: number;
}

export default function CallHistoryLog({ leadId }: CallHistoryLogProps) {
  const [history, setHistory] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHistory();
  }, [leadId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/calls/history/${leadId}`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load call history', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-theme-text flex items-center gap-1.5 uppercase tracking-wider">
          <PhoneCall size={14} className="text-theme-primary" /> Call Session History
        </h4>
        <button
          type="button"
          onClick={fetchHistory}
          className="text-theme-text-muted hover:text-theme-text p-1 transition-colors"
          title="Refresh History"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-theme-text-muted">Loading call logs...</div>
      ) : history.length === 0 ? (
        <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/40 text-center text-xs text-theme-text-muted italic">
          No call duration sessions logged for this lead yet.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {history.map((session) => (
            <div
              key={session.id}
              className="bg-theme-bg-alt/50 border border-theme-border/60 rounded-2xl p-3 space-y-1.5 hover:border-theme-primary/40 transition-all text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-theme-text font-extrabold">
                  <Calendar size={12} className="text-theme-primary" />
                  <span>{new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                  session.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {session.formattedDuration || 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-theme-text-muted font-medium">
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>
                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {session.endTime ? ` → ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Call Running)'}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-bold text-theme-text">
                  <User size={10} className="text-theme-primary" />
                  <span>{session.userName || 'Sales Executive'}</span>
                </div>
              </div>

              {session.notes && (
                <p className="text-[10px] text-theme-text-muted italic pt-1 border-t border-theme-border/30">
                  "{session.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
