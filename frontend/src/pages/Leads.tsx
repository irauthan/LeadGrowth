import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Lead, User } from '../types';
import { formatShortDate, isLeadAssigned, isLeadFresh } from '../utils';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Search, 
  Download, 
  MessageSquare, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Flame, 
  Zap, 
  Briefcase, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  XCircle,
  UserCheck,
  Sparkles,
  Clock
} from 'lucide-react';
import { downloadReport } from '../services/reportService';
import WorkDetailsPanel from '../components/WorkDetailsPanel';

export default function Leads() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);

  // Selected Lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // WorkDetailsPanel Modal state
  const [isMaximized, setIsMaximized] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Bulk Selection & Auto-Assign state
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const isManagementUser = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_MANAGER');

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

  useEffect(() => {
    fetchLeads();
    fetchMembers();
    fetchCampaigns();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      const data = Array.isArray(res.data) ? res.data : [];
      setLeads(data);
      
      const paramId = searchParams.get('id') || searchParams.get('leadId');
      if (paramId && data.length > 0) {
        const targetId = parseInt(paramId, 10);
        const match = data.find((l) => l.id === targetId);
        if (match) {
          setSelectedLead(match);
          return;
        }
      }

      if (data.length > 0) {
        setSelectedLead(data[0]);
      }
    } catch (e) {
      console.error(e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync selectedLead and search query when URL search params change
  useEffect(() => {
    const paramId = searchParams.get('id') || searchParams.get('leadId');
    const paramSearch = searchParams.get('search');

    if (paramSearch && paramSearch !== search) {
      setSearch(paramSearch);
    }

    if (paramId && leads.length > 0) {
      const targetId = parseInt(paramId, 10);
      if (!isNaN(targetId)) {
        const match = leads.find((l) => l.id === targetId);
        if (match) {
          setSelectedLead(match);
          // If the match was filtered out, reset filters so it's clearly visible
          if (statusFilter !== 'All' && match.status !== statusFilter) {
            setStatusFilter('All');
          }
          if (platformFilter !== 'All' && match.sourcePlatform !== platformFilter) {
            setPlatformFilter('All');
          }
          // Smoothly scroll to the target lead card
          setTimeout(() => {
            const el = document.getElementById(`lead-card-${targetId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }
      }
    }
  }, [searchParams, leads]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/assignable');
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        setMembers(list);
      } else {
        const res2 = await api.get('/api/users/members');
        setMembers(Array.isArray(res2.data) ? res2.data : []);
      }
    } catch (e) {
      try {
        const res2 = await api.get('/api/users/members');
        setMembers(Array.isArray(res2.data) ? res2.data : []);
      } catch (err) {
        console.error(err);
        setMembers([]);
      }
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setCampaigns([]);
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
          return newLead;
        }
        return prev;
      });
    },
  });

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
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

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelectLead = (e: React.MouseEvent, leadId: number) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleBulkAutoAssign = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkAssigning(true);
    try {
      await api.post(`/api/leads/bulk-assign?leadIds=${selectedLeadIds.join(',')}&userId=-1`);
      alert(`Successfully auto-assigned ${selectedLeadIds.length} lead(s) via Smart Hybrid Engine!`);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err: any) {
      console.error('Bulk auto-assign error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Failed to bulk auto-assign leads.';
      alert(msg);
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleBulkManualAssign = async (targetUserId: number) => {
    if (selectedLeadIds.length === 0 || !targetUserId) return;
    setBulkAssigning(true);
    try {
      await api.post(`/api/leads/bulk-assign?leadIds=${selectedLeadIds.join(',')}&userId=${targetUserId}`);
      alert(`Successfully assigned ${selectedLeadIds.length} lead(s) to selected team member!`);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err: any) {
      console.error('Bulk manual assign error:', err);
      const msg = err.response?.data?.message || err.response?.data?.title || err.message || 'Failed to bulk assign leads.';
      alert(msg);
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleSingleAutoAssign = async (e: React.MouseEvent, leadId: number) => {
    e.stopPropagation();
    try {
      await api.post(`/api/leads/${leadId}/auto-assign`);
      alert('Lead successfully auto-assigned via Smart Hybrid Engine!');
      fetchLeads();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to auto-assign lead.');
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

  // Priority Engine Helper: Check if lead has an ACTIVE overdue follow-up
  const isLeadOverdue = (l: Lead): boolean => {
    const st = (l.status || '').toLowerCase();
    if (st === 'converted' || st === 'lost' || st === 'rejected' || st === 'completed') {
      return false;
    }
    const fs = (l.followupStatus || '').toUpperCase();
    if (fs === 'COMPLETED' || fs === 'CANCELLED') {
      return false;
    }
    if (fs === 'OVERDUE') {
      return true;
    }
    if (!l.nextFollowupDate) return false;
    return new Date(l.nextFollowupDate).getTime() < Date.now();
  };

  // Priority Engine Counters
  const leadsArray = Array.isArray(leads) ? leads : [];
  const overdueCount = leadsArray.filter(isLeadOverdue).length;
  const highPriorityCount = leadsArray.filter((l) => l.priority === 'HIGH' || l.qualityTier === 'HOT').length;
  const newLeadsCount = leadsArray.filter((l) => l.status === 'New').length;

  // Filtered Leads
  const filteredLeads = leadsArray.filter((l) => {
    const matchesSearch = 
      !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone && l.phone.includes(search));
    const matchesPlatform = platformFilter === 'All' || l.sourcePlatform === platformFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Overdue') {
      matchesStatus = isLeadOverdue(l);
    } else if (statusFilter === 'HIGH') {
      matchesStatus = l.priority === 'HIGH' || l.qualityTier === 'HOT';
    } else if (statusFilter !== 'All') {
      matchesStatus = l.status === statusFilter;
    }

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  // Sync selectedLead when filters change
  useEffect(() => {
    if (selectedLead) {
      const stillExists = filteredLeads.some((l) => l.id === selectedLead.id);
      if (!stillExists) {
        setSelectedLead(filteredLeads.length > 0 ? filteredLeads[0] : null);
      }
    } else if (filteredLeads.length > 0 && !selectedLead) {
      setSelectedLead(filteredLeads[0]);
    }
  }, [search, platformFilter, statusFilter, leads]);

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
            <h1 className="text-3xl font-extrabold tracking-tight text-theme-text">Lead Management Console</h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">ACTIVE PIPELINE</span>
          </div>
          <p className="mt-1 text-sm text-theme-text-muted">
            Intelligently ranked workspace pipeline sorted by urgency, due date, and conversion impact.
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

      {/* Smart Priority Engine KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Overdue' ? 'All' : 'Overdue')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'Overdue'
              ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/50 shadow-md'
              : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <AlertTriangle size={12} /> Overdue Tasks
            </span>
            <div className="text-xl font-extrabold text-rose-500 mt-0.5">{overdueCount}</div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${overdueCount > 0 ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {overdueCount > 0 ? 'Action Req' : 'Clean'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'HIGH' ? 'All' : 'HIGH')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'HIGH'
              ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
              : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <Flame size={12} /> High Focus
            </span>
            <div className="text-xl font-extrabold text-amber-500 mt-0.5">{highPriorityCount}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-extrabold">
            Hot Tier
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'New' ? 'All' : 'New')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'New'
              ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
              : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <Zap size={12} /> Fresh Leads
            </span>
            <div className="text-xl font-extrabold text-emerald-500 mt-0.5">{newLeadsCount}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold">
            Inbound
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-theme-primary/10 border-theme-primary ring-2 ring-theme-primary/50 shadow-md'
              : 'bg-theme-card hover:bg-theme-bg-alt border-theme-border'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-text-muted flex items-center gap-1">
              <Briefcase size={12} /> All Pipeline
            </span>
            <div className="text-xl font-extrabold text-theme-text mt-0.5">{leads.length}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-theme-primary/20 text-theme-primary text-[10px] font-extrabold">
            Total
          </span>
        </button>
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
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary font-bold"
                >
                  <option value="All">All Status</option>
                  <option value="New">New</option>
                  <option value="Interaction">Interaction</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Overdue">Overdue</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>
            </div>

              {/* Management Bulk Auto-Assign Controls */}
              {isManagementUser && filteredLeads.length > 0 && (
                <div className="p-3 rounded-2xl bg-theme-bg-alt/70 border border-theme-border space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-1.5 text-xs font-bold text-theme-text-muted hover:text-theme-text"
                    >
                      {selectedLeadIds.length === filteredLeads.length ? (
                        <CheckSquare size={16} className="text-theme-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>Select All ({filteredLeads.length})</span>
                    </button>

                    {selectedLeadIds.length > 0 && (
                      <span className="text-[11px] font-extrabold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-full border border-theme-primary/20">
                        {selectedLeadIds.length} Selected
                      </span>
                    )}
                  </div>

                  {selectedLeadIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleBulkAutoAssign}
                        disabled={bulkAssigning}
                        className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-theme-primary to-indigo-500 hover:opacity-90 text-white text-xs font-extrabold shadow-md disabled:opacity-50 transition-all"
                      >
                        {bulkAssigning ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                        <span>Bulk Auto-Assign ({selectedLeadIds.length})</span>
                      </button>

                      <select
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val) handleBulkManualAssign(val);
                        }}
                        disabled={bulkAssigning}
                        className="w-full sm:w-auto rounded-xl border border-theme-border bg-theme-card px-2.5 py-1.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
                      >
                        <option value="">Bulk Assign To...</option>
                        {members.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName || m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

            {/* Feed List Items */}
            <div className="max-h-[650px] space-y-2.5 overflow-y-auto pr-1">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isLostLead = lead.status === 'Lost' || lead.status === 'Rejected';
                const isOverdue = isLeadOverdue(lead);
                const isChecked = selectedLeadIds.includes(lead.id);
                const assigned = isLeadAssigned(lead);
                const fresh = isLeadFresh(lead);

                return (
                  <button
                    key={lead.id}
                    id={`lead-card-${lead.id}`}
                    onClick={() => handleLeadSelect(lead)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-theme-primary bg-theme-primary/10 shadow-md ring-1 ring-theme-primary'
                        : isOverdue
                        ? 'border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10'
                        : isLostLead
                        ? 'border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10'
                        : 'border-theme-border/60 bg-theme-bg-alt/40 hover:bg-theme-bg-alt'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isManagementUser && (
                          <div
                            onClick={(e) => handleToggleSelectLead(e, lead.id)}
                            className="text-theme-text-muted hover:text-theme-primary cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare size={16} className="text-theme-primary" />
                            ) : (
                              <Square size={16} />
                            )}
                          </div>
                        )}
                        <span className={`font-bold ${isOverdue ? 'text-rose-500 font-extrabold' : isLostLead ? 'text-rose-400' : 'text-theme-text'}`}>
                          {lead.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-theme-text-muted">{formatShortDate(lead.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-theme-text-muted truncate pl-6">{lead.email}</p>

                    {isOverdue && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 w-max">
                        <AlertTriangle size={11} /> Overdue Follow-up
                      </div>
                    )}
                    
                    {/* Tags row: Source, Fresh, Assigned (Admin only), Status */}
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          lead.sourcePlatform === 'Meta' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {lead.sourcePlatform || 'Direct'}
                        </span>

                        {fresh && (
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1">
                            <Sparkles size={10} /> Fresh
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isManagementUser && (
                          assigned ? (
                            <span className="rounded-lg px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1" title={lead.assignedToName ? `Assigned to ${lead.assignedToName}` : 'Assigned'}>
                              <UserCheck size={10} /> Assigned{lead.assignedToName && lead.assignedToName !== 'Unassigned' ? `: ${lead.assignedToName}` : ''}
                            </span>
                          ) : (
                            <div
                              onClick={(e) => handleSingleAutoAssign(e, lead.id)}
                              className="flex items-center gap-1 text-[9px] font-extrabold text-theme-primary bg-theme-primary/10 hover:bg-theme-primary/20 px-2 py-0.5 rounded-lg border border-theme-primary/20 transition-all cursor-pointer"
                              title="Auto-Assign this single lead using Smart AI Engine"
                            >
                              <Zap size={10} /> Auto-Assign
                            </div>
                          )
                        )}

                        <span className={`rounded px-2 py-0.5 text-[9px] font-extrabold inline-flex items-center gap-1 ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                            : isLostLead 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-theme-primary/10 text-theme-primary'
                        }`}>
                          {isLostLead && <XCircle size={10} className="text-rose-400" />}
                          <span>{isOverdue ? 'OVERDUE' : isLostLead ? lead.status.toUpperCase() : lead.status}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredLeads.length === 0 && (
                <div className="p-8 text-center space-y-2 border border-dashed border-theme-border/60 rounded-2xl bg-theme-bg-alt/30 my-4">
                  <AlertCircle size={28} className="text-theme-text-muted opacity-40 mx-auto" />
                  <p className="text-xs font-bold text-theme-text">No leads found</p>
                  <p className="text-[10px] text-theme-text-muted">
                    {statusFilter === 'Overdue' 
                      ? 'Great! There are no overdue follow-ups or pending actions right now.'
                      : 'No leads match the selected filter criteria.'}
                  </p>
                </div>
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
                  <option value="-1">Auto-Assign via Engine</option>
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
