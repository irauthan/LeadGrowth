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
  Zap, 
  ChevronRight, 
  Sparkles,
  Flame,
  Snowflake,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import WorkDetailsPanel from '../components/WorkDetailsPanel';

const STAGES = [
  'New',
  'Contacted',
  'Follow-up',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Lost'
];

export default function MyWork() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Selected lead for work details side panel
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD' | 'PENDING' | 'CONVERTED' | 'LOST'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'priority' | 'progress'>('newest');

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
  }, [searchParams, leads]);

  const fetchMyWorkLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/leads/pipeline');
      setLeads(res.data || []);
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
      await api.patch(`/api/leads/${leadId}/status?status=${newStage}`);
      fetchMyWorkLeads();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update stage');
    }
  };

  const openDetails = (id: number) => {
    setSelectedLeadId(id);
    setIsPanelOpen(true);
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
      String(lead.id).includes(searchTerm);

    const matchesPriority = selectedPriority === 'ALL' || lead.priority === selectedPriority;
    const matchesQuality = selectedQuality === 'ALL' || lead.qualityTier === selectedQuality;

    let matchesQuick = true;
    if (quickFilter === 'HOT') matchesQuick = lead.qualityTier === 'HOT';
    else if (quickFilter === 'WARM') matchesQuick = lead.qualityTier === 'WARM';
    else if (quickFilter === 'COLD') matchesQuick = lead.qualityTier === 'COLD';
    else if (quickFilter === 'PENDING') matchesQuick = lead.status !== 'Converted' && lead.status !== 'Lost';
    else if (quickFilter === 'CONVERTED') matchesQuick = lead.status === 'Converted';
    else if (quickFilter === 'LOST') matchesQuick = lead.status === 'Lost';

    return matchesSearch && matchesPriority && matchesQuality && matchesQuick;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === 'a-z') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'z-a') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'priority') {
      const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    if (sortBy === 'progress') return (b.progressPercentage || 0) - (a.progressPercentage || 0);
    return 0;
  });

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
              Unified Lead & Task Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1 flex items-center gap-2">
            <Briefcase size={22} className="text-theme-primary" /> My Work Workspace
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
            <Zap size={14} /> Ready For Next Lead
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
              <LayoutGrid size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-theme-card text-theme-primary shadow-sm' 
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {sweepMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2">
          <Sparkles size={16} /> {sweepMessage}
        </div>
      )}

      {/* Quick Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'ALL', label: 'All Work', icon: null },
          { key: 'HOT', label: 'Hot Leads', icon: <Flame size={12} className="text-rose-500" /> },
          { key: 'WARM', label: 'Warm Leads', icon: <Zap size={12} className="text-amber-400" /> },
          { key: 'COLD', label: 'Cold Leads', icon: <Snowflake size={12} className="text-blue-400" /> },
          { key: 'PENDING', label: 'Pending Action', icon: <Clock size={12} className="text-amber-500" /> },
          { key: 'CONVERTED', label: 'Converted', icon: <CheckCircle2 size={12} className="text-emerald-500" /> },
          { key: 'LOST', label: 'Lost', icon: <XCircle size={12} className="text-rose-500" /> },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => setQuickFilter(pill.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              quickFilter === pill.key
                ? 'bg-theme-primary text-white border-theme-primary shadow-md'
                : 'bg-theme-card text-theme-text-muted border-theme-border hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            {pill.icon}
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="p-4 rounded-3xl border border-theme-border bg-theme-card shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search Box */}
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Instant Search client name, company, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-bg-alt border border-theme-border/60 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-theme-text placeholder-theme-text-muted focus:outline-none focus:border-theme-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
          
          {/* Priority Filter */}
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

          {/* Quality Tier Filter */}
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

          {/* Sort By Filter */}
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
          {/* VIEW MODE 1: KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter(l => l.status === stage || (stage === 'New' && !l.status));
                return (
                  <div key={stage} className="rounded-3xl border border-theme-border bg-theme-card/60 p-4 space-y-4 min-w-[260px] flex flex-col h-full">
                    {/* Stage Header */}
                    <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-theme-primary" />
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-text">{stage}</h3>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-theme-bg-alt text-theme-text-muted border border-theme-border/40">
                        {stageLeads.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => openDetails(lead.id)}
                          className="group p-4 rounded-2xl border border-theme-border bg-theme-card hover:border-theme-primary/60 shadow-xs hover:shadow-lg transition-all cursor-pointer space-y-3"
                        >
                          {/* Top Card Bar */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                              lead.priority === 'LOW' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                              'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {lead.priority || 'MEDIUM'}
                            </span>
                            <span className="text-[9px] font-extrabold text-amber-400">
                              🔥 {lead.qualityTier || 'HOT'} ({lead.qualityScore || 85}pt)
                            </span>
                          </div>

                          {/* Client & Company */}
                          <div>
                            <h4 className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors">
                              {lead.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1 mt-0.5">
                              <Building size={11} /> {lead.company || 'Enterprise Client'}
                            </p>
                          </div>

                          {/* Contact Details */}
                          <div className="text-[10px] text-theme-text-muted space-y-1 bg-theme-bg-alt/40 p-2 rounded-xl border border-theme-border/20">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone || 'N/A'}</span>
                              <span className="text-theme-primary font-bold">{lead.campaignName || 'Organic'}</span>
                            </div>
                            <div className="truncate"><Mail size={10} className="inline mr-1" /> {lead.email}</div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-theme-text-muted">
                              <span>Work Progress</span>
                              <span className="text-theme-primary">{lead.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-theme-bg-alt rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-theme-primary to-indigo-500 h-full rounded-full"
                                style={{ width: `${lead.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Quick Stage Changer & Details Action */}
                          <div className="flex items-center justify-between pt-1 border-t border-theme-border/20">
                            <span className="text-[9px] text-theme-text-muted font-semibold">
                              Assigned: {new Date(lead.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-theme-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Work Card <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="p-6 text-center text-xs text-theme-text-muted border border-dashed border-theme-border/40 rounded-2xl">
                          No leads in {stage}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: TABLE VIEW */}
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
                            {STAGES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
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

      {/* Full Screen Work Details Side Panel */}
      <WorkDetailsPanel
        leadId={selectedLeadId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onLeadUpdated={fetchMyWorkLeads}
      />

    </div>
  );
}
