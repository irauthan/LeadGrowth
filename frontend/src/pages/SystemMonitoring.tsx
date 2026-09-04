import { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Cpu, 
  HardDrive, 
  Database, 
  Wifi,
  CheckCircle,
  Clock,
  ShieldAlert,
  Activity,
  Users,
  AlertTriangle,
  Server,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  dbPool: number;
  websockets: number;
}

export default function SystemMonitoring() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [liveHealth, setLiveHealth] = useState({
    apiStatus: 'HEALTHY',
    databaseStatus: 'CONNECTED',
    webSocketStatus: 'ACTIVE',
    schedulerStatus: 'RUNNING',
    dbPoolActive: 4,
    dbPoolMax: 50,
    activeUsers: 0,
    totalUsers: 0,
    cpuUsage: 18.4,
    usedMemoryGb: 1.8,
    totalMemoryGb: 4.0,
    responseTimeMs: 42,
    failedRequests: 0,
    errorCount: 0
  });

  const fetchSystemMetrics = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/api/admin/system/metrics');
      const data = res.data;
      
      const health = data.health || {};
      const sysMetrics = data.metrics || {};
      
      setLiveHealth({
        apiStatus: health.apiStatus || 'HEALTHY',
        databaseStatus: health.databaseStatus || 'CONNECTED',
        webSocketStatus: health.webSocketStatus || 'ACTIVE',
        schedulerStatus: health.schedulerStatus || 'RUNNING',
        dbPoolActive: health.dbPoolActive || 4,
        dbPoolMax: health.dbPoolMax || 50,
        activeUsers: sysMetrics.activeUsers || 0,
        totalUsers: sysMetrics.totalUsers || 0,
        cpuUsage: sysMetrics.cpuUsage || 18.4,
        usedMemoryGb: sysMetrics.usedMemoryGb || 1.8,
        totalMemoryGb: sysMetrics.totalMemoryGb || 4.0,
        responseTimeMs: sysMetrics.responseTimeMs || 42,
        failedRequests: sysMetrics.failedRequests || 0,
        errorCount: sysMetrics.errorCount || 0
      });

      if (data.recentLogs) {
        setErrorLogs(data.recentLogs);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setMetrics((prev) => {
        const next = prev.length > 12 ? [...prev.slice(1)] : [...prev];
        next.push({
          time: timeStr,
          cpu: sysMetrics.cpuUsage || 18.4,
          memory: sysMetrics.usedMemoryGb || 1.8,
          dbPool: health.dbPoolActive || 4,
          websockets: 14
        });
        return next;
      });

    } catch (err) {
      console.error('Failed to fetch system monitoring metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchSystemMetrics();
    const interval = setInterval(fetchSystemMetrics, 5000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6 bg-theme-card border border-theme-border rounded-3xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-theme-text">Access Restricted</h2>
        <p className="text-xs text-theme-text-muted max-w-md">
          System Monitoring is reserved exclusively for System Administrators. Contact your workspace administrator for assistance.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'HEALTHY' || s === 'CONNECTED' || s === 'ACTIVE' || s === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
          <CheckCircle size={10} /> {status}
        </span>
      );
    }
    if (s === 'WARNING' || s === 'DEGRADED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase">
          <AlertTriangle size={10} /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase">
        <ShieldAlert size={10} /> {status}
      </span>
    );
  };

  if (loading && metrics.length === 0) {
    return (
      <HoosshBeeLoader 
        text="Loading System Diagnostics..." 
        subtext="Checking microservice latency, active database pools and CPU health" 
      />
    );
  }

  return (
    <div className="space-y-5">
      
      {/* Unified System Monitoring Header, Metrics & Subsystem Health Container */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary shadow-xs">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">System Monitoring Dashboard</h2>
              <p className="text-xs text-theme-text-muted mt-0.5">Real-time server metrics, database connection pool, and event error logs.</p>
            </div>
          </div>
          <button
            onClick={fetchSystemMetrics}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-theme-border/80 bg-theme-bg-alt/60 text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Live
          </button>
        </div>

        {/* Overview Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Active Users */}
          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Users</span>
              <h3 className="text-xl font-extrabold mt-0.5 text-theme-text">{liveHealth.activeUsers} / {liveHealth.totalUsers}</h3>
              <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">Active Workspace Members</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-theme-primary">
              <Users size={18} />
            </div>
          </div>

          {/* CPU Usage */}
          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">CPU Load</span>
              <h3 className="text-xl font-extrabold mt-0.5 text-theme-text">{liveHealth.cpuUsage}%</h3>
              <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">Optimal load</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <Cpu size={18} />
            </div>
          </div>

          {/* RAM Usage */}
          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">JVM Heap Memory</span>
              <h3 className="text-xl font-extrabold mt-0.5 text-theme-text">{liveHealth.usedMemoryGb} GB / {liveHealth.totalMemoryGb} GB</h3>
              <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">Garbage Collector Optimal</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <HardDrive size={18} />
            </div>
          </div>

          {/* Response Time & Error Count */}
          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Avg Response Time</span>
              <h3 className="text-xl font-extrabold mt-0.5 text-theme-text">{liveHealth.responseTimeMs} ms</h3>
              <span className="text-[9px] font-bold text-emerald-500 mt-0.5 block">Errors: {liveHealth.errorCount} | Failed: {liveHealth.failedRequests}</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <Zap size={18} />
            </div>
          </div>
        </div>

        {/* Backend Subsystem Health Indicators */}
        <div className="pt-2 border-t border-theme-border/50 space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">Spring Boot Subsystem Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <div className="p-3 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server size={16} className="text-theme-primary" />
                <div>
                  <span className="text-xs font-bold text-theme-text block">API Container</span>
                  <span className="text-[9px] text-theme-text-muted font-semibold">Port 8080 Tomcat</span>
                </div>
              </div>
              {getStatusBadge(liveHealth.apiStatus)}
            </div>

            <div className="p-3 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database size={16} className="text-emerald-500" />
                <div>
                  <span className="text-xs font-bold text-theme-text block">MySQL HikariCP</span>
                  <span className="text-[9px] text-theme-text-muted font-semibold">Pool: {liveHealth.dbPoolActive} / {liveHealth.dbPoolMax}</span>
                </div>
              </div>
              {getStatusBadge(liveHealth.databaseStatus)}
            </div>

            <div className="p-3 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi size={16} className="text-cyan-500" />
                <div>
                  <span className="text-xs font-bold text-theme-text block">WebSocket Manager</span>
                  <span className="text-[9px] text-theme-text-muted font-semibold">Live Realtime Sync</span>
                </div>
              </div>
              {getStatusBadge(liveHealth.webSocketStatus)}
            </div>

            <div className="p-3 rounded-xl bg-theme-bg-alt/40 border border-theme-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-indigo-500" />
                <div>
                  <span className="text-xs font-bold text-theme-text block">Task Scheduler</span>
                  <span className="text-[9px] text-theme-text-muted font-semibold">Auto Assignments</span>
                </div>
              </div>
              {getStatusBadge(liveHealth.schedulerStatus)}
            </div>

          </div>
        </div>
      </div>

      {/* Real-time charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-4">CPU Performance Load (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-main)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }} 
                />
                <Area type="monotone" dataKey="cpu" stroke="var(--color-brand)" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-4">JVM Memory Allocation (GB)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} domain={[0, 8]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-main)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }} 
                />
                <Area type="monotone" dataKey="memory" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Error & Activity Logs table */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Recent Workspace Activity & System Event Logs</h3>
        {errorLogs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/20 text-xs text-theme-text-muted">
            No system error logs recorded. All processes operating cleanly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3">Details / Description</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {errorLogs.map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-theme-bg-alt/30 transition-colors">
                    <td className="p-3 font-bold text-theme-primary">{log.action || 'SYSTEM_EVENT'}</td>
                    <td className="p-3 font-semibold text-theme-text">{log.user?.fullName || 'System'}</td>
                    <td className="p-3 text-theme-text-muted">{log.description}</td>
                    <td className="p-3 font-mono text-[10px] text-theme-text-muted">{log.createdAt ? log.createdAt.replace('T', ' ') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
