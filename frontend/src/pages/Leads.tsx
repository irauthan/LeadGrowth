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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const url = `http://localhost:8080/api/reports/leads/${format}`;
    window.open(url, '_blank');
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Live Lead Tracker</h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">LIVE NOW</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Qualify incoming customer contacts and assign follow-up tasks to team members.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <Download size={16} />
              <span>Export Leads</span>
            </button>
            <div className="absolute right-0 top-11 hidden w-36 rounded-xl border border-slate-100 bg-white p-1 shadow-2xl dark:border-slate-800 dark:bg-slate-900 group-hover:block z-10">
              <button onClick={() => handleExport('csv')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">CSV Sheet</button>
              <button onClick={() => handleExport('excel')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">Excel Sheet</button>
              <button onClick={() => handleExport('pdf')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800">PDF Sheet</button>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-400 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:scale-[1.01] nav-glow"
          >
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Grid Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side Pane: Leads Feed list */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/50 bg-white/45 p-4 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/25 lg:col-span-1">
          {/* List filters */}
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/60 py-2 pl-9 pr-4 text-xs outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs outline-none dark:border-slate-800/80 dark:bg-slate-900/50"
              >
                <option value="All">All Platforms</option>
                <option value="Meta">Meta</option>
                <option value="Google">Google</option>
                <option value="Direct">Direct</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs outline-none dark:border-slate-800/80 dark:bg-slate-900/50"
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
                      ? 'border-brand-500 bg-brand-50/20 shadow-md dark:bg-brand-950/20'
                      : 'border-slate-200/50 bg-white/50 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{lead.name}</span>
                    <span className="text-[10px] text-slate-400">{formatShortDate(lead.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{lead.email}</p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      lead.sourcePlatform === 'Meta' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                    }`}>
                      {lead.sourcePlatform}
                    </span>
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      {lead.status}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredLeads.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-10">No leads match filters.</p>
            )}
          </div>
        </div>

        {/* Right Side Pane: Selected Lead details view */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <div className="glass-card flex flex-col gap-6 rounded-3xl p-6 shadow-sm">
              {/* Top Summary header */}
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{selectedLead.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">Captured via {selectedLead.campaignName || 'Direct Intake'}</p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-semibold outline-none dark:border-slate-800/80 dark:bg-slate-900/50"
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contact Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Mail size={16} />
                      <span className="text-sm">{selectedLead.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Phone size={16} />
                      <span className="text-sm">{selectedLead.phone || 'No phone recorded'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Assignment</h3>
                  {/* Lead Assignment Selector (Admin/Manager only) */}
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <UserIcon size={16} />
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
                        className="rounded-2xl border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-semibold outline-none dark:border-slate-800/80 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100"
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
              <div className="border-t border-slate-100 pt-6 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Activity & Note Logs</h3>
                
                {/* Add Note textarea */}
                <form onSubmit={handleAddNoteSubmit} className="relative mt-2">
                  <textarea
                    rows={3}
                    placeholder="Add notes about calls, client requests, pricing negotiation..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white/50 p-4 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                  />
                  <button
                    type="submit"
                    className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow hover:scale-105 transition-transform"
                  >
                    <Send size={14} />
                  </button>
                </form>

                {/* Timeline display */}
                <div className="space-y-4 pt-2">
                  {notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                        {note.user?.fullName ? note.user.fullName[0].toUpperCase() : 'U'}
                      </div>
                      <div className="rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{note.user?.fullName}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(note.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">{note.note}</p>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">No notes added yet. Record interactions to keep team updated.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card flex h-96 flex-col items-center justify-center rounded-3xl p-6 shadow-sm">
              <MessageSquare size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold">Select a lead to view details and update notes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Lead manually</h3>
            <p className="text-xs text-slate-400 mb-4">Intake a customer contact into the dashboard.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Martinez"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="liam@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Source Platform</label>
                  <select
                    value={createForm.sourcePlatform}
                    onChange={(e) => setCreateForm({ ...createForm, sourcePlatform: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="Meta">Meta Ads</option>
                    <option value="Google">Google Ads</option>
                    <option value="Direct">Direct Intake</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Link Campaign</label>
                  <select
                    value={createForm.campaignId}
                    onChange={(e) => setCreateForm({ ...createForm, campaignId: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="">Direct Intake (No campaign)</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
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
