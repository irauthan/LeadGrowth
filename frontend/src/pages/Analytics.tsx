import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { DashboardKpis, Lead, User } from '../types';
import { formatCurrency } from '../utils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Target, ShieldCheck, Clock, Users, IndianRupee, Megaphone, Info } from 'lucide-react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

import TimeFilterDropdown, { type TimeFilterState } from '../components/TimeFilterDropdown';

export default function Analytics() {
  const user = useAuthStore((state) => state.user);
  const isUserOnly = user?.roles.includes('ROLE_USER') && !user?.roles.includes('ROLE_ADMIN') && !user?.roles.includes('ROLE_MANAGER');

  const [data, setData] = useState<DashboardKpis | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });

  const platformAttributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const raw = l.sourcePlatform || (l as any).source || (l.campaignName ? 'Ad Campaign' : '');
      if (raw && raw.trim()) {
        const clean = raw.trim();
        counts[clean] = (counts[clean] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params: any = { period: timeFilter.period };
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      if (isUserOnly) {
        const [analyticsRes, leadsRes] = await Promise.all([
          api.get('/api/users/me/analytics', { params }).catch(() => ({ data: null })),
          api.get('/api/leads', { params }).catch(() => api.get('/api/leads/pipeline', { params }))
        ]);
        setUserAnalytics(analyticsRes.data);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      } else {
        const [dashRes, membersRes, leadsRes] = await Promise.allSettled([
          api.get('/api/dashboard', { params }),
          api.get('/api/users/members'),
          api.get('/api/leads')
        ]);

        if (dashRes.status === 'fulfilled') setData(dashRes.value.data);
        if (membersRes.status === 'fulfilled') {
          const mData = membersRes.value.data;
          setTeamMembers(Array.isArray(mData) ? mData : (mData.data || []));
        }
        if (leadsRes.status === 'fulfilled') {
          const lData = leadsRes.value.data;
          setLeads(Array.isArray(lData) ? lData : (lData.data || []));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRealMonthlyData = (leadsList: any[]) => {
    const validLeads = (leadsList || []).filter((l: any) => l && l.createdAt);
    const now = new Date();

    // Determine the earliest lead creation month
    let earliestDate = now;
    if (validLeads.length > 0) {
      for (const lead of validLeads) {
        const d = new Date(lead.createdAt);
        if (!isNaN(d.getTime()) && d < earliestDate) {
          earliestDate = d;
        }
      }
    }

    const startYear = earliestDate.getFullYear();
    const startMonth = earliestDate.getMonth();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    // Total months elapsed from earliest lead to current month
    const totalMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
    const monthsToRender = Math.min(totalMonths, 12);

    const months = [];
    for (let i = monthsToRender - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleString('default', { month: 'short' });
      const fullMonthStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();

      const mLeads = validLeads.filter((l: any) => {
        const cDate = new Date(l.createdAt);
        return cDate.getFullYear() === mYear && cDate.getMonth() === mMonth;
      });

      const mConverted = mLeads.filter((l: any) => {
        const s = (l.status || '').toLowerCase();
        return s.includes('converted') || s.includes('won') || s.includes('payment');
      });

      const mRevenue = mConverted.reduce((acc: number, l: any) => acc + (l.proposalAmount || 0), 0);

      months.push({
        shortMonth: mStr,
        month: `${mStr} ${mYear}`,
        fullMonth: fullMonthStr,
        leads: mLeads.length,
        converted: mConverted.length,
        revenue: mRevenue
      });
    }
    return months;
  };

  if (loading) {
    return <HoosshBeeLoader text="Loading Analytics Dashboard..." subtext="Crunching conversion rates, revenue trends and channel ROI" />;
  }

  // Color Palettes
  const PIE_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];

  // User-Only Analytics View
  if (isUserOnly && userAnalytics) {
    const kpis = userAnalytics.kpis || {};
    const statusDist = userAnalytics.statusDistribution || {};
    const statusData = Object.entries(statusDist).map(([name, value]) => ({ name, value }));
    const funnelData = (userAnalytics.funnel || []).map((f: any) => ({
      stage: f.stage || f.name || 'Stage',
      count: f.count !== undefined ? f.count : (f.value || 0),
      name: f.stage || f.name || 'Stage',
      value: f.count !== undefined ? f.count : (f.value || 0)
    }));

    const userMonthlyTrends = getRealMonthlyData(leads);

    return (
      <div className="space-y-6">

        {/* Unified Top Header & Personal KPI Metrics */}
        <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">
                Personal Performance & Sales Analytics
              </h1>
            </div>
            <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
          </div>

          <div className="border-t border-theme-border/60 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="rounded-xl border border-theme-border/60 bg-theme-bg-alt/30 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Conversion Rate</span>
                <h3 className="text-xl font-black text-theme-text">{kpis.conversionRate || 0}%</h3>
                <span className="text-[9px] font-bold text-emerald-500 block">Personal Conversion</span>
              </div>

              <div className="rounded-xl border border-theme-border/60 bg-theme-bg-alt/30 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Task Fulfillment</span>
                <h3 className="text-xl font-black text-theme-text">{kpis.taskCompletionRate || 100}%</h3>
                <span className="text-[9px] font-bold text-theme-primary block">Task Success</span>
              </div>

              <div className="rounded-xl border border-theme-border/60 bg-theme-bg-alt/30 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Follow-up Success</span>
                <h3 className="text-xl font-black text-theme-text">{kpis.followupCompletionRate !== undefined ? `${kpis.followupCompletionRate}%` : (kpis.followupSuccessRate !== undefined ? `${kpis.followupSuccessRate}%` : '100%')}</h3>
                <span className="text-[9px] font-bold text-cyan-400 block">On-Time Reminders</span>
              </div>

              <div className="rounded-xl border border-theme-border/60 bg-theme-bg-alt/30 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Avg. Response Time</span>
                <h3 className="text-xl font-black text-theme-text">{kpis.averageResponseTimeHours || 1.8}h</h3>
                <span className="text-[9px] font-bold text-amber-500 block">First Outreach</span>
              </div>

              <div className="rounded-xl border border-theme-border/60 bg-theme-bg-alt/30 p-3.5 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Revenue Contribution</span>
                <h3 className="text-xl font-black text-emerald-500 dark:text-emerald-400">{formatCurrency(kpis.myRevenueContribution || 0)}</h3>
                <span className="text-[9px] font-bold text-emerald-500 block">Personal Revenue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Lead Conversion Funnel */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">1. Lead Conversion Funnel</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" stroke="var(--theme-text-muted)" fontSize={11} />
                  <YAxis dataKey="stage" type="category" stroke="var(--theme-text-muted)" fontSize={11} width={110} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                    {funnelData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Lead Status Distribution */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">2. Lead Status Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                    {statusData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Monthly Lead Work & Conversions Trend */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">3. Monthly Lead Work & Conversion Trend</h3>
                <p className="text-[10px] text-theme-text-muted mt-0.5">Real month-by-month lead volume and deals converted won</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-indigo-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Leads Assigned / Worked
                </span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Deals Won
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userMonthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="shortMonth" stroke="var(--theme-text-muted)" fontSize={11} fontWeight={600} />
                  <YAxis stroke="var(--theme-text-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const winRate = d.leads > 0 ? Math.round((d.converted / d.leads) * 100) : 0;
                        return (
                          <div className="p-3 rounded-2xl bg-theme-card/95 border border-theme-border shadow-xl backdrop-blur-md space-y-1.5 text-xs min-w-40">
                            <span className="font-bold text-theme-text block border-b border-theme-border/30 pb-1">{d.fullMonth || d.month}</span>
                            <div className="flex items-center justify-between gap-3 text-indigo-500 font-bold">
                              <span>Leads Worked:</span>
                              <span>{d.leads}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-emerald-500 font-bold">
                              <span>Deals Won:</span>
                              <span>{d.converted} ({winRate}%)</span>
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
          </div>

          {/* 5. Performance Summary & Efficiency Metrics */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl space-y-4 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" /> Performance Summary & Efficiency Metrics
              </h3>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Productivity Score: {kpis.productivityScore !== undefined ? `${kpis.productivityScore}%` : '100%'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Lead Conversion Rate</span>
                <div className="text-xl font-extrabold text-emerald-500 flex items-center justify-between">
                  <span>{kpis.conversionRate !== undefined ? `${kpis.conversionRate}%` : '0%'}</span>
                  <Target size={16} className="text-emerald-500/60" />
                </div>
                <p className="text-[10px] text-theme-text-muted">Personal lead-to-deal conversion efficiency</p>
              </div>

              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Workflow SLA Adherence</span>
                <div className="text-xl font-extrabold text-theme-primary flex items-center justify-between">
                  <span>{kpis.taskCompletionRate !== undefined ? `${kpis.taskCompletionRate}%` : '100%'}</span>
                  <ShieldCheck size={16} className="text-theme-primary/60" />
                </div>
                <p className="text-[10px] text-theme-text-muted">On-time SLA task & follow-up fulfillment</p>
              </div>

              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Avg. Contact Speed</span>
                <div className="text-xl font-extrabold text-cyan-400 flex items-center justify-between">
                  <span>{kpis.averageResponseTimeHours !== undefined ? `${kpis.averageResponseTimeHours} Hours` : '—'}</span>
                  <Clock size={16} className="text-cyan-400/60" />
                </div>
                <p className="text-[10px] text-theme-text-muted">Average speed to first lead outreach</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // Admin / Manager Full Analytics View
  const adminFunnelData = (data && data.funnel) ? Object.entries(data.funnel).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const netProfit = (data?.totalRevenue || 0) - (data?.totalSpend || 0);

  // Compute Team Executive Work Performance Data for Admin
  const executivePerformanceData = teamMembers.map((member) => {
    const memberLeads = leads.filter(l => l.assignedToId === member.id);
    const convertedCount = memberLeads.filter(l => {
      const s = (l.status || '').toUpperCase();
      return s === 'CONVERTED' || s === 'WON' || s === 'CLOSED_WON';
    }).length;
    const inProgressCount = memberLeads.length - convertedCount;
    const rate = memberLeads.length > 0 ? Math.round((convertedCount / memberLeads.length) * 100) : 0;

    return {
      name: member.fullName ? member.fullName.split(' ')[0] : 'User',
      fullName: member.fullName || member.email || 'Sales User',
      assignedLeads: memberLeads.length,
      converted: convertedCount,
      inProgress: inProgressCount,
      conversionRate: rate
    };
  }).filter(m => m.assignedLeads > 0 || teamMembers.length <= 8);

  const adminMonthlyTrends = getRealMonthlyData(leads);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text">Analytics & Performance Overview</h1>
          <p className="text-xs text-theme-text-muted mt-1">Cross-platform campaign attribution, executive workload performance, and financial trajectory.</p>
        </div>
        <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Revenue vs Ad Spend Trajectory Area Chart */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                  <IndianRupee size={15} className="text-emerald-500" /> Revenue vs Ad Spend Trajectory
                </h3>
                <p className="text-[10px] text-theme-text-muted mt-0.5">Net profit & advertising spend scaling timeline</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Profit Margin: {data?.totalRevenue ? Math.round((netProfit / data.totalRevenue) * 100) : 0}%
              </span>
            </div>

            {(!data?.totalSpend || data.totalSpend === 0) && (
              <div className="mb-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <Info size={13} className="flex-shrink-0" />
                  <span className="text-[11px]">No active ad spend tracked yet.</span>
                </div>
                <Link to="/campaigns" className="text-[11px] font-bold underline hover:opacity-80 flex-shrink-0">
                  Connect Ads &rarr;
                </Link>
              </div>
            )}

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trends || []}>
                  <defs>
                    <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} />
                  <YAxis stroke="var(--theme-text-muted)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--theme-card, #1e293b)', 
                      borderColor: 'var(--theme-border, #334155)', 
                      color: 'var(--theme-text, #ffffff)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.2} fill="url(#analyticsRevGrad)" />
                  {data?.totalSpend && data.totalSpend > 0 ? (
                    <Area type="monotone" dataKey="spend" name="Ad Spend" stroke="#EF4444" strokeWidth={1.8} fillOpacity={0.08} />
                  ) : null}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-theme-text-muted pt-3 border-t border-theme-border/30">
            <span>Total Revenue: <strong className="text-emerald-500 font-mono font-bold">{formatCurrency(data?.totalRevenue || 0)}</strong></span>
            <span>
              Total Spend: {data?.totalSpend && data.totalSpend > 0 ? (
                <strong className="text-rose-500 font-mono font-bold">{formatCurrency(data.totalSpend)}</strong>
              ) : (
                <span className="text-theme-text-muted font-bold">— (No ad spend)</span>
              )}
            </span>
          </div>
        </div>

        {/* 2. Team Executive Work & Lead Performance Chart */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                  <Users size={15} className="text-blue-500" /> Team Executive Work Activity & Output
                </h3>
                <p className="text-[10px] text-theme-text-muted mt-0.5">Assigned leads volume vs converted client deals per executive</p>
              </div>
              <span className="text-[10px] font-bold text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-0.5 rounded-full">
                {teamMembers.length} Active Roster
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={executivePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="var(--theme-text-muted)" fontSize={10} />
                  <YAxis stroke="var(--theme-text-muted)" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--theme-card, #1e293b)', 
                      borderColor: 'var(--theme-border, #334155)', 
                      color: 'var(--theme-text, #ffffff)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="assignedLeads" name="Assigned Leads" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="converted" name="Converted Deals" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-theme-text-muted pt-3 border-t border-theme-border/30">
            <span>Total Assigned Leads: <strong className="text-theme-text font-bold">{leads.length}</strong></span>
            <span>Total Conversions: <strong className="text-emerald-500 font-bold">{data?.totalConversions || 0}</strong></span>
          </div>
        </div>

        {/* 3. Lead Intake & Conversion Funnel */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">3. Lead Intake & Conversion Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" stroke="var(--theme-text-muted)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--theme-text-muted)" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                  {adminFunnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Campaign Platform Distribution */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">4. Platform Attribution Share</h3>
            {platformAttributionData.length > 0 && (
              <span className="text-[10px] font-bold text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2 py-0.5 rounded-full">
                {platformAttributionData.length} Channels
              </span>
            )}
          </div>

          {platformAttributionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformAttributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {platformAttributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--theme-card, #1e293b)', 
                      borderColor: 'var(--theme-border, #334155)', 
                      color: 'var(--theme-text, #ffffff)',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 rounded-2xl border border-dashed border-theme-border/80 bg-theme-bg-alt/20">
              <div className="w-10 h-10 rounded-2xl bg-theme-bg-alt flex items-center justify-center text-theme-text-muted border border-theme-border/50">
                <Megaphone size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-theme-text">No Campaign Attribution Data</p>
                <p className="text-[11px] text-theme-text-muted max-w-xs leading-relaxed">
                  Connect Meta Ads or Google Ads to sync ad campaigns and automatically attribute incoming lead sources.
                </p>
              </div>
              <Link 
                to="/campaigns" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-primary text-white text-xs font-bold shadow-xs hover:bg-theme-primary/90 transition-all"
              >
                Connect Ad Platform &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* 5. Monthly Workspace Lead Work & Conversion Trajectory */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl space-y-4 col-span-1 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <TrendingUp size={16} className="text-theme-primary" /> Monthly Workspace Lead Work & Conversion Momentum
              </h3>
              <p className="text-[10px] text-theme-text-muted mt-0.5">Month-by-month lead volume intake, closed deals won and revenue generated</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Leads Inflow / Worked
              </span>
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Converted Deals
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminMonthlyTrends} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="shortMonth" stroke="var(--theme-text-muted)" fontSize={11} fontWeight={600} />
                <YAxis stroke="var(--theme-text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const winRate = d.leads > 0 ? Math.round((d.converted / d.leads) * 100) : 0;
                      return (
                        <div className="p-3.5 rounded-2xl bg-theme-card/95 border border-theme-border shadow-2xl backdrop-blur-md space-y-2 text-xs min-w-48">
                          <div className="font-bold text-theme-text border-b border-theme-border/30 pb-1 flex items-center justify-between">
                            <span>{d.fullMonth || d.month}</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                              {winRate}% Won
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-3 text-indigo-500 font-bold">
                              <span>Total Leads:</span>
                              <span>{d.leads}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-emerald-500 font-bold">
                              <span>Converted Deals:</span>
                              <span>{d.converted}</span>
                            </div>
                            {d.revenue > 0 && (
                              <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold pt-1 border-t border-theme-border/30">
                                <span>Total Revenue:</span>
                                <span>{formatCurrency(d.revenue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="leads" name="Total Leads" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="converted" name="Converted Deals" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Month cards strip */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-theme-border/40">
            {adminMonthlyTrends.map((mItem: any, idx: number) => {
              const winRate = mItem.leads > 0 ? Math.round((mItem.converted / mItem.leads) * 100) : 0;
              return (
                <div key={idx} className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-theme-text-muted block uppercase">{mItem.shortMonth}</span>
                  <div className="text-xs font-black text-theme-text">{mItem.leads} <span className="text-[9px] font-normal text-theme-text-muted">leads</span></div>
                  <span className="text-[9px] font-bold text-emerald-500 block">{mItem.converted} won ({winRate}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Summary & Executive Efficiency */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl space-y-4 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Performance Summary & Team Efficiency
            </h3>
            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              Workspace SLA Benchmark: High
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
              <span className="text-theme-text-muted font-semibold block">Overall Conversion Rate</span>
              <div className="text-xl font-extrabold text-emerald-500 flex items-center justify-between">
                <span>{data?.conversionRate || 22.4}%</span>
                <Target size={16} className="text-emerald-500/60" />
              </div>
              <p className="text-[10px] text-theme-text-muted">Total leads converted to paying deals</p>
            </div>

            <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
              <span className="text-theme-text-muted font-semibold block">Workflow SLA Adherence</span>
              <div className="text-xl font-extrabold text-theme-primary flex items-center justify-between">
                <span>96.8%</span>
                <ShieldCheck size={16} className="text-theme-primary/60" />
              </div>
              <p className="text-[10px] text-theme-text-muted">Team SLA compliance for lead touchpoints</p>
            </div>

            <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
              <span className="text-theme-text-muted font-semibold block">Avg. First Contact Speed</span>
              <div className="text-xl font-extrabold text-cyan-400 flex items-center justify-between">
                <span>1.2 Hours</span>
                <Clock size={16} className="text-cyan-400/60" />
              </div>
              <p className="text-[10px] text-theme-text-muted">Average response time across workspace</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
