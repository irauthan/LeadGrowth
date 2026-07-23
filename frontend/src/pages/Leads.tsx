import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Lead, LeadNote, User } from '../types';
import { formatDate, formatShortDate } from '../utils';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Search, 
  Download, 
  MessageSquare, 
  Send, 
  Plus,
  Loader2,
  Phone,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { downloadReport } from '../services/reportService';

export default function Leads() {
  const user = useAuthStore((state) => state.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);

  // Selected Lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Lead Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    sourcePlatform: 'Meta',
    campaignId: '',
    campaignName: '',
    assignedToId: '',
  });

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');

  useEffect(() => {
    fetchLeads();
    fetchMembers();
    fetchCampaigns();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
      if (res.data.length > 0) {
        setSelectedLead(res.data[0]);
        fetchNotes(res.data[0].id);
      }
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

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotes = async (leadId: number) => {
    try {
      const res = await api.get(`/api/leads/${leadId}/notes`);
      setNotes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Live Real-Time WebSocket Alerts
  useWebSocket({
    workspaceId: user?.workspaceId,
    onLeadReceived: (newLead) => {
      setLeads((prev) => {
        // Only insert if it doesn't already exist to prevent duplicates
        if (prev.some((l) => l.id === newLead.id)) return prev;
        
        // Push notification sound or audio visual alert
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
          audio.volume = 0.2;
          audio.play();
        } catch (e) {
          // Ignore audio failures if browser blocks play
        }

        // Add to leads array
        return [newLead, ...prev];
      });

      // If no lead was selected before, select the new live lead
      setSelectedLead((prev) => {
        if (!prev) {
          fetchNotes(newLead.id);
          return newLead;
        }
        return prev;
      });
    },
  });

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    fetchNotes(lead.id);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedLead) return;
    try {
      const res = await api.patch(`/api/leads/${selectedLead.id}/status?status=${status}`);
      const updated = res.data;
      
      // Update local state
      setLeads(leads.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedLead(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignChange = async (memberId: number) => {
    if (!selectedLead) return;
    try {
      const res = await api.patch(`/api/leads/${selectedLead.id}/assign?userId=${memberId}`);
      const updated = res.data;
      
      // Update local state
      setLeads(leads.map((l) => (l.id === updated.id ? updated : l)));
      setSelectedLead(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;

    try {
      await api.post(`/api/leads/${selectedLead.id}/notes`, { note: newNote });
      setNewNote('');
      fetchNotes(selectedLead.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const camp = campaigns.find(c => String(c.id) === createForm.campaignId);
      const payload = {
        ...createForm,
        campaignId: createForm.campaignId ? parseInt(createForm.campaignId) : undefined,
        campaignName: camp ? camp.name : 'Direct Intake',
        assignedToId: createForm.assignedToId ? parseInt(createForm.assignedToId) : undefined,
      };
      await api.post('/api/leads', payload);
      setShowCreateModal(false);
      // Reset form
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        sourcePlatform: 'Meta',
        campaignId: '',
        campaignName: '',
        assignedToId: '',
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await downloadReport('leads', format);
    } catch (err) {
      console.error(err);
      alert(`Failed to export leads as ${format.toUpperCase()}.`);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platformFilter === 'All' || l.sourcePlatform === platformFilter;
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-theme-text">Live Lead Tracker</h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">LIVE NOW</span>
          </div>
          <p className="mt-1 text-sm text-theme-text-muted">
            Qualify incoming customer contacts and assign follow-up tasks to team members.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-theme-bg-alt text-theme-text transition-all">
              <Download size={16} />
              <span>Export Leads</span>
            </button>
            <div className="absolute right-0 top-11 hidden w-36 rounded-xl border border-theme-border bg-theme-card p-1 shadow-2xl group-hover:block z-10">
              <button onClick={() => handleExport('csv')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">CSV Sheet</button>
              <button onClick={() => handleExport('excel')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">Excel Sheet</button>
              <button onClick={() => handleExport('pdf')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">PDF Sheet</button>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-theme-primary/10 hover:scale-[1.01] transition-all"
          >
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Grid Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side Pane: Leads Feed list */}
        <div className="flex flex-col gap-4 rounded-3xl border border-theme-border bg-theme-card p-4 shadow-sm lg:col-span-1">
          {/* List filters */}
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2 pl-9 pr-4 text-xs outline-none focus:border-theme-primary text-theme-text"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary"
              >
                <option value="All">All Platforms</option>
                <option value="Meta">Meta</option>
                <option value="Google">Google</option>
                <option value="Direct">Direct</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Feed List Items */}
          <div className="max-h-[600px] space-y-2.5 overflow-y-auto pr-1">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() => handleLeadSelect(lead)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-theme-primary bg-theme-primary/10 shadow-md ring-1 ring-theme-primary'
                      : 'border-theme-border/60 bg-theme-bg-alt/40 hover:bg-theme-bg-alt'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-theme-text">{lead.name}</span>
                    <span className="text-[10px] text-theme-text-muted">{formatShortDate(lead.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-theme-text-muted truncate">{lead.email}</p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      lead.sourcePlatform === 'Meta' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {lead.sourcePlatform}
                    </span>
                    <span className="rounded bg-theme-primary/10 px-2 py-0.5 text-[9px] font-bold text-theme-primary">
                      {lead.status}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredLeads.length === 0 && (
              <p className="text-center text-xs text-theme-text-muted py-10">No leads match filters.</p>
            )}
          </div>
        </div>

        {/* Right Side Pane: Selected Lead details view */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <div className="glass-card flex flex-col gap-6 rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
              {/* Top Summary header */}
              <div className="flex flex-col gap-4 border-b border-theme-border pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-theme-text">{selectedLead.name}</h2>
                  <p className="text-xs text-theme-text-muted mt-1">Captured via {selectedLead.campaignName || 'Direct Intake'}</p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-theme-text-muted uppercase tracking-wider">Status:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-sm font-semibold outline-none text-theme-text focus:border-theme-primary"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Lead Details fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Contact Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-theme-text">
                      <Mail size={16} className="text-theme-text-muted" />
                      <span className="text-sm">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-theme-text">
                      <Phone size={16} className="text-theme-text-muted" />
                      <span className="text-sm">{selectedLead.phone || 'No phone recorded'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Assignment</h3>
                  {/* Lead Assignment Selector (Admin/Manager only) */}
                  <div className="flex items-center gap-3 text-theme-text">
                    <UserIcon size={16} className="text-theme-text-muted" />
                    {!(isAdmin || isManager) ? (
                      <span className="text-sm font-semibold">{selectedLead.assignedToName}</span>
                    ) : (
                      <select
                        value={selectedLead.assignedToId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '-1') {
                            handleAssignChange(-1);
                          } else if (val !== '') {
                            handleAssignChange(parseInt(val));
                          }
                        }}
                        className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs font-semibold outline-none text-theme-text focus:border-theme-primary"
                      >
                        <option value="">Unassigned</option>
                        <option value="-1">🎲 Auto-Assign via Engine</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.fullName} ({m.designation || 'Staff'})</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes timeline logs */}
              <div className="border-t border-theme-border pt-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Activity & Note Logs</h3>
                
                {/* Add Note textarea */}
                <form onSubmit={handleAddNoteSubmit} className="relative mt-2">
                  <textarea
                    rows={3}
                    placeholder="Add notes about calls, client requests, pricing negotiation..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt p-4 pr-12 text-sm outline-none transition-all placeholder:text-theme-text-muted focus:border-theme-primary text-theme-text"
                  />
                  <button
                    type="submit"
                    className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white shadow transition-transform"
                  >
                    <Send size={14} />
                  </button>
                </form>

                {/* Timeline display */}
                <div className="space-y-4 pt-2">
                  {notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-theme-bg-alt border border-theme-border text-xs font-bold text-theme-text-muted">
                        {note.user?.fullName ? note.user.fullName[0].toUpperCase() : 'U'}
                      </div>
                      <div className="rounded-2xl bg-theme-bg-alt/50 p-4 border border-theme-border flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-theme-text">{note.user?.fullName}</span>
                          <span className="text-[10px] text-theme-text-muted">{formatDate(note.createdAt)}</span>
                        </div>
                        <p className="text-xs text-theme-text-muted leading-normal">{note.note}</p>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-xs text-theme-text-muted py-6">No notes added yet. Record interactions to keep team updated.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card flex h-96 flex-col items-center justify-center rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
              <MessageSquare size={48} className="text-theme-text-muted mb-3 opacity-50" />
              <p className="text-theme-text-muted font-semibold">Select a lead to view details and update notes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-theme-text">Add Lead manually</h3>
            <p className="text-xs text-theme-text-muted mb-4">Intake a customer contact into the dashboard.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Martinez"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="liam@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Source Platform</label>
                  <select
                    value={createForm.sourcePlatform}
                    onChange={(e) => setCreateForm({ ...createForm, sourcePlatform: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="Meta">Meta Ads</option>
                    <option value="Google">Google Ads</option>
                    <option value="Direct">Direct Intake</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Link Campaign</label>
                  <select
                    value={createForm.campaignId}
                    onChange={(e) => setCreateForm({ ...createForm, campaignId: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="">Direct Intake (No campaign)</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Assignee</label>
                <select
                  value={createForm.assignedToId}
                  onChange={(e) => setCreateForm({ ...createForm, assignedToId: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                >
                  <option value="">Unassigned (Queue)</option>
                  <option value="-1">🎲 Auto-Assign via Engine</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-theme-border bg-theme-bg-alt px-5 py-2.5 text-sm font-semibold hover:bg-theme-bg text-theme-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-theme-primary/10 transition-all"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
