import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Task, Lead, User as MemberType } from '../../types';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  CheckSquare, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leadQueue, setLeadQueue] = useState<Lead[]>([]);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Task Creation form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedToId: '', priority: 'Medium', dueDate: '' });
  const [creatingTask, setCreatingTask] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const [tasksRes, queueRes, membersRes] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/leads/queue').catch(() => ({ data: [] })),
        api.get('/api/users/members')
      ]);

      setTasks(tasksRes.data);
      setLeadQueue(queueRes.data || []);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load Manager Operations data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId: number) => {
    try {
      const res = await api.post(`/api/tasks/${taskId}/approve`);
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleRejectTask = async (taskId: number) => {
    try {
      const res = await api.post(`/api/tasks/${taskId}/reject`);
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleAutoAssignLead = async (leadId: number) => {
    try {
      await api.post(`/api/leads/queue/${leadId}/auto-assign`);
      fetchManagerData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Auto-assignment failed.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!taskForm.title.trim()) {
      setErrorMsg('Task title is required.');
      setCreatingTask(false);
      return;
    }

    try {
      const payload: any = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
      };

      if (taskForm.assignedToId) {
        payload.assignedToId = parseInt(taskForm.assignedToId);
      }
      if (taskForm.dueDate && taskForm.dueDate.trim() !== '') {
        payload.dueDate = taskForm.dueDate;
      }

      await api.post('/api/tasks', payload);
      setTaskForm({ title: '', description: '', assignedToId: '', priority: 'Medium', dueDate: '' });
      setSuccessMsg('Task created and assigned successfully!');
      fetchManagerData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Operations Control Center...</span>
      </div>
    );
  }

  // Filter task queues
  const reviewTasks = tasks.filter(t => t.status === 'PENDING_REVIEW' || t.status === 'Pending_Review');
  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'In_Progress' || t.status === 'PENDING' || t.status === 'Pending');

  return (
    <div className="space-y-6">

      {/* Header Operations Control Center Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Team Leader</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Operations Operations Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-text mt-1">Operations Control Center</h1>
            <p className="text-xs text-theme-text-muted mt-0.5">Manage team workload, assign incoming lead queue, and review task submissions.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-theme-border bg-theme-bg-alt text-xs font-bold text-theme-text hover:bg-theme-border/20 transition-all"
          >
            <UserCheck size={14} /> Team Roster
          </Link>
          <Link
            to="/tasks"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-xs font-bold text-white shadow-lg shadow-theme-primary/10 transition-all"
          >
            <CheckSquare size={14} /> Full Kanban Board
          </Link>
        </div>
      </div>

      {/* Top Operations Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Team Members Count */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Sales Team</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-theme-primary">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{members.length} Members</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Available for Lead Assignments</span>
        </div>

        {/* Unassigned Lead Queue */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Unassigned Lead Queue</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Zap size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{leadQueue.length} Leads</h3>
          <span className="text-[9px] font-bold text-amber-500 block">Requires Assignment</span>
        </div>

        {/* Tasks Pending Approval */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Pending Manager Review</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <CheckSquare size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{reviewTasks.length} Submissions</h3>
          <span className="text-[9px] font-bold text-purple-400 block">Requires Quality Approval</span>
        </div>

        {/* Active Workload Tasks */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Workload Tasks</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Clock size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{activeTasks.length} In Progress</h3>
          <span className="text-[9px] font-bold text-cyan-400 block">Team Operations</span>
        </div>

      </div>

      {/* Main Operations Grid: Task Reviews & Lead Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Review & Approval Queue */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border/30 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-purple-400" />
              <h3 className="text-sm font-bold text-theme-text">Tasks Awaiting Approval ({reviewTasks.length})</h3>
            </div>
            <Link to="/tasks" className="text-xs font-bold text-theme-primary hover:underline">View All</Link>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {reviewTasks.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-theme-text">{t.title}</h4>
                  <p className="text-[10px] text-theme-text-muted mt-0.5">{t.description}</p>
                  <span className="text-[9px] font-semibold text-theme-primary block mt-1">Assignee: {t.assignedToName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveTask(t.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectTask(t.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {reviewTasks.length === 0 && (
              <p className="text-xs text-theme-text-muted italic text-center py-10">No submitted tasks pending review.</p>
            )}
          </div>
        </div>

        {/* Lead Queue Auto-Assignment */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border/30 pb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-theme-text">Unassigned Lead Queue ({leadQueue.length})</h3>
            </div>
            <Link to="/leads" className="text-xs font-bold text-theme-primary hover:underline">View Leads</Link>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {leadQueue.map((lead) => (
              <div key={lead.id} className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-theme-text">{lead.name}</h4>
                  <span className="text-[10px] text-theme-text-muted block mt-0.5">{lead.email} | {lead.sourcePlatform}</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mt-1 inline-block">
                    {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75} PTS)
                  </span>
                </div>
                <button
                  onClick={() => handleAutoAssignLead(lead.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles size={12} /> Auto-Assign
                </button>
              </div>
            ))}
            {leadQueue.length === 0 && (
              <p className="text-xs text-theme-text-muted italic text-center py-10">Lead queue is empty. All leads assigned!</p>
            )}
          </div>
        </div>

      </div>

      {/* Quick Create Task Form */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-theme-text">Create & Assign Workspace Task</h3>
        {successMsg && <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500">{successMsg}</div>}
        {errorMsg && <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">{errorMsg}</div>}

        <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Task Title *"
            required
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium outline-none focus:border-theme-primary text-theme-text"
          />

          <select
            value={taskForm.assignedToId}
            onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium outline-none focus:border-theme-primary text-theme-text"
          >
            <option value="">Unassigned Queue</option>
            <option value="-1">🎲 Auto-Assign via Engine</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName}</option>
            ))}
          </select>

          <input
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium outline-none focus:border-theme-primary text-theme-text"
          />

          <button
            type="submit"
            disabled={creatingTask}
            className="w-full rounded-2xl bg-theme-primary hover:bg-theme-primary-hover py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Create Task
          </button>
        </form>
      </div>

    </div>
  );
}
