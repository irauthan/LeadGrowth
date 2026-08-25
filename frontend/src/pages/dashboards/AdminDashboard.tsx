import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import type { DashboardKpis as KpiType, User as MemberType, Lead, Campaign } from '../../types';
import { formatCurrency, formatNumber } from '../../utils';
import CallDetailsModal from '../../components/CallDetailsModal';
import WorkDetailsPanel from '../../components/WorkDetailsPanel';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Shield, 
  Clock, 
  ExternalLink,
  RefreshCw, 
  Zap, 
  PhoneCall, 
  Eye, 
  ChevronRight, 
  UserCheck, 
  UserX, 
  Coffee, 
  Activity, 
  Sparkles, 
  ArrowRight,
  Globe,
  PlusCircle,
  Layers,
  PieChart as PieIcon
} from 'lucide-react';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';

const defaultKpis: KpiType = {
  totalRevenue: 0,
  totalSpend: 0,
  roas: 0,
  cpc: 0,
  ctr: 0,
  totalLeads: 0,
  totalConversions: 0,
  conversionRate: 0,
  trends: [],
  funnel: {}
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<KpiType>(defaultKpis);
  const [teamCalls, setTeamCalls] = useState<any>(null);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignFilter, setCampaignFilter] = useState<'ALL' | 'PROFIT' | 'BLEEDING' | 'ACTIVE'>('ALL');
  
  // Modals state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isLeadPanelOpen, setIsLeadPanelOpen] = useState(false);
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'OFFLINE' | 'CAPACITY' | null>(null);

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

      const [dashRes, membersRes, leadsRes, callsRes, campaignsRes] = await Promise.allSettled([
        api.get('/api/dashboard', { params }),
        api.get('/api/users/members'),
        api.get('/api/leads'),
        api.get('/api/calls/team'),
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

  const handleOpenLead = (leadId: number) => {
    setSelectedLeadId(leadId);
    setIsLeadPanelOpen(true);
  };

  if (loading && !data.totalRevenue && !data.totalLeads && members.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Business Command Center...</span>
      </div>
    );
  }

  const netProfit = (data.totalRevenue || 0) - (data.totalSpend || 0);

  // Calculate Team Availability Counts
  const availableCount = members.filter(m => (m.availabilityStatus || 'AVAILABLE').toUpperCase() === 'AVAILABLE').length;
  const busyCount = members.filter(m => (m.availabilityStatus || '').toUpperCase() === 'BUSY').length;
  const breakCount = members.filter(m => (m.availabilityStatus || '').toUpperCase() === 'ON_BREAK').length;
  const offlineCount = members.filter(m => {
    const s = (m.availabilityStatus || '').toUpperCase();
    return s === 'OFFLINE' || s === 'ON_LEAVE' || s === 'SUSPENDED';
  }).length;

  const DEFAULT_MAX_CAPACITY = 20;
  const totalCapacity = Math.max(members.length * DEFAULT_MAX_CAPACITY, 1);
  const totalAssignedLeads = leads.filter(l => l.assignedToId != null).length;
  const overallCapacityPercent = Math.min(Math.round((totalAssignedLeads / totalCapacity) * 100), 100);

  const filteredMembers = members.filter(m => {
    if (!selectedAvailabilityFilter) return false;
    if (selectedAvailabilityFilter === 'CAPACITY') return true;
    const status = (m.availabilityStatus || 'AVAILABLE').toUpperCase();
    if (selectedAvailabilityFilter === 'AVAILABLE') return status === 'AVAILABLE';
    if (selectedAvailabilityFilter === 'BUSY') return status === 'BUSY';
    if (selectedAvailabilityFilter === 'ON_BREAK') return status === 'ON_BREAK';
    if (selectedAvailabilityFilter === 'OFFLINE') return status === 'OFFLINE' || status === 'ON_LEAVE' || status === 'SUSPENDED';
    return true;
  }).sort((a, b) => {
    if (selectedAvailabilityFilter === 'CAPACITY') {
      const aLeads = leads.filter(l => l.assignedToId === a.id).length;
      const bLeads = leads.filter(l => l.assignedToId === b.id).length;
      return bLeads - aLeads; // highest capacity workload first
    }
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const getAvailabilityBadge = (status?: string) => {
    const s = (status || 'AVAILABLE').toUpperCase();
    switch (s) {
      case 'AVAILABLE':
        return {
          label: 'Available',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          icon: UserCheck
        };
      case 'BUSY':
        return {
          label: 'In Call / Busy',
          dot: 'bg-amber-500',
          badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          icon: PhoneCall
        };
      case 'ON_BREAK':
        return {
          label: 'On Break',
          dot: 'bg-purple-500',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Coffee
        };
      default:
        return {
          label: 'Offline',
          dot: 'bg-slate-400',
          badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: UserX
        };
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Command Center Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl relative">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-text">Business Command Center</h1>
            <p className="text-xs text-theme-text-muted mt-1">High-level financial KPIs, ad spend efficiency, team output, and live marketing ROI.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
        </div>
      </div>

      {/* Top Financial & Growth KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Total Revenue</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <IndianRupee size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{formatCurrency(data.totalRevenue)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>Net Profit</span>
            <span className="font-bold text-emerald-500">{formatCurrency(netProfit)}</span>
          </div>
        </div>

        {/* Total Ad Spend */}
        <Link
          to="/campaigns"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-rose-500/40 hover:shadow-lg transition-all cursor-pointer group block"
          title="Open Campaigns Analytics"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-rose-500 transition-colors">Total Ad Spend</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{formatCurrency(data.totalSpend)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>CPC</span>
            <span className="font-bold text-theme-text">{formatCurrency(data.cpc)}</span>
          </div>
        </Link>

        {/* Blended ROAS */}
        <Link
          to="/campaigns"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-cyan-500/40 hover:shadow-lg transition-all cursor-pointer group block"
          title="Open Campaigns Analytics"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-cyan-500 transition-colors">Blended ROAS</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{data.roas}x</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>CTR</span>
            <span className="font-bold text-cyan-500">{data.ctr}%</span>
          </div>
        </Link>

        {/* Total Leads & Conversions */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-theme-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Total Leads Captured</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{formatNumber(data.totalLeads)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>Conversions</span>
            <span className="font-bold text-emerald-500">{formatNumber(data.totalConversions)}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TEAM AVAILABILITY & LEAD CAPACITY HUB (INTERACTIVE CARDS)      */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-5">
        
        {/* Header & Quick Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/40 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
              <Users size={17} className="text-theme-primary" />
              <span>Team Availability & Lead Capacity</span>
            </h3>
            <p className="text-xs text-theme-text-muted">Real-time executive presence, live availability statuses, and lead capacity distribution.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/work-monitor"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-theme-bg-alt hover:bg-theme-card text-xs font-bold text-theme-text border border-theme-border/80 transition-all shadow-sm"
            >
              <Activity size={14} className="text-theme-primary" />
              <span>Work Monitor</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-theme-primary/10 hover:bg-theme-primary/20 text-xs font-bold text-theme-primary border border-theme-primary/30 transition-all"
            >
              <span>Manage Roster</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Top Workforce Status Interactive Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Card 1: Available Now */}
          <button
            type="button"
            onClick={() => setSelectedAvailabilityFilter(selectedAvailabilityFilter === 'AVAILABLE' ? null : 'AVAILABLE')}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border shadow-2xs flex items-center justify-between group ${
              selectedAvailabilityFilter === 'AVAILABLE'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40'
                : 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] border-emerald-500/20 hover:border-emerald-500/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Available Now</span>
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{availableCount}</span>
              <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold block mt-0.5">Ready for Leads</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 flex items-center justify-center transition-all">
              <UserCheck size={18} />
            </div>
          </button>

          {/* Card 2: Busy / In Call */}
          <button
            type="button"
            onClick={() => setSelectedAvailabilityFilter(selectedAvailabilityFilter === 'BUSY' ? null : 'BUSY')}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border shadow-2xs flex items-center justify-between group ${
              selectedAvailabilityFilter === 'BUSY'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40'
                : 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border-amber-500/20 hover:border-amber-500/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">In Call / Busy</span>
              </div>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{busyCount}</span>
              <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-semibold block mt-0.5">Active on Leads</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-105 flex items-center justify-center transition-all">
              <PhoneCall size={18} />
            </div>
          </button>

          {/* Card 3: On Break */}
          <button
            type="button"
            onClick={() => setSelectedAvailabilityFilter(selectedAvailabilityFilter === 'ON_BREAK' ? null : 'ON_BREAK')}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border shadow-2xs flex items-center justify-between group ${
              selectedAvailabilityFilter === 'ON_BREAK'
                ? 'bg-purple-500/15 border-purple-500 ring-2 ring-purple-500/40'
                : 'bg-purple-500/[0.04] hover:bg-purple-500/[0.08] border-purple-500/20 hover:border-purple-500/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">On Break</span>
              </div>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{breakCount}</span>
              <span className="text-[9px] text-purple-600/70 dark:text-purple-400/70 font-semibold block mt-0.5">Short Pause</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 group-hover:scale-105 flex items-center justify-center transition-all">
              <Coffee size={18} />
            </div>
          </button>

          {/* Card 4: Offline / Leave */}
          <button
            type="button"
            onClick={() => setSelectedAvailabilityFilter(selectedAvailabilityFilter === 'OFFLINE' ? null : 'OFFLINE')}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border shadow-2xs flex items-center justify-between group ${
              selectedAvailabilityFilter === 'OFFLINE'
                ? 'bg-slate-500/15 border-slate-400 ring-2 ring-slate-400/40'
                : 'bg-slate-500/[0.04] hover:bg-slate-500/[0.08] border-slate-500/20 hover:border-slate-500/40'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">Offline / Leave</span>
              </div>
              <span className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1 block">{offlineCount}</span>
              <span className="text-[9px] text-slate-500/70 dark:text-slate-400/70 font-semibold block mt-0.5">Unavailable</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400 group-hover:scale-105 flex items-center justify-center transition-all">
              <UserX size={18} />
            </div>
          </button>

          {/* Card 5: Lead Capacity Load */}
          <button
            type="button"
            onClick={() => setSelectedAvailabilityFilter(selectedAvailabilityFilter === 'CAPACITY' ? null : 'CAPACITY')}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer border shadow-2xs col-span-2 lg:col-span-1 flex flex-col justify-between group ${
              selectedAvailabilityFilter === 'CAPACITY'
                ? 'bg-theme-primary/15 border-theme-primary ring-2 ring-theme-primary/40'
                : 'bg-theme-primary/[0.04] hover:bg-theme-primary/[0.08] border-theme-primary/20 hover:border-theme-primary/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase text-theme-primary block">Lead Capacity</span>
              <span className="text-xs font-black text-theme-primary font-mono">{overallCapacityPercent}%</span>
            </div>
            <div className="w-full bg-theme-bg-alt rounded-full h-1.5 my-2 overflow-hidden border border-theme-border/40">
              <div
                className={`h-full rounded-full transition-all ${
                  overallCapacityPercent > 85 ? 'bg-rose-500' : overallCapacityPercent > 65 ? 'bg-amber-500' : 'bg-theme-primary'
                }`}
                style={{ width: `${overallCapacityPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-theme-text-muted font-bold block text-right">
              {totalAssignedLeads} of {totalCapacity} Max Assigned
            </span>
          </button>

        </div>

        {/* Interactive Filter Detail Drawer / Table */}
        {selectedAvailabilityFilter && (
          <div className="mt-4 p-5 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/60 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-theme-primary" />
                  {selectedAvailabilityFilter === 'CAPACITY'
                    ? 'Team Workload & Capacity Distribution'
                    : `Showing ${filteredMembers.length} ${
                        selectedAvailabilityFilter === 'AVAILABLE'
                          ? 'Available Executives'
                          : selectedAvailabilityFilter === 'BUSY'
                          ? 'Executives In Call / Busy'
                          : selectedAvailabilityFilter === 'ON_BREAK'
                          ? 'Executives On Break'
                          : 'Offline / On Leave Members'
                      }`}
                </span>
                <span className="text-[10px] font-bold text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2 py-0.5 rounded-full">
                  {filteredMembers.length} Members
                </span>
              </div>

              <button
                onClick={() => setSelectedAvailabilityFilter(null)}
                className="text-xs font-bold text-theme-text-muted hover:text-theme-text px-2.5 py-1 rounded-xl bg-theme-card border border-theme-border hover:bg-theme-border/40 transition-colors"
              >
                Close Table ×
              </button>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-theme-border/50 text-[10px] uppercase text-theme-text-muted font-bold">
                      <th className="py-2.5 px-3">Sales Executive</th>
                      <th className="py-2.5 px-3">Designation / Role</th>
                      <th className="py-2.5 px-3">Availability</th>
                      <th className="py-2.5 px-3">Assigned Leads</th>
                      <th className="py-2.5 px-3">Capacity</th>
                      <th className="py-2.5 px-3">Assignment Eligibility</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {filteredMembers.map((member) => {
                      const memberLeadsCount = leads.filter(l => l.assignedToId === member.id).length;
                      const maxCap = DEFAULT_MAX_CAPACITY;
                      const capPercent = Math.min(Math.round((memberLeadsCount / maxCap) * 100), 100);
                      const availBadge = getAvailabilityBadge(member.availabilityStatus);
                      const AvailIcon = availBadge.icon;

                      return (
                        <tr key={member.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center justify-center font-extrabold text-xs shrink-0">
                                {member.fullName ? member.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-theme-text block truncate">{member.fullName}</span>
                                <span className="text-[10px] text-theme-text-muted truncate block">{member.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-theme-text font-medium">
                            {member.designation || (member.roles && member.roles.length > 0 ? (typeof member.roles[0] === 'string' ? member.roles[0] : member.roles[0]?.name) : 'Sales Executive')}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${availBadge.badge}`}>
                              <AvailIcon size={11} />
                              <span>{availBadge.label}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-theme-text">
                            {memberLeadsCount} / {maxCap}
                          </td>

                          <td className="py-3 px-3 min-w-[130px]">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="font-bold text-theme-text">{capPercent}%</span>
                                <span className={capPercent >= 85 ? 'text-rose-500 font-bold' : capPercent >= 60 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                                  {capPercent >= 85 ? 'Full' : capPercent >= 60 ? 'Moderate' : 'Available'}
                                </span>
                              </div>
                              <div className="w-full bg-theme-card rounded-full h-1.5 overflow-hidden border border-theme-border/40">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    capPercent >= 85 ? 'bg-rose-500' : capPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${capPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {member.availabilityStatus?.toUpperCase() === 'AVAILABLE' && capPercent < 85 ? (
                              <span className="font-bold text-emerald-500 text-[11px] flex items-center gap-1">
                                <Sparkles size={11} /> Ready
                              </span>
                            ) : capPercent >= 85 ? (
                              <span className="font-bold text-rose-500 text-[11px]">At Limit</span>
                            ) : (
                              <span className="font-bold text-amber-500 text-[11px]">Standby</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <Link
                              to={`/admin/work-monitor?userId=${member.id}`}
                              className="px-2.5 py-1 rounded-xl bg-theme-card hover:bg-theme-bg-alt text-theme-primary font-bold text-[11px] border border-theme-border inline-block transition-colors"
                            >
                              Logs
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-theme-text-muted space-y-1">
                <UserCheck size={28} className="mx-auto text-theme-text-muted/40 mb-2" />
                <p className="font-bold text-theme-text">No team members match this status.</p>
                <p className="text-[11px]">All workspace users are currently active under other statuses.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Workspace Call Duration Audit & Effort Analytics Banner */}
      <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <PhoneCall size={22} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
              Workspace Call Activity & Effort Audit Logs
            </h3>
            <p className="text-xs text-theme-text-muted">
              Total Team Call Time Today: <span className="font-mono font-bold text-rose-500">{teamCalls?.totalTeamCallTimeFormatted || '00:00:00'}</span> ({teamCalls?.totalTeamCallsToday || 0} completed sessions)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCallModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Eye size={14} /> View Call Logs
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: CAMPAIGN PROFITABILITY & BLEED RADAR                           */}
      {/* ========================================================================= */}
      {(() => {
        const profitCampaigns = campaigns.filter(c => ((c.revenue || 0) - (c.spend || 0)) > 0);
        const bleedingCampaigns = campaigns.filter(c => (c.spend || 0) > (c.revenue || 0) && (c.spend || 0) > 0);
        const totalProfitGenerated = profitCampaigns.reduce((acc, c) => acc + ((c.revenue || 0) - (c.spend || 0)), 0);
        const totalBleedLoss = bleedingCampaigns.reduce((acc, c) => acc + ((c.spend || 0) - (c.revenue || 0)), 0);

        const displayedCampaigns = campaigns.filter(c => {
          if (campaignFilter === 'PROFIT') return ((c.revenue || 0) - (c.spend || 0)) > 0;
          if (campaignFilter === 'BLEEDING') return (c.spend || 0) > (c.revenue || 0) && (c.spend || 0) > 0;
          if (campaignFilter === 'ACTIVE') return (c.status || '').toUpperCase() === 'ACTIVE';
          return true;
        }).sort((a, b) => {
          if (campaignFilter === 'PROFIT') {
            const pA = (a.revenue || 0) - (a.spend || 0);
            const pB = (b.revenue || 0) - (b.spend || 0);
            return pB - pA;
          }
          if (campaignFilter === 'BLEEDING') {
            const lA = (a.spend || 0) - (a.revenue || 0);
            const lB = (b.spend || 0) - (b.revenue || 0);
            return lB - lA;
          }
          return (b.revenue || 0) - (a.revenue || 0);
        });

        return (
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-5">
            
            {/* Top Header & ROI Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-theme-border/40 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                  <PieIcon size={17} className="text-theme-primary" />
                  <span>Campaign Profitability & Loss Radar</span>
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Instant financial attribution: Identify which ad campaigns are generating net profit vs budget-bleeding channels.
                </p>
              </div>

              {/* Quick ROI Filter Badges & Direct Hub Action */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setCampaignFilter('ALL')}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border ${
                    campaignFilter === 'ALL'
                      ? 'bg-theme-text text-theme-bg border-theme-text shadow-sm'
                      : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text border-theme-border'
                  }`}
                >
                  All ({campaigns.length})
                </button>

                <button
                  onClick={() => setCampaignFilter(campaignFilter === 'PROFIT' ? 'ALL' : 'PROFIT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border ${
                    campaignFilter === 'PROFIT'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>Profit Winners</span>
                  <span className="font-mono font-black text-[11px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20">
                    {profitCampaigns.length}
                  </span>
                </button>

                <button
                  onClick={() => setCampaignFilter(campaignFilter === 'BLEEDING' ? 'ALL' : 'BLEEDING')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border ${
                    campaignFilter === 'BLEEDING'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                  }`}
                >
                  <TrendingDown size={13} />
                  <span>Bleeding Budget</span>
                  <span className="font-mono font-black text-[11px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20">
                    {bleedingCampaigns.length}
                  </span>
                </button>

                <Link
                  to="/campaigns"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary border border-theme-primary/30 text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Campaign Manager</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Campaign Cards Intelligence Grid */}
            {displayedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedCampaigns.slice(0, 8).map((c) => {
                  const revenue = c.revenue || 0;
                  const spend = c.spend || 0;
                  const profit = revenue - spend;
                  const isProfitable = profit > 0;
                  const isBleeding = spend > 0 && revenue <= spend;
                  const roas = spend > 0 ? (revenue / spend) : (revenue > 0 ? 99 : 0);
                  const leadsCount = c.leadsCount || 0;
                  const cpl = leadsCount > 0 ? (spend / leadsCount) : spend;
                  const conversions = c.conversions || 0;
                  const conversionRate = leadsCount > 0 ? Math.round((conversions / leadsCount) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/campaigns?search=${encodeURIComponent(c.name)}`)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-2xs ${
                        isProfitable 
                          ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07] border-emerald-500/30 hover:border-emerald-500/60'
                          : isBleeding
                          ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.07] border-rose-500/30 hover:border-rose-500/60'
                          : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60 hover:border-theme-border'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Platform & Profit/Loss Status Pill */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-theme-card border border-theme-border text-theme-text-muted">
                            <Globe size={10} className="text-theme-primary" />
                            {c.platform || 'Meta Ads'}
                          </span>

                          {isProfitable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <TrendingUp size={11} />
                              +{roas.toFixed(1)}x ROAS
                            </span>
                          ) : isBleeding ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <TrendingDown size={11} />
                              Bleeding Spend
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-theme-text-muted bg-theme-card border border-theme-border">
                              Standby
                            </span>
                          )}
                        </div>

                        {/* Campaign Name */}
                        <div>
                          <h4 className="text-sm font-black text-theme-text group-hover:text-theme-primary transition-colors truncate">
                            {c.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-theme-text-muted">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              (c.status || '').toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            <span className="font-semibold uppercase tracking-wider">{c.status || 'ACTIVE'}</span>
                            <span>•</span>
                            <span className="font-mono">{leadsCount} Leads</span>
                          </div>
                        </div>
                      </div>

                      {/* Net Financial Stats Box */}
                      <div className="space-y-2 pt-2 border-t border-theme-border/40 text-xs">
                        
                        {/* Net ROI Profit / Loss Highlight */}
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isProfitable 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : isBleeding 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-theme-bg-alt border-theme-border text-theme-text-muted'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isProfitable ? 'Net Profit' : isBleeding ? 'Net Loss' : 'Net Margin'}
                          </span>
                          <span className="text-sm font-mono font-black">
                            {isProfitable ? `+${formatCurrency(profit)}` : formatCurrency(profit)}
                          </span>
                        </div>

                        {/* Revenue vs Spend Split */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                          <div className="rounded-lg bg-theme-card p-1.5 border border-theme-border/40">
                            <span className="text-theme-text-muted block font-semibold">Revenue</span>
                            <span className="font-mono font-bold text-emerald-500 block truncate">
                              {formatCurrency(revenue)}
                            </span>
                          </div>

                          <div className="rounded-lg bg-theme-card p-1.5 border border-theme-border/40">
                            <span className="text-theme-text-muted block font-semibold">Ad Spend</span>
                            <span className="font-mono font-bold text-rose-500 block truncate">
                              {formatCurrency(spend)}
                            </span>
                          </div>
                        </div>

                        {/* CPL & Conversions Breakdown */}
                        <div className="flex items-center justify-between text-[10px] text-theme-text-muted font-medium pt-1">
                          <span>CPL: <strong className="text-theme-text font-mono font-bold">{formatCurrency(cpl)}</strong></span>
                          <span>Won: <strong className="text-emerald-500 font-bold">{conversions} ({conversionRate}%)</strong></span>
                        </div>

                        {/* Direct Action Link */}
                        <div className="pt-1.5 border-t border-theme-border/30 flex items-center justify-between text-[10px]">
                          <span className="text-theme-text-muted font-semibold">Click to analyze</span>
                          <span className="text-theme-primary font-bold group-hover:underline flex items-center gap-0.5">
                            Inspect Campaign <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 rounded-2xl bg-theme-bg-alt/20 border border-theme-border/40">
                <Layers className="w-10 h-10 text-theme-text-muted/40 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-theme-text">No Campaigns Found in This Filter</h4>
                  <p className="text-xs text-theme-text-muted max-w-sm mx-auto mt-0.5">
                    {campaignFilter === 'BLEEDING'
                      ? 'Awesome! You currently have zero bleeding ad campaigns burning budget.'
                      : campaignFilter === 'PROFIT'
                      ? 'No profitable campaigns registered yet. Add campaign revenue and conversions in Campaign Manager.'
                      : 'Connect your Meta/Google ads or create a campaign to track automated ROI analytics.'}
                  </p>
                </div>
                <Link
                  to="/campaigns"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-theme-primary text-white text-xs font-bold shadow-md shadow-theme-primary/20 hover:bg-theme-primary/90 transition-all"
                >
                  <PlusCircle size={14} />
                  <span>Go to Campaign Manager</span>
                </Link>
              </div>
            )}

            {/* Bottom Insight Strip */}
            <div className="pt-3 border-t border-theme-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-theme-text-muted">
              <div className="flex items-center gap-4 flex-wrap text-[11px]">
                <span>Total Attributed Profit: <strong className="text-emerald-500 font-mono font-bold">+{formatCurrency(totalProfitGenerated)}</strong></span>
                <span>•</span>
                <span>Total Budget Bleed: <strong className="text-rose-500 font-mono font-bold">-{formatCurrency(totalBleedLoss)}</strong></span>
              </div>

              <Link
                to="/campaigns"
                className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1"
              >
                <span>View Full Marketing Campaign Attribution</span>
                <ArrowRight size={13} />
              </Link>
            </div>

          </div>
        );
      })()}

      {/* Call Details Modal for Admin */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title="Workspace Call Activity & Contact Details"
      />

      {/* Slide-over Work Details Panel for Lead Actions */}
      <WorkDetailsPanel
        leadId={selectedLeadId}
        isOpen={isLeadPanelOpen}
        onClose={() => setIsLeadPanelOpen(false)}
        onLeadUpdated={fetchAdminData}
      />

    </div>
  );
}
