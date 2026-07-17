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
  Clock
} from 'lucide-react';

interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  dbPool: number;
  websockets: number;
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [sysHealth, setSysHealth] = useState({
    cpu: 24,
    memory: 4.2,
    dbPool: 8,
    websockets: 14,
    uptime: '14 days, 3 hours'
  });

  // Populate initial metrics
  useEffect(() => {
    const initialData: MetricPoint[] = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5000);
      initialData.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: parseFloat((Math.random() * 0.5 + 4.0).toFixed(1)),
        dbPool: Math.floor(Math.random() * 4) + 6,
        websockets: Math.floor(Math.random() * 5) + 10,
      });
    }
    setMetrics(initialData);
  }, []);

  // Poll metrics shifts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newCpu = Math.floor(Math.random() * 35) + 12;
      const newMemory = parseFloat((Math.random() * 0.6 + 3.9).toFixed(1));
      const newDb = Math.floor(Math.random() * 5) + 5;
      const newWs = Math.floor(Math.random() * 6) + 12;

      setMetrics((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: timeStr,
          cpu: newCpu,
          memory: newMemory,
          dbPool: newDb,
          websockets: newWs
        });
        return next;
      });

      setSysHealth({
        cpu: newCpu,
        memory: newMemory,
        dbPool: newDb,
        websockets: newWs,
        uptime: '14 days, 3 hours'
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">CPU load</span>
            <h3 className="text-2xl font-extrabold mt-1 text-theme-text">{sysHealth.cpu}%</h3>
            <span className="text-[9px] font-bold text-emerald-500 mt-1 block">Healthy load</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-theme-primary">
            <Cpu size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">RAM usage</span>
            <h3 className="text-2xl font-extrabold mt-1 text-theme-text">{sysHealth.memory} GB</h3>
            <span className="text-[9px] font-bold text-emerald-500 mt-1 block">JVM heap optimal</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <HardDrive size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">DB connections</span>
            <h3 className="text-2xl font-extrabold mt-1 text-theme-text">{sysHealth.dbPool} / 50</h3>
            <span className="text-[9px] font-bold text-emerald-500 mt-1 block">Hikari active pools</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Database size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active WebSockets</span>
            <h3 className="text-2xl font-extrabold mt-1 text-theme-text">{sysHealth.websockets} clients</h3>
            <span className="text-[9px] font-bold text-emerald-500 mt-1 block">Lead broadcasting live</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
            <Wifi size={20} />
          </div>
        </div>
      </div>

      {/* Real-time charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-4">CPU Performance Load</h3>
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-4">JVM Memory Allocation</h3>
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

      {/* Backend Health Check table */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Spring Boot Subsystem Statuses</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-theme-text">Tomcat Web Container</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Port 8080</span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-theme-text">Hibernate JPA Layer</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Dialect MySQL</span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/25 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-theme-primary animate-spin" />
              <span className="text-xs font-bold text-theme-text">Uptime Counter</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-theme-text-muted">{sysHealth.uptime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
