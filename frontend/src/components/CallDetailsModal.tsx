import { useState, useEffect } from 'react';
import { 
  X, 
  Phone, 
  PhoneCall, 
  User, 
  Building, 
  Calendar, 
  Clock, 
  Search, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  Radio, 
  ExternalLink,
  Users
} from 'lucide-react';
import api from '../services/api';
import type { CallSession } from '../types';

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: number;
  userNameFilter?: string;
  title?: string;
}

export default function CallDetailsModal({
  isOpen,
  onClose,
  initialUserId,
  userNameFilter,
  title = 'Call Activity Audit Logs & Contact History'
}: CallDetailsModalProps) {
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchCallLogs();
    }
  }, [isOpen, initialUserId, dateFilter]);

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      let startDate = '';
      let endDate = '';
      const now = new Date();

      if (dateFilter === 'TODAY') {
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === '7DAYS') {
        const past = new Date(now.setDate(now.getDate() - 7));
        startDate = past.toISOString().split('T')[0];
      } else if (dateFilter === '30DAYS') {
        const past = new Date(now.setDate(now.getDate() - 30));
        startDate = past.toISOString().split('T')[0];
      }

      const params: Record<string, any> = {};
      if (initialUserId) params.userId = initialUserId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/api/calls/reports', { params });
      setCalls(res.data || []);
    } catch (err) {
      console.error('Failed to load call details log:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter calls by search query
  const filteredCalls = calls.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (c.leadName || '').toLowerCase().includes(query) ||
      (c.leadPhone || '').toLowerCase().includes(query) ||
      (c.leadCompany || '').toLowerCase().includes(query) ||
      (c.userName || '').toLowerCase().includes(query) ||
      (c.notes || '').toLowerCase().includes(query)
    );
  });

  // Calculate Summary KPIs
  const totalCalls = filteredCalls.length;
  const totalDurationSeconds = filteredCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const formattedTotalTime = formatSecondsToHHMMSS(totalDurationSeconds);
  const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
  const formattedAvgTime = formatSecondsToHHMMSS(avgDurationSeconds);
  
  const uniqueLeads = new Set(filteredCalls.map((c) => c.leadId || c.leadName)).size;

  function formatSecondsToHHMMSS(totalSeconds: number) {
    if (totalSeconds <= 0) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? '0' + v : v))
      .join(':');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-theme-card border border-theme-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border/60 bg-theme-bg-alt/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              <PhoneCall size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-theme-text flex items-center gap-2">
                {title}
                {userNameFilter && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                    {userNameFilter}
                  </span>
                )}
              </h2>
              <p className="text-xs text-theme-text-muted">
                Detailed record of phone conversations, lead contacts, and call outcome notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-theme-bg-alt border border-theme-border hover:bg-theme-border/40 text-theme-text-muted hover:text-theme-text flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-theme-bg-alt/20 border-b border-theme-border/40">
          <div className="p-3 rounded-2xl bg-theme-card border border-theme-border/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-theme-text-muted">Total Conversations</span>
            <div className="text-lg font-black text-cyan-400 flex items-center gap-1.5">
              <PhoneCall size={14} /> {totalCalls} Calls
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-theme-card border border-theme-border/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-theme-text-muted">Total Duration</span>
            <div className="text-lg font-mono font-black text-rose-400 flex items-center gap-1.5">
              <Clock size={14} /> {formattedTotalTime}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-theme-card border border-theme-border/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-theme-text-muted">Avg Call Length</span>
            <div className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Clock size={14} /> {formattedAvgTime}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-theme-card border border-theme-border/60 space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-theme-text-muted">Unique Contacts</span>
            <div className="text-lg font-black text-purple-400 flex items-center gap-1.5">
              <Users size={14} /> {uniqueLeads} Contacts
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-theme-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-theme-card">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Search by Lead Name, Phone, Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-theme-bg-alt border border-theme-border text-theme-text placeholder-theme-text-muted focus:outline-none focus:border-theme-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-theme-bg-alt p-1 rounded-xl border border-theme-border text-[11px] font-bold">
            {(
              [
                { id: 'ALL', label: 'All History' },
                { id: 'TODAY', label: "Today's Calls" },
                { id: '7DAYS', label: 'Last 7 Days' },
                { id: '30DAYS', label: 'Last 30 Days' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  dateFilter === tab.id
                    ? 'bg-theme-primary text-white shadow-sm'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={fetchCallLogs}
              className="p-1 text-theme-text-muted hover:text-theme-text ml-1"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Modal Body - Call Session Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw size={32} className="animate-spin text-theme-primary" />
              <span className="text-xs font-bold text-theme-text-muted">Fetching conversation audit logs...</span>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-16 p-8 border border-dashed border-theme-border rounded-3xl bg-theme-bg-alt/30 space-y-2">
              <PhoneCall size={36} className="mx-auto text-theme-text-muted/50" />
              <h3 className="text-sm font-extrabold text-theme-text">No Call Sessions Found</h3>
              <p className="text-xs text-theme-text-muted max-w-sm mx-auto">
                No recorded phone conversation sessions match the current search filters or date range.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-theme-primary/40 transition-all space-y-3"
                >
                  {/* Card Header: Lead Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border/40 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-sm">
                        {(session.leadName || 'L').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-theme-text">
                            {session.leadName || `Lead #${session.leadId}`}
                          </h4>
                          {session.leadCompany && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-bg-alt border border-theme-border text-theme-text-muted flex items-center gap-1 font-semibold">
                              <Building size={10} /> {session.leadCompany}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-theme-text-muted mt-0.5">
                          {session.leadPhone && (
                            <a
                              href={`tel:${session.leadPhone}`}
                              className="font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1"
                              title="Click to dial"
                            >
                              <Phone size={12} /> {session.leadPhone}
                            </a>
                          )}
                          <span className="flex items-center gap-1 text-[11px]">
                            <User size={11} className="text-theme-primary" /> Spoke with:{' '}
                            <strong className="text-theme-text">{session.userName || 'Sales Executive'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Duration Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 rounded-xl bg-theme-card border border-theme-border font-mono font-black text-xs text-rose-400 flex items-center gap-1">
                        <Clock size={12} /> {session.formattedDuration || '00:00:00'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                          session.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}
                      >
                        {session.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle2 size={10} /> COMPLETED
                          </>
                        ) : (
                          <>
                            <Radio size={10} className="animate-ping" /> IN PROGRESS
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Details: Start/End Timestamps & Notes */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-[11px] text-theme-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-theme-primary" />
                        {new Date(session.startTime).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock size={12} />
                        {new Date(session.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {session.endTime ? (
                          ` → ${new Date(session.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        ) : (
                          ' (Active Session)'
                        )}
                      </span>
                    </div>

                    {session.leadId && (
                      <a
                        href={`/my-work`}
                        className="text-[11px] font-bold text-theme-primary hover:underline flex items-center gap-1 self-end sm:self-auto"
                      >
                        View Lead in Workspace <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {/* Conversation Notes */}
                  {session.notes ? (
                    <div className="p-3 rounded-xl bg-theme-card/80 border border-theme-border/40 text-xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-theme-text-muted flex items-center gap-1">
                        <FileText size={11} className="text-amber-400" /> Call Outcome Notes
                      </span>
                      <p className="text-theme-text leading-relaxed italic">
                        "{session.notes}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-theme-text-muted/60 italic pl-1">
                      No call outcome notes recorded for this session.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-theme-border/60 bg-theme-bg-alt/40 flex items-center justify-between text-xs text-theme-text-muted">
          <span>
            Showing <strong className="text-theme-text">{filteredCalls.length}</strong> of{' '}
            <strong className="text-theme-text">{calls.length}</strong> call records
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-border/30 border border-theme-border text-theme-text font-bold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
