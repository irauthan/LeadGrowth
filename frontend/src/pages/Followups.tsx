import React, { useEffect, useState, useRef } from 'react';
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
  Search,
  History,
  X
} from 'lucide-react';

export default function Followups() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'UPCOMING' | 'TODAY' | 'OVERDUE' | 'COMPLETED' | 'MISSED' | 'CANCELLED'>('UPCOMING');

  // Multi Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');

  // Selected Lead for Timeline modal
  const [timeline, setTimeline] = useState<any[]>([]);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // Create Follow-up Modal State
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
      setFollowups(res.data || []);
    } catch (err) {
      console.error('Failed to fetch followups', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/api/followups/${id}/complete`);
      setSuccessMsg('Follow-up marked as completed!');
      fetchFollowups();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const openTimeline = async (leadId: number) => {
    try {
      const res = await api.get(`/api/leads/${leadId}/timeline`);
      setTimeline(res.data || []);
      setShowTimelineModal(true);
    } catch (e) {
      alert('Failed to load client history timeline.');
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
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to schedule follow-up.');
    }
  };

  // Filter & Search Logic
  const filteredFollowups = followups.filter((f) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const itemDate = f.scheduledAt ? f.scheduledAt.split('T')[0] : '';
    const now = new Date().getTime();
    const scheduledTime = f.scheduledAt ? new Date(f.scheduledAt).getTime() : 0;

    let matchesTab = true;
    if (statusTab === 'UPCOMING') matchesTab = f.status !== 'COMPLETED' && scheduledTime >= now;
    else if (statusTab === 'TODAY') matchesTab = itemDate === todayStr;
    else if (statusTab === 'OVERDUE') matchesTab = f.status !== 'COMPLETED' && scheduledTime < now;
    else if (statusTab === 'COMPLETED') matchesTab = f.status === 'COMPLETED';
    else if (statusTab === 'MISSED') matchesTab = f.status === 'MISSED';
    else if (statusTab === 'CANCELLED') matchesTab = f.status === 'CANCELLED';

    const matchesSearch = 
      !searchTerm ||
      f.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.leadEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || b.scheduledAt || 0).getTime() - new Date(a.createdAt || a.scheduledAt || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || a.scheduledAt || 0).getTime() - new Date(b.createdAt || b.scheduledAt || 0).getTime();
    if (sortBy === 'a-z') return (a.leadName || '').localeCompare(b.leadName || '');
    if (sortBy === 'z-a') return (b.leadName || '').localeCompare(a.leadName || '');
    return 0;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Enterprise Follow-up Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Client Engagement Hub
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1">
            Follow-up Reminders & CRM Timeline
          </h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Schedule calls, emails, and meetings. Track past engagement histories to convert leads efficiently.
          </p>
        </div>

        <button
          onClick={() => { setShowCreateModal(true); setErrorMsg(''); setSuccessMsg(''); }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme-primary/20 transition-all"
        >
          <Plus size={16} /> Schedule Follow-up
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500 flex items-center gap-2">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Control Bar: Search & Sorting */}
      <div className="p-4 rounded-3xl border border-theme-border bg-theme-card shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search by client name, email, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-bg-alt border border-theme-border/60 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-theme-text focus:outline-none focus:border-theme-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="a-z">Sort: Client A-Z</option>
            <option value="z-a">Sort: Client Z-A</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'UPCOMING', label: 'Upcoming', icon: null },
          { id: 'TODAY', label: "Today's", icon: null },
          { id: 'OVERDUE', label: 'Overdue', icon: <AlertCircle size={12} className="text-amber-400" /> },
          { id: 'COMPLETED', label: 'Completed', icon: <CheckCircle size={12} className="text-emerald-400" /> },
          { id: 'MISSED', label: 'Missed', icon: null },
          { id: 'CANCELLED', label: 'Cancelled', icon: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all uppercase whitespace-nowrap ${
              statusTab === tab.id
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
                : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFollowups.map((f) => (
          <div key={f.id} className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-theme-primary/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-theme-text">{f.leadName || 'Client Contact'}</h4>
                  <span className="text-[10px] text-theme-text-muted block mt-0.5">{f.leadEmail}</span>
                </div>
                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  f.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  f.status === 'MISSED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}>
                  {f.type || 'CALL'} • {f.status}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-theme-text font-bold">
                  <Clock size={14} className="text-cyan-400" />
                  <span>Scheduled: {f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : 'N/A'}</span>
                </div>
                {f.notes && (
                  <p className="text-[11px] text-theme-text-muted italic pt-1 border-t border-theme-border/20">
                    "{f.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-theme-border/30 flex items-center justify-between gap-2">
              <button
                onClick={() => openTimeline(f.leadId)}
                className="text-[10px] font-bold text-theme-primary hover:underline flex items-center gap-1"
              >
                <History size={12} /> View Client Timeline
              </button>

              {f.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleComplete(f.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Check size={12} /> Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredFollowups.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-3xl border border-theme-border bg-theme-card text-xs text-theme-text-muted italic">
            No follow-up reminders found under "{statusTab}".
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div ref={modalRef} className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-theme-text">Schedule Client Follow-up</h3>
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
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Notes / Objectives</label>
                <textarea
                  rows={3}
                  placeholder="State meeting objectives..."
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

      {/* Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                <History size={18} className="text-theme-primary" /> Client CRM History Timeline
              </h3>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="p-1.5 rounded-xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative pl-6 space-y-4 max-h-[60vh] overflow-y-auto before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border">
              {timeline.map((item: any) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-theme-primary border-2 border-theme-bg" />
                  <div className="p-3.5 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                      <span>{item.action}</span>
                      <span className="text-[10px] text-theme-text-muted">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-theme-text-muted">{item.description}</p>
                    <span className="text-[9px] font-semibold text-theme-text-muted block">By {item.performedByName || 'System'}</span>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-center text-xs text-theme-text-muted py-6">No historical records logged yet for this lead.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
