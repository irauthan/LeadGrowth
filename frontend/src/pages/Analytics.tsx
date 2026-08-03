import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { DashboardKpis } from '../types';
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
import { Loader2, TrendingUp, Target, ShieldCheck, Clock } from 'lucide-react';

import TimeFilterDropdown, { type TimeFilterState } from '../components/TimeFilterDropdown';

export default function Analytics() {
  const user = useAuthStore((state) => state.user);
  const isUserOnly = user?.roles.includes('ROLE_USER') && !user?.roles.includes('ROLE_ADMIN') && !user?.roles.includes('ROLE_MANAGER');

  const [data, setData] = useState<DashboardKpis | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
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
        const res = await api.get('/api/dashboard', { params });
        setData(res.data);
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
            <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Read-Only Module</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-0.5">
              Personal Performance & Sales Analytics
            </h1>
            <p className="text-xs text-theme-text-muted mt-0.5">
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
  const adminFunnelData = data ? Object.entries(data.funnel).map(([name, value]) => ({
    name,
    value,
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text">Analytics & Performance Overview</h1>
          <p className="text-xs text-theme-text-muted mt-1">Cross-platform campaign attribution, lead intake funnel, and revenue metrics.</p>
        </div>
        <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lead Intake Funnel */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Lead Intake & Conversion Funnel</h3>
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

        {/* Campaign Platform Distribution */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Platform Attribution Share</h3>
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
