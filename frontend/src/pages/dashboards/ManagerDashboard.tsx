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
  Zap,
  Eye,
  Lightbulb,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CallDetailsModal from '../../components/CallDetailsModal';

import TimeFilterDropdown, { type TimeFilterState } from '../../components/TimeFilterDropdown';

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leadQueue, setLeadQueue] = useState<Lead[]>([]);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });

  // Quick Task Creation form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedToId: '', priority: 'Medium', dueDate: '' });
  const [creatingTask, setCreatingTask] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchManagerData();
  }, [timeFilter]);

  const [teamAnalytics, setTeamAnalytics] = useState<any>(null);
  const [workloadScores, setWorkloadScores] = useState<any[]>([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<{ userId?: number; userName?: string }>({});

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const params: any = { period: timeFilter.period };
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      const [tasksRes, queueRes, membersRes, callsRes, workloadRes] = await Promise.all([
        api.get('/api/tasks', { params }),
        api.get('/api/leads/queue', { params }).catch(() => ({ data: [] })),
        api.get('/api/users/assignable').catch(() => api.get('/api/users/members')),
        api.get('/api/calls/team', { params }).catch(() => ({ data: null })),
        api.get('/api/assignments/workload-scores').catch(() => ({ data: [] }))
      ]);

      const salesExecs = (membersRes.data || []).filter((m: any) => {
        const roleNames = (m.roles || []).map((r: any) => (r.name || r || '').toUpperCase());
        const hasUser = roleNames.includes('ROLE_USER') || roleNames.includes('USER');
        const hasAdminOrManager = roleNames.includes('ROLE_ADMIN') || roleNames.includes('ADMIN') || roleNames.includes('ROLE_MANAGER') || roleNames.includes('MANAGER');
        return roleNames.length === 0 || (hasUser && !hasAdminOrManager);
      });

      setTasks(tasksRes.data);
      setLeadQueue(queueRes.data || []);
      setMembers(salesExecs);
      setTeamAnalytics(callsRes.data);
      setWorkloadScores(workloadRes.data || []);
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-theme-text">Operations Control Center</h1>
            <p className="text-xs text-theme-text-muted mt-1">Manage team workload, assign incoming lead queue, and review task submissions.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
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
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Sales Team</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{members.length} Members</h3>
          <span className="text-[10px] font-semibold text-blue-500 block">Available for Lead Assignments</span>
        </div>

        {/* Unassigned Lead Queue */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Unassigned Lead Queue</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{leadQueue.length} Leads</h3>
          <span className="text-[10px] font-semibold text-amber-500 block">Requires Assignment</span>
        </div>

        {/* Tasks Pending Approval */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Pending Manager Review</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CheckSquare size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{reviewTasks.length} Submissions</h3>
          <span className="text-[10px] font-semibold text-purple-400 block">Requires Quality Approval</span>
        </div>

        {/* Active Workload Tasks */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Workload Tasks</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-theme-text">{activeTasks.length} In Progress</h3>
          <span className="text-[10px] font-semibold text-cyan-400 block">Team Operations</span>
        </div>

      </div>

      {/* Module 7: Manager Team Call Productivity & Leaderboard */}
      <div className="p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border/40 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
              <Users size={18} className="text-theme-primary" /> Team Call Productivity & Effort Analytics
            </h3>
            <p className="text-xs text-theme-text-muted">Monitor team call duration, active calls, and daily productivity output</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedUserFilter({});
                setIsCallModalOpen(true);
              }}
              className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 px-3 py-1.5 rounded-2xl text-xs font-bold text-rose-500 transition-all cursor-pointer flex items-center gap-1.5 group"
            >
              <span>Total Call Time:</span>
              <span className="text-rose-500 font-mono font-black">{teamAnalytics?.totalTeamCallTimeFormatted || '00:00:00'}</span>
              <Eye size={12} className="text-rose-500/70 group-hover:text-rose-500 transition-colors" />
            </button>
            <button
              onClick={() => {
                setSelectedUserFilter({});
                setIsCallModalOpen(true);
              }}
              className="bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 px-3 py-1.5 rounded-2xl text-xs font-bold text-cyan-500 transition-all cursor-pointer flex items-center gap-1.5 group"
            >
              <span>Calls Today:</span>
              <span className="text-cyan-500 font-black">{teamAnalytics?.totalTeamCallsToday || 0}</span>
              <Eye size={12} className="text-cyan-500/70 group-hover:text-cyan-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Team Calling Leaderboard Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Sales Executive Call Leaderboard
            </h4>
            <span className="text-[10px] text-theme-text-muted font-bold flex items-center gap-1.5">
              <Lightbulb size={13} className="text-amber-400" />
              <span>Click any executive row to view conversation details</span>
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-theme-border/50 text-[10px] uppercase text-theme-text-muted font-bold">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Sales Executive</th>
                  <th className="py-2.5 px-3">Today's Calls</th>
                  <th className="py-2.5 px-3">Total Call Time</th>
                  <th className="py-2.5 px-3">Avg Call Duration</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {(teamAnalytics?.userProductivityLeaderboard || []).map((row: any) => (
                  <tr
                    key={row.userId}
                    onClick={() => {
                      setSelectedUserFilter({ userId: row.userId, userName: row.userName });
                      setIsCallModalOpen(true);
                    }}
                    className="hover:bg-theme-bg-alt/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-[10px] ${
                        row.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        row.rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                        row.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' :
                        'bg-theme-bg-alt text-theme-text-muted'
                      }`}>
                        #{row.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-theme-text group-hover:text-theme-primary transition-colors">
                      {row.userName}
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-400">{row.callsCount} calls</td>
                    <td className="py-3 px-3 font-mono font-black text-rose-400">{row.callTimeFormatted}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">{row.avgDurationFormatted}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 group-hover:underline">
                        <Eye size={12} /> View Log
                      </span>
                    </td>
                  </tr>
                ))}
                {(!teamAnalytics?.userProductivityLeaderboard || teamAnalytics.userProductivityLeaderboard.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-theme-text-muted italic">
                      No team call sessions recorded today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module 13: Smart Lead Auto Assignment Engine Workload Score Table */}
        <div className="pt-4 border-t border-theme-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-400" /> Smart Auto Assignment Engine Foundation (Workload Scores)
              </h4>
              <span className="text-[10px] text-theme-text-muted">Calculates real user workload before auto-assigning incoming leads (Lower score = Preferred candidate)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-theme-border/50 text-[10px] uppercase text-theme-text-muted font-bold">
                  <th className="py-2.5 px-3">Sales Exec</th>
                  <th className="py-2.5 px-3">Active Leads</th>
                  <th className="py-2.5 px-3">Pending Follow-ups</th>
                  <th className="py-2.5 px-3">Today's Tasks</th>
                  <th className="py-2.5 px-3">Today Call Time</th>
                  <th className="py-2.5 px-3">Overdue Tasks</th>
                  <th className="py-2.5 px-3">Workload Score</th>
                  <th className="py-2.5 px-3">Assignment Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {workloadScores.map((scoreItem: any) => (
                  <tr key={scoreItem.userId} className="hover:bg-theme-bg-alt/30 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-theme-text">{scoreItem.userName}</td>
                    <td className="py-3 px-3 font-bold text-theme-text">{scoreItem.activeLeads}</td>
                    <td className="py-3 px-3 font-bold text-cyan-400">{scoreItem.pendingFollowups}</td>
                    <td className="py-3 px-3 font-bold text-amber-400">{scoreItem.todayActiveTasks}</td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-400">{scoreItem.todayCallTimeFormatted}</td>
                    <td className="py-3 px-3 font-bold text-rose-500">{scoreItem.overdueTasks}</td>
                    <td className="py-3 px-3 font-black text-purple-400 font-mono text-sm">{scoreItem.workloadScore}</td>
                    <td className="py-3 px-3">
                      {scoreItem.preferredForAutoAssignment ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Star size={11} className="text-emerald-400 fill-emerald-400/20" />
                          <span>Preferred Candidate</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-theme-bg-alt text-theme-text-muted border border-theme-border">
                          Active Capacity
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <option value="-1">Auto-Assign via Engine</option>
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

      {/* Call Details Modal for Manager */}
      <CallDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        initialUserId={selectedUserFilter.userId}
        userNameFilter={selectedUserFilter.userName}
        title={selectedUserFilter.userName ? `Call History for ${selectedUserFilter.userName}` : 'Team Call Activity Audit Logs'}
        period={timeFilter.period}
        startDate={timeFilter.startDate}
        endDate={timeFilter.endDate}
      />

    </div>
  );
}
