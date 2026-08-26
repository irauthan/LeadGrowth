import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatCurrency } from '../../utils';
import { 
  UserCheck, 
  Phone, 
  Mail, 
  Sparkles, 
  RefreshCw, 
  Flame,
  Clock,
  IndianRupee,
  Zap,
  ChevronRight,
  Briefcase,
  Eye,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CallDetailsModal from '../../components/CallDetailsModal';
import { useLayoutStore } from '../../store/layoutStore';
import { useWebSocket } from '../../hooks/useWebSocket';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const { dashboardCards } = useLayoutStore();

  const isCardEnabled = (id: string) => {
    const card = dashboardCards.find((c) => c.id === id);
    return card ? card.enabled : true;
  };

  const [kpis, setKpis] = useState<any>(null);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [pendingLeads, setPendingLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });



  // Live WebSocket sync for real-time KPI updates
  useWebSocket({
    workspaceId: user?.workspaceId,
    onLeadReceived: () => {
      fetchUserData();
    },
  });

  useEffect(() => {
    fetchUserData();
  }, [timeFilter]);

  const [callAnalytics, setCallAnalytics] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const params: any = { period: timeFilter.period };
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      const [kpiRes, leadsRes, followupsRes, pendingRes, , callRes] = await Promise.all([
        api.get('/api/users/me/dashboard', { params }).catch(() => ({ data: null })),
        api.get('/api/leads', { params }).catch(() => api.get('/api/leads/pipeline', { params })),
        api.get('/api/followups', { params }).catch(() => ({ data: [] })),
        api.get('/api/leads/pending-assigned').catch(() => ({ data: [] })),
        api.get('/api/leads/workflow-pending-counts').catch(() => ({ data: {} })),
        api.get('/api/calls/user', { params }).catch(() => ({ data: null }))
      ]);

      const rawPending = pendingRes.data || [];
      const myLeadIds = new Set((leadsRes.data || []).map((l: any) => l.id));
      // Deduplicate by unique id and filter out any leads already in pipeline
      const uniquePending = rawPending
        .filter((l: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.id === l.id) === idx)
        .filter((l: any) => !myLeadIds.has(l.id));

      setKpis(kpiRes.data);
      setMyLeads(leadsRes.data || []);
      const activeFollowupList = (followupsRes.data || []).filter((f: any) => f.status !== 'COMPLETED' && f.status !== 'CANCELLED');
      setFollowups(activeFollowupList);
      setPendingLeads(uniquePending);
      setCallAnalytics(callRes.data);
    } catch (err) {
      console.error('Failed to load User Productivity Hub data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPipeline = async (leadId: number, leadName: string) => {
    if (!user) return;
    // Optimistically remove from pending leads immediately
    setPendingLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      await api.post(`/api/leads/${leadId}/add-to-pipeline`).catch(() =>
        api.patch(`/api/leads/${leadId}/assign?userId=${user.id}`)
      );
      setIdleMessage(`Lead "${leadName}" added to your Pipelines!`);
      setTimeout(() => setIdleMessage(''), 4000);
      fetchUserData();
    } catch (e: any) {
      fetchUserData();
      alert(e.response?.data?.message || 'Failed to add lead to pipeline');
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data && res.data.id) {
        // Only show if not already in myLeads
        const isAlreadyPresent = myLeads.some((l: any) => l.id === res.data.id);
        if (!isAlreadyPresent) {
          setIdleMessage(`New lead auto-assigned: ${res.data.name}! Click 'Add To Pipelines' to accept.`);
          fetchUserData();
        }
      } else {
        setIdleMessage('Queue empty. You are fully caught up!');
      }
      setTimeout(() => setIdleMessage(''), 4000);
    } catch (e) {
      setIdleMessage('Sweep active. All queue items currently assigned.');
      setTimeout(() => setIdleMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Personal Sales Executive Hub...</span>
      </div>
    );
  }

  const getStageCount = (targetStage: string) => {
    if (!myLeads || !Array.isArray(myLeads)) return 0;

    return myLeads.filter((lead: any) => {
      const st = (lead.status || '').trim();
      const stLower = st.toLowerCase();
      const isNewLead = stLower === 'new' || stLower === 'new lead' || stLower === 'fresh';

      if (targetStage === 'New') {
        return isNewLead;
      }
      if (isNewLead) {
        return false;
      }
      if (targetStage === 'Interaction') {
        return stLower === 'interaction' || stLower === 'contacted' || stLower === 'first call' || stLower === 'first_call' || stLower === 'follow-up' || stLower === 'followup' || stLower === 'requirement collection' || stLower === 'requirement_collection' || stLower === 'interested';
      }
      if (targetStage === 'Proposal Sent') {
        return stLower === 'proposal sent' || stLower === 'proposal_sent' || stLower === 'proposal' || stLower === 'demo scheduled' || stLower === 'demo_scheduled' || stLower === 'qualified';
      }
      if (targetStage === 'Negotiation') {
        return stLower === 'negotiation' || stLower === 'negotiation_started' || stLower === 'closing';
      }
      if (targetStage === 'Converted') {
        return stLower === 'converted' || stLower === 'payment completed' || stLower === 'payment_completed' || stLower === 'payment' || stLower === 'closed won' || stLower === 'closed_won';
      }
      if (targetStage === 'Lost') {
        return stLower === 'lost' || stLower === 'rejected';
      }
      return stLower === targetStage.toLowerCase();
    }).length;
  };

  const assignedLeadsCount = kpis?.myAssignedLeads ?? myLeads.length;
  const pendingFollowupsCount = kpis?.myPendingFollowups ?? followups.length;
  const conversionsCount = kpis?.myConversions ?? getStageCount('Converted');
  const personalRevenue = kpis?.myRevenueContribution ?? 0;

  return (
    <div className="space-y-6">

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs text-theme-text-muted mt-1">
            Manage your pipeline, advance workflow steps, complete client follow-ups, and drive conversions.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
          <Link
            to="/my-work"
            className="flex items-center gap-2 rounded-2xl bg-theme-bg-alt border border-theme-border hover:bg-theme-card px-4 py-2.5 text-xs font-bold text-theme-text transition-all"
          >
            <Briefcase size={14} className="text-theme-primary" /> Open Pipelines
          </Link>
          <button
            onClick={handleIdleSweep}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-blue-600 hover:from-theme-primary-hover hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme-primary/20 transition-all"
          >
            <Zap size={14} /> Ready For Next Lead
          </button>
        </div>
      </div>

      {idleMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2">
          <Sparkles size={16} /> {idleMessage}
        </div>
      )}

      {/* Newly Assigned Leads - Pending Pipeline Acceptance Card */}
      {isCardEnabled('pending_leads') && pendingLeads.length > 0 && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-1.5">
                <Bell size={16} className="text-amber-500" />
                <span>Newly Received Leads ({pendingLeads.length} Lead{pendingLeads.length > 1 ? 's' : ''} Assigned)</span>
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-500 uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Pending Pipeline Acceptance
            </span>
          </div>
          <p className="text-xs text-theme-text-muted">
            You have received a new lead assignment! Click <b>"Add To Pipelines"</b> below to activate it in your Open Pipelines workspace.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingLeads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-2xl bg-theme-card border border-theme-border/60 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-extrabold text-theme-text">{lead.name}</h4>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75} pts)
                    </span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted mt-1">{lead.email} • {lead.sourcePlatform || 'Meta'}</p>
                  {lead.campaignName && (
                    <Link
                      to="/campaigns"
                      className="text-[9px] text-theme-primary hover:underline font-bold block mt-0.5"
                    >
                      Campaign: {lead.campaignName}
                    </Link>
                  )}
                </div>

                <button
                  onClick={() => handleAcceptPipeline(lead.id, lead.name)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-md shadow-theme-primary/20 transition-all"
                >
                  <Briefcase size={14} /> Add To Pipelines
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal KPI Cards */}
      {isCardEnabled('kpis_summary') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* 1. My Assigned Leads -> /my-work */}
        <Link
          to={`/my-work?period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-blue-500 transition-colors">Assigned Leads</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{assignedLeadsCount}</h3>
          <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-1">
            Active in Pipeline <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 2. My Pending Follow-Ups -> /followups */}
        <Link
          to="/followups"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-amber-500/50 hover:shadow-lg transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-amber-500 transition-colors">Pending Follow-ups</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{pendingFollowupsCount}</h3>
          <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
            Scheduled Reminders <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 3. My Conversions -> /my-work?stage=Converted */}
        <Link
          to={`/my-work?stage=Converted&period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-emerald-500 transition-colors">My Conversions</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{conversionsCount}</h3>
          <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
            {kpis?.conversionRate || 0}% Conversion Rate <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 4. My Revenue Contribution -> /analytics */}
        <Link
          to="/analytics"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-indigo-500/50 hover:shadow-lg transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-indigo-500 transition-colors">Revenue Contribution</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <IndianRupee size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-500 dark:text-indigo-400">{formatCurrency(personalRevenue)}</h3>
          <span className="text-[10px] font-semibold text-indigo-500 flex items-center gap-1">
            Closed Deals Value <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

      </div>
      )}

      {/* Call Duration Tracking Productivity Metrics */}
      {isCardEnabled('call_metrics') && (
        <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-bold">
                <Phone size={16} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                  Call Duration Tracking & Effort Productivity
                </h3>
                <span className="text-[10px] text-theme-text-muted">Realtime effort tracking used by Smart Auto Assignment Engine</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-bold transition-all shadow-2xs"
              >
                <Eye size={14} />
                <span>View Call Details</span>
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
                <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-rose-500 transition-colors">Today's Call Time</span>
                <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xl font-mono font-black text-rose-500">
                {callAnalytics?.todayCallTimeFormatted || '00:00:00'}
              </div>
              <span className="text-[9px] text-theme-text-muted block">Click to view contacts talked to</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-cyan-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-cyan-500 transition-colors">Today's Calls</span>
                <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xl font-mono font-black text-cyan-500">
                {callAnalytics?.todayCallsCount || 0}
              </div>
              <span className="text-[9px] text-theme-text-muted block">Click to view session log</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-emerald-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-emerald-500 transition-colors">Avg Duration</span>
                <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xl font-mono font-black text-emerald-500">
                {callAnalytics?.avgDurationFormatted || '00:00:00'}
              </div>
              <span className="text-[9px] text-theme-text-muted block">Average per session</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-amber-500/40 hover:bg-theme-bg-alt transition-all text-left space-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase group-hover:text-amber-500 transition-colors">Longest Call</span>
                <Eye size={12} className="text-theme-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xl font-mono font-black text-amber-500">
                {callAnalytics?.longestCallFormatted || '00:00:00'}
              </div>
              <span className="text-[9px] text-theme-text-muted block">Peak session length</span>
            </button>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title="Your Call Activity & Contact Details"
        period={timeFilter.period}
        startDate={timeFilter.startDate}
        endDate={timeFilter.endDate}
      />

      {/* Workflow Stage-wise Active Breakdown Grid */}
      {isCardEnabled('workflow_queue') && (
        <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-text flex items-center gap-2">
              <Briefcase size={16} className="text-theme-primary" /> Workflow Stage Breakdown
            </h3>
            <span className="text-[10px] font-bold text-theme-text-muted">
              Active Pipeline Leads by Stage
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'New Leads', count: getStageCount('New'), dot: 'bg-blue-500', targetStage: 'New' },
              { label: 'Interaction', count: getStageCount('Interaction'), dot: 'bg-purple-500', targetStage: 'Interaction' },
              { label: 'Proposal Sent', count: getStageCount('Proposal Sent'), dot: 'bg-cyan-500', targetStage: 'Proposal Sent' },
              { label: 'Negotiation', count: getStageCount('Negotiation'), dot: 'bg-amber-500', targetStage: 'Negotiation' },
              { label: 'Converted', count: getStageCount('Converted'), dot: 'bg-emerald-500', targetStage: 'Converted' }
            ].map((item, i) => (
              <Link
                key={i}
                to={`/my-work?stage=${encodeURIComponent(item.targetStage)}&period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
                className="p-3.5 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 hover:border-theme-primary/40 hover:bg-theme-bg-alt transition-all group block"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                  <span className="text-[10px] font-bold text-theme-text-muted block truncate group-hover:text-theme-text">
                    {item.label}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span className="text-xl font-black text-theme-text">
                    {item.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* Left Column: My Pipeline Active Leads */}
        <div className="lg:col-span-2 flex flex-col space-y-6">

          <div className="h-full flex flex-col justify-between rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <UserCheck size={16} className="text-theme-primary" /> Active Pipeline Contacts
              </h3>
              <Link to={`/my-work?period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`} className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1">
                View My Workspace <ChevronRight size={14} />
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto max-h-[420px] min-h-[380px] overflow-y-auto rounded-2xl border border-theme-border/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Pipeline Stage</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {myLeads.slice(0, 8).map((lead) => (
                    <tr key={lead.id} className="hover:bg-theme-bg-alt/40 transition-colors">
                      <td className="p-3 font-bold text-theme-text">
                        <Link 
                          to={`/my-work?leadId=${lead.id}&period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
                          className="hover:text-theme-primary hover:underline transition-colors flex items-center gap-1.5 group/link"
                        >
                          <span>{lead.name}</span>
                          <ChevronRight size={12} className="text-theme-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="p-3 text-theme-text-muted font-medium truncate max-w-[120px]">{lead.company || lead.sourcePlatform || 'Corporate'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500' :
                          lead.status === 'Negotiation' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-theme-primary/10 text-theme-primary'
                        }`}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {lead.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`tel:${lead.phone || ''}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Phone size={13} />
                          </a>
                          <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Mail size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme-text-muted">
                        No assigned pipeline leads. Click "Ready For Next Lead" to pull unassigned contacts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Scheduled Reminders & Productivity Summary */}
        <div className="flex flex-col space-y-6">

          {/* Upcoming Reminders */}
          {isCardEnabled('today_followups') && (
            <div className="h-full flex flex-col justify-between rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" /> Follow-up Schedule
              </h3>

              <div className="flex-1 space-y-3 max-h-[420px] min-h-[380px] overflow-y-auto pr-1">
                {followups.slice(0, 8).map((f: any, idx: number) => (
                  <Link 
                    key={idx}
                    to={`/my-work?leadId=${f.leadId || ''}`}
                    className="block p-3.5 rounded-2xl border border-theme-border/40 bg-theme-bg-alt/30 hover:bg-theme-bg-alt hover:border-theme-primary/40 transition-all group space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                      <span className="group-hover:text-theme-primary transition-colors flex items-center gap-1">
                        {f.leadName || 'Client Touchpoint'}
                        <ChevronRight size={12} className="text-theme-primary transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 uppercase">{f.type || 'CALL'}</span>
                    </div>
                    <p className="text-[10px] text-theme-text-muted truncate">{f.notes || 'Requirement collection & proposal follow-up'}</p>
                  </Link>
                ))}
                {followups.length === 0 && (
                  <p className="text-center text-xs text-theme-text-muted py-6">No pending follow-up reminders scheduled.</p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
