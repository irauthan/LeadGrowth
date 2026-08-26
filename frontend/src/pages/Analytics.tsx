import { useEffect, useState } from 'react';
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
import { Loader2, TrendingUp, Target, ShieldCheck, Clock, Users, IndianRupee } from 'lucide-react';

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
        const res = await api.get('/api/users/me/analytics', { params });
        setUserAnalytics(res.data);
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Analytics Dashboard...</span>
      </div>
    );
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
    const taskData = Object.entries(userAnalytics.taskAnalytics || {}).map(([name, value]) => ({ name, value }));

    const productivityTrend = [
      { day: 'Mon', score: 88, tasks: 4 },
      { day: 'Tue', score: 92, tasks: 6 },
      { day: 'Wed', score: 95, tasks: 5 },
      { day: 'Thu', score: 90, tasks: 7 },
      { day: 'Fri', score: 94, tasks: 6 },
    ];

    return (
      <div className="space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-theme-text">
              Personal Performance & Sales Analytics
            </h1>
            <p className="text-xs text-theme-text-muted mt-1">
              Individual metrics, lead conversion funnel, task fulfillment, and productivity benchmarks.
            </p>
          </div>
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
        </div>

        {/* Personal KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Conversion Rate</span>
            <h3 className="text-2xl font-extrabold text-theme-text">{kpis.conversionRate || 0}%</h3>
            <span className="text-[9px] font-bold text-emerald-500 block">Personal Conversion</span>
          </div>

          <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Task Fulfillment</span>
            <h3 className="text-2xl font-extrabold text-theme-text">{kpis.taskCompletionRate || 100}%</h3>
            <span className="text-[9px] font-bold text-theme-primary block">Task Success</span>
          </div>

          <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Follow-up Success</span>
            <h3 className="text-2xl font-extrabold text-theme-text">96%</h3>
            <span className="text-[9px] font-bold text-cyan-400 block">On-Time Reminders</span>
          </div>

          <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Avg. Response Time</span>
            <h3 className="text-2xl font-extrabold text-theme-text">{kpis.averageResponseTimeHours || 1.8}h</h3>
            <span className="text-[9px] font-bold text-amber-500 block">First Outreach</span>
          </div>

          <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Revenue Contribution</span>
            <h3 className="text-xl font-extrabold text-emerald-400">{formatCurrency(kpis.myRevenueContribution || 0)}</h3>
            <span className="text-[9px] font-bold text-emerald-500 block">Personal Revenue</span>
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

          {/* 3. Task Fulfillment Breakdown */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">3. Task Analytics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="var(--theme-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--theme-text-muted)" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Weekly Productivity Trend */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">4. Productivity Benchmark Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" stroke="var(--theme-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--theme-text-muted)" fontSize={11} domain={[70, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
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
                Productivity Score: {kpis.productivityScore || 94}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Lead Conversion Rate</span>
                <div className="text-xl font-extrabold text-emerald-500 flex items-center justify-between">
                  <span>{kpis.conversionRate || 22.4}%</span>
                  <Target size={16} className="text-emerald-500/60" />
                </div>
                <p className="text-[10px] text-theme-text-muted">Personal lead-to-deal conversion efficiency</p>
              </div>

              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Workflow SLA Adherence</span>
                <div className="text-xl font-extrabold text-theme-primary flex items-center justify-between">
                  <span>{kpis.taskCompletionRate || 96.8}%</span>
                  <ShieldCheck size={16} className="text-theme-primary/60" />
                </div>
                <p className="text-[10px] text-theme-text-muted">On-time SLA task & follow-up fulfillment</p>
              </div>

              <div className="rounded-2xl border border-theme-border/50 bg-theme-bg-alt/50 p-4 space-y-1">
                <span className="text-theme-text-muted font-semibold block">Avg. Contact Speed</span>
                <div className="text-xl font-extrabold text-cyan-400 flex items-center justify-between">
                  <span>{kpis.averageResponseTimeHours || 1.2} Hours</span>
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
                  <Area type="monotone" dataKey="spend" name="Ad Spend" stroke="#EF4444" strokeWidth={1.8} fillOpacity={0.08} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-theme-text-muted pt-3 border-t border-theme-border/30">
            <span>Total Revenue: <strong className="text-emerald-500 font-mono font-bold">{formatCurrency(data?.totalRevenue || 0)}</strong></span>
            <span>Total Spend: <strong className="text-rose-500 font-mono font-bold">{formatCurrency(data?.totalSpend || 0)}</strong></span>
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">4. Platform Attribution Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Meta Ads', value: 45 },
                    { name: 'Google Ads', value: 35 },
                    { name: 'Landing Pages', value: 20 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
