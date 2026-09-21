import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../../services/api';
import { followUpService, type FollowUp } from '../../services/followUpService';
import type { DashboardKpis as KpiType, User as MemberType, Campaign, Lead } from '../../types';
import { formatCurrency, formatNumber } from '../../utils';
import CallDetailsModal from '../../components/CallDetailsModal';
import { 
  TrendingUp, 
  Users, 
  Shield, 
  PhoneCall, 
  Eye, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  PieChart as PieIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserPlus,
  Calendar,
  Upload,
  Layers,
  PhoneForwarded,
  ArrowUpRight,
  XCircle
} from 'lucide-react';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';
import HoosshBeeLoader from '../../components/HoosshBeeLoader';

const defaultKpis: KpiType = {
  totalLeads: 0,
  totalClicks: 0,
  totalImpressions: 0,
  totalConversions: 0,
  totalSpend: 0,
  totalRevenue: 0,
  conversionRate: 0,
  roas: 0,
  ctr: 0,
  cpc: 0,
  recentLeads: [],
  platformLeadsShare: [],
  platformRevenueShare: [],
  trends: [],
  funnel: {},
  teamActivities: [],
  workspaceStats: []
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<KpiType>(defaultKpis);
  const [teamCalls, setTeamCalls] = useState<any>(null);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Modals & Panels state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d');

  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });

  useEffect(() => {
    fetchAdminData();
  }, [timeFilter]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const params: any = { period: timeFilter.period };
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      const [dashRes, membersRes, leadsRes, followupsRes, callsRes, campaignsRes] = await Promise.allSettled([
        api.get('/api/dashboard', { params }),
        api.get('/api/users/members'),
        api.get('/api/leads', { params }),
        followUpService.getFollowups(),
        api.get('/api/calls/team', { params }),
        api.get('/api/campaigns')
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setData(dashRes.value.data);
      }
      if (membersRes.status === 'fulfilled' && membersRes.value?.data) {
        setMembers(Array.isArray(membersRes.value.data) ? membersRes.value.data : []);
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setLeads(Array.isArray(leadsRes.value.data) ? leadsRes.value.data : []);
      }
      if (followupsRes.status === 'fulfilled' && followupsRes.value) {
        setFollowups(Array.isArray(followupsRes.value) ? followupsRes.value : []);
      }
      if (callsRes.status === 'fulfilled' && callsRes.value?.data) {
        setTeamCalls(callsRes.value.data);
      }
      if (campaignsRes.status === 'fulfilled' && campaignsRes.value?.data) {
        setCampaigns(Array.isArray(campaignsRes.value.data) ? campaignsRes.value.data : []);
      }
    } catch (err) {
      console.error('Failed to load Admin Command Center data', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 1. TOP CARDS CALCULATIONS
  // ==========================================
  const totalLeadsCount = data.totalLeads || leads.length;
  const convertedCount = data.totalConversions || leads.filter(l => (l.status as string) === 'Converted' || (l.status as string) === 'Closed Won').length;
  const conversionRate = totalLeadsCount > 0 ? (convertedCount / totalLeadsCount) * 100 : 0;
  
  const totalAdSpend = data.totalSpend || campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const paidLeadsCount = leads.filter(l => l.campaignId || (l.sourcePlatform && ['meta', 'facebook', 'instagram', 'google', 'ads'].some(s => (l.sourcePlatform || (l as any).source || '').toLowerCase().includes(s)))).length;
  const costPerLead = paidLeadsCount > 0 ? (totalAdSpend / paidLeadsCount) : (totalLeadsCount > 0 ? (totalAdSpend / totalLeadsCount) : data.cpc || 0);

  // Qualified leads calculation: leads in 'Proposal Sent', 'Negotiation', or 'Qualified'
  const qualifiedLeads = useMemo(() => {
    return leads.filter(l => ['Proposal Sent', 'Negotiation', 'Qualified'].some(s => (l.status || '').toLowerCase() === s.toLowerCase()));
  }, [leads]);
  const qualifiedCount = qualifiedLeads.length;
  const qualificationRate = totalLeadsCount > 0 ? (qualifiedCount / totalLeadsCount) * 100 : 0;

  // ==========================================
  // 2. LEAD PIPELINE FUNNEL CALCULATIONS
  // ==========================================
  const pipelineStages = useMemo(() => {
    const newCount = leads.filter(l => (l.status || 'New').toLowerCase() === 'new').length;
    const contactedCount = leads.filter(l => (l.status || '').toLowerCase() === 'interaction' || (l.status || '').toLowerCase() === 'contacted').length;
    const qCount = qualifiedCount;
    const convCount = convertedCount;
    const lostCount = leads.filter(l => (l.status || '').toLowerCase() === 'lost' || (l.status || '').toLowerCase() === 'rejected').length;

    return {
      new: newCount,
      contacted: contactedCount,
      qualified: qCount,
      converted: convCount,
      lost: lostCount,
      totalActive: newCount + contactedCount + qCount + convCount
    };
  }, [leads, qualifiedCount, convertedCount]);

  // Bottleneck detection
  const bottleneck = useMemo(() => {
    const stages = [
      { name: 'New (Uncontacted)', count: pipelineStages.new, key: 'New', desc: 'Fresh leads waiting for initial outreach' },
      { name: 'Contacted (Interaction)', count: pipelineStages.contacted, key: 'Interaction', desc: 'Leads currently in discussions without proposals' },
      { name: 'Qualified (Proposals)', count: pipelineStages.qualified, key: 'Proposal Sent', desc: 'Proposals sent waiting for closing/negotiation' }
    ];
    stages.sort((a, b) => b.count - a.count);
    return stages[0]?.count > 0 ? stages[0] : null;
  }, [pipelineStages]);

  // ==========================================
  // 3. NEEDS ATTENTION CALCULATIONS
  // ==========================================
  // A. Unassigned Leads
  const unassignedLeads = useMemo(() => {
    return leads.filter(l => !l.assignedToId || !l.assignedToName);
  }, [leads]);

  // B. Not Contacted Yet (New Leads) & oldest pending
  const notContactedLeads = useMemo(() => {
    return leads.filter(l => (l.status || 'New').toLowerCase() === 'new');
  }, [leads]);

  const oldestNotContactedTime = useMemo(() => {
    if (notContactedLeads.length === 0) return null;
    const sorted = [...notContactedLeads].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const oldest = sorted[0];
    if (!oldest?.createdAt) return null;
    const diffMs = Date.now() - new Date(oldest.createdAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, [notContactedLeads]);

  // C. Overdue Follow-ups with Executive Breakdown
  const overdueFollowups = useMemo(() => {
    const now = new Date();
    return followups.filter(f => {
      if (f.status === 'COMPLETED' || f.status === 'CANCELLED') return false;
      if (f.status === 'OVERDUE' || f.isOverdue) return true;
      if (f.scheduledAt && new Date(f.scheduledAt) < now) return true;
      return false;
    });
  }, [followups]);

  const overdueByExecutive = useMemo(() => {
    const map: Record<string, number> = {};
    overdueFollowups.forEach(f => {
      const exec = f.assignedToName || 'Unassigned';
      map[exec] = (map[exec] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [overdueFollowups]);

  // D. Qualified Leads without next follow-up
  const qualifiedWithoutFollowup = useMemo(() => {
    const now = new Date();
    const leadIdsWithUpcomingFollowup = new Set(
      followups
        .filter(f => f.status !== 'COMPLETED' && f.status !== 'CANCELLED' && f.scheduledAt && new Date(f.scheduledAt) >= now)
        .map(f => f.leadId)
    );
    return qualifiedLeads.filter(l => !leadIdsWithUpcomingFollowup.has(l.id));
  }, [qualifiedLeads, followups]);

  // ==========================================
  // 4. LEAD & CONVERSION TREND DATA (7 or 30 Days)
  // ==========================================
  const trendData = useMemo(() => {
    const days = trendRange === '7d' ? 7 : 30;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - i);
      const displayDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayLeads = leads.filter(l => {
        if (!l.createdAt) return false;
        const lDate = new Date(l.createdAt);
        return lDate.toDateString() === targetDate.toDateString();
      });

      const dayConversions = dayLeads.filter(l => (l.status as string) === 'Converted' || (l.status as string) === 'Closed Won');

      result.push({
        date: displayDate,
        leads: dayLeads.length,
        conversions: dayConversions.length
      });
    }

    return result;
  }, [leads, trendRange]);

  const totalTrendLeads = trendData.reduce((acc, d) => acc + d.leads, 0);
  const totalTrendConversions = trendData.reduce((acc, d) => acc + d.conversions, 0);
  const avgLeadsPerDay = (totalTrendLeads / (trendRange === '7d' ? 7 : 30)).toFixed(1);

  // ==========================================
  // 5. CAMPAIGN / SOURCE PERFORMANCE TABLE (Top 5)
  // ==========================================
  const topCampaignsData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) {
      // Build source performance from leads if no ad campaigns exist
      const sourceMap: Record<string, { name: string; platform: string; leads: number; qualified: number; conversions: number; spend: number }> = {};
      leads.forEach(l => {
        const src = l.sourcePlatform || (l as any).source || 'Direct / Organic';
        if (!sourceMap[src]) {
          sourceMap[src] = { name: src, platform: src, leads: 0, qualified: 0, conversions: 0, spend: 0 };
        }
        sourceMap[src].leads += 1;
        if (['Proposal Sent', 'Negotiation', 'Qualified'].some(s => (l.status || '').toLowerCase() === s.toLowerCase())) {
          sourceMap[src].qualified += 1;
        }
        if ((l.status as string) === 'Converted' || (l.status as string) === 'Closed Won') {
          sourceMap[src].conversions += 1;
        }
      });
      return Object.values(sourceMap)
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5)
        .map((s, idx) => ({
          id: idx + 1,
          name: s.name,
          platform: s.platform,
          leadsCount: s.leads,
          qualifiedCount: s.qualified,
          conversions: s.conversions,
          spend: s.spend,
          cpl: s.leads > 0 ? s.spend / s.leads : 0,
          isCampaign: false
        }));
    }

    // Process real campaigns
    const sorted = [...campaigns].sort((a, b) => {
      const leadsDiff = (b.leadsCount || 0) - (a.leadsCount || 0);
      if (leadsDiff !== 0) return leadsDiff;
      return (b.spend || 0) - (a.spend || 0);
    });

    return sorted.slice(0, 5).map(c => {
      const campaignLeads = leads.filter(l => l.campaignId === c.id);
      const qCount = campaignLeads.filter(l => ['Proposal Sent', 'Negotiation', 'Qualified'].some(s => (l.status || '').toLowerCase() === s.toLowerCase())).length;
      const convCount = c.conversions || campaignLeads.filter(l => (l.status as string) === 'Converted' || (l.status as string) === 'Closed Won').length;
      const lCount = c.leadsCount || campaignLeads.length;
      const spend = c.spend || 0;
      const cpl = lCount > 0 ? spend / lCount : spend;

      return {
        id: c.id,
        name: c.name,
        platform: c.platform || 'Meta Ads',
        leadsCount: lCount,
        qualifiedCount: qCount,
        conversions: convCount,
        spend,
        cpl,
        isCampaign: true
      };
    });
  }, [campaigns, leads]);

  // Team availability summary for the bottom bar
  const availableCount = members.filter(m => (m.availabilityStatus || 'AVAILABLE').toUpperCase() === 'AVAILABLE').length;
  const busyCount = members.filter(m => (m.availabilityStatus || '').toUpperCase() === 'BUSY').length;
  const breakCount = members.filter(m => (m.availabilityStatus || '').toUpperCase() === 'ON_BREAK').length;
  const offlineCount = members.filter(m => {
    const s = (m.availabilityStatus || '').toUpperCase();
    return s === 'OFFLINE' || s === 'ON_LEAVE' || s === 'SUSPENDED';
  }).length;

  if (loading) {
    return (
      <HoosshBeeLoader 
        text="Loading Admin Command Center..." 
        subtext="Syncing executive KPIs, lead pipeline, marketing performance and priority actions" 
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. HEADER WITH TIME FILTER & QUICK ACTIONS                                 */}
      {/* ========================================================================= */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary shadow-xs">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-theme-text">Business Overview</h1>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Live executive intelligence across lead velocity, marketing ROI, and operational bottlenecks.
            </p>
          </div>
        </div>

        {/* Quick Actions & Date Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />

          <button
            onClick={() => navigate('/leads?action=new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus size={14} />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => navigate('/leads?action=import')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text border border-theme-border/70 text-xs font-semibold transition-all cursor-pointer"
            title="Import Leads CSV/Excel"
          >
            <Upload size={13} />
            <span>Import</span>
          </button>

          <button
            onClick={() => navigate('/leads?filter=unassigned')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text border border-theme-border/70 text-xs font-semibold transition-all cursor-pointer"
            title="Bulk Assign Unassigned Leads"
          >
            <Layers size={13} />
            <span>Assign</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 MAIN KPI CARDS                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Leads */}
        <div className="rounded-2xl border border-theme-border/70 bg-theme-card p-4 space-y-3 hover:border-theme-primary/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">Total Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-theme-text">{formatNumber(totalLeadsCount)}</h3>
            <div className="flex items-center justify-between text-xs text-theme-text-muted mt-1">
              <span>Active Pipeline</span>
              <span className="font-semibold text-theme-primary">{leads.length} in Workspace</span>
            </div>
          </div>
          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted flex items-center justify-between">
            <span>Period Volume</span>
            <span className="font-medium text-emerald-500 flex items-center gap-0.5">
              <TrendingUp size={12} /> Active Inflow
            </span>
          </div>
        </div>

        {/* Card 2: Converted Leads */}
        <div className="rounded-2xl border border-theme-border/70 bg-theme-card p-4 space-y-3 hover:border-emerald-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">Converted Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatNumber(convertedCount)}
            </h3>
            <div className="flex items-center justify-between text-xs text-theme-text-muted mt-1">
              <span>Conversion Rate</span>
              <span className="font-bold text-emerald-500">{conversionRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted flex items-center justify-between">
            <span>Deals Won</span>
            <span className="font-medium text-theme-text">Closed Successfully</span>
          </div>
        </div>

        {/* Card 3: Ad Spend & CPL */}
        <Link
          to="/campaigns"
          className="rounded-2xl border border-theme-border/70 bg-theme-card p-4 space-y-3 hover:border-theme-primary/40 transition-all shadow-xs cursor-pointer group block"
          title="Open Campaigns Analytics"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">
              Ad Spend
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary group-hover:scale-105 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-theme-text">{formatCurrency(totalAdSpend)}</h3>
            <div className="flex items-center justify-between text-xs text-theme-text-muted mt-1">
              <span>Cost Per Lead (CPL)</span>
              <span className="font-bold text-theme-text font-mono">{formatCurrency(costPerLead)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted flex items-center justify-between">
            <span>Paid Acquisition</span>
            <span className="font-medium text-theme-primary group-hover:underline flex items-center gap-0.5">
              Campaigns <ArrowRight size={11} />
            </span>
          </div>
        </Link>

        {/* Card 4: Qualified Leads / Revenue */}
        <div className="rounded-2xl border border-theme-border/70 bg-theme-card p-4 space-y-3 hover:border-amber-500/40 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">Qualified Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-amber-500">{formatNumber(qualifiedCount)}</h3>
            <div className="flex items-center justify-between text-xs text-theme-text-muted mt-1">
              <span>Qualification Rate</span>
              <span className="font-bold text-amber-500">{qualificationRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted flex items-center justify-between">
            <span>Recorded Revenue</span>
            <span className="font-bold text-emerald-500 font-mono">
              {data.totalRevenue > 0 ? formatCurrency(data.totalRevenue) : 'In Progress'}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE ROW: LEAD PIPELINE (LEFT) & NEEDS ATTENTION (RIGHT)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT (6 COLS): LEAD PIPELINE FUNNEL */}
        <div className="lg:col-span-6 rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-theme-text flex items-center gap-2">
                  <Layers size={16} className="text-theme-primary" />
                  <span>Lead Pipeline Funnel</span>
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Click any stage to instantly inspect leads and identify drop-off bottlenecks.
                </p>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                {pipelineStages.totalActive} Active Leads
              </span>
            </div>

            {/* Stages Step-by-Step Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              
              {/* Stage 1: New */}
              <button
                type="button"
                onClick={() => navigate('/leads?status=New')}
                className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-500 uppercase">
                  <span>1. New</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-black text-theme-text mt-1">{pipelineStages.new}</div>
                <div className="text-[10px] text-theme-text-muted mt-0.5">Fresh Inflow</div>
              </button>

              {/* Stage 2: Contacted */}
              <button
                type="button"
                onClick={() => navigate('/leads?status=Interaction')}
                className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-purple-500 uppercase">
                  <span>2. Contacted</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-black text-theme-text mt-1">{pipelineStages.contacted}</div>
                <div className="text-[10px] text-theme-text-muted mt-0.5">In Discussion</div>
              </button>

              {/* Stage 3: Qualified */}
              <button
                type="button"
                onClick={() => navigate('/leads?status=Proposal Sent')}
                className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-500 uppercase">
                  <span>3. Qualified</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-black text-theme-text mt-1">{pipelineStages.qualified}</div>
                <div className="text-[10px] text-theme-text-muted mt-0.5">Proposal/Neg.</div>
              </button>

              {/* Stage 4: Converted */}
              <button
                type="button"
                onClick={() => navigate('/leads?status=Converted')}
                className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-500 uppercase">
                  <span>4. Converted</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{pipelineStages.converted}</div>
                <div className="text-[10px] text-theme-text-muted mt-0.5">Won Deals</div>
              </button>

            </div>

            {/* Visual Funnel Conversion Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] text-theme-text-muted font-medium">
                <span>Stage Distribution</span>
                <span>{pipelineStages.totalActive > 0 ? '100% of Active Pool' : '0 Leads'}</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden bg-theme-bg-alt flex gap-0.5 p-0.5 border border-theme-border/60">
                {pipelineStages.totalActive > 0 ? (
                  <>
                    <div 
                      style={{ width: `${(pipelineStages.new / pipelineStages.totalActive) * 100}%` }} 
                      className="bg-blue-500 h-full rounded-l-full transition-all" 
                      title={`New: ${pipelineStages.new}`}
                    />
                    <div 
                      style={{ width: `${(pipelineStages.contacted / pipelineStages.totalActive) * 100}%` }} 
                      className="bg-purple-500 h-full transition-all" 
                      title={`Contacted: ${pipelineStages.contacted}`}
                    />
                    <div 
                      style={{ width: `${(pipelineStages.qualified / pipelineStages.totalActive) * 100}%` }} 
                      className="bg-amber-500 h-full transition-all" 
                      title={`Qualified: ${pipelineStages.qualified}`}
                    />
                    <div 
                      style={{ width: `${(pipelineStages.converted / pipelineStages.totalActive) * 100}%` }} 
                      className="bg-emerald-500 h-full rounded-r-full transition-all" 
                      title={`Converted: ${pipelineStages.converted}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-300 dark:bg-slate-700 h-full rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Summary: Rejected/Lost + Bottleneck Alert */}
          <div className="pt-3 border-t border-theme-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <button
              onClick={() => navigate('/leads?status=Lost')}
              className="flex items-center gap-2 text-rose-500 hover:underline font-semibold"
            >
              <XCircle size={14} />
              <span>{pipelineStages.lost} Lost / Rejected Leads ({leads.length > 0 ? Math.round((pipelineStages.lost / leads.length) * 100) : 0}%)</span>
            </button>

            {bottleneck && (
              <span className="text-[11px] text-amber-500 font-medium flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                <AlertTriangle size={12} />
                <span>Bottleneck: {bottleneck.count} in {bottleneck.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT (6 COLS): "NEEDS ATTENTION" (ACTIONABLE CRM HUB) */}
        <div className="lg:col-span-6 rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-theme-text flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span>Needs Immediate Attention</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                </h3>
                <p className="text-xs text-theme-text-muted">
                  High priority items requiring administrative delegation or executive follow-up.
                </p>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {unassignedLeads.length + (notContactedLeads.length > 0 ? 1 : 0) + overdueFollowups.length + qualifiedWithoutFollowup.length} Alerts
              </span>
            </div>

            {/* Actionable Alert Rows */}
            <div className="space-y-2.5 mt-3.5">
              
              {/* Alert 1: Unassigned Leads */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                unassignedLeads.length > 0 
                  ? 'bg-rose-500/[0.04] border-rose-500/30' 
                  : 'bg-theme-bg-alt/30 border-theme-border/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    unassignedLeads.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    <UserPlus size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                      <span>Unassigned Leads</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        unassignedLeads.length > 0 ? 'bg-rose-500 text-white' : 'bg-theme-bg-alt text-theme-text-muted'
                      }`}>
                        {unassignedLeads.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">
                      {unassignedLeads.length > 0 ? 'Leads waiting for sales executive delegation' : 'All leads currently delegated'}
                    </p>
                  </div>
                </div>

                {unassignedLeads.length > 0 ? (
                  <button
                    onClick={() => navigate('/leads?filter=unassigned')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    Assign Now
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Clear
                  </span>
                )}
              </div>

              {/* Alert 2: Not Contacted Yet Leads */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                notContactedLeads.length > 0 
                  ? 'bg-amber-500/[0.04] border-amber-500/30' 
                  : 'bg-theme-bg-alt/30 border-theme-border/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    notContactedLeads.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    <Clock size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                      <span>Pending First Contact</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {notContactedLeads.length} Leads
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">
                      {oldestNotContactedTime ? `Oldest pending: ${oldestNotContactedTime}` : 'All active leads contacted'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/leads?status=New')}
                  className="px-3 py-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text border border-theme-border text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  View Leads
                </button>
              </div>

              {/* Alert 3: Overdue Follow-ups */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                overdueFollowups.length > 0 
                  ? 'bg-rose-500/[0.04] border-rose-500/30' 
                  : 'bg-theme-bg-alt/30 border-theme-border/50'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    overdueFollowups.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    <PhoneForwarded size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                      <span>Overdue Follow-ups</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        overdueFollowups.length > 0 ? 'bg-rose-500 text-white' : 'bg-theme-bg-alt text-theme-text-muted'
                      }`}>
                        {overdueFollowups.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-theme-text-muted mt-0.5 truncate">
                      {overdueByExecutive.length > 0 ? (
                        <span>
                          Pending: {overdueByExecutive.slice(0, 2).map(e => `${e.name} (${e.count})`).join(', ')}
                          {overdueByExecutive.length > 2 && ` +${overdueByExecutive.length - 2} more`}
                        </span>
                      ) : (
                        'No overdue follow-up tasks'
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/followups?tab=OVERDUE')}
                  className="px-3 py-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text border border-theme-border text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  Resolve
                </button>
              </div>

              {/* Alert 4: Qualified Leads without next follow-up */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                qualifiedWithoutFollowup.length > 0 
                  ? 'bg-purple-500/[0.04] border-purple-500/30' 
                  : 'bg-theme-bg-alt/30 border-theme-border/50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    qualifiedWithoutFollowup.length > 0 ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    <Calendar size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                      <span>Qualified Without Next Step</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {qualifiedWithoutFollowup.length} Leads
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-0.5">
                      {qualifiedWithoutFollowup.length > 0 ? 'High drop-off risk — schedule next touchpoint' : 'All qualified leads scheduled'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/followups')}
                  className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  Schedule
                </button>
              </div>

            </div>
          </div>

          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted text-right">
            <span>Updates automatically in real-time</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ROW: LEAD TREND (LEFT) & CAMPAIGN PERFORMANCE TABLE (RIGHT)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT (6 COLS): LEAD & CONVERSION TREND CHART */}
        <div className="lg:col-span-6 rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/40 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-theme-text flex items-center gap-2">
                  <TrendingUp size={16} className="text-theme-primary" />
                  <span>Lead Inflow & Conversion Trend</span>
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Daily comparison of new lead acquisition vs closed won conversions.
                </p>
              </div>

              {/* 7d vs 30d Toggle */}
              <div className="flex items-center gap-1 bg-theme-bg-alt p-1 rounded-xl border border-theme-border/60">
                <button
                  type="button"
                  onClick={() => setTrendRange('7d')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendRange === '7d'
                      ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/60'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setTrendRange('30d')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    trendRange === '30d'
                      ? 'bg-theme-card text-theme-primary shadow-xs border border-theme-border/60'
                      : 'text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5 my-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40">
                <span className="text-[10px] uppercase font-bold text-theme-text-muted block">Period Inflow</span>
                <span className="text-base font-black text-theme-text mt-0.5 block">{totalTrendLeads} Leads</span>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40">
                <span className="text-[10px] uppercase font-bold text-theme-text-muted block">Avg / Day</span>
                <span className="text-base font-black text-theme-primary mt-0.5 block">{avgLeadsPerDay}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40">
                <span className="text-[10px] uppercase font-bold text-theme-text-muted block">Conversions</span>
                <span className="text-base font-black text-emerald-500 mt-0.5 block">{totalTrendConversions} Won</span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-theme-border, #e2e8f0)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'var(--color-theme-text-muted, #94a3b8)' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 10, fill: 'var(--color-theme-text-muted, #94a3b8)' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-theme-card, #ffffff)', 
                      borderColor: 'var(--color-theme-border, #e2e8f0)',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    name="New Leads" 
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#leadGrad)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conversions" 
                    name="Deals Won" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#convGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-theme-border/40 text-[11px] text-theme-text-muted flex justify-between items-center">
            <span>Velocity: {avgLeadsPerDay} leads/day</span>
            <Link to="/analytics" className="text-theme-primary font-semibold hover:underline flex items-center gap-1">
              Full Analytics <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* RIGHT (6 COLS): CAMPAIGN & SOURCE PERFORMANCE TABLE (MAX 5 ROWS) */}
        <div className="lg:col-span-6 rounded-2xl border border-theme-border/70 bg-theme-card p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-theme-text flex items-center gap-2">
                  <PieIcon size={16} className="text-theme-primary" />
                  <span>Campaign & Source Performance</span>
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Top acquisition channels ranked by lead count, qualification rate, and spend efficiency.
                </p>
              </div>

              <Link
                to="/campaigns"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary text-xs font-semibold transition-colors"
              >
                <span>View All ({campaigns.length})</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Compact Table */}
            <div className="overflow-x-auto mt-3.5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-theme-border/60 text-[10px] uppercase text-theme-text-muted font-bold">
                    <th className="py-2 px-2.5">Campaign / Source</th>
                    <th className="py-2 px-2.5 text-center">Leads</th>
                    <th className="py-2 px-2.5 text-center">Qualified</th>
                    <th className="py-2 px-2.5 text-center">Won</th>
                    <th className="py-2 px-2.5 text-right">Spend</th>
                    <th className="py-2 px-2.5 text-right">CPL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {topCampaignsData.length > 0 ? (
                    topCampaignsData.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => c.isCampaign && navigate(`/campaigns?id=${c.id}&search=${encodeURIComponent(c.name)}`)}
                        className={`transition-colors ${c.isCampaign ? 'hover:bg-theme-bg-alt/50 cursor-pointer' : ''}`}
                      >
                        <td className="py-2.5 px-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-theme-primary/10 text-theme-primary shrink-0">
                              <Globe size={12} />
                            </span>
                            <div className="min-w-0 max-w-[130px] sm:max-w-[160px]">
                              <span className="font-bold text-theme-text block truncate" title={c.name}>
                                {c.name}
                              </span>
                              <span className="text-[10px] text-theme-text-muted block truncate">
                                {c.platform}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2.5 text-center font-bold text-theme-text font-mono">
                          {c.leadsCount}
                        </td>

                        <td className="py-2.5 px-2.5 text-center font-semibold text-amber-500 font-mono">
                          {c.qualifiedCount}
                        </td>

                        <td className="py-2.5 px-2.5 text-center font-bold text-emerald-500 font-mono">
                          {c.conversions}
                        </td>

                        <td className="py-2.5 px-2.5 text-right font-mono text-theme-text">
                          {formatCurrency(c.spend)}
                        </td>

                        <td className="py-2.5 px-2.5 text-right font-mono font-bold text-theme-primary">
                          {formatCurrency(c.cpl)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-theme-text-muted">
                        No active campaigns or lead source records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-theme-border/40 flex items-center justify-between text-[11px] text-theme-text-muted">
            <span>Showing top {topCampaignsData.length} channels</span>
            <Link to="/campaigns" className="text-theme-primary font-semibold hover:underline">
              Manage Ad Campaigns &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. WORK MONITOR & CALL ACTIVITY BAR (COMPACT FOOTER HUB)                   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl border border-theme-border/70 bg-theme-card shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-theme-text">Team Presence & Work Monitor</h4>
              <p className="text-[11px] text-theme-text-muted">
                {availableCount} Available • {busyCount} Busy • {breakCount} Break • {offlineCount} Offline
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-theme-border/60 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs">
            <PhoneCall size={14} className="text-emerald-500" />
            <span className="text-theme-text-muted">Today's Call Time:</span>
            <span className="font-mono font-bold text-theme-text">
              {teamCalls?.totalTeamCallTimeFormatted || '00:00:00'}
            </span>
            <span className="text-[10px] text-theme-text-muted">({teamCalls?.totalTeamCallsToday || 0} calls)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCallModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text border border-theme-border text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye size={13} />
            <span>Call Logs</span>
          </button>

          <Link
            to="/admin/work-monitor"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border border-theme-primary/20 text-xs font-bold transition-all"
          >
            <span>Open Work Monitor</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Call Details Modal for Admin */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title="Workspace Call Activity & Contact Details"
        period={timeFilter.period}
        startDate={timeFilter.startDate}
        endDate={timeFilter.endDate}
      />

    </div>
  );
}
