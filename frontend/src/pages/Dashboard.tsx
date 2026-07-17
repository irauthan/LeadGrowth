import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { DashboardKpis as KpiType, Task } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell
} from 'recharts';
import { 
  Users, 
  MousePointer, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<KpiType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');
  const isUser = user?.roles.includes('ROLE_USER') && !isAdmin && !isManager;

  useEffect(() => {
    fetchDashboardData();
    fetchTasks();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (e) {
      console.error('Error fetching dashboard KPIs', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Live WebSocket Integration
  useWebSocket({
    workspaceId: user?.workspaceId,
    onLeadReceived: (newLead) => {
      // Prepend to recentLeads list on live lead trigger
      setData((prev) => {
        if (!prev) return prev;
        const leads = [newLead, ...prev.recentLeads.filter(l => l.id !== newLead.id)].slice(0, 10);
        return {
          ...prev,
          totalLeads: prev.totalLeads + 1,
          recentLeads: leads
        };
      });
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 rounded-3xl bg-slate-200 lg:col-span-2 dark:bg-slate-800 animate-pulse" />
          <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Define Funnel Chart Data
  const funnelData = data ? Object.entries(data.funnel).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const COLORS = ['#3b82f6', '#6366f1', '#eab308', '#10b981', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Title greeting */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Welcome back, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Role: <span className="font-bold text-brand-600 dark:text-brand-400">{user?.roles[0]?.replace('ROLE_', '')}</span> • Workspace invites linked.
        </p>
      </div>

      {/* KPI Stats Cards - Layout shifts depending on role */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads Card */}
        <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
            <h3 className="mt-2 text-3xl font-extrabold">{formatNumber(data?.totalLeads)}</h3>
            <p className="mt-1 text-[11px] font-semibold text-green-500">Live web socket active</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <Users size={22} />
          </div>
        </div>

        {/* Clicks (Admin/Manager) / Assigned Tasks (User) */}
        {!isUser ? (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Clicks</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatNumber(data?.totalClicks)}</h3>
              <p className="mt-1 text-[11px] text-slate-400">Avg CTR: {data?.ctr.toFixed(2)}%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <MousePointer size={22} />
            </div>
          </div>
        ) : (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Tasks</p>
              <h3 className="mt-2 text-3xl font-extrabold">
                {tasks.filter(t => t.status !== 'Completed').length}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Total tasks: {tasks.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock size={22} />
            </div>
          </div>
        )}

        {/* Spend (Admin) / Impressions (Manager) / Completed tasks (User) */}
        {isAdmin ? (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Spend</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatCurrency(data?.totalSpend)}</h3>
              <p className="mt-1 text-[11px] text-slate-400">Avg CPC: ${data?.cpc.toFixed(2)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <DollarSign size={22} />
            </div>
          </div>
        ) : isManager ? (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Impressions</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatNumber(data?.totalImpressions)}</h3>
              <p className="mt-1 text-[11px] text-slate-400">Campaign views</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Eye size={22} />
            </div>
          </div>
        ) : (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Tasks</p>
              <h3 className="mt-2 text-3xl font-extrabold">
                {tasks.filter(t => t.status === 'Completed').length}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Nice progress!</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
          </div>
        )}

        {/* Revenue (Admin) / Conversions (Manager) / Performance Status (User) */}
        {isAdmin ? (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatCurrency(data?.totalRevenue)}</h3>
              <p className="mt-1 text-[11px] text-slate-400">ROAS: {data?.roas.toFixed(2)}x</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <TrendingUp size={22} />
            </div>
          </div>
        ) : isManager ? (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversions</p>
              <h3 className="mt-2 text-3xl font-extrabold">{formatNumber(data?.totalConversions)}</h3>
              <p className="mt-1 text-[11px] text-slate-400">Qualified leads</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <TrendingUp size={22} />
            </div>
          </div>
        ) : (
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">My Performance</p>
              <h3 className="mt-2 text-3xl font-extrabold">
                {data?.totalLeads ? Math.round((data.recentLeads.filter(l => l.status === 'Converted').length / data.totalLeads) * 100) : 0}%
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Conversion Rate</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Activity size={22} />
            </div>
          </div>
        )}
      </div>

      {/* Main Charts & Widgets section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area Chart (Recharts) */}
        {!isUser && (
          <div className="glass-card rounded-3xl p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Revenue vs Spend Trends</h3>
            <p className="text-xs text-slate-400 mb-6">Daily marketing efficiency tracking</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="spend" stroke="#ef4444" fillOpacity={0.1} fill="url(#colorSpend)" strokeWidth={2} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={0.1} fill="url(#colorRev)" strokeWidth={2} />
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* User Specific tasks panel */}
        {isUser && (
          <div className="glass-card rounded-3xl p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">My Tasks</h3>
                <p className="text-xs text-slate-400">Assigned task backlog</p>
              </div>
              <Link to="/tasks" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                <span>View all</span>
                <ExternalLink size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'Completed').slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-white/40">
                  <div>
                    <h4 className="text-sm font-bold">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
              {tasks.filter(t => t.status !== 'Completed').length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">🎉 No pending tasks! All clear.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lead Funnel Chart (Recharts) */}
        <div className="glass-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Pipeline Funnel</h3>
          <p className="text-xs text-slate-400 mb-6">Pipeline distribution counts</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" barSize={16} radius={8}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second grid: Live Leads Counter & Team activities list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Leads Counter Panel */}
        <div className="glass-card rounded-3xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Live Leads Feed</h3>
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">LIVE NOW</span>
              </div>
              <p className="text-xs text-slate-400">Recent leads syncing to your workspace</p>
            </div>
            <Link to="/leads" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Manage leads
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 dark:border-slate-800">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.recentLeads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                    <td className="py-3 font-semibold">{lead.name}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        lead.sourcePlatform === 'Meta' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                      }`}>
                        {lead.sourcePlatform}
                      </span>
                    </td>
                    <td className="py-3 max-w-[150px] truncate">{lead.campaignName}</td>
                    <td className="py-3">
                      <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400">{formatDate(lead.createdAt).substring(0, 12)}</td>
                  </tr>
                ))}
                {data?.recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">No leads captured yet. Connect Meta/Google integrations!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Activities Feed / Workspace Stats (Admin Only) */}
        {isAdmin && data?.workspaceStats && data.workspaceStats.length > 0 ? (
          <div className="glass-card rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">Workspace Monitor</h3>
            <p className="text-xs text-slate-400 mb-6">Cross-tenant statistics overview</p>
            <div className="space-y-4">
              {data.workspaceStats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-2xl border border-slate-100 p-4 dark:border-slate-800 bg-white/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">{stat.name}</h4>
                    <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">{stat.industry}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Team</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{stat.teamSize}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Campaigns</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{stat.activeCampaigns}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Leads</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{stat.totalLeads}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Team Activity Logs</h3>
            <p className="text-xs text-slate-400 mb-6">Logs of actions within workspace</p>
            <div className="space-y-4 overflow-y-auto max-h-80 pr-1">
              {data?.teamActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{act.userName}</p>
                    <p className="text-slate-500 mt-0.5">{act.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{act.timestamp.replace('T', ' ').substring(0, 16)}</p>
                  </div>
                </div>
              ))}
              {data?.teamActivities.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">No recent workspace actions recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
