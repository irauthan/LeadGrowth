import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatCurrency } from '../../utils';
import { 
  UserCheck, 
  Sparkles, 
  Flame,
  Clock,
  IndianRupee,
  ChevronRight,
  Briefcase,
  Bell,
  CheckSquare,
  Square,
  CheckCheck,
  X,
  Layers,
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
  PieChart,
  Pie,
  CartesianGrid
} from 'recharts';
import { useLayoutStore } from '../../store/layoutStore';
import { useWebSocket } from '../../hooks/useWebSocket';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';
import HoosshBeeLoader from '../../components/HoosshBeeLoader';
import { toast } from '../../store/toastStore';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { dashboardCards } = useLayoutStore();

  const isCardEnabled = (id: string) => {
    const card = dashboardCards.find((c) => c.id === id);
    return card ? card.enabled : true;
  };

  const [kpis, setKpis] = useState<any>(null);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [pendingLeads, setPendingLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });
  const [chartTab, setChartTab] = useState<'funnel' | 'trend' | 'quality'>('funnel');

  // Live WebSocket sync for real-time KPI updates
  useWebSocket({
    workspaceId: user?.workspaceId,
    userId: user?.id,
    onLeadReceived: () => {
      fetchUserData();
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
    },
    onNotificationReceived: () => {
      fetchUserData();
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
    }
  });

  useEffect(() => {
    fetchUserData();
  }, [timeFilter]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const params: any = { period: timeFilter.period };
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      const [kpiRes, leadsRes, followupsRes, pendingRes] = await Promise.all([
        api.get('/api/users/me/dashboard', { params }).catch(() => ({ data: null })),
        api.get('/api/leads', { params }).catch(() => api.get('/api/leads/pipeline', { params })),
        api.get('/api/followups', { params }).catch(() => ({ data: [] })),
        api.get('/api/leads/pending-assigned').catch(() => ({ data: [] }))
      ]);

      const rawPending = pendingRes.data || [];

      setKpis(kpiRes.data);
      setMyLeads(leadsRes.data || []);
      const activeFollowupList = (followupsRes.data || []).filter((f: any) => f.status !== 'COMPLETED' && f.status !== 'CANCELLED');
      setFollowups(activeFollowupList);
      setPendingLeads(rawPending);
      
      // Auto select all pending leads and show modal if new leads arrived
      if (rawPending.length > 0) {
        setSelectedLeadIds(rawPending.map((l: any) => l.id));
        setIsAcceptModalOpen(true);
      } else {
        setSelectedLeadIds([]);
        setIsAcceptModalOpen(false);
      }
      // Smooth viewing duration for loader
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error('Failed to load User Productivity Hub data', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    // Past 6 months up to current month (e.g. Apr, May, Jun, Jul, Aug, Sep)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleString('default', { month: 'short' });
      const fullMonthStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();

      const leadsInMonth = (myLeads || []).filter((l: any) => {
        if (!l.createdAt) return false;
        const cDate = new Date(l.createdAt);
        return cDate.getFullYear() === mYear && cDate.getMonth() === mMonth;
      });

      const convertedInMonth = leadsInMonth.filter((l: any) => {
        const s = (l.status || '').toLowerCase();
        return s.includes('converted') || s.includes('won') || s.includes('payment');
      });

      const lostInMonth = leadsInMonth.filter((l: any) => {
        const s = (l.status || '').toLowerCase();
        return s.includes('lost') || s.includes('reject');
      });

      const revenueInMonth = convertedInMonth.reduce((acc: number, l: any) => acc + (l.proposalAmount || 0), 0);

      months.push({
        month: `${mStr} ${mYear}`,
        shortMonth: mStr,
        fullMonth: fullMonthStr,
        leads: leadsInMonth.length,
        converted: convertedInMonth.length,
        lost: lostInMonth.length,
        revenue: revenueInMonth
      });
    }
    return months;
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === pendingLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(pendingLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAcceptPipeline = async (leadId: number, leadName: string) => {
    if (!user) return;
    // Optimistically remove from pending leads immediately
    setPendingLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
    try {
      await api.post(`/api/leads/${leadId}/add-to-pipeline`).catch(() =>
        api.patch(`/api/leads/${leadId}/assign?userId=${user.id}`)
      );
      setIdleMessage(`Lead "${leadName}" added to your Pipelines!`);
      toast.success(`Lead "${leadName}" added to your Pipelines!`, 'Pipeline Updated');
      setTimeout(() => setIdleMessage(''), 4000);
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
      fetchUserData();
    } catch (e: any) {
      fetchUserData();
      toast.error(e.response?.data?.message || 'Failed to add lead to pipeline');
    }
  };

  const handleBulkAcceptPipeline = async (customIds?: number[]) => {
    if (!user) return;
    const targetIds = customIds && customIds.length > 0 ? customIds : selectedLeadIds;
    if (targetIds.length === 0) return;

    // Optimistically remove from pending leads immediately
    setPendingLeads((prev) => prev.filter((l) => !targetIds.includes(l.id)));
    setSelectedLeadIds([]);
    setIsAcceptModalOpen(false);

    try {
      await api.post('/api/leads/bulk-add-to-pipeline', targetIds);
      setIdleMessage(`${targetIds.length} lead${targetIds.length > 1 ? 's' : ''} added to your Pipelines!`);
      toast.success(`${targetIds.length} lead${targetIds.length > 1 ? 's' : ''} added to your Pipelines!`, 'Pipelines Updated');
      setTimeout(() => setIdleMessage(''), 4000);
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
      fetchUserData();
    } catch (e: any) {
      fetchUserData();
      toast.error(e.response?.data?.message || 'Failed to add leads to pipeline');
    }
  };

  if (loading) {
    return (
      <HoosshBeeLoader 
        text="Loading Sales Workspace..." 
        subtext="Syncing your active pipelines, scheduled follow-ups and performance targets" 
      />
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
        return stLower === 'interaction' || stLower === 'contacted' || stLower === 'first call' || stLower === 'first_call' || stLower === 'follow-up' || stLower === 'followup' || stLower === 'requirement collection' || stLower === 'requirement_collection' || stLower === 'interested' || stLower === 'in progress' || stLower === 'in_progress';
      }
      if (targetStage === 'Proposal Sent') {
        return stLower === 'proposal sent' || stLower === 'proposal_sent' || stLower === 'proposal' || stLower === 'demo scheduled' || stLower === 'demo_scheduled' || stLower === 'qualified';
      }
      if (targetStage === 'Negotiation') {
        return stLower === 'negotiation' || stLower === 'negotiation_started' || stLower === 'closing';
      }
      if (targetStage === 'Converted') {
        return stLower === 'converted' || stLower === 'payment completed' || stLower === 'payment_completed' || stLower === 'payment' || stLower === 'closed won' || stLower === 'closed_won' || stLower === 'won';
      }
      if (targetStage === 'Lost') {
        return stLower === 'lost' || stLower === 'rejected' || stLower === 'closed lost' || stLower === 'closed_lost' || stLower === 'dropped' || stLower === 'junk' || stLower === 'unqualified' || stLower === 'disqualified' || stLower === 'cancelled';
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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-theme-text">
            Welcome back, {user?.fullName}!
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
          <Link
            to="/my-work"
            className="flex items-center gap-2 rounded-2xl bg-theme-bg-alt border border-theme-border hover:bg-theme-card px-4 py-2.5 text-xs font-bold text-theme-text transition-all"
          >
            <Briefcase size={14} className="text-theme-primary" /> Open Pipelines
          </Link>
        </div>
      </div>

      {idleMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2">
          <Sparkles size={16} /> {idleMessage}
        </div>
      )}

      {/* NEW LEADS ASSIGNED POPUP MODAL */}
      {isAcceptModalOpen && pendingLeads.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl rounded-3xl bg-theme-card border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-theme-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bell size={20} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-theme-text">
                      Newly Assigned Leads ({pendingLeads.length} Lead{pendingLeads.length > 1 ? 's' : ''})
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    Select the leads you wish to add into your Active Pipelines workspace.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-colors"
                title="Close and view on dashboard"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Toolbar (Select All & Quick Actions) */}
            <div className="p-4 bg-theme-bg-alt/50 border-b border-theme-border/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-card border border-theme-border hover:border-amber-500/50 text-xs font-bold text-theme-text transition-all"
                >
                  {selectedLeadIds.length === pendingLeads.length ? (
                    <CheckSquare size={16} className="text-amber-500" />
                  ) : (
                    <Square size={16} className="text-theme-text-muted" />
                  )}
                  <span>Select All ({selectedLeadIds.length}/{pendingLeads.length})</span>
                </button>

                {selectedLeadIds.length > 0 && (
                  <span className="text-xs font-bold text-amber-500">
                    {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkAcceptPipeline(pendingLeads.map((l) => l.id))}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <CheckCheck size={14} />
                  <span>Add All to Pipelines ({pendingLeads.length})</span>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Lead Grid */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pendingLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => toggleSelectLead(lead.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/5 shadow-md shadow-amber-500/5'
                          : 'border-theme-border/70 bg-theme-bg-alt/30 hover:border-theme-border hover:bg-theme-bg-alt/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`flex-shrink-0 transition-colors ${isSelected ? 'text-amber-500' : 'text-theme-text-muted'}`}>
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                            <h4 className="text-xs font-semibold text-theme-text">{lead.name}</h4>
                          </div>
                          <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0">
                            {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75} pts)
                          </span>
                        </div>

                        <div className="mt-2 space-y-0.5 text-[11px] text-theme-text-muted pl-6">
                          <p className="truncate">Email: <strong className="text-theme-text">{lead.email}</strong></p>
                          {lead.phone && <p>Phone: <strong className="text-theme-text font-mono">{lead.phone}</strong></p>}
                          <p>Source: <span className="font-semibold text-theme-text">{lead.sourcePlatform || 'Website / Direct'}</span></p>
                          {lead.campaignName && (
                            <p className="text-theme-primary font-bold text-[10px]">Campaign: {lead.campaignName}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-theme-border/40 flex items-center justify-between gap-2 pl-6">
                        <span className="text-[10px] text-theme-text-muted font-bold">Single Action:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptPipeline(lead.id, lead.name);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1"
                        >
                          <Briefcase size={12} /> Add to Pipeline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-theme-bg-alt border-t border-theme-border/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-theme-text-muted hover:text-theme-text hover:bg-theme-card transition-all"
              >
                Decide Later
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedLeadIds.length === 0}
                  onClick={() => handleBulkAcceptPipeline()}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2 ${
                    selectedLeadIds.length > 0
                      ? 'bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-white shadow-theme-primary/25 cursor-pointer scale-100'
                      : 'bg-theme-bg-alt text-theme-text-muted border border-theme-border/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Briefcase size={14} />
                  <span>Add Selected ({selectedLeadIds.length}) to Pipelines</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Newly Assigned Leads - Pending Pipeline Acceptance Dashboard Card */}
      {isCardEnabled('pending_leads') && pendingLeads.length > 0 && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-semibold text-theme-text flex items-center gap-1.5">
                <Bell size={16} className="text-amber-500" />
                <span>Newly Received Leads ({pendingLeads.length} Lead{pendingLeads.length > 1 ? 's' : ''} Assigned)</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(true)}
                className="px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
              >
                <Layers size={12} /> Open Popup View
              </button>
              <span className="text-[10px] font-bold text-amber-500 uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Pending Acceptance
              </span>
            </div>
          </div>

          <p className="text-xs text-theme-text-muted">
            You have received new lead assignments! Select leads and click <b>"Add To Pipelines"</b> to activate them in your Pipelines workspace.
          </p>

          {/* Batch Actions Header Bar */}
          <div className="p-3 bg-theme-card/80 border border-theme-border rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-bg-alt border border-theme-border hover:border-amber-500/40 text-xs font-bold text-theme-text transition-all"
              >
                {selectedLeadIds.length === pendingLeads.length ? (
                  <CheckSquare size={16} className="text-amber-500" />
                ) : (
                  <Square size={16} className="text-theme-text-muted" />
                )}
                <span>Select All ({selectedLeadIds.length}/{pendingLeads.length})</span>
              </button>

              {selectedLeadIds.length > 0 && (
                <span className="text-xs font-bold text-amber-500">
                  {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkAcceptPipeline(pendingLeads.map((l) => l.id))}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <CheckCheck size={14} />
                <span>Add All ({pendingLeads.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedLeadIds.length === 0}
                onClick={() => handleBulkAcceptPipeline()}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 ${
                  selectedLeadIds.length > 0
                    ? 'bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-white shadow-theme-primary/20 cursor-pointer'
                    : 'bg-theme-bg-alt text-theme-text-muted border border-theme-border/60 cursor-not-allowed opacity-60'
                }`}
              >
                <Briefcase size={13} />
                <span>Add Selected ({selectedLeadIds.length})</span>
              </button>
            </div>
          </div>

          {/* Lead Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              return (
                <div 
                  key={lead.id} 
                  onClick={() => toggleSelectLead(lead.id)}
                  className={`p-4 rounded-2xl border shadow-sm space-y-3 flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-theme-card border-amber-500/60 ring-2 ring-amber-500/20'
                      : 'bg-theme-card border-theme-border/60 hover:border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 transition-colors ${isSelected ? 'text-amber-500' : 'text-theme-text-muted'}`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <h4 className="text-xs font-semibold text-theme-text">{lead.name}</h4>
                      </div>
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-shrink-0">
                        {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75} pts)
                      </span>
                    </div>

                    <div className="mt-2 space-y-0.5 text-[10px] text-theme-text-muted pl-6">
                      <p className="truncate">{lead.email} • {lead.sourcePlatform || 'Meta'}</p>
                      {lead.phone && <p className="font-mono text-theme-text">{lead.phone}</p>}
                      {lead.campaignName && (
                        <Link
                          to="/campaigns"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9px] text-theme-primary hover:underline font-bold block mt-0.5"
                        >
                          Campaign: {lead.campaignName}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-theme-border/40 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptPipeline(lead.id, lead.name);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-md shadow-theme-primary/20 transition-all"
                    >
                      <Briefcase size={14} /> Add To Pipelines
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal KPI Cards */}
      {isCardEnabled('kpis_summary') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* 1. My Assigned Leads -> /my-work */}
        <Link
          to={`/my-work?period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
          className="rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs space-y-2 hover:border-theme-primary/40 hover:shadow-md transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">Assigned Leads</span>
            <div className="h-9 w-9 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <UserCheck size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-theme-text">{assignedLeadsCount}</h3>
          <span className="text-[10px] font-semibold text-theme-text-muted group-hover:text-theme-primary flex items-center gap-1 transition-colors">
            Active in Pipeline <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 2. My Pending Follow-Ups -> /followups */}
        <Link
          to="/followups"
          className="rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs space-y-2 hover:border-theme-primary/40 hover:shadow-md transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">Pending Follow-ups</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-105">
              <Clock size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-theme-text">{pendingFollowupsCount}</h3>
          <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
            Scheduled Reminders <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 3. My Conversions -> /my-work?stage=Converted */}
        <Link
          to={`/my-work?stage=Converted&period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`}
          className="rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs space-y-2 hover:border-theme-primary/40 hover:shadow-md transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">My Conversions</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center transition-transform group-hover:scale-105">
              <Flame size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-theme-text">{conversionsCount}</h3>
          <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
            {kpis?.conversionRate || 0}% Conversion Rate <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 4. My Revenue Contribution -> /analytics */}
        <Link
          to="/analytics"
          className="rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs space-y-2 hover:border-theme-primary/40 hover:shadow-md transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">Revenue Contribution</span>
            <div className="h-9 w-9 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <IndianRupee size={17} />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-theme-text">{formatCurrency(personalRevenue)}</h3>
          <span className="text-[10px] font-semibold text-theme-text-muted group-hover:text-theme-primary flex items-center gap-1 transition-colors">
            Closed Deals Value <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

      </div>
      )}

      {/* Interactive Clickable Performance & Conversion Analytics Section */}
      {(isCardEnabled('performance_analytics') || isCardEnabled('call_metrics')) && (
        <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-theme-primary to-indigo-600 flex items-center justify-center text-white shadow-md shadow-theme-primary/20">
                <BarChart2 size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-theme-text">
                  Executive Performance & Conversion Analytics
                </h3>
              </div>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-1 bg-theme-bg-alt/70 p-1 rounded-2xl border border-theme-border/70 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartTab('funnel')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  chartTab === 'funnel'
                    ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/60 font-semibold'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <TrendingUp size={13} />
                <span>Funnel & Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setChartTab('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  chartTab === 'trend'
                    ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/60 font-semibold'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <Activity size={13} />
                <span>Monthly & Work Trend</span>
              </button>

              <button
                type="button"
                onClick={() => setChartTab('quality')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  chartTab === 'quality'
                    ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/60 font-semibold'
                    : 'text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <PieChartIcon size={13} />
                <span>Quality & Sources</span>
              </button>
            </div>
          </div>

          {/* Chart Rendering Container */}
          <div className="h-80 sm:h-96 w-full pt-1">
            {chartTab === 'funnel' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-theme-text">
                    Pipeline Stages Conversion Funnel
                  </span>
                  <span className="text-[10px] text-theme-text-muted">
                    Click any bar or stage pill to view leads in My Work
                  </span>
                </div>
                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { stage: 'New', label: 'New Leads', count: getStageCount('New'), color: '#3b82f6', targetUrl: '/my-work?stage=New' },
                        { stage: 'Interaction', label: 'Interaction', count: getStageCount('Interaction'), color: '#a855f7', targetUrl: '/my-work?stage=Interaction' },
                        { stage: 'Proposal Sent', label: 'Proposal Sent', count: getStageCount('Proposal Sent'), color: '#06b6d4', targetUrl: '/my-work?stage=Proposal%20Sent' },
                        { stage: 'Negotiation', label: 'Negotiation', count: getStageCount('Negotiation'), color: '#f59e0b', targetUrl: '/my-work?stage=Negotiation' },
                        { stage: 'Converted', label: 'Closed Won', count: getStageCount('Converted'), color: '#10b981', targetUrl: '/my-work?stage=Converted' },
                        { stage: 'Lost', label: 'Closed Lost', count: getStageCount('Lost'), color: '#f43f5e', targetUrl: '/my-work?stage=Lost' }
                      ]}
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                      onClick={(state: any) => {
                        if (state && state.activePayload && state.activePayload[0]) {
                          const item = state.activePayload[0].payload;
                          if (item?.targetUrl) navigate(item.targetUrl);
                        }
                      }}
                    >
                      <XAxis 
                        dataKey="label" 
                        stroke="var(--color-theme-text-muted, #94a3b8)" 
                        fontSize={11} 
                        fontWeight={600}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="var(--color-theme-text-muted, #94a3b8)" 
                        fontSize={11} 
                        allowDecimals={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 12 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 rounded-2xl bg-theme-card/95 border border-theme-border shadow-xl backdrop-blur-md space-y-1 text-xs">
                                <div className="font-semibold text-theme-text flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                  <span>{data.label}</span>
                                </div>
                                <div className="text-sm font-bold text-theme-primary">{data.count} Leads</div>
                                <div className="text-[10px] text-emerald-500 font-medium">👉 Click to view leads in this stage</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} className="cursor-pointer">
                        <LabelList dataKey="count" position="top" fill="var(--color-theme-text, #475569)" fontSize={12} fontWeight={700} />
                        {[
                          { color: '#3b82f6' },
                          { color: '#a855f7' },
                          { color: '#06b6d4' },
                          { color: '#f59e0b' },
                          { color: '#10b981' },
                          { color: '#f43f5e' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Stage Filter Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 border-t border-theme-border/40">
                  {[
                    { label: 'New Leads', count: getStageCount('New'), dot: 'bg-blue-500', targetStage: 'New' },
                    { label: 'Interaction', count: getStageCount('Interaction'), dot: 'bg-purple-500', targetStage: 'Interaction' },
                    { label: 'Proposal Sent', count: getStageCount('Proposal Sent'), dot: 'bg-cyan-500', targetStage: 'Proposal Sent' },
                    { label: 'Negotiation', count: getStageCount('Negotiation'), dot: 'bg-amber-500', targetStage: 'Negotiation' },
                    { label: 'Converted', count: getStageCount('Converted'), dot: 'bg-emerald-500', targetStage: 'Converted' },
                    { label: 'Closed Lost', count: getStageCount('Lost'), dot: 'bg-rose-500', targetStage: 'Lost' }
                  ].map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigate(`/my-work?stage=${encodeURIComponent(item.targetStage)}&period=${timeFilter.period}${timeFilter.startDate ? `&startDate=${timeFilter.startDate}` : ''}${timeFilter.endDate ? `&endDate=${timeFilter.endDate}` : ''}`)}
                      className="p-2.5 rounded-xl bg-theme-bg-alt/50 border border-theme-border/50 hover:border-theme-primary/40 hover:bg-theme-bg-alt transition-all flex items-center justify-between text-left group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`} />
                        <span className="text-[11px] font-semibold text-theme-text-muted group-hover:text-theme-text truncate">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-theme-text font-mono pl-1">
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chartTab === 'trend' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <span className="text-xs font-semibold text-theme-text block">
                      Monthly Lead Work & Conversion Trajectory
                    </span>
                    <span className="text-[10px] text-theme-text-muted font-medium">
                      Month-wise leads worked, conversions won & activity volume
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-indigo-500">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> Leads Worked
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Deals Won
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getMonthlyData()}
                      margin={{ top: 12, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="shortMonth" stroke="var(--color-theme-text-muted, #94a3b8)" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="var(--color-theme-text-muted, #94a3b8)" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            const rate = d.leads > 0 ? Math.round((d.converted / d.leads) * 100) : 0;
                            return (
                              <div className="p-3 rounded-2xl bg-theme-card/95 border border-theme-border shadow-xl backdrop-blur-md space-y-2 text-xs min-w-44">
                                <div className="font-bold text-theme-text border-b border-theme-border/40 pb-1 flex items-center justify-between">
                                  <span>{d.fullMonth || d.month}</span>
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                    {rate}% Won
                                  </span>
                                </div>
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex items-center justify-between gap-3 text-indigo-500 font-bold">
                                    <span>Leads Worked:</span>
                                    <span>{d.leads}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 text-emerald-500 font-bold">
                                    <span>Deals Won:</span>
                                    <span>{d.converted}</span>
                                  </div>
                                  {d.revenue > 0 && (
                                    <div className="flex items-center justify-between gap-3 text-theme-text font-bold pt-1 border-t border-theme-border/30">
                                      <span>Won Value:</span>
                                      <span className="text-emerald-500">{formatCurrency(d.revenue)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="leads" name="Leads Worked" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="converted" name="Deals Won" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Summary Quick Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-theme-border/40">
                  {getMonthlyData().map((mItem: any, idx: number) => {
                    const winRate = mItem.leads > 0 ? Math.round((mItem.converted / mItem.leads) * 100) : 0;
                    return (
                      <div key={idx} className="p-2 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 text-center space-y-0.5">
                        <span className="text-[10px] font-bold text-theme-text-muted block uppercase">{mItem.shortMonth}</span>
                        <div className="text-xs font-black text-theme-text">{mItem.leads} <span className="text-[9px] font-normal text-theme-text-muted">leads</span></div>
                        <span className="text-[9px] font-bold text-emerald-500 block">{mItem.converted} won ({winRate}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {chartTab === 'quality' && (
              <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-full min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'HOT Leads', value: Math.max(myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'HOT').length, 1), color: '#ef4444' },
                          { name: 'WARM Leads', value: Math.max(myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'WARM' || !l.qualityTier).length, 2), color: '#f59e0b' },
                          { name: 'COLD Leads', value: Math.max(myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'COLD').length, 1), color: '#3b82f6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        onClick={() => navigate('/my-work')}
                        className="cursor-pointer"
                      >
                        {[
                          { color: '#ef4444' },
                          { color: '#f59e0b' },
                          { color: '#3b82f6' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 rounded-xl bg-theme-card border border-theme-border shadow-lg text-xs font-bold">
                                <span style={{ color: data.color }}>{data.name}</span>: {data.value} Leads
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  <div 
                    onClick={() => navigate('/my-work')}
                    className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-pointer hover:bg-rose-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="font-semibold text-rose-500">HOT Priority Leads</span>
                    </div>
                    <span className="font-mono font-bold text-rose-500">
                      {myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'HOT').length} Leads
                    </span>
                  </div>

                  <div 
                    onClick={() => navigate('/my-work')}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-semibold text-amber-500">WARM Interested Leads</span>
                    </div>
                    <span className="font-mono font-bold text-amber-500">
                      {myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'WARM' || !l.qualityTier).length} Leads
                    </span>
                  </div>

                  <div 
                    onClick={() => navigate('/my-work')}
                    className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between cursor-pointer hover:bg-blue-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="font-semibold text-blue-500">COLD Nurturing Leads</span>
                    </div>
                    <span className="font-mono font-bold text-blue-500">
                      {myLeads.filter((l: any) => (l.qualityTier || '').toUpperCase() === 'COLD').length} Leads
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

