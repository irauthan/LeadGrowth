import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  LayoutGrid, 
  Table as TableIcon, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  Building, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
  PhoneCall,
  ClipboardList,
  Send,
  Scale,
  MessageSquare,
  AlertCircle,
  Maximize2,
  Minimize2,
  Users
} from 'lucide-react';
import api from '../services/api';
import WorkDetailsPanel from '../components/WorkDetailsPanel';

const KANBAN_STAGES = [
  { key: 'New', title: 'New', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10', headerColor: 'from-blue-500/20 to-blue-500/5 text-blue-400', icon: Sparkles },
  { key: 'Interaction', title: 'Interaction', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', headerColor: 'from-amber-500/20 to-amber-500/5 text-amber-400', icon: MessageSquare },
  { key: 'Follow-up', title: 'Follow-up', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', headerColor: 'from-purple-500/20 to-purple-500/5 text-purple-400', icon: ClipboardList },
  { key: 'Proposal Sent', title: 'Proposal Sent', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', headerColor: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400', icon: Send },
  { key: 'Negotiation', title: 'Negotiation', color: 'border-amber-500/40 text-amber-500 bg-amber-500/10', headerColor: 'from-amber-500/20 to-amber-500/5 text-amber-500', icon: Scale },
  { key: 'Converted', title: 'Converted', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', headerColor: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400', icon: CheckCircle2 },
  { key: 'Lost', title: 'Lost', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10', headerColor: 'from-rose-500/20 to-rose-500/5 text-rose-400', icon: XCircle }
];

const STAGES_TABLE_LIST = [
  'New',
  'Interaction',
  'Follow-up',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Lost'
];

export default function MyWork() {
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Contacts Section collapse & full-width toggle state
  const [isContactsCollapsed, setIsContactsCollapsed] = useState(false);
  const [isContactsFullWidth, setIsContactsFullWidth] = useState(false);

  // Selected lead for work details side panel
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Business-Critical Filters & Search (E4 Filter Streamlining)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'priority' | 'progress'>('newest');

  // Collapsed columns state for Kanban
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStageKey, setDragOverStageKey] = useState<string | null>(null);

  // Idle Sweep notification
  const [sweepMessage, setSweepMessage] = useState('');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchMyWorkLeads();
  }, []);

  useEffect(() => {
    const paramLeadId = searchParams.get('leadId');
    if (paramLeadId && leads.length > 0) {
      const targetId = parseInt(paramLeadId);
      if (!isNaN(targetId)) {
        setSelectedLeadId(targetId);
        setIsPanelOpen(true);
      }
    }

    const paramStage = searchParams.get('stage');
    if (paramStage) {
      setSearchTerm(paramStage);
    }
  }, [searchParams, leads]);

  const fetchMyWorkLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, contactsRes] = await Promise.all([
        api.get('/api/leads/pipeline'),
        api.get('/api/leads/contacts').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsRes.data || []);
      setContacts(contactsRes.data || []);
    } catch (err) {
      console.error('Failed to load My Work workspace leads', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data) {
        setSweepMessage(`New lead auto-assigned: ${res.data.name}!`);
        fetchMyWorkLeads();
      } else {
        setSweepMessage('Queue empty. You are fully caught up!');
      }
      setTimeout(() => setSweepMessage(''), 4000);
    } catch (e) {
      setSweepMessage('Sweep active. All queue items currently assigned.');
      setTimeout(() => setSweepMessage(''), 4000);
    }
  };

  const handleStageChange = async (leadId: number, newStage: string) => {
    try {
      await api.patch(`/api/leads/${leadId}/status?status=${encodeURIComponent(newStage)}`);
      fetchMyWorkLeads();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update stage');
    }
  };

  const toggleCollapseColumn = (stageKey: string) => {
    setCollapsedColumns((prev) => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const openDetails = (id: number) => {
    setSelectedLeadId(id);
    setIsPanelOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('text/plain', String(leadId));
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStageKey !== stageKey) {
      setDragOverStageKey(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStageKey === stageKey) {
      setDragOverStageKey(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverStageKey(null);
    const leadIdStr = e.dataTransfer.getData('text/plain') || String(draggedLeadId);
    const targetLeadId = parseInt(leadIdStr);
    if (isNaN(targetLeadId)) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === targetLeadId ? { ...l, status: targetStageKey } : l))
    );

    // Send API update
    await handleStageChange(targetLeadId, targetStageKey);
    setDraggedLeadId(null);
  };

  // Filter & Search Logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      !searchTerm ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.campaignName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(lead.id).includes(searchTerm);

    const matchesPriority = selectedPriority === 'ALL' || lead.priority === selectedPriority;
    const matchesQuality = selectedQuality === 'ALL' || lead.qualityTier === selectedQuality;

    return matchesSearch && matchesPriority && matchesQuality;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'a-z') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'z-a') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'priority') {
      const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    if (sortBy === 'progress') return (b.progressPercentage || 0) - (a.progressPercentage || 0);
    return 0;
  });

  const getStageLeads = (stageKey: string) => {
    return filteredLeads.filter((l) => {
      const st = l.status || 'New';
      const isNewLead = st === 'New' || st === 'New Lead';
      const hasScheduledFollowup = !!l.nextFollowupDate;

      if (stageKey === 'New') {
        return isNewLead;
      }
      if (isNewLead) {
        return false;
      }
      if (stageKey === 'Interaction') {
        if (hasScheduledFollowup) return false;
        return st === 'Interaction' || st === 'Contacted' || st === 'First Call';
      }
      if (stageKey === 'Follow-up') {
        if (st === 'Follow-up' || st === 'Follow-Up' || st === 'Requirement Collection' || st === 'Interested') return true;
        if (hasScheduledFollowup && st !== 'Proposal Sent' && st !== 'Proposal' && st !== 'Negotiation' && st !== 'Converted' && st !== 'Lost' && st !== 'Rejected') {
          return true;
        }
        return false;
      }
      if (stageKey === 'Proposal Sent') return st === 'Proposal Sent' || st === 'Proposal' || st === 'Demo Scheduled' || st === 'Qualified';
      if (stageKey === 'Negotiation') return st === 'Negotiation';
      if (stageKey === 'Converted') return st === 'Converted' || st === 'Closing' || st === 'Payment' || st === 'Payment Completed';
      if (stageKey === 'Lost') return st === 'Lost' || st === 'Rejected';
      return st === stageKey;
    });
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Workspace Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              Enterprise Sales Workspace
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Unified Multi-Activity Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1 flex items-center gap-2">
            <Briefcase size={22} className="text-theme-primary" /> My Work Pipeline
          </h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Manage assigned leads, execute sales activities, complete client follow-ups, and auto-track progress from one interface.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleIdleSweep}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-blue-600 hover:from-theme-primary-hover hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme-primary/20 transition-all"
          >
            Ready For Next Lead
          </button>

          <div className="flex items-center rounded-2xl bg-theme-bg-alt p-1 border border-theme-border/50">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'kanban' 
                  ? 'bg-theme-card text-theme-primary shadow-sm' 
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <LayoutGrid size={14} /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-theme-card text-theme-primary shadow-sm' 
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <TableIcon size={14} /> Table View
            </button>
          </div>
        </div>
      </div>

      {sweepMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {sweepMessage}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-theme-card/60 p-4 rounded-3xl border border-theme-border">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search by Client, Company, Phone, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-bg-alt border border-theme-border/60 rounded-2xl pl-9 pr-4 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text text-xs">
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          >
            <option value="ALL">Priority: All</option>
            <option value="HIGH">Priority: High</option>
            <option value="MEDIUM">Priority: Medium</option>
            <option value="LOW">Priority: Low</option>
          </select>

          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          >
            <option value="ALL">Quality: All</option>
            <option value="HOT">HOT Tier</option>
            <option value="WARM">WARM Tier</option>
            <option value="COLD">COLD Tier</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="a-z">Sort: A-Z</option>
            <option value="z-a">Sort: Z-A</option>
            <option value="priority">Sort: Priority</option>
            <option value="progress">Sort: Progress %</option>
          </select>

          <button
            onClick={fetchMyWorkLeads}
            className="p-2 rounded-2xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center space-y-3 flex-col">
          <RefreshCw size={36} className="animate-spin text-theme-primary" />
          <span className="text-xs font-bold text-theme-text-muted">Loading My Work Pipeline...</span>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: REDESIGNED ENTERPRISE HORIZONTAL KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 pt-2 snap-x select-none custom-scrollbar min-h-[calc(100vh-230px)] items-start">
              {KANBAN_STAGES.map((col) => {
                const stageLeads = getStageLeads(col.key);
                const Icon = col.icon;
                const isCollapsed = collapsedColumns[col.key] ?? false;
                const isOver = dragOverStageKey === col.key;

                if (isCollapsed) {
                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleCollapseColumn(col.key)}
                      className="w-12 min-w-[48px] max-w-[48px] h-[calc(100vh-250px)] rounded-3xl border border-theme-border/80 bg-theme-card/60 flex flex-col items-center justify-between py-6 cursor-pointer hover:border-theme-primary transition-all shadow-md group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center border ${col.color}`}>
                          <Icon size={14} />
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-theme-bg-alt text-theme-text-muted border border-theme-border/40">
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="rotate-90 whitespace-nowrap text-xs font-extrabold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">
                        {col.title}
                      </div>

                      <button className="text-theme-text-muted group-hover:text-theme-text p-1">
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDragLeave={(e) => handleDragLeave(e, col.key)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className={`w-[310px] min-w-[310px] max-w-[310px] flex-shrink-0 snap-start flex flex-col rounded-3xl border transition-all duration-200 shadow-lg relative ${
                      isOver 
                        ? 'border-2 border-dashed border-theme-primary bg-theme-primary/10 shadow-2xl scale-[1.01]' 
                        : 'border-theme-border/80 bg-theme-card/80 backdrop-blur-md'
                    }`}
                  >
                    {/* Column Header */}
                    <div className={`p-4 rounded-t-3xl border-b border-theme-border/60 bg-gradient-to-b ${col.headerColor} flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-xs ${col.color}`}>
                          <Icon size={14} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-text flex items-center gap-2">
                            {col.title}
                          </h3>
                          <span className="text-[9px] font-bold text-theme-text-muted block">
                            {stageLeads.length} {stageLeads.length === 1 ? 'Lead' : 'Leads'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-theme-card/90 text-theme-text border border-theme-border/60 shadow-xs">
                          {stageLeads.length}
                        </span>
                        <button
                          onClick={() => toggleCollapseColumn(col.key)}
                          title="Collapse Column"
                          className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt/60 transition-all"
                        >
                          <Minimize2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Column Body Cards Scroll Area */}
                    <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] p-3 space-y-3 custom-scrollbar min-h-[220px]">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => openDetails(lead.id)}
                          className="group p-4 rounded-2xl border border-theme-border/80 bg-theme-card/90 hover:border-theme-primary/80 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing space-y-3 backdrop-blur-xs relative overflow-hidden"
                        >
                          {/* Priority and Tier Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                              lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              lead.priority === 'LOW' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {lead.priority || 'MEDIUM'}
                            </span>

                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border ${
                              lead.qualityTier === 'HOT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              lead.qualityTier === 'COLD' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              🔥 {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75}pt)
                            </span>
                          </div>

                          {/* Client Header Info */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex flex-shrink-0 items-center justify-center text-theme-primary font-black text-xs">
                              {lead.name?.substring(0, 2).toUpperCase() || 'LD'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors truncate">
                                {lead.name}
                              </h4>
                              <p className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1 mt-0.5 truncate">
                                <Building size={11} className="text-theme-text-muted flex-shrink-0" /> {lead.company || 'Enterprise Contact'}
                              </p>
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="text-[10px] text-theme-text-muted space-y-1 bg-theme-bg-alt/40 p-2.5 rounded-xl border border-theme-border/30">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-theme-text flex items-center gap-1 truncate">
                                <Phone size={10} className="text-theme-primary flex-shrink-0" /> {lead.phone || 'N/A'}
                              </span>
                              <span className="text-[9px] font-extrabold text-theme-primary px-1.5 py-0.5 rounded bg-theme-primary/10 border border-theme-primary/20 truncate">
                                {lead.campaignName || lead.sourcePlatform || 'Organic'}
                              </span>
                            </div>
                            <div className="truncate text-theme-text-muted">
                              <Mail size={10} className="inline mr-1" /> {lead.email}
                            </div>
                          </div>

                          {/* Scheduled / Latest Follow-Up Badge Box (ONLY for Follow-up column/status) */}
                          {(col.key === 'Follow-up' || lead.status === 'Follow-up' || lead.status === 'Follow-Up') && (lead.nextFollowupDate || lead.lastFollowupDate || lead.followupNotes) && (
                            <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl text-[10px] space-y-1">
                              <div className="flex items-center justify-between font-extrabold text-purple-400">
                                <span className="flex items-center gap-1">
                                  <ClipboardList size={11} className="text-purple-400" />
                                  {lead.nextFollowupDate ? 'Scheduled Follow-up:' : 'Follow-up Info:'}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
                                  {lead.followupType || 'CALL'}
                                </span>
                              </div>
                              <div className="font-extrabold text-theme-text flex items-center gap-1">
                                <PhoneCall size={10} className="text-purple-400 flex-shrink-0" />
                                {lead.nextFollowupDate 
                                  ? new Date(lead.nextFollowupDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                  : lead.lastFollowupDate 
                                    ? new Date(lead.lastFollowupDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                    : 'Pending Schedule'}
                              </div>
                              {(lead.followupNotes || lead.clientNotes) && (
                                <p className="text-theme-text-muted text-[9px] line-clamp-1 italic">
                                  "{lead.followupNotes || lead.clientNotes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-theme-text-muted">
                              <span>Stage Progress</span>
                              <span className="text-theme-primary font-extrabold">{lead.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-theme-bg-alt rounded-full h-1.5 overflow-hidden border border-theme-border/30">
                              <div
                                className="bg-gradient-to-r from-theme-primary to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${lead.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Bottom Quick Toolbar */}
                          <div className="flex items-center justify-between pt-2 border-t border-theme-border/30 text-[10px]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone}`}
                                  title="Call Client"
                                  className="p-1.5 rounded-lg bg-theme-bg-alt border border-theme-border/50 text-theme-text-muted hover:text-blue-400 hover:border-blue-400/50 transition-all"
                                >
                                  <Phone size={11} />
                                </a>
                              )}
                              {lead.phone && (
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp Chat"
                                  className="p-1.5 rounded-lg bg-theme-bg-alt border border-theme-border/50 text-theme-text-muted hover:text-emerald-400 hover:border-emerald-400/50 transition-all"
                                >
                                  <MessageSquare size={11} />
                                </a>
                              )}
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  title="Send Email"
                                  className="p-1.5 rounded-lg bg-theme-bg-alt border border-theme-border/50 text-theme-text-muted hover:text-amber-400 hover:border-amber-400/50 transition-all"
                                >
                                  <Mail size={11} />
                                </a>
                              )}
                            </div>

                            <button
                              onClick={() => openDetails(lead.id)}
                              className="flex items-center gap-1 text-[10px] font-extrabold text-theme-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                            >
                              Work Card <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-theme-border/50 rounded-2xl bg-theme-card/30 space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-theme-bg-alt border border-theme-border flex items-center justify-center mx-auto text-theme-text-muted">
                            <AlertCircle size={20} />
                          </div>
                          <h5 className="text-xs font-bold text-theme-text">No Leads Available</h5>
                          <p className="text-[10px] text-theme-text-muted">
                            Drag new contacts here or advance workflow stages.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* CRM CONTACTS REPOSITORY SECTION (AUTOMATICALLY SYNCHRONIZED AFTER LOST) */}
              <div
                className={`transition-all duration-300 flex-shrink-0 snap-start flex flex-col rounded-3xl border border-theme-border bg-theme-card shadow-xl relative backdrop-blur-md ${
                  isContactsFullWidth ? 'w-full min-w-full' : isContactsCollapsed ? 'w-[80px] min-w-[80px]' : 'w-[340px] min-w-[340px] max-w-[340px]'
                }`}
              >
                {/* Contacts Header */}
                <div className="p-4 rounded-t-3xl border-b border-theme-border bg-gradient-to-r from-theme-primary/10 via-theme-bg-alt to-theme-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center border border-theme-primary/40 text-theme-primary bg-theme-primary/10 shadow-xs">
                      <Users size={14} />
                    </span>
                    {!isContactsCollapsed && (
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-primary flex items-center gap-1.5">
                          CONTACTS <span className="text-[9px] font-semibold text-theme-text-muted font-mono">(Repository)</span>
                        </h3>
                        <span className="text-[9px] font-bold text-theme-text-muted block">
                          {contacts.length} Synchronized Contacts
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!isContactsCollapsed && (
                      <button
                        onClick={() => setIsContactsFullWidth(!isContactsFullWidth)}
                        title={isContactsFullWidth ? "Standard Column View" : "Full Width View"}
                        className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
                      >
                        {isContactsFullWidth ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsContactsCollapsed(!isContactsCollapsed);
                        if (isContactsFullWidth) setIsContactsFullWidth(false);
                      }}
                      title={isContactsCollapsed ? "Expand Contacts" : "Collapse Contacts"}
                      className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
                    >
                      {isContactsCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Contacts Body */}
                {!isContactsCollapsed && (
                  <div className={`flex-1 overflow-y-auto max-h-[calc(100vh-280px)] p-3 space-y-3 custom-scrollbar min-h-[220px] ${
                    isContactsFullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0' : ''
                  }`}>
                    {contacts.map((contact) => (
                      <div
                        key={contact.leadId}
                        onClick={() => openDetails(contact.leadId)}
                        className="group p-4 rounded-2xl border border-theme-border/80 hover:border-theme-primary/80 bg-theme-bg-alt/60 hover:bg-theme-card shadow-xs hover:shadow-xl transition-all cursor-pointer space-y-3 relative overflow-hidden"
                      >
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                            {contact.currentStage || 'Contact'}
                          </span>

                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            🔥 {contact.qualityTier || 'WARM'} ({contact.qualityScore || 75}pt)
                          </span>
                        </div>

                        {/* Name & Company */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex flex-shrink-0 items-center justify-center text-theme-primary font-black text-xs">
                            {contact.name?.substring(0, 2).toUpperCase() || 'CT'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors truncate">
                              {contact.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1 mt-0.5 truncate">
                              <Building size={11} className="text-theme-text-muted flex-shrink-0" /> {contact.company || 'Enterprise Contact'}
                            </p>
                          </div>
                        </div>

                        {/* Interaction Statistics Grid */}
                        <div className="grid grid-cols-3 gap-1 bg-theme-card p-2 rounded-xl border border-theme-border/60 text-center">
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">Calls</div>
                            <div className="text-xs font-extrabold text-emerald-500">{contact.totalCalls || 0}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">Emails</div>
                            <div className="text-xs font-extrabold text-theme-primary">{contact.totalEmails || 0}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">WhatsApp</div>
                            <div className="text-xs font-extrabold text-amber-500">{contact.totalWhatsApp || 0}</div>
                          </div>
                        </div>

                        {/* Dates & Owner */}
                        <div className="text-[10px] text-theme-text-muted space-y-1 bg-theme-card/60 p-2.5 rounded-xl border border-theme-border/40">
                          <div className="flex items-center justify-between">
                            <span>First Contact:</span>
                            <span className="text-theme-text font-semibold">{contact.firstContactDate ? new Date(contact.firstContactDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Last Contact:</span>
                            <span className="text-theme-text font-semibold">{contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          {contact.assignedToName && (
                            <div className="flex items-center justify-between pt-0.5 border-t border-theme-border/60">
                              <span>Owner:</span>
                              <span className="text-theme-primary font-bold">{contact.assignedToName}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-between pt-1 border-t border-theme-border/60 text-[10px]">
                          <span className="text-[9px] text-theme-text-muted truncate max-w-[170px]">
                            {contact.lastActivityDescription || 'Interaction recorded'}
                          </span>
                          <button
                            onClick={() => openDetails(contact.leadId)}
                            className="flex items-center gap-1 text-[10px] font-extrabold text-theme-primary hover:underline"
                          >
                            Timeline <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {contacts.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-theme-border/60 rounded-2xl bg-theme-card/40 space-y-2">
                        <Users size={20} className="mx-auto text-theme-text-muted" />
                        <h5 className="text-xs font-bold text-theme-text">No Contacts In Repository</h5>
                        <p className="text-[10px] text-theme-text-muted">
                          Leads automatically sync here upon their first successful interaction.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: TABLE VIEW (UNTOUCHED & PRESERVED) */}
          {viewMode === 'table' && (
            <div className="rounded-3xl border border-theme-border bg-theme-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Client Name & Company</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Source / Campaign</th>
                      <th className="p-4">Priority & Quality</th>
                      <th className="p-4">Stage Status</th>
                      <th className="p-4">Follow-up Schedule</th>
                      <th className="p-4">Progress %</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/30">
                    {filteredLeads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => openDetails(lead.id)}
                        className="hover:bg-theme-bg-alt/40 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="font-extrabold text-theme-text">{lead.name}</div>
                          <div className="text-[10px] font-semibold text-theme-text-muted">{lead.company || 'Enterprise Contact'}</div>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="font-bold text-theme-text flex items-center gap-1">
                            <Phone size={12} className="text-theme-primary" /> {lead.phone || 'N/A'}
                          </div>
                          <div className="text-[10px] text-theme-text-muted">{lead.email}</div>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-theme-text">{lead.campaignName || 'Direct'}</span>
                          <span className="block text-[10px] text-theme-text-muted">{lead.sourcePlatform || 'Web'}</span>
                        </td>

                        <td className="p-4 space-y-1">
                          <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {lead.priority || 'MEDIUM'}
                          </span>
                          <div className="text-[10px] text-amber-400 font-bold">
                            🔥 {lead.qualityTier} ({lead.qualityScore}pt)
                          </div>
                        </td>

                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'New'}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="bg-theme-bg-alt border border-theme-border/50 rounded-xl px-2.5 py-1 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                          >
                            {STAGES_TABLE_LIST.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4">
                          {lead.nextFollowupDate && (lead.status === 'Follow-up' || lead.status === 'Follow-Up' || lead.status === 'New' || lead.status === 'Interaction' || lead.status === 'Contacted') ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-purple-400 flex items-center gap-1 text-xs">
                                <ClipboardList size={11} /> {new Date(lead.nextFollowupDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-theme-text-muted">
                                <span className="font-semibold text-purple-300 uppercase px-1 rounded bg-purple-500/10 border border-purple-500/20">{lead.followupType || 'CALL'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-theme-text-muted italic">N/A</span>
                          )}
                        </td>

                        <td className="p-4 w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-theme-bg-alt rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-theme-primary h-full rounded-full"
                                style={{ width: `${lead.progressPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-theme-text">{lead.progressPercentage || 0}%</span>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetails(lead.id); }}
                            className="px-3 py-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-[10px] font-bold text-white shadow"
                          >
                            Open Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-theme-text-muted">
                          No work items match your selected filters. Click "Ready For Next Lead" to assign unassigned leads.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Full Screen Work Details Side Panel Drawer */}
      <WorkDetailsPanel
        leadId={selectedLeadId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onLeadUpdated={fetchMyWorkLeads}
      />

    </div>
  );
}
