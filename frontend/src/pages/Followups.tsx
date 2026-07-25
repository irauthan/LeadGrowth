import { useEffect, useState, useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import api from '../services/api';
import type { Lead } from '../types';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Check, 
  Loader2, 
  MessageSquare
} from 'lucide-react';

export default function Followups() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UPCOMING' | 'PENDING' | 'MISSED' | 'COMPLETED'>('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    leadId: '',
    scheduledAt: '',
    type: 'CALL',
    notes: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (showCreateModal) setShowCreateModal(false);
  });

  useEffect(() => {
    fetchFollowups();
    fetchLeads();
  }, []);

  const fetchFollowups = async () => {
    try {
      const res = await api.get('/api/followups');
      setFollowups(res.data);
    } catch (err) {
      console.error('Failed to fetch followups', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/followups/${id}/complete`);
      setSuccessMsg('Follow-up marked as completed!');
      fetchFollowups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!createForm.leadId || !createForm.scheduledAt) {
      setErrorMsg('Please select a lead and date/time.');
      return;
    }

    try {
      await api.post('/api/followups', {
        leadId: createForm.leadId,
        scheduledAt: createForm.scheduledAt,
        type: createForm.type,
        notes: createForm.notes
      });

      setShowCreateModal(false);
      setCreateForm({ leadId: '', scheduledAt: '', type: 'CALL', notes: '' });
      setSuccessMsg('Follow-up scheduled successfully!');
      fetchFollowups();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to schedule follow-up.');
    }
  };

  const filteredFollowups = followups.filter(f => filterStatus === 'ALL' || f.status === filterStatus);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Follow-up Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-text">Follow-up Reminders Engine</h1>
          <p className="mt-1 text-xs sm:text-sm text-theme-text-muted">
            Schedule and track lead calls, emails, and meetings to prevent lead decay.
          </p>
        </div>

        <button
          onClick={() => { setShowCreateModal(true); setErrorMsg(''); setSuccessMsg(''); }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-theme-primary/10 transition-all w-full sm:w-auto"
        >
          <Plus size={16} /> Schedule Follow-up
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500 flex items-center gap-2">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['ALL', 'UPCOMING', 'MISSED', 'COMPLETED'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all uppercase ${
              filterStatus === st
                ? 'bg-theme-primary text-white shadow-md'
                : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
            }`}
          >
            {st} ({followups.filter(f => st === 'ALL' || f.status === st).length})
          </button>
        ))}
      </div>

      {/* Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFollowups.map((f) => (
          <div key={f.id} className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-theme-text">{f.leadName}</h4>
                  <span className="text-[10px] text-theme-text-muted block mt-0.5">{f.leadEmail}</span>
                </div>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  f.status === 'MISSED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  'bg-blue-500/10 text-theme-primary border border-theme-primary/20'
                }`}>
                  {f.status}
                </span>
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-theme-text font-semibold">
                  <Clock size={14} className="text-theme-primary" />
                  <span>{f.scheduledAt ? f.scheduledAt.replace('T', ' ') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-theme-text-muted text-[11px]">
                  <MessageSquare size={12} />
                  <span>Type: <strong>{f.type}</strong></span>
                </div>
                {f.notes && (
                  <p className="text-[10px] text-theme-text-muted italic pt-1 border-t border-theme-border/20">{f.notes}</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-theme-border/30 flex items-center justify-between">
              <span className="text-[10px] text-theme-text-muted font-semibold">Assigned: {f.assignedToName}</span>
              {f.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleComplete(f.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Check size={12} /> Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredFollowups.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl border border-theme-border bg-theme-card text-xs text-theme-text-muted italic">
            No follow-ups matching status "{filterStatus}".
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div ref={modalRef} className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-theme-text">Schedule Lead Follow-up</h3>
            <p className="text-xs text-theme-text-muted">Set up a reminder for a call, email, or demo.</p>

            {errorMsg && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-bold text-rose-500 flex items-center gap-2">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Select Lead *</label>
                <select
                  required
                  value={createForm.leadId}
                  onChange={(e) => setCreateForm({ ...createForm, leadId: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
                >
                  <option value="">Select Lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.scheduledAt}
                    onChange={(e) => setCreateForm({ ...createForm, scheduledAt: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Type</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email Followup</option>
                    <option value="MEETING">Meeting</option>
                    <option value="DEMO">Product Demo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Notes / Context</label>
                <textarea
                  rows={3}
                  placeholder="State meeting objective..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-theme-border bg-theme-bg-alt px-5 py-2.5 text-xs font-semibold text-theme-text-muted hover:bg-theme-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
