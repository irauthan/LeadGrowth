import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { Task, Lead } from '../../types';
import { formatCurrency } from '../../utils';
import { 
  CheckSquare, 
  UserCheck, 
  Phone, 
  Mail, 
  Award, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Flame,
  Clock,
  CheckCircle2,
  DollarSign,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);

  const [kpis, setKpis] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [kpiRes, tasksRes, leadsRes, followupsRes] = await Promise.all([
        api.get('/api/users/me/dashboard').catch(() => ({ data: null })),
        api.get('/api/tasks'),
        api.get('/api/leads'),
        api.get('/api/followups').catch(() => ({ data: [] }))
      ]);

      setKpis(kpiRes.data);
      const myId = user?.id;
      setMyTasks((tasksRes.data || []).filter((t: Task) => t.assignedToId === myId));
      setMyLeads((leadsRes.data || []).filter((l: Lead) => l.assignedToId === myId));
      setFollowups((followupsRes.data || []).filter((f: any) => f.status !== 'COMPLETED'));
    } catch (err) {
      console.error('Failed to load User Productivity Hub data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, nextStatus: 'Pending' | 'In_Progress' | 'Completed') => {
    try {
      await api.patch(`/api/tasks/${taskId}/status?status=${nextStatus}`);
      fetchUserData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data) {
        setIdleMessage(`🎯 New lead auto-assigned: ${res.data.name}!`);
        fetchUserData();
      } else {
        setIdleMessage('Queue empty. You are fully caught up!');
      }
    } catch (e) {
      setIdleMessage('Sweep active. All queue items currently assigned.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Personal Sales Executive Hub...</span>
      </div>
    );
  }

  const assignedLeadsCount = kpis?.myAssignedLeads ?? myLeads.length;
  const activeTasksCount = kpis?.myActiveTasks ?? myTasks.filter(t => t.status !== 'Completed').length;
  const completedTasksCount = kpis?.myCompletedTasks ?? myTasks.filter(t => t.status === 'Completed').length;
  const pendingFollowupsCount = kpis?.myPendingFollowups ?? followups.length;
  const conversionsCount = kpis?.myConversions ?? myLeads.filter(l => l.status === 'Converted').length;
  const personalRevenue = kpis?.myRevenueContribution ?? (conversionsCount * 2500);

  return (
    <div className="space-y-6">

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Sales Executive Workspace</span>
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Award size={10} /> Productivity Score: {kpis?.productivityScore || 92}%
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1">
            Welcome back, {user?.fullName}! 👋
          </h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Track your assigned leads, execute tasks, complete client follow-ups, and drive personal conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleIdleSweep}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-blue-600 hover:from-theme-primary-hover hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme-primary/20 transition-all"
          >
            <Zap size={14} /> Ready For Next Lead
          </button>
        </div>
      </div>

      {idleMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2">
          <Sparkles size={16} /> {idleMessage}
        </div>
      )}

      {/* 6 Personal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* 1. My Assigned Leads */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Assigned Leads</span>
            <UserCheck size={16} className="text-theme-primary" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{assignedLeadsCount}</h3>
          <span className="text-[9px] font-bold text-theme-primary block">Active Contacts</span>
        </div>

        {/* 2. My Active Tasks */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Tasks</span>
            <CheckSquare size={16} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{activeTasksCount}</h3>
          <span className="text-[9px] font-bold text-amber-500 block">Pending Action</span>
        </div>

        {/* 3. My Completed Tasks */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Completed Tasks</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{completedTasksCount}</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Fulfilled Tasks</span>
        </div>

        {/* 4. My Pending Follow-Ups */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Pending Follow-ups</span>
            <Clock size={16} className="text-cyan-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{pendingFollowupsCount}</h3>
          <span className="text-[9px] font-bold text-cyan-400 block">Scheduled Calls/Emails</span>
        </div>

        {/* 5. My Conversions */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">My Conversions</span>
            <Flame size={16} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{conversionsCount}</h3>
          <span className="text-[9px] font-bold text-rose-500 block">{kpis?.conversionRate || 0}% Conversion Rate</span>
        </div>

        {/* 6. My Revenue Contribution */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Revenue Generated</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-extrabold text-emerald-400">{formatCurrency(personalRevenue)}</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Personal Contribution</span>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Assigned Leads & Active Tasks */}
        <div className="lg:col-span-2 space-y-6">

          {/* Assigned Leads Table */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <UserCheck size={16} className="text-theme-primary" /> My Assigned Leads
              </h3>
              <Link to="/leads" className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1">
                View All Leads <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
                  <tr>
                    <th className="p-3">Lead Name</th>
                    <th className="p-3">Platform</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Quality Tier</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {myLeads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="hover:bg-theme-bg-alt/30 transition-colors">
                      <td className="p-3 font-bold text-theme-text">{lead.name}</td>
                      <td className="p-3 text-theme-text-muted font-medium">{lead.sourcePlatform}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500' :
                          lead.status === 'Qualified' ? 'bg-cyan-500/10 text-cyan-400' :
                          'bg-theme-primary/10 text-theme-primary'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-extrabold text-amber-400 flex items-center gap-1">
                          🔥 HOT ({lead.qualityScore || 85} pts)
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`tel:${lead.phone || ''}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Phone size={13} />
                          </a>
                          <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Mail size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme-text-muted">
                        No assigned leads found. Click "Ready For Next Lead" to pull unassigned leads.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Tasks List */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <CheckSquare size={16} className="text-amber-500" /> My Active Tasks
              </h3>
              <Link to="/tasks" className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1">
                View Kanban Board <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {myTasks.filter(t => t.status !== 'Completed').slice(0, 4).map((task) => (
                <div key={task.id} className="p-4 rounded-2xl border border-theme-border bg-theme-bg-alt/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-theme-text">{task.title}</h4>
                    <p className="text-[11px] text-theme-text-muted">{task.description}</p>
                    <span className="text-[10px] font-bold text-amber-500 block">Due: {task.dueDate || 'Today'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(task.status === 'Pending' || task.status === 'PENDING') && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'In_Progress')}
                        className="px-3 py-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-[10px] font-bold text-white shadow"
                      >
                        Start Work
                      </button>
                    )}
                    {(task.status === 'In Progress' || task.status === 'In_Progress' || task.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'Completed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[10px] font-bold text-white shadow flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Submit Review
                      </button>
                    )}
                    {(task.status === 'PENDING_REVIEW' || task.status === 'Pending_Review') && (
                      <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold text-amber-400">
                        Pending Review ⏳
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {myTasks.filter(t => t.status !== 'Completed').length === 0 && (
                <p className="text-center text-xs text-theme-text-muted py-6">All active tasks completed! Great work.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Upcoming Follow-ups & Productivity Summary */}
        <div className="space-y-6">

          {/* Upcoming Follow-ups */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Scheduled Follow-ups
            </h3>

            <div className="space-y-3">
              {followups.slice(0, 4).map((f: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-theme-border/40 bg-theme-bg-alt/30 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                    <span>{f.leadName || 'Contact Call'}</span>
                    <span className="text-[10px] text-cyan-400">{f.type || 'CALL'}</span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted">{f.notes || 'Discuss campaign proposal'}</p>
                </div>
              ))}
              {followups.length === 0 && (
                <p className="text-center text-xs text-theme-text-muted py-6">No upcoming follow-up reminders scheduled.</p>
              )}
            </div>
          </div>

          {/* Daily Productivity & Response Time */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Personal Performance Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-theme-border/30">
                <span className="text-theme-text-muted font-semibold">Lead Conversion Rate:</span>
                <span className="font-extrabold text-emerald-500">{kpis?.conversionRate || 18.5}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-theme-border/30">
                <span className="text-theme-text-muted font-semibold">Task Fulfillment Rate:</span>
                <span className="font-extrabold text-theme-primary">{kpis?.taskCompletionRate || 95}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-theme-text-muted font-semibold">Avg. First Response Time:</span>
                <span className="font-extrabold text-cyan-400">1.8 Hours</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
