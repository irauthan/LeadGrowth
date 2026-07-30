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
  User as UserIcon,
  Briefcase,
  UserCheck,
  Activity,
  Eye,
  Sparkles
} from 'lucide-react';
import { downloadReport } from '../services/reportService';
import WorkDetailsPanel from '../components/WorkDetailsPanel';

export default function Leads() {
  const user = useAuthStore((state) => state.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);

  // Selected Lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAssignUserId, setSelectedAssignUserId] = useState<string>('');
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  // WorkDetailsPanel Modal state
  const [workDetailsLeadId, setWorkDetailsLeadId] = useState<number | null>(null);
  const [isWorkDetailsOpen, setIsWorkDetailsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

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
  const canManage = isAdmin || isManager;

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
      const res = await api.get('/api/users/assignable');
      setMembers(res.data);
    } catch (e) {
      try {
        const res2 = await api.get('/api/users/members');
        const salesExecs = (res2.data || []).filter((m: any) => {
          const roleNames = (m.roles || []).map((r: any) => (r.name || r || '').toUpperCase());
          const hasUser = roleNames.includes('ROLE_USER') || roleNames.includes('USER');
          const hasAdminOrManager = roleNames.includes('ROLE_ADMIN') || roleNames.includes('ADMIN') || roleNames.includes('ROLE_MANAGER') || roleNames.includes('MANAGER');
          return hasUser && !hasAdminOrManager;
        });
        setMembers(salesExecs);
      } catch (err) {
        console.error(err);
      }
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
      const [notesRes, timelineRes] = await Promise.all([
        api.get(`/api/leads/${leadId}/notes`),
        api.get(`/api/leads/${leadId}/timeline`).catch(() => ({ data: [] }))
      ]);
      setNotes(notesRes.data);
      setTimeline(timelineRes.data || []);
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
    setSelectedAssignUserId(lead.assignedToId ? String(lead.assignedToId) : '');
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
      alert(`Lead "${updated.name}" successfully assigned to ${updated.assignedToName || 'team member'}!`);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || 'Failed to assign lead.');
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;

    try {
      await api.post(`/api/leads/${selectedLead.id}/notes`, { note: newNote });
      await api.post(`/api/leads/${selectedLead.id}/timeline/notes`, { title: 'Activity Note Added', description: newNote }).catch(() => {});
      setNewNote('');
      fetchNotes(selectedLead.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToPipeline = async () => {
    if (!selectedLead || !user) return;
    try {
      const res = await api.post(`/api/leads/${selectedLead.id}/add-to-pipeline`).catch(() =>
        api.patch(`/api/leads/${selectedLead.id}/assign?userId=${user.id}`)
      );
      alert(`Lead "${selectedLead.name}" has been added to your Pipelines!`);
      const updatedLead = res.data;
      setSelectedLead(updatedLead);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to add lead to Pipelines.');
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

      {/* Main Split Panel with Maximize/Minimize capability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side Pane: Leads Feed list (Hidden when user maximizes Workflow Container) */}
        {!isMaximized && (
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
                  <option value="Interaction">Interaction</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Feed List Items */}
            <div className="max-h-[650px] space-y-2.5 overflow-y-auto pr-1">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isLostLead = lead.status === 'Lost' || lead.status === 'Rejected';
                return (
                  <button
                    key={lead.id}
                    onClick={() => handleLeadSelect(lead)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-theme-primary bg-theme-primary/10 shadow-md ring-1 ring-theme-primary'
                        : isLostLead
                        ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                        : 'border-theme-border/60 bg-theme-bg-alt/40 hover:bg-theme-bg-alt'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isLostLead ? 'text-rose-400' : 'text-theme-text'}`}>
                        {lead.name}
                      </span>
                      <span className="text-[10px] text-theme-text-muted">{formatShortDate(lead.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-theme-text-muted truncate">{lead.email}</p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        lead.sourcePlatform === 'Meta' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {lead.sourcePlatform}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[9px] font-extrabold ${
                        isLostLead 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-theme-primary/10 text-theme-primary'
                      }`}>
                        {isLostLead ? `🔴 ${lead.status.toUpperCase()}` : lead.status}
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
        )}

        {/* Right Side Pane: Enterprise Multi-Activity Workflow Container */}
        <div className={isMaximized ? "lg:col-span-3" : "lg:col-span-2"}>
          {selectedLead ? (
            <WorkDetailsPanel
              leadId={selectedLead.id}
              isOpen={true}
              inline={true}
              isMaximized={isMaximized}
              onToggleMaximize={() => setIsMaximized(!isMaximized)}
              onClose={() => setSelectedLead(null)}
              onLeadUpdated={fetchLeads}
            />
          ) : (
            <div className="glass-card flex h-[650px] flex-col items-center justify-center rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm text-center space-y-3">
              <MessageSquare size={48} className="text-theme-text-muted opacity-40 mx-auto" />
              <div>
                <h4 className="text-sm font-extrabold text-theme-text">Select a Lead from Workspace Feed</h4>
                <p className="text-xs text-theme-text-muted mt-1 max-w-sm">
                  Click any lead in your workspace feed to open the Enterprise Multi-Activity Workflow Container.
                </p>
              </div>
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
