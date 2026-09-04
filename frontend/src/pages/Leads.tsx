import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Lead, User } from '../types';
import { formatShortDate, isLeadAssigned } from '../utils';
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
  FileSpreadsheet
} from 'lucide-react';
import { downloadReport } from '../services/reportService';
import WorkDetailsPanel from '../components/WorkDetailsPanel';
import LeadImportModal from '../components/LeadImportModal';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

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
  const [showImportModal, setShowImportModal] = useState(false);
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
      await new Promise(r => setTimeout(r, 1200));
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
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
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
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
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
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
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

  // Priority Engine Counters & Management Metrics
  const leadsArray = Array.isArray(leads) ? leads : [];
  const unassignedCount = leadsArray.filter((l) => !isLeadAssigned(l)).length;
  const assignedCount = leadsArray.filter((l) => isLeadAssigned(l) && l.status !== 'Converted' && l.status !== 'Lost' && l.status !== 'Rejected').length;
  const convertedCount = leadsArray.filter((l) => l.status === 'Converted').length;

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
    if (statusFilter === 'Unassigned') {
      matchesStatus = !isLeadAssigned(l);
    } else if (statusFilter === 'Assigned') {
      matchesStatus = isLeadAssigned(l) && l.status !== 'Converted' && l.status !== 'Lost' && l.status !== 'Rejected';
    } else if (statusFilter === 'Converted') {
      matchesStatus = l.status === 'Converted';
    } else if (statusFilter === 'Overdue') {
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
    return <HoosshBeeLoader text="Loading Leads Pipeline..." subtext="Syncing contacts, AI scores and conversion tiers" />;
  }

  return (
    <div className="space-y-5">
      {/* Unified Header & KPI Section */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">
                {isManagementUser ? 'Admin Lead Allocation & Workspace' : 'Workspace Leads'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-theme-text-muted">
              {isManagementUser 
                ? 'Lead distribution hub: assign leads to sales executives, monitor team workload, and audit client conversations.'
                : 'Prioritized intake pipeline for lead qualification, assignments, and follow-ups.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-xl border border-theme-border hover:border-theme-primary/40 bg-theme-bg-alt hover:bg-theme-card px-3.5 py-2 text-xs font-semibold text-theme-text transition-all"
              title="Import Excel or CSV spreadsheet"
            >
              <FileSpreadsheet size={15} className="text-theme-primary" />
              <span>Import Sheet</span>
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 rounded-xl border border-theme-border hover:border-theme-primary/40 bg-theme-bg-alt hover:bg-theme-card px-3.5 py-2 text-xs font-semibold text-theme-text transition-all">
                <Download size={15} />
                <span>Export</span>
              </button>
              <div className="absolute right-0 top-10 hidden w-36 rounded-xl border border-theme-border bg-theme-card p-1 shadow-xl group-hover:block z-20">
                <button onClick={() => handleExport('csv')} className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">CSV (.csv)</button>
                <button onClick={() => handleExport('excel')} className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">Excel (.xlsx)</button>
                <button onClick={() => handleExport('pdf')} className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">PDF (.pdf)</button>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <Plus size={15} />
              <span>Add Lead</span>
            </button>
          </div>
        </div>

        {/* KPI Row (Admin Management Cards vs Sales Rep Operational Cards) */}
        <div className="border-t border-theme-border/60 pt-3">
          {isManagementUser ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-theme-bg-alt/70 border-theme-primary shadow-xs ring-1 ring-theme-primary/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Briefcase size={13} className="text-theme-primary" /> Total Leads
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{leads.length}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary text-[10px] font-bold">
                  All
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Unassigned' ? 'All' : 'Unassigned')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'Unassigned'
                    ? 'bg-theme-bg-alt/70 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-amber-500" /> Unassigned Leads
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{unassignedCount}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  unassignedCount > 0 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse' 
                    : 'bg-theme-bg-alt text-theme-text-muted'
                }`}>
                  {unassignedCount > 0 ? 'Needs Action' : '0'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Assigned' ? 'All' : 'Assigned')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'Assigned'
                    ? 'bg-theme-bg-alt/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Zap size={13} className="text-indigo-500" /> Assigned & Active
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{assignedCount}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                  In Progress
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Converted' ? 'All' : 'Converted')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'Converted'
                    ? 'bg-theme-bg-alt/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Briefcase size={13} className="text-emerald-500" /> Converted Won
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{convertedCount}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Won
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'All'
                    ? 'bg-theme-bg-alt/70 border-theme-primary shadow-xs ring-1 ring-theme-primary/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Briefcase size={13} className="text-theme-primary" /> Total Leads
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{leads.length}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary text-[10px] font-bold">
                  All
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'New' ? 'All' : 'New')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'New'
                    ? 'bg-theme-bg-alt/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Zap size={13} className="text-emerald-500" /> Fresh Inbound
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{newLeadsCount}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  New
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'HIGH' ? 'All' : 'HIGH')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'HIGH'
                    ? 'bg-theme-bg-alt/70 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <Flame size={13} className="text-amber-500" /> High Focus
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{highPriorityCount}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                  Hot
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Overdue' ? 'All' : 'Overdue')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  statusFilter === 'Overdue'
                    ? 'bg-theme-bg-alt/70 border-rose-500 shadow-xs ring-1 ring-rose-500/30'
                    : 'bg-theme-bg-alt/30 hover:bg-theme-bg-alt/60 border-theme-border/60'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-500" /> Overdue Action
                  </span>
                  <div className="text-xl font-black text-theme-text mt-0.5">{overdueCount}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  overdueCount > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-theme-bg-alt text-theme-text-muted'
                }`}>
                  {overdueCount > 0 ? 'Pending' : '0'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Panel - Left Sticky Sidebar & Right Naturally Scrollable Workflow */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
        {/* Left Side Pane: Leads Feed list (Sticky & Fit to Screen) */}
        {!isMaximized && (
          <div className="flex flex-col rounded-2xl border border-theme-border/70 bg-theme-card p-4 shadow-xs lg:col-span-1 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:max-h-[calc(100vh-120px)] overflow-hidden">
            {/* Search & filters */}
            <div className="space-y-2 flex-shrink-0 pb-1">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-theme-border/70 bg-theme-bg-alt/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-theme-primary focus:bg-theme-card text-theme-text transition-all placeholder:text-theme-text-muted"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="w-full rounded-xl border border-theme-border/70 bg-theme-bg-alt/50 px-2.5 py-1.5 text-xs font-medium outline-none text-theme-text focus:border-theme-primary cursor-pointer"
                >
                  <option value="All">All Platforms</option>
                  <option value="Meta">Meta</option>
                  <option value="Google">Google</option>
                  <option value="Direct">Direct</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-theme-border/70 bg-theme-bg-alt/50 px-2.5 py-1.5 text-xs font-medium outline-none text-theme-text focus:border-theme-primary cursor-pointer"
                >
                  <option value="All">All Statuses / Categories</option>
                  {isManagementUser && (
                    <>
                      <option value="Unassigned">Unassigned (Pending Allocation)</option>
                      <option value="Assigned">Assigned (In Pipeline)</option>
                    </>
                  )}
                  <option value="New">New</option>
                  <option value="Interaction">Interaction</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Lost">Lost</option>
                  <option value="Overdue">Overdue</option>
                  <option value="HIGH">High Focus</option>
                </select>
              </div>
            </div>

            {/* Management Bulk Actions Bar */}
            {isManagementUser && filteredLeads.length > 0 && (
              <div className="p-3 my-2 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/60 space-y-2.5 shadow-xs flex-shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs font-bold text-theme-text-muted hover:text-theme-text cursor-pointer"
                  >
                    {selectedLeadIds.length === filteredLeads.length ? (
                      <CheckSquare size={15} className="text-theme-primary" />
                    ) : (
                      <Square size={15} />
                    )}
                    <span>Select All ({filteredLeads.length})</span>
                  </button>

                  {selectedLeadIds.length > 0 && (
                    <span className="text-[10px] font-black text-theme-primary bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-0.5 rounded-full">
                      {selectedLeadIds.length} Selected
                    </span>
                  )}
                </div>

                {selectedLeadIds.length > 0 && (
                  <div className="pt-0.5">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '-1') {
                          handleBulkAutoAssign();
                        } else if (val) {
                          handleBulkManualAssign(parseInt(val, 10));
                        }
                        e.target.value = '';
                      }}
                      disabled={bulkAssigning}
                      className="w-full rounded-xl border border-theme-border bg-theme-card px-3 py-2 text-xs font-bold text-theme-text outline-none focus:border-theme-primary shadow-xs cursor-pointer"
                    >
                      <option value="" disabled>
                        {bulkAssigning ? 'Assigning selected leads...' : `⚡ Bulk Assign (${selectedLeadIds.length}) Leads To...`}
                      </option>
                      <option value="-1">⚡ Auto-Assign (Smart AI Engine)</option>
                      <optgroup label="Sales Executives">
                        {members
                          .filter((m: any) => {
                            const roles = Array.isArray(m.roles)
                              ? m.roles.map((r: any) => (typeof r === 'string' ? r : r.name || ''))
                              : [];
                            const roleStr = (m.role || m.designation || '').toUpperCase();
                            return !roles.some((r: string) => r.toUpperCase().includes('ADMIN')) && !roleStr.includes('ADMIN');
                          })
                          .map((m: any) => (
                            <option key={m.id} value={m.id}>
                              👤 {m.fullName || m.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Feed List Items (scrolls internally without page scroll) */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0 pt-1">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isLostLead = lead.status === 'Lost' || lead.status === 'Rejected';
                const isOverdue = isLeadOverdue(lead);
                const isChecked = selectedLeadIds.includes(lead.id);
                const assigned = isLeadAssigned(lead);

                return (
                  <button
                    key={lead.id}
                    id={`lead-card-${lead.id}`}
                    onClick={() => handleLeadSelect(lead)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-theme-primary bg-theme-primary/[0.04] shadow-xs'
                        : isOverdue
                        ? 'border-rose-500/30 bg-rose-500/[0.02] hover:bg-rose-500/[0.05]'
                        : 'border-theme-border/50 bg-theme-card hover:bg-theme-bg-alt/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isManagementUser && (
                          <div
                            onClick={(e) => handleToggleSelectLead(e, lead.id)}
                            className="text-theme-text-muted hover:text-theme-primary cursor-pointer flex-shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare size={15} className="text-theme-primary" />
                            ) : (
                              <Square size={15} />
                            )}
                          </div>
                        )}
                        <span className="font-bold text-xs text-theme-text truncate">
                          {lead.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-theme-text-muted flex-shrink-0">{formatShortDate(lead.createdAt)}</span>
                    </div>

                    <p className="mt-1 text-[11px] text-theme-text-muted truncate">
                      {lead.email} {lead.phone ? `• ${lead.phone}` : ''}
                    </p>

                    {/* Clean compact bottom tags row */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-theme-border/30 pt-2 text-[10px]">
                      <span className="text-theme-text-muted font-medium">
                        {lead.sourcePlatform || 'Direct'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isManagementUser && (
                          assigned ? (
                            <span className="text-[10px] text-theme-text-muted font-medium truncate max-w-[100px]" title={lead.assignedToName}>
                              {lead.assignedToName?.split(' ')[0] || 'Assigned'}
                            </span>
                          ) : (
                            <span
                              onClick={(e) => handleSingleAutoAssign(e, lead.id)}
                              className="text-[10px] font-semibold text-theme-primary hover:underline cursor-pointer"
                            >
                              + Assign
                            </span>
                          )
                        )}

                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] ${
                          lead.status === 'Converted'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isOverdue
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isLostLead
                            ? 'bg-slate-500/10 text-slate-500'
                            : 'bg-theme-primary/10 text-theme-primary'
                        }`}>
                          {isOverdue ? 'Overdue' : lead.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredLeads.length === 0 && (
                <div className="p-8 text-center space-y-2 border border-dashed border-theme-border/60 rounded-xl bg-theme-bg-alt/20 my-4">
                  <AlertCircle size={24} className="text-theme-text-muted opacity-40 mx-auto" />
                  <p className="text-xs font-semibold text-theme-text">No leads found</p>
                  <p className="text-[11px] text-theme-text-muted">
                    No records match the active filter criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side Pane: Enterprise Multi-Activity Workflow Container (Same Height & Bottom Alignment) */}
        <div className={`${isMaximized ? "lg:col-span-3" : "lg:col-span-2"} lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:max-h-[calc(100vh-120px)] flex flex-col`}>
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
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-theme-border/70 bg-theme-card p-6 shadow-xs text-center space-y-2">
              <MessageSquare size={36} className="text-theme-text-muted opacity-30 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-theme-text">Select a Lead from the Pipeline</h4>
                <p className="text-xs text-theme-text-muted mt-0.5 max-w-sm">
                  Click any contact on the left to view customer dossiers, timeline history, and call logs.
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

      {/* Excel Sheet Lead Reader & Intake Modal */}
      <LeadImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          fetchLeads();
        }}
        currentUser={user}
        teamMembers={members}
        campaigns={campaigns}
      />
    </div>
  );
}
