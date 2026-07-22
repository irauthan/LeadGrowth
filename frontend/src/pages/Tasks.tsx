import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Task, User } from '../types';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function Tasks() {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Task creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    priority: 'Medium',
    requiredSkill: '',
  });

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (taskId: number, nextStatus: 'Pending' | 'In_Progress' | 'Completed') => {
    try {
      const res = await api.patch(`/api/tasks/${taskId}/status?status=${nextStatus}`);
      const updated = res.data;
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (taskId: number) => {
    try {
      const res = await api.post(`/api/tasks/${taskId}/approve`);
      setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (taskId: number) => {
    try {
      const res = await api.post(`/api/tasks/${taskId}/reject`);
      setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoAssign = async (taskId: number) => {
    try {
      const res = await api.post(`/api/tasks/${taskId}/auto-assign`);
      setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Auto-assignment failed. No eligible team members available.');
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...createForm,
        assignedToId: createForm.assignedToId ? parseInt(createForm.assignedToId) : undefined,
      };
      await api.post('/api/tasks', payload);
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        assignedToId: '',
        dueDate: '',
        priority: 'Medium',
        requiredSkill: '',
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Group tasks for Kanban columns
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'Pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'In_Progress' || t.status === 'In Progress' || t.status === 'REJECTED' || t.status === 'Rejected');
  const reviewTasks = tasks.filter((t) => t.status === 'PENDING_REVIEW' || t.status === 'Pending_Review');
  const approvedTasks = tasks.filter((t) => t.status === 'APPROVED' || t.status === 'Approved' || t.status === 'Completed' || t.status === 'COMPLETED');

  const renderCard = (task: Task) => {
    const isTaskPending = task.status === 'PENDING' || task.status === 'Pending';
    const isTaskActive = task.status === 'IN_PROGRESS' || task.status === 'In_Progress' || task.status === 'In Progress' || task.status === 'REJECTED' || task.status === 'Rejected';
    const isTaskReview = task.status === 'PENDING_REVIEW' || task.status === 'Pending_Review';
    
    return (
      <div key={task.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/60 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{task.title}</h4>
            {(isAdmin || isManager) && (
              <button
                onClick={() => handleDelete(task.id)}
                className="hidden group-hover:block text-rose-500 hover:text-rose-600 transition-colors"
                title="Delete Task"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{task.description}</p>
          {task.requiredSkill && (
            <div className="mt-2.5">
              <span className="bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Skill: {task.requiredSkill}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-400">
            <div className="flex items-center gap-1.5">
              <UserIcon size={12} />
              <span>{task.assignedToName || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{task.dueDate}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              task.priority?.toUpperCase() === 'HIGH' || task.priority?.toUpperCase() === 'URGENT'
                ? 'bg-rose-500/10 text-rose-500' 
                : task.priority?.toUpperCase() === 'MEDIUM' 
                ? 'bg-indigo-500/10 text-indigo-500' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            }`}>
              {task.priority} Priority
            </span>

            {/* Quick State-Transition actions */}
            <div className="flex items-center gap-1.5">
              {/* Unassigned -> auto-assign trigger */}
              {isTaskPending && !task.assignedToId && (isAdmin || isManager) && (
                <button
                  onClick={() => handleAutoAssign(task.id)}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-500 text-white hover:from-brand-700 hover:to-indigo-600 text-[10px] font-bold px-2 py-1 shadow-sm flex items-center gap-1"
                  title="Trigger Hybrid Assignment Algorithm"
                >
                  <Sparkles size={10} />
                  <span>Auto-Assign</span>
                </button>
              )}

              {/* Pending Queue -> start task */}
              {isTaskPending && task.assignedToId && (
                <button
                  onClick={() => handleStatusChange(task.id, 'In_Progress')}
                  className="rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 p-1 dark:text-indigo-400"
                  title="Start Task"
                >
                  <ArrowRight size={12} />
                </button>
              )}

              {/* Active -> submit for review */}
              {isTaskActive && (
                <button
                  onClick={() => handleStatusChange(task.id, 'Completed')}
                  className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-bold px-2.5 py-1.5 transition-all flex items-center gap-1 shadow-sm"
                  title="Submit for Approval"
                >
                  <CheckCircle size={11} />
                  <span>Submit Review</span>
                </button>
              )}

              {/* Review -> Approve / Reject */}
              {isTaskReview && (isAdmin || isManager) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleApprove(task.id)}
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 shadow-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(task.id)}
                    className="rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold px-2 py-1 shadow-xs"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Tasks Board</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Assign duties to lead specialists and follow up on marketing goals.
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg"
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Queue Column */}
        <div className="rounded-3xl border border-slate-200/50 bg-slate-50 p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/15 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Task Queue</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {pendingTasks.length}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {pendingTasks.map(renderCard)}
            {pendingTasks.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">Queue is empty.</p>
            )}
          </div>
        </div>

        {/* Active Column */}
        <div className="rounded-3xl border border-slate-200/50 bg-slate-50 p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/15 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Active</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                {inProgressTasks.length}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {inProgressTasks.map(renderCard)}
            {inProgressTasks.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">No active tasks.</p>
            )}
          </div>
        </div>

        {/* Pending Review Column */}
        <div className="rounded-3xl border border-slate-200/50 bg-slate-50 p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/15 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Pending Review</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {reviewTasks.length}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {reviewTasks.map(renderCard)}
            {reviewTasks.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">No tasks pending approval.</p>
            )}
          </div>
        </div>

        {/* Approved Column */}
        <div className="rounded-3xl border border-slate-200/50 bg-slate-50 p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/15 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Approved</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {approvedTasks.length}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {approvedTasks.map(renderCard)}
            {approvedTasks.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">No approved tasks.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Workspace Task</h3>
            <p className="text-xs text-slate-400 mb-4">Set up a task card for a team member.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Optimize ad target keywords"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly state action instructions..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Assignee</label>
                  <select
                    value={createForm.assignedToId}
                    onChange={(e) => setCreateForm({ ...createForm, assignedToId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="">Unassigned (Queue)</option>
                    <option value="-1">🎲 Auto-Assign via Engine</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Required Skill</label>
                  <input
                    type="text"
                    placeholder="e.g. Meta Ads, Copywriting"
                    value={createForm.requiredSkill}
                    onChange={(e) => setCreateForm({ ...createForm, requiredSkill: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
