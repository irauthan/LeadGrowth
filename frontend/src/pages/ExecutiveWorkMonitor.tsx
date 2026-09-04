import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  UserCheck, 
  Calendar as CalendarIcon, 
  PhoneCall, 
  Phone,
  Radio,
  Video, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Eye, 
  BarChart3,
  Layers,
  Sparkles,
  User as UserIcon,
  ArrowRight
} from 'lucide-react';
import WorkDetailsPanel from '../components/WorkDetailsPanel';
import HoosshBeeLoader from '../components/HoosshBeeLoader';
import CallDetailsModal from '../components/CallDetailsModal';

interface DailyBreakdown {
  date: string;
  dayOfWeek: string;
  callsCount: number;
  meetingsCount: number;
  emailsCount: number;
  whatsappCount: number;
  totalActivitiesCount: number;
  followupsCompletedCount: number;
}

interface ActivityLogItem {
  id: number;
  activityNumber: number;
  communicationType: string;
  outcome: string;
  remarks: string;
  duration: string;
  status: string;
  nextFollowupDate: string;
  createdAt: string;
  loggedByName: string;
}

interface FollowupItem {
  id: number;
  scheduledAt: string;
  status: string;
  type: string;
  notes: string;
  remarks: string;
  outcome: string;
  completedAt?: string;
  isOverdue: boolean;
}

interface LeadHistoryItem {
  id: number;
  action: string;
  description: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  performedByName: string;
}

interface LeadWorkItem {
  leadId: number;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  leadStatus: string;
  priority: string;
  assignedToName: string;
  assignedToId: number;
  lastActivityAt: string;
  totalActivitiesCount: number;
  activityLogs: ActivityLogItem[];
  followups: FollowupItem[];
  timelineHistory: LeadHistoryItem[];
}

interface ExecutiveWorkSummary {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  profileImage?: string;
  timeframe: string;

  totalAssignedLeads: number;
  totalActivitiesLogged: number;
  totalCallsMade: number;
  totalMeetingsHeld: number;
  totalEmailsSent: number;
  totalWhatsappSent: number;
  completedFollowupsCount: number;
  overdueFollowupsCount: number;
  totalConvertedLeads: number;

  conversionRate: number;
  activityCompletionRate: number;

  dailyBreakdown: DailyBreakdown[];
  leadWorkList: LeadWorkItem[];
}

import { useAuthStore } from '../store/authStore';

export default function ExecutiveWorkMonitor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isManager = user?.roles?.includes('ROLE_MANAGER');
  const isPrivileged = isAdmin || isManager;

  const initialUserId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!, 10) : (isPrivileged ? 0 : (user?.id || 0));

  const [members, setMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(initialUserId);
  const [timeframe, setTimeframe] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [summary, setSummary] = useState<ExecutiveWorkSummary | null>(null);
  const [callAnalytics, setCallAnalytics] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [leadSearchTerm, setLeadSearchTerm] = useState<string>('');
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<number, boolean>>({});
  const [leadDrawerId, setLeadDrawerId] = useState<number | null>(null);

  // Active sub-tab inside expanded lead card (logs, followups, timeline)
  const [activeLeadSubTab, setActiveLeadSubTab] = useState<Record<number, 'logs' | 'followups' | 'timeline'>>({});

  useEffect(() => {
    if (isPrivileged) {
      fetchMembers();
    }
  }, [isPrivileged]);

  useEffect(() => {
    fetchWorkSummary();
  }, [selectedUserId, timeframe, startDate, endDate]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/members');
      const staffOnly = (res.data || []).filter((m: any) => {
        const r = (m.roles?.[0]?.name || m.roles?.[0] || '').replace('ROLE_', '');
        return r !== 'ADMIN';
      });
      setMembers(staffOnly);
    } catch (err) {
      console.error('Failed to load team members', err);
    }
  };

  const fetchWorkSummary = async () => {
    setLoading(true);
    try {
      const params: any = { timeframe };
      if (selectedUserId > 0) params.userId = selectedUserId;
      if (timeframe === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      let callPeriod = 'monthly';
      if (timeframe === 'TODAY') callPeriod = 'today';
      else if (timeframe === 'YESTERDAY') callPeriod = 'yesterday';
      else if (timeframe === 'THIS_WEEK') callPeriod = 'weekly';
      else if (timeframe === 'THIS_MONTH') callPeriod = 'monthly';

      const callParams: any = { period: callPeriod };
      if (selectedUserId > 0) callParams.userId = selectedUserId;
      if (startDate) callParams.startDate = startDate;
      if (endDate) callParams.endDate = endDate;

      const [workRes, callRes] = await Promise.all([
        api.get('/api/admin/executive-work', { params }),
        selectedUserId > 0 
          ? api.get('/api/calls/analytics', { params: callParams }).catch(() => ({ data: null }))
          : api.get('/api/calls/team', { params: callParams }).catch(() => ({ data: null }))
      ]);

      setSummary(workRes.data);
      setCallAnalytics(callRes.data);
    } catch (err) {
      console.error('Failed to fetch executive work summary', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLeadExpand = (id: number) => {
    setExpandedLeadIds((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!activeLeadSubTab[id]) {
      setActiveLeadSubTab((prev) => ({ ...prev, [id]: 'logs' }));
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'E';
  };

  const getLeadProgressInfo = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('converted') || s.includes('won')) {
      return { percent: 100, step: 4, totalSteps: 4, label: 'Converted / Won', color: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    }
    if (s.includes('proposal') || s.includes('negotiation')) {
      return { percent: 75, step: 3, totalSteps: 4, label: 'Proposal & Negotiation', color: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    }
    if (s.includes('contacted') || s.includes('interaction') || s.includes('interested') || s.includes('follow')) {
      return { percent: 50, step: 2, totalSteps: 4, label: 'Interaction', color: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    }
    if (s.includes('lost') || s.includes('reject')) {
      return { percent: 0, step: 0, totalSteps: 4, label: 'Lost / Closed', color: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    }
    return { percent: 25, step: 1, totalSteps: 4, label: 'New Lead', color: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
  };

  const filteredLeadWorkList = (summary?.leadWorkList || []).filter((item) => {
    if (!leadSearchTerm) return true;
    const q = leadSearchTerm.toLowerCase();
    return (
      item.leadName.toLowerCase().includes(q) ||
      (item.leadPhone && item.leadPhone.includes(q)) ||
      (item.leadStatus && item.leadStatus.toLowerCase().includes(q)) ||
      (item.assignedToName && item.assignedToName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Unified Executive Monitor Header, Filters & KPI Overview Container */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-text font-sans">
              {isPrivileged ? 'Executive Activity & Lead Work Monitor' : 'My Activity & Lead Performance'}
            </h1>
            <p className="text-xs text-theme-text-muted mt-1">
              {isPrivileged 
                ? 'Empirical day-wise and month-wise audit tracking of all activities, outreach calls, and step progress for every lead.'
                : 'Track your daily calls, meetings, follow-ups, and lead progress in real-time.'}
            </p>
          </div>

          {/* Member Selector / User Badge */}
          <div className="flex items-center gap-3">
            {isPrivileged ? (
              <div className="flex items-center gap-2 bg-theme-bg-alt/70 p-1.5 rounded-xl border border-theme-border shadow-xs">
                <UserIcon size={14} className="text-theme-primary ml-1.5" />
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSelectedUserId(val);
                    setSearchParams(val > 0 ? { userId: String(val) } : {});
                  }}
                  className="bg-transparent text-xs font-bold text-theme-text outline-none pr-2 cursor-pointer"
                >
                  <option value={0}>All Staff & Executive Team Members</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.roles?.[0]?.name?.replace('ROLE_', '') || m.roles?.[0]?.replace('ROLE_', '') || 'STAFF'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-theme-bg-alt/70 px-3.5 py-1.5 rounded-xl border border-theme-border shadow-xs">
                <div className="h-6 w-6 rounded-full bg-theme-primary/20 text-theme-primary flex items-center justify-center text-xs font-extrabold">
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-text leading-tight">{user?.fullName || 'Executive'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeframe Presets & Custom Range Bar */}
        <div className="border-t border-theme-border/60 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'TODAY', label: 'Today (Day-wise)' },
              { key: 'YESTERDAY', label: 'Yesterday' },
              { key: 'THIS_WEEK', label: 'This Week' },
              { key: 'THIS_MONTH', label: 'This Month (Month-wise)' },
              { key: 'CUSTOM', label: 'Custom Range' },
            ].map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setTimeframe(tf.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === tf.key
                    ? 'bg-theme-primary text-white shadow-xs'
                    : 'bg-theme-bg-alt/50 text-theme-text-muted hover:text-theme-text'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {timeframe === 'CUSTOM' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-theme-bg-alt border border-theme-border rounded-xl px-2.5 py-1 text-xs font-bold text-theme-text outline-none"
              />
              <span className="text-xs text-theme-text-muted font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-theme-bg-alt border border-theme-border rounded-xl px-2.5 py-1 text-xs font-bold text-theme-text outline-none"
              />
            </div>
          )}
        </div>

        {/* Executive Overview KPI Grid */}
        {summary && (
          <div className="border-t border-theme-border/60 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Assigned Leads</span>
                  <UserCheck size={14} className="text-blue-500" />
                </div>
                <div className="text-xl font-black text-theme-text">{summary.totalAssignedLeads}</div>
                <p className="text-[9px] text-theme-text-muted font-semibold">Active in workspace</p>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Total Activities</span>
                  <BarChart3 size={14} className="text-purple-500" />
                </div>
                <div className="text-xl font-black text-theme-text">{summary.totalActivitiesLogged}</div>
                <p className="text-[9px] text-theme-text-muted font-semibold">Outreach attempts</p>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Calls Made</span>
                  <PhoneCall size={14} className="text-emerald-500" />
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summary.totalCallsMade}</div>
                <p className="text-[9px] text-theme-text-muted font-semibold">Phone calls logged</p>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Meetings & Demos</span>
                  <Video size={14} className="text-amber-500" />
                </div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">{summary.totalMeetingsHeld}</div>
                <p className="text-[9px] text-theme-text-muted font-semibold">Scheduled / Executed</p>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Followups Done</span>
                  <CheckCircle2 size={14} className="text-cyan-500" />
                </div>
                <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">{summary.completedFollowupsCount}</div>
                <p className="text-[9px] text-rose-500 font-semibold">{summary.overdueFollowupsCount} Overdue</p>
              </div>

              <div className="p-3.5 rounded-xl bg-theme-bg-alt/30 border border-theme-border/60 space-y-1">
                <div className="flex items-center justify-between text-theme-text-muted">
                  <span className="text-[10px] font-bold uppercase">Conversions</span>
                  <TrendingUp size={14} className="text-indigo-500" />
                </div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{summary.totalConvertedLeads}</div>
                <p className="text-[9px] text-theme-text-muted font-semibold">{(summary.conversionRate * 100).toFixed(1)}% Conversion</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <HoosshBeeLoader text="Loading Executive Monitor..." subtext="Syncing agent activities, call durations and live presence" />
      ) : summary ? (
        <>

          {/* Executive Call Duration Tracking & Effort Productivity Banner (ADMIN / MANAGER MONITOR) */}
          <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/60 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-bold shadow-xs">
                  <Phone size={18} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-theme-text">
                    Call Duration Tracking & Executive Effort Audit
                  </h3>
                  <span className="text-xs text-theme-text-muted mt-0.5 block">
                    {selectedUserId > 0 ? `Live call effort and session duration for ${summary.userName}` : 'Aggregated team-wide call duration and communication telemetry'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {callAnalytics?.activeCallSession && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Active Call Running
                  </span>
                )}
                <button
                  onClick={() => setIsCallModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-bold transition-all shadow-xs"
                >
                  <Eye size={15} />
                  <span>Inspect Call Session Logs</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-rose-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-rose-500 transition-colors">Total Call Duration</span>
                  <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-mono font-black text-rose-500">
                  {callAnalytics?.todayCallTimeFormatted || callAnalytics?.totalCallTimeFormatted || '00:00:00'}
                </div>
                <span className="text-[9px] text-theme-text-muted block">Click to audit all conversations</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-cyan-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-cyan-500 transition-colors">Total Calls Count</span>
                  <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-mono font-black text-cyan-500">
                  {callAnalytics?.todayCallsCount ?? callAnalytics?.totalCallsCount ?? summary.totalCallsMade} Calls
                </div>
                <span className="text-[9px] text-theme-text-muted block">Completed phone outreach</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-emerald-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-emerald-500 transition-colors">Avg Call Length</span>
                  <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-mono font-black text-emerald-500">
                  {callAnalytics?.avgDurationFormatted || '00:00:00'}
                </div>
                <span className="text-[9px] text-theme-text-muted block">Average discussion duration</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-amber-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-amber-500 transition-colors">Peak Call Session</span>
                  <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-mono font-black text-amber-500">
                  {callAnalytics?.longestCallFormatted || '00:00:00'}
                </div>
                <span className="text-[9px] text-theme-text-muted block">Longest discussion recorded</span>
              </button>
            </div>
          </div>

          {/* Day-wise & Month-wise Activity Breakdown Table */}
          <div className="p-6 rounded-3xl bg-theme-card border border-theme-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                  <CalendarIcon size={18} className="text-theme-primary" />
                  Day-wise & Month-wise Activity Log Breakdown
                </h3>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  {selectedUserId > 0 
                    ? `Daily breakdown of calls, meetings, emails, and follow-ups executed by ${summary.userName}.`
                    : 'Daily breakdown of calls, meetings, emails, and follow-ups executed across all team members.'}
                </p>
              </div>
              <span className="text-xs font-bold text-theme-text-muted bg-theme-bg-alt px-3 py-1 rounded-full border border-theme-border">
                {summary.dailyBreakdown.length} Days Recorded
              </span>
            </div>

            {summary.dailyBreakdown.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-theme-text-muted">
                No daily activity breakdown recorded for this timeframe.
              </div>
            ) : (
              <div className="overflow-x-auto border border-theme-border/60 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg-alt border-b border-theme-border/60 text-theme-text-muted font-bold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Day</th>
                      <th className="p-3 text-center">Calls</th>
                      <th className="p-3 text-center">Meetings / Demos</th>
                      <th className="p-3 text-center">Emails</th>
                      <th className="p-3 text-center">WhatsApp</th>
                      <th className="p-3 text-center">Followups Completed</th>
                      <th className="p-3 text-right">Total Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/40 font-semibold">
                    {summary.dailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-theme-bg-alt/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-theme-text">{row.date}</td>
                        <td className="p-3 text-theme-text-muted">{row.dayOfWeek}</td>
                        <td className="p-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.callsCount}</td>
                        <td className="p-3 text-center text-amber-600 dark:text-amber-400 font-bold">{row.meetingsCount}</td>
                        <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-bold">{row.emailsCount}</td>
                        <td className="p-3 text-center text-purple-600 dark:text-purple-400 font-bold">{row.whatsappCount}</td>
                        <td className="p-3 text-center text-cyan-600 dark:text-cyan-400 font-bold">{row.followupsCompletedCount}</td>
                        <td className="p-3 text-right font-black text-theme-text">{row.totalActivitiesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lead-by-Lead Detailed Work Directory */}
          <div className="p-6 rounded-3xl bg-theme-card border border-theme-border shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                  <Layers size={18} className="text-theme-primary" />
                  Lead-by-Lead Detailed Work & Audit Trail ({filteredLeadWorkList.length} Leads)
                </h3>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  Click on any lead to expand its complete day-by-day activity logs, follow-ups, and stage timeline history.
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3.5 top-3 text-theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search lead name, phone, stage..."
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl pl-9 pr-3 py-2 text-xs font-semibold text-theme-text outline-none focus:border-theme-primary"
                />
              </div>
            </div>

            {filteredLeadWorkList.length === 0 ? (
              <div className="p-12 text-center text-theme-text-muted space-y-2">
                <UserIcon size={36} className="mx-auto text-theme-text-muted opacity-40" />
                <h4 className="text-sm font-bold text-theme-text">No Assigned Leads Found</h4>
                <p className="text-xs">No leads match your current search or executive selection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeadWorkList.map((item) => {
                  const isExpanded = !!expandedLeadIds[item.leadId];
                  const currentSubTab = activeLeadSubTab[item.leadId] || 'logs';
                  const progress = getLeadProgressInfo(item.leadStatus);

                  return (
                    <div
                      key={item.leadId}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'border-theme-primary/50 bg-theme-bg-alt/30 shadow-md'
                          : 'border-theme-border/70 bg-theme-card hover:border-theme-border'
                      }`}
                    >
                      {/* Accordion Header Bar */}
                      <div
                        onClick={() => toggleLeadExpand(item.leadId)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary font-extrabold text-sm border border-theme-primary/20 flex-shrink-0 shadow-xs">
                            {getInitials(item.leadName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-theme-text leading-tight">{item.leadName}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${progress.badge}`}>
                                {item.leadStatus}
                              </span>
                              {item.priority && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                  item.priority === 'High' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-theme-text-muted mt-1 flex-wrap">
                              <span>Phone: <strong className="text-theme-text font-mono">{item.leadPhone || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Assigned to: <strong className="text-theme-text">{item.assignedToName}</strong></span>
                              <span>•</span>
                              <span>Last Activity: <strong className="text-theme-text">{item.lastActivityAt ? item.lastActivityAt.replace('T', ' ').slice(0, 16) : 'N/A'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Visual Progress Bar */}
                          <div className="hidden lg:flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-theme-text">
                              <TrendingUp size={12} className="text-theme-primary" />
                              <span>{progress.label} ({progress.percent}%)</span>
                            </div>
                            <div className="w-32 bg-theme-bg-alt rounded-full h-2 border border-theme-border/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress.percent === 100 ? 'bg-emerald-500' :
                                  progress.percent === 0 ? 'bg-rose-500' :
                                  'bg-gradient-to-r from-theme-primary to-indigo-500'
                                }`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </div>

                          <span className="text-xs font-extrabold text-theme-text-muted bg-theme-bg-alt px-3 py-1.5 rounded-xl border border-theme-border flex items-center gap-1.5">
                            <BarChart3 size={13} className="text-theme-primary" />
                            {item.totalActivitiesCount} Work Logs
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadDrawerId(item.leadId);
                            }}
                            className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-theme-primary hover:bg-theme-primary-hover px-3.5 py-1.5 rounded-xl shadow-md shadow-theme-primary/10 transition-all"
                            title="Open Full Interactive Lead Work Panel"
                          >
                            <Eye size={14} /> Full Work Panel
                          </button>
                          {isExpanded ? <ChevronUp size={18} className="text-theme-text-muted" /> : <ChevronDown size={18} className="text-theme-text-muted" />}
                        </div>
                      </div>

                      {/* Expandable Lead Details & Audit History */}
                      {isExpanded && (
                        <div className="border-t border-theme-border/50 p-4 space-y-4 bg-theme-card">
                          
                          {/* Pipeline Progress Stepper */}
                          <div className="p-4 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-theme-primary" />
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text">Lead Pipeline Progress & Work Status</h4>
                              </div>
                              <span className="text-xs font-extrabold text-theme-text">{progress.percent}% Pipeline Completion</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              {[
                                { step: 1, label: 'New Lead' },
                                { step: 2, label: 'Interaction' },
                                { step: 3, label: 'Proposal' },
                                { step: 4, label: 'Converted' },
                              ].map((st) => {
                                const isDone = progress.step >= st.step;
                                const isCurrent = progress.step === st.step;
                                return (
                                  <div key={st.step} className="flex flex-col items-center gap-1 text-center">
                                    <div className={`w-full h-1.5 rounded-full transition-all ${
                                      isDone ? (progress.percent === 0 ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-theme-border/60'
                                    }`} />
                                    <span className={`text-[9px] font-bold ${
                                      isCurrent ? 'text-theme-primary font-black' : isDone ? 'text-theme-text' : 'text-theme-text-muted'
                                    }`}>
                                      {st.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Inner Sub-tabs */}
                          <div className="flex items-center gap-2 border-b border-theme-border/40 pb-2">
                            {[
                              { key: 'logs', label: `Outreach Activity Logs (${item.activityLogs.length})` },
                              { key: 'followups', label: `Follow-ups & Schedules (${item.followups.length})` },
                              { key: 'timeline', label: `Stage Audit History (${item.timelineHistory.length})` },
                            ].map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveLeadSubTab((prev) => ({ ...prev, [item.leadId]: tab.key as any }))}
                                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                                  currentSubTab === tab.key
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Sub-tab Content 1: Activity Logs */}
                          {currentSubTab === 'logs' && (
                            <div className="space-y-2">
                              {item.activityLogs.length === 0 ? (
                                <p className="text-xs text-theme-text-muted p-4 italic">No direct outreach logs recorded for this lead yet.</p>
                              ) : (
                                <div className="divide-y divide-theme-border/30">
                                  {item.activityLogs.map((log) => (
                                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            Attempt #{log.activityNumber}
                                          </span>
                                          <span className="text-xs font-extrabold text-theme-text">{log.communicationType}</span>
                                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                            {log.outcome}
                                          </span>
                                          {log.duration && (
                                            <span className="text-[10px] font-bold text-theme-text-muted flex items-center gap-1">
                                              <Clock size={11} /> {log.duration}
                                            </span>
                                          )}
                                        </div>
                                        {log.remarks && (
                                          <p className="text-xs text-theme-text leading-relaxed">
                                            "{log.remarks}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="text-[10px] font-bold text-theme-text-muted">{log.createdAt ? log.createdAt.replace('T', ' ').slice(0, 16) : ''}</div>
                                        <div className="text-[10px] text-theme-primary font-bold">{log.loggedByName}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sub-tab Content 2: Follow-ups */}
                          {currentSubTab === 'followups' && (
                            <div className="space-y-2">
                              {item.followups.length === 0 ? (
                                <p className="text-xs text-theme-text-muted p-4 italic">No scheduled follow-ups found for this lead.</p>
                              ) : (
                                <div className="divide-y divide-theme-border/30">
                                  {item.followups.map((f: any) => (
                                    <div key={f.id} className="py-2.5 flex items-center justify-between gap-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                            f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            f.isOverdue ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                          }`}>
                                            {f.status}
                                          </span>
                                          <span className="text-xs font-bold text-theme-text">{f.type || 'CALL'}</span>
                                        </div>
                                        {f.notes && <p className="text-xs text-theme-text leading-normal">{f.notes}</p>}
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="text-xs font-bold text-theme-text font-mono">
                                          {f.scheduledAt ? f.scheduledAt.replace('T', ' ').slice(0, 16) : ''}
                                        </div>
                                        {f.completedAt && (
                                          <div className="text-[10px] font-bold text-emerald-500">
                                            Completed: {f.completedAt.replace('T', ' ').slice(0, 16)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sub-tab Content 3: Timeline History */}
                          {currentSubTab === 'timeline' && (
                            <div className="space-y-2">
                              {item.timelineHistory.length === 0 ? (
                                <p className="text-xs text-theme-text-muted p-4 italic">No stage audit history recorded.</p>
                              ) : (
                                <div className="divide-y divide-theme-border/30">
                                  {item.timelineHistory.map((h: any) => (
                                    <div key={h.id} className="py-2 flex items-center justify-between gap-4">
                                      <div>
                                        <div className="text-xs font-extrabold text-theme-text flex items-center gap-2">
                                          <span>{h.action || 'STAGE_UPDATE'}</span>
                                          {h.previousStatus && h.newStatus && (
                                            <span className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1">
                                              ({h.previousStatus} <ArrowRight size={10} /> {h.newStatus})
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-theme-text-muted">{h.description}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="text-[10px] text-theme-text-muted font-bold">{h.timestamp ? h.timestamp.replace('T', ' ').slice(0, 16) : ''}</div>
                                        <div className="text-[10px] text-theme-primary font-bold">{h.performedByName}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Interactive Work Details Panel Drawer */}
      {leadDrawerId && (
        <WorkDetailsPanel
          leadId={leadDrawerId}
          isOpen={!!leadDrawerId}
          onClose={() => setLeadDrawerId(null)}
          onLeadUpdated={() => fetchWorkSummary()}
        />
      )}

      {/* Call Details & Audit Logs Modal */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        initialUserId={selectedUserId > 0 ? selectedUserId : undefined}
        userNameFilter={selectedUserId > 0 ? summary?.userName : 'Team-Wide Audit'}
        title={selectedUserId > 0 ? `${summary?.userName}'s Call Activity Logs` : 'Team-Wide Call Activity Logs & Audit'}
        period={timeframe.toLowerCase()}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
