import { useEffect, useState } from 'react';
import api from '../services/api';
import type { DashboardKpis } from '../types';
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
import { Loader2 } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-500" />
      </div>
    );
  }

  // Color Palettes
  const PIE_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#eab308', '#10b981', '#ef4444'];

  // Funnel data
  const funnelData = data ? Object.entries(data.funnel).map(([name, value]) => ({
    name,
    value,
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Drill down campaign clicks, conversion flows, and return on investment trends.
        </p>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spend vs Revenue Trends */}
        <div className="glass-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Spend vs Revenue Efficiency</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} name="Ad Spend ($)" />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Generated Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Click and Lead Conversion Trends */}
        <div className="glass-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Lead Capture Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" fillOpacity={0.15} fill="url(#colorLeads)" name="Leads Count" strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fillOpacity={0.15} fill="url(#colorClicks)" name="Clicks Count" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Platform share */}
        <div className="glass-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Leads by platform share</h3>
          <div className="flex h-80 w-full items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.platformLeadsShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="platform"
                  label
                >
                  {data?.platformLeadsShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel Pipeline Breakdown */}
        <div className="glass-card rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Lead funnel conversion rate</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" barSize={20} radius={10}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
