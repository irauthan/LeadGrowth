import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { DashboardKpis as KpiType, Task, Lead, User as MemberType } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  Loader2,
  Zap,
  Layers,
  Sparkles,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<KpiType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<MemberType[]>([]);

  // Task assignment form (for Manager Dashboard)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedToId: '', priority: 'Medium', dueDate: '' });
  const [assigningTask, setAssigningTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState('');

  // Sticky notes (for User Dashboard)
  const [stickies, setStickies] = useState<string[]>(['Follow up with Pooja Sharma tomorrow.', 'Review campaigns spend breakdown for Priya.']);
  const [newSticky, setNewSticky] = useState('');

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');
  const isUser = user?.roles.includes('ROLE_USER') && !isAdmin && !isManager;

  useEffect(() => {
    fetchDashboardData();
    fetchTasks();
    fetchLeads();
    if (!isUser) {
      fetchMembers();
    }
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

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/members');
      setMembers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Live WebSocket Integration
  useWebSocket({
    workspaceId: user?.workspaceId,
    onLeadReceived: (newLead) => {
      setData((prev) => {
        if (!prev) return prev;
        const leads = [newLead, ...prev.recentLeads.filter(l => l.id !== newLead.id)].slice(0, 10);
        return {
          ...prev,
          totalLeads: prev.totalLeads + 1,
          recentLeads: leads
        };
      });
      fetchLeads();
    }
  });

  const handleAssignLead = async (leadId: number, userId: string) => {
    try {
      await api.patch(`/api/leads/${leadId}/assign?userId=${userId}`);
      fetchLeads();
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigningTask(true);
    setTaskSuccess('');
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        assignedToId: taskForm.assignedToId ? parseInt(taskForm.assignedToId) : undefined,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        status: 'Pending'
      };
      await api.post('/api/tasks', payload);
      setTaskForm({ title: '', description: '', assignedToId: '', priority: 'Medium', dueDate: '' });
      setTaskSuccess('Task assigned successfully!');
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningTask(false);
    }
  };

  const handleTaskStatus = async (taskId: number, status: string) => {
    try {
      await api.patch(`/api/tasks/${taskId}/status?status=${status}`);
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeadStatus = async (leadId: number, status: string) => {
    try {
      await api.patch(`/api/leads/${leadId}/status?status=${status}`);
      fetchLeads();
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const addSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSticky.trim()) return;
    setStickies([newSticky, ...stickies]);
    setNewSticky('');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded bg-theme-bg-alt animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-theme-bg-alt animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 rounded-3xl bg-theme-bg-alt lg:col-span-2 animate-pulse" />
          <div className="h-96 rounded-3xl bg-theme-bg-alt animate-pulse" />
        </div>
      </div>
    );
  }

  // Dashboard Header Title Greeting
  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-theme-text flex items-center gap-2">
          Welcome back, {user?.fullName} <Sparkles className="text-cyan-600 dark:text-cyan-400 animate-pulse" size={24} />
        </h1>
        <p className="mt-1 text-sm font-semibold text-theme-text-muted">
          SaaS Workspace: <span className="text-blue-600 dark:text-blue-400 font-bold">{user?.workspaceName}</span> • Role: <span className="bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full uppercase text-[11px] ml-1">{user?.roles[0]?.replace('ROLE_', '')}</span>
        </p>
      </div>
      <div className="flex gap-2">
        <span className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-2xl">
          <Zap size={12} className="animate-bounce" /> Live WebSockets
        </span>
      </div>
    </div>
  );

  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================
  const renderAdminDashboard = () => {
    const kpis = [
      { label: 'Total Revenue', value: formatCurrency(data?.totalRevenue), desc: 'Aggregated earnings', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
      { label: 'Total Leads', value: formatNumber(data?.totalLeads), desc: 'Workspace total leads', icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
      { label: 'Marketing Spend', value: formatCurrency(data?.totalSpend), desc: 'Ad campaigns cost', icon: TrendingUp, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' },
      { label: 'Team Size', value: members.length.toString(), desc: 'Active workspace members', icon: Layers, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' }
    ];

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">{kpi.label}</p>
                <h3 className="mt-2 text-3xl font-extrabold text-theme-text">{kpi.value}</h3>
                <p className="mt-1 text-xs font-medium text-theme-text-muted">{kpi.desc}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Recharts Trend Line + Workspace Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-3xl p-6 lg:col-span-2 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider">Growth Reports</h4>
                <p className="text-sm text-theme-text-muted">Revenue vs spend performance trends</p>
              </div>
              <span className="text-xs bg-theme-bg-alt text-theme-text-muted font-bold px-2 py-1 rounded">Last 7 Days</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trends || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '12px' }} labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  <Area type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" name="Spend" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider">Workspace Health</h4>
              <p className="text-sm text-theme-text-muted">API configurations & metadata metrics</p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-theme-border pb-2">
                  <span className="text-sm text-theme-text-muted">Timezone</span>
                  <span className="text-sm font-bold text-theme-text">GMT+5:30 (India)</span>
                </div>
                <div className="flex items-center justify-between border-b border-theme-border pb-2">
                  <span className="text-sm text-theme-text-muted">Industry Sector</span>
                  <span className="text-sm font-bold text-theme-text">Digital Marketing</span>
                </div>
                <div className="flex items-center justify-between border-b border-theme-border pb-2">
                  <span className="text-sm text-theme-text-muted">Invite Code</span>
                  <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">{user?.inviteCode}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-theme-border pt-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted block mb-3">API Integration Status</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-bg-alt border border-theme-border">
                  <span className="text-sm font-semibold text-theme-text">Meta API V18</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-bg-alt border border-theme-border">
                  <span className="text-sm font-semibold text-theme-text">Google Marketing API</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Directory Quick Look */}
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider">Workspace Users Directory</h4>
              <p className="text-sm text-theme-text-muted">Quick list of registered team members</p>
            </div>
            <Link to="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
              Manage Users <ExternalLink size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-theme-border text-xs font-extrabold uppercase text-theme-text-muted">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Department</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-sm">
                {members.slice(0, 5).map((m) => (
                  <tr key={m.id} className="text-theme-text-muted">
                    <td className="py-3 font-bold text-theme-text">{m.fullName}</td>
                    <td className="py-3">{m.email}</td>
                    <td className="py-3"><span className="text-xs font-semibold text-theme-text-muted bg-theme-bg-alt px-2 py-0.5 rounded-full">{((typeof m.roles?.[0] === 'string' ? m.roles[0] : (m.roles?.[0] as any)?.name) || 'USER').replace('ROLE_', '')}</span></td>
                    <td className="py-3">{m.department || 'N/A'}</td>
                    <td className="py-3">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // MANAGER DASHBOARD
  // ==========================================
  const renderManagerDashboard = () => {
    // KPI aggregations
    const unassignedCount = leads.filter(l => l.assignedToId === null || l.assignedToId === undefined).length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In_Progress').length;
    const conversionsRate = leads.length > 0 
      ? ((leads.filter(l => l.status === 'Converted').length / leads.length) * 100).toFixed(1)
      : '0.0';

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">Unassigned Leads</p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{unassignedCount}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Awaiting assignment</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">Active Workload</p>
              <h3 className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{pendingTasks}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Incomplete team tasks</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">Lead Conversion Rate</p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{conversionsRate}%</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Lead to Converted ratio</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">Campaign Conversions</p>
              <h3 className="mt-2 text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{data?.totalConversions}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Total conversions tracked</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Lead Assignment Widget + Assign Task Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Lead Assignment Table */}
          <div className="glass-card rounded-3xl p-6 shadow-xl">
            <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider mb-2">Unassigned Leads Queue</h4>
            <p className="text-sm text-theme-text-muted mb-4">Select workspace member to assign lead</p>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-theme-border text-xs font-extrabold uppercase text-theme-text-muted">
                    <th className="py-2">Lead</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Assign To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border text-sm">
                  {leads.filter(l => !l.assignedToId).map((l) => (
                    <tr key={l.id} className="text-theme-text-muted">
                      <td className="py-2">
                        <div className="font-bold text-theme-text">{l.name}</div>
                        <div className="text-xs text-theme-text-muted">{l.email}</div>
                      </td>
                      <td className="py-2">{l.sourcePlatform}</td>
                      <td className="py-2">
                        <select
                          onChange={(e) => handleAssignLead(l.id, e.target.value)}
                          className="rounded-xl border border-theme-border bg-theme-bg-alt px-2 py-1 text-sm outline-none focus:border-theme-primary text-theme-text"
                          defaultValue=""
                        >
                          <option value="" disabled>Select User...</option>
                          <option value="-1">🎲 Auto Load Balance</option>
                          {members.filter(u => u.status === 'ACTIVE').map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {leads.filter(l => !l.assignedToId).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-theme-text-muted italic">No unassigned leads found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Task Assign Form */}
          <div className="glass-card rounded-3xl p-6 shadow-xl">
            <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider mb-2">Create & Assign Workspace Task</h4>
            <p className="text-sm text-theme-text-muted mb-4">Input instructions and select assignee</p>

            {taskSuccess && (
              <div className="mb-3 rounded-xl bg-green-500/10 border border-green-500/30 p-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                {taskSuccess}
              </div>
            )}

            <form onSubmit={handleTaskSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-sm outline-none focus:border-theme-primary text-theme-text"
                />
              </div>
              <div>
                <textarea
                  rows={2}
                  placeholder="Task instructions/description..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-sm outline-none focus:border-theme-primary text-theme-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={taskForm.assignedToId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-sm outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="">Unassigned</option>
                    <option value="-1">🎲 Auto Load Balance</option>
                    {members.filter(u => u.status === 'ACTIVE').map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="date"
                    required
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={assigningTask}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-theme-primary py-2 text-sm font-bold text-white hover:bg-theme-primary-hover disabled:opacity-50"
              >
                {assigningTask ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Assign Task</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // USER DASHBOARD
  // ==========================================
  const renderUserDashboard = () => {
    const myLeads = leads.filter(l => l.assignedToId === user?.id);
    const myTasks = tasks.filter(t => t.assignedToId === user?.id);

    return (
      <div className="space-y-6">
        {/* User KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">My Leads</p>
              <h3 className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{myLeads.length}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Leads assigned to me</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">My Completed Tasks</p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{myTasks.filter(t => t.status === 'Completed').length}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Out of {myTasks.length} total tasks</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="glass-card flex items-center justify-between rounded-3xl p-6 shadow-xl">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">Active Leads Pipeline</p>
              <h3 className="mt-2 text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">{myLeads.filter(l => l.status === 'Qualified' || l.status === 'Contacted').length}</h3>
              <p className="mt-1 text-xs text-theme-text-muted">Qualified or Contacted</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Zap size={20} />
            </div>
          </div>
        </div>

        {/* Assigned Tasks & Leads Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* My Tasks Kanban Column */}
          <div className="glass-card rounded-3xl p-6 lg:col-span-2 shadow-xl">
            <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider mb-2">My Assigned Tasks Kanban</h4>
            <p className="text-sm text-theme-text-muted mb-4">Click action icons to transition status values</p>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myTasks.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-theme-bg-alt border border-theme-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        t.priority === 'High' || t.priority === 'Urgent' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-theme-bg-alt text-theme-text-muted'
                      }`}>{t.priority}</span>
                      <h5 className="text-sm font-bold text-theme-text">{t.title}</h5>
                    </div>
                    <p className="mt-1 text-sm text-theme-text-muted">{t.description}</p>
                    <p className="mt-1 text-[11px] font-semibold text-theme-text-muted">Due: {formatDate(t.dueDate)} • Issued By: {t.assignedByName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      t.status === 'In_Progress' || t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      t.status === 'Rejected' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      'bg-theme-bg-alt text-theme-text-muted'
                    }`}>{t.status}</span>

                    {t.status !== 'Completed' && t.status !== 'Rejected' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleTaskStatus(t.id, 'In_Progress')}
                          className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-600 dark:text-blue-400 text-xs font-bold"
                        >
                          Work
                        </button>
                        <button
                          onClick={() => handleTaskStatus(t.id, 'Completed')}
                          className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                        >
                          Finish
                        </button>
                        <button
                          onClick={() => handleTaskStatus(t.id, 'Rejected')}
                          className="px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-600 dark:text-red-400 text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {myTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-theme-text-muted italic">No tasks currently assigned.</p>
              )}
            </div>
          </div>

          {/* Sticky Notes Widget */}
          <div className="glass-card rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider mb-2">My Work Sticky Pad</h4>
              <p className="text-sm text-theme-text-muted mb-4">Quick reminders and scratch notes</p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stickies.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300 font-medium text-left">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={addSticky} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Add sticky note..."
                value={newSticky}
                onChange={(e) => setNewSticky(e.target.value)}
                className="flex-1 rounded-xl border border-theme-border bg-theme-bg-alt py-1.5 px-3 text-sm outline-none focus:border-theme-primary text-theme-text"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* My Assigned Leads pipeline */}
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <h4 className="text-base font-extrabold text-theme-text uppercase tracking-wider mb-2">My Leads List</h4>
          <p className="text-sm text-theme-text-muted mb-4">Update status of leads assigned to you</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-theme-border text-xs font-extrabold uppercase text-theme-text-muted">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Platform</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-sm">
                {myLeads.map((l) => (
                  <tr key={l.id} className="text-theme-text-muted">
                    <td className="py-3 font-bold text-theme-text">{l.name}</td>
                    <td className="py-3">{l.email}</td>
                    <td className="py-3">{l.sourcePlatform}</td>
                    <td className="py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        l.status === 'Rejected' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-theme-bg-alt text-theme-text-muted'
                      }`}>{l.status}</span>
                    </td>
                    <td className="py-3">
                      <select
                        onChange={(e) => handleLeadStatus(l.id, e.target.value)}
                        className="rounded bg-theme-bg-alt border border-theme-border text-theme-text text-xs p-1 font-semibold"
                        value={l.status}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Converted">Converted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {myLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-theme-text-muted italic">No leads assigned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderHeader()}
      {isAdmin ? renderAdminDashboard() : isManager ? renderManagerDashboard() : renderUserDashboard()}
    </div>
  );
}
