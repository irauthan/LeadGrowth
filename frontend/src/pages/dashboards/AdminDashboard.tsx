import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { DashboardKpis as KpiType } from '../../types';
import { formatCurrency, formatNumber } from '../../utils';
import { 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Shield, 
  Database, 
  Wifi, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  ExternalLink,
  Plus,
  RefreshCw,
  Zap,
  Server,
  PhoneCall,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CallDetailsModal from '../../components/CallDetailsModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';

export default function AdminDashboard() {
  const [data, setData] = useState<KpiType | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [teamCalls, setTeamCalls] = useState<any>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
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

      const [dashRes, _sysRes, auditRes, callsRes] = await Promise.all([
        api.get('/api/dashboard', { params }),
        api.get('/api/admin/system/metrics').catch(() => ({ data: {} })),
        api.get('/api/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/api/calls/team').catch(() => ({ data: null }))
      ]);

      setData(dashRes.data);
      setAuditLogs(auditRes.data || []);
      setTeamCalls(callsRes.data);
    } catch (err) {
      console.error('Failed to load Admin Command Center data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Business Command Center...</span>
      </div>
    );
  }

  const netProfit = (data.totalRevenue || 0) - (data.totalSpend || 0);

  return (
    <div className="space-y-6">

      {/* Header Command Center Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
            <Shield size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Agency Owner</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-theme-primary border border-theme-primary/20">Full Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-text mt-1">Business Command Center</h1>
            <p className="text-xs text-theme-text-muted mt-0.5">High-level financial KPIs, ad spend efficiency, team output, and system health.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
          <Link
            to="/settings"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-theme-border bg-theme-bg-alt text-xs font-bold text-theme-text hover:bg-theme-border/20 transition-all"
          >
            <CreditCard size={14} /> Workspace Billing
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-xs font-bold text-white shadow-lg shadow-theme-primary/10 transition-all"
          >
            <Plus size={14} /> Manage Team & Roles
          </Link>
        </div>
      </div>

      {/* Top Financial & Growth KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Total Revenue</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <IndianRupee size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{formatCurrency(data.totalRevenue)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>Net Profit</span>
            <span className="font-bold text-emerald-500">{formatCurrency(netProfit)}</span>
          </div>
        </div>

        {/* Total Ad Spend */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Total Ad Spend</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{formatCurrency(data.totalSpend)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>CPC</span>
            <span className="font-bold text-theme-text">{formatCurrency(data.cpc)}</span>
          </div>
        </div>

        {/* Blended ROAS */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Blended ROAS</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Zap size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{data.roas}x</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>CTR</span>
            <span className="font-bold text-cyan-400">{data.ctr}%</span>
          </div>
        </div>

        {/* Total Leads & Conversions */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Total Leads Captured</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-theme-primary">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{formatNumber(data.totalLeads)}</h3>
          <div className="flex items-center justify-between text-[10px] font-semibold text-theme-text-muted pt-1 border-t border-theme-border/30">
            <span>Conversions</span>
            <span className="font-bold text-emerald-500">{formatNumber(data.totalConversions)}</span>
          </div>
        </div>

      </div>

      {/* Workspace Call Duration Audit & Effort Analytics Banner */}
      <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <PhoneCall size={24} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
              Workspace Call Activity & Effort Audit Logs
            </h3>
            <p className="text-xs text-theme-text-muted">
              Total Team Call Time Today: <span className="font-mono font-bold text-rose-400">{teamCalls?.totalTeamCallTimeFormatted || '00:00:00'}</span> ({teamCalls?.totalTeamCallsToday || 0} completed sessions)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCallModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-extrabold transition-all cursor-pointer shadow-sm"
        >
          <Eye size={14} /> View All Workspace Call Logs
        </button>
      </div>

      {/* System Monitoring Cards for Admin */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-theme-text">Live System Infrastructure & Subsystems</h3>
            <p className="text-xs text-theme-text-muted">Real-time status of backend services, DB pool, and API containers.</p>
          </div>
          <Link to="/admin/system" className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1">
            System Monitoring <ExternalLink size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server size={18} className="text-theme-primary" />
              <div>
                <span className="text-xs font-bold text-theme-text block">API Container</span>
                <span className="text-[9px] text-theme-text-muted">Port 8080 Tomcat</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              <CheckCircle size={10} /> HEALTHY
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database size={18} className="text-emerald-500" />
              <div>
                <span className="text-xs font-bold text-theme-text block">MySQL JPA Pool</span>
                <span className="text-[9px] text-theme-text-muted">HikariCP 50 Max</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              <CheckCircle size={10} /> CONNECTED
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi size={18} className="text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-theme-text block">WebSocket Manager</span>
                <span className="text-[9px] text-theme-text-muted">Live Sync Active</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              <CheckCircle size={10} /> ACTIVE
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-theme-text block">Task Scheduler</span>
                <span className="text-[9px] text-theme-text-muted">Auto Assignments</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              <CheckCircle size={10} /> RUNNING
            </span>
          </div>
        </div>
      </div>

      {/* Revenue & Growth Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Spend Area Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-4">Revenue vs Ad Spend Trajectory</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-main)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="spend" stroke="#EF4444" strokeWidth={2} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Log Stream Feed */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Security Audit Trail</h3>
              <Link to="/activity-logs" className="text-[10px] font-bold text-theme-primary hover:underline">View All</Link>
            </div>
            <div className="mt-3 space-y-3 max-h-60 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map((log: any, idx: number) => (
                <div key={log.id || idx} className="p-2.5 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/20 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-theme-primary text-[11px]">{log.action}</span>
                    <span className="text-[9px] text-theme-text-muted font-mono">{log.createdAt ? log.createdAt.split('T')[1]?.substring(0, 5) : ''}</span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted mt-1 leading-tight">{log.description}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-theme-text-muted italic text-center py-6">No audit records logged yet.</p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-theme-border/30 flex items-center justify-between text-xs text-theme-text-muted">
            <span>Workspace Integrations</span>
            <Link to="/integrations" className="font-bold text-theme-primary hover:underline">API Keys & Webhooks</Link>
          </div>
        </div>

      </div>

      {/* Call Details Modal for Admin */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title="Workspace Call Activity & Contact Details"
      />

    </div>
  );
}
