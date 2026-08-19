import { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Building2, 
  ShieldAlert,
  SlidersHorizontal,
  X,
  Filter
} from 'lucide-react';
import api from '../services/api';
import type { PriorityItem, PriorityStats } from '../types';
import WorkDetailsPanel from '../components/WorkDetailsPanel';

export default function PriorityCenter() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [stats, setStats] = useState<PriorityStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Active KPI Card Filter & Rank Filter
  const [activeCardFilter, setActiveCardFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityRankFilter, setPriorityRankFilter] = useState<string>('ALL');
    // 
  // Selected Lead for WorkDetailsPanel
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Extra filtered items from API endpoints
  const [filteredApiItems, setFilteredApiItems] = useState<any[] | null>(null);

  useEffect(() => {
    // Check URL query parameters for persistent filter state
    const params = new URLSearchParams(window.location.search);
    const filterFromUrl = params.get('filter') || params.get('card');
    if (filterFromUrl) {
      setActiveCardFilter(filterFromUrl);
    }
    fetchPriorityData();
  }, []);

  const fetchPriorityData = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        api.get('/api/priority/leads'),
        api.get('/api/priority/stats')
      ]);
      setPriorities(leadsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load Priority Center data', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUrlFilter = (filterKey: string) => {
    setActiveCardFilter(filterKey);
    const url = new URL(window.location.href);
    if (filterKey && filterKey !== 'ALL') {
      url.searchParams.set('filter', filterKey);
    } else {
      url.searchParams.delete('filter');
      url.searchParams.delete('card');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleCardClick = async (cardKey: string) => {
    if (activeCardFilter === cardKey) {
      // Toggle off if already selected
      updateUrlFilter('ALL');
      setFilteredApiItems(null);
      return;
    }

    updateUrlFilter(cardKey);
    setLoading(true);

    try {
      let endpoint = '';
      switch (cardKey) {
        case 'TODAY_WORK':
          endpoint = '/api/tasks/today';
          break;
        case 'OVERDUE':
          endpoint = '/api/tasks/overdue';
          break;
        case 'HIGH_PRIORITY':
        case 'HIGH_FOCUS':
          endpoint = '/api/leads/high-priority';
          break;
        case 'NEGOTIATIONS':
          endpoint = '/api/leads/negotiation';
          break;
        case 'TODAYS_FOLLOWUPS':
          endpoint = '/api/followups/today';
          break;
        case 'NEW_LEADS':
          endpoint = '/api/leads/new';
          break;
        case 'COMPLETED':
          endpoint = '/api/tasks/completed';
          break;
        default:
          setFilteredApiItems(null);
          setLoading(false);
          return;
      }

      if (endpoint) {
        const res = await api.get(endpoint);
        setFilteredApiItems(res.data || []);
      } else {
        setFilteredApiItems(null);
      }
    } catch (err) {
      console.error(`Failed to fetch items for card ${cardKey}`, err);
      setFilteredApiItems(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLead = (leadId: number) => {
    setSelectedLeadId(leadId);
    setIsPanelOpen(true);
  };

  const clearCardFilter = () => {
    updateUrlFilter('ALL');
    setFilteredApiItems(null);
  };

  // Base Priority Filtering
  const filteredPriorities = priorities.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.phone && item.phone.includes(searchTerm));

    const matchesRank = priorityRankFilter === 'ALL' || item.priorityLevel === priorityRankFilter;

    let matchesCard = true;
    if (activeCardFilter === 'OVERDUE') {
      matchesCard = item.priorityLevel === 'P1_OVERDUE_FOLLOWUP';
    } else if (activeCardFilter === 'NEGOTIATIONS') {
      matchesCard = item.priorityLevel === 'P2_TODAY_NEGOTIATION' || item.currentStage === 'Negotiation';
    } else if (activeCardFilter === 'TODAYS_FOLLOWUPS') {
      matchesCard = item.priorityLevel === 'P4_TODAY_FOLLOWUP' || item.priorityLevel === 'P1_OVERDUE_FOLLOWUP';
    } else if (activeCardFilter === 'NEW_LEADS') {
      matchesCard = item.priorityLevel === 'P5_TODAY_NEW_LEAD' || item.currentStage === 'New';
    } else if (activeCardFilter === 'HIGH_PRIORITY' || activeCardFilter === 'HIGH_FOCUS') {
      matchesCard = item.qualityTier === 'HOT' || item.priorityLevel === 'P1_OVERDUE_FOLLOWUP' || item.priorityLevel === 'P2_TODAY_NEGOTIATION';
    }

    return matchesSearch && matchesRank && matchesCard;
  });

  const getPriorityBadge = (level: string) => {
    switch (level) {
      case 'P1_OVERDUE_FOLLOWUP':
        return { label: 'P1 • Overdue Follow-up', color: 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-semibold' };
      case 'P2_TODAY_NEGOTIATION':
        return { label: 'P2 • Negotiation Due Today', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold' };
      case 'P3_TODAY_PROPOSAL':
        return { label: 'P3 • Proposal Pending', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-semibold' };
      case 'P4_TODAY_FOLLOWUP':
        return { label: 'P4 • Scheduled Today', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold' };
      case 'P5_TODAY_NEW_LEAD':
        return { label: 'P5 • Fresh Inbound Lead', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold' };
      default:
        return { label: 'P6 • Active Pipeline', color: 'bg-theme-bg-alt text-theme-text-muted border-theme-border' };
    }
  };

  const getCardTitle = (key: string) => {
    switch (key) {
      case 'TODAY_WORK': return "Today's Work Tasks";
      case 'HIGH_FOCUS': return "High Focus Leads";
      case 'OVERDUE': return "Overdue Tasks & Follow-ups";
      case 'HIGH_PRIORITY': return "High Priority Leads";
      case 'NEGOTIATIONS': return "Active Negotiations";
      case 'TODAYS_FOLLOWUPS': return "Today's Scheduled Follow-ups";
      case 'NEW_LEADS': return "New Inbound Leads Today";
      case 'COMPLETED': return "Completed Tasks & Actions";
      default: return "All Priority Items";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
              <Zap className="w-3.5 h-3.5" />
              SMART PRIORITY ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text flex items-center gap-2">
            Priority Center
          </h1>
          <p className="text-xs text-theme-text-muted">
            Intelligently ranked lead queue sorted by urgency, due date, conversion probability, and high-impact actions. Click any KPI card to instantly filter records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPriorityData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-theme-bg-alt hover:bg-theme-card text-theme-text text-xs font-bold rounded-2xl border border-theme-border/80 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Interactive KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Card 1: Today's Work */}
          <button
            type="button"
            onClick={() => handleCardClick('TODAY_WORK')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'TODAY_WORK'
                ? 'bg-theme-primary/10 border-theme-primary ring-2 ring-theme-primary/50 shadow-md'
                : 'bg-theme-card hover:bg-theme-bg-alt/50 border-theme-border/80 hover:border-theme-primary/50'
            }`}
          >
            <div className="text-xs font-semibold text-theme-text-muted">Today's Work</div>
            <div className="text-2xl font-extrabold text-theme-text mt-1">{stats.todaysWorkCount}</div>
            <div className="text-[10px] text-theme-primary font-bold mt-0.5">High Focus Leads</div>
          </button>

          {/* Card 2: Overdue */}
          <button
            type="button"
            onClick={() => handleCardClick('OVERDUE')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'OVERDUE'
                ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/50 shadow-md'
                : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'
            }`}
          >
            <div className="text-xs font-bold text-rose-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Overdue
            </div>
            <div className="text-2xl font-extrabold text-rose-500 mt-1">{stats.overdueCount}</div>
            <div className="text-[10px] text-rose-500/80 font-medium mt-0.5">Immediate Action</div>
          </button>

          {/* Card 3: High Priority */}
          <button
            type="button"
            onClick={() => handleCardClick('HIGH_PRIORITY')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'HIGH_PRIORITY' || activeCardFilter === 'HIGH_FOCUS'
                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
            }`}
          >
            <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> High Priority
            </div>
            <div className="text-2xl font-extrabold text-amber-500 mt-1">{stats.highPriorityCount}</div>
            <div className="text-[10px] text-amber-500/80 font-medium mt-0.5">Top Tier Impact</div>
          </button>

          {/* Card 4: Negotiations */}
          <button
            type="button"
            onClick={() => handleCardClick('NEGOTIATIONS')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'NEGOTIATIONS'
                ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/50 shadow-md'
                : 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40'
            }`}
          >
            <div className="text-xs font-bold text-purple-400">Negotiations</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{stats.negotiationsCount}</div>
            <div className="text-[10px] text-purple-400/80 font-medium mt-0.5">Closing Deals</div>
          </button>

          {/* Card 5: Today's Follow-ups */}
          <button
            type="button"
            onClick={() => handleCardClick('TODAYS_FOLLOWUPS')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'TODAYS_FOLLOWUPS'
                ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                : 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'
            }`}
          >
            <div className="text-xs font-bold text-blue-500">Today's Follow-ups</div>
            <div className="text-2xl font-extrabold text-blue-500 mt-1">{stats.todaysFollowupsCount}</div>
            <div className="text-[10px] text-blue-500/80 font-medium mt-0.5">Scheduled Today</div>
          </button>

          {/* Card 6: New Leads */}
          <button
            type="button"
            onClick={() => handleCardClick('NEW_LEADS')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border shadow-sm ${
              activeCardFilter === 'NEW_LEADS'
                ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
            }`}
          >
            <div className="text-xs font-bold text-emerald-500">New Leads</div>
            <div className="text-2xl font-extrabold text-emerald-500 mt-1">{stats.newLeadsCount}</div>
            <div className="text-[10px] text-emerald-500/80 font-medium mt-0.5">Fresh Inbound</div>
          </button>

          {/* Card 7: Completed */}
          <button
            type="button"
            onClick={() => handleCardClick('COMPLETED')}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer border col-span-2 sm:col-span-1 shadow-sm ${
              activeCardFilter === 'COMPLETED'
                ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                : 'bg-theme-card hover:bg-theme-bg-alt/50 border-theme-border/80 hover:border-theme-primary/50'
            }`}
          >
            <div className="text-xs font-bold text-theme-text-muted flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
            </div>
            <div className="text-2xl font-extrabold text-emerald-500 mt-1">{stats.completedTodayCount}</div>
            <div className="text-[10px] text-theme-text-muted font-medium mt-0.5">Converted / Done</div>
          </button>
        </div>
      )}

      {/* Filter Indicator Badge & Clear Button */}
      {activeCardFilter !== 'ALL' && (
        <div className="flex items-center justify-between bg-theme-primary/10 border border-theme-primary/30 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-theme-primary">
            <Filter size={16} />
            <span>Active Card Filter: <strong>{getCardTitle(activeCardFilter)}</strong></span>
          </div>
          <button
            onClick={clearCardFilter}
            className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-xl transition-all"
          >
            <X size={14} /> Clear Card Filter
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-theme-card border border-theme-border p-4 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search priority leads by name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-bg-alt border border-theme-border rounded-xl pl-9 pr-4 py-2 text-xs text-theme-text placeholder-theme-text-muted focus:outline-none focus:border-theme-primary font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="w-4 h-4 text-theme-text-muted" />
          <span className="text-xs text-theme-text-muted font-bold">Rank Filter:</span>
          {[
            { id: 'ALL', label: 'All Ranks' },
            { id: 'P1_OVERDUE_FOLLOWUP', label: 'P1 Overdue' },
            { id: 'P2_TODAY_NEGOTIATION', label: 'P2 Negotiation' },
            { id: 'P3_TODAY_PROPOSAL', label: 'P3 Proposal' },
            { id: 'P4_TODAY_FOLLOWUP', label: 'P4 Today' },
            { id: 'P5_TODAY_NEW_LEAD', label: 'P5 New' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPriorityRankFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priorityRankFilter === f.id
                  ? 'bg-theme-primary text-white shadow-sm'
                  : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text border border-theme-border/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render API Filtered Items or Priorities Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-theme-text-muted gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-theme-primary" />
          <p className="text-xs font-bold">Filtering priority records...</p>
        </div>
      ) : filteredApiItems && filteredApiItems.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-extrabold text-theme-text-muted uppercase tracking-wider mb-2">
            Showing {filteredApiItems.length} records for filter: {getCardTitle(activeCardFilter)}
          </div>
          {filteredApiItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-theme-card border border-theme-border rounded-3xl p-5 shadow-sm space-y-2 hover:border-theme-primary/60 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-theme-text">
                    {item.title || item.name || item.leadName || `Record #${item.id}`}
                  </h3>
                  <p className="text-xs text-theme-text-muted">
                    {item.description || item.notes || item.remarks || item.company || item.email || 'No additional description provided'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-theme-bg-alt text-theme-primary border border-theme-border">
                      {item.status}
                    </span>
                  )}
                  {(item.leadId || item.id) && (
                    <button
                      onClick={() => handleOpenLead(item.leadId || item.id)}
                      className="px-3 py-1.5 bg-theme-primary text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-theme-primary-hover shadow-sm"
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPriorities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-theme-card border border-theme-border rounded-3xl text-theme-text-muted gap-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          <h3 className="text-base font-extrabold text-theme-text">No Priority Items Pending</h3>
          <p className="text-xs text-theme-text-muted">All high-urgency lead activities for this filter are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPriorities.map((item) => {
            const badge = getPriorityBadge(item.priorityLevel);
            return (
              <div
                key={item.leadId}
                className="group relative bg-theme-card hover:bg-theme-bg-alt/30 border border-theme-border hover:border-theme-primary/80 rounded-3xl p-5 transition-all duration-200 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-theme-bg-alt text-theme-text border border-theme-border">
                        {item.currentStage}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        🔥 {item.qualityTier || 'WARM'} ({item.qualityScore || 75} PTS)
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLead(item.leadId)}
                          className="text-base font-extrabold text-theme-text hover:text-theme-primary transition-colors text-left"
                        >
                          {item.name}
                        </button>
                        {item.company && (
                          <span className="text-xs font-semibold text-theme-text-muted flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {item.company}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-500 font-bold mt-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> {item.urgencyReason}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-theme-text-muted pt-1 font-medium">
                      {item.dueDate && (
                        <div className="flex items-center gap-1 text-theme-text font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-theme-primary" />
                          <span>Due: {item.dueDate} {item.dueTime ? `at ${item.dueTime}` : ''}</span>
                        </div>
                      )}
                      {item.assignedToName && (
                        <div>
                          Owner: <span className="text-theme-text font-bold">{item.assignedToName}</span>
                        </div>
                      )}
                      {item.sourcePlatform && (
                        <div>
                          Source: <span className="text-theme-text-muted">{item.sourcePlatform}</span>
                        </div>
                      )}
                      {item.lastActivityDescription && (
                        <div className="text-theme-text-muted italic">
                          Last: {item.lastActivityDescription}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap border-t lg:border-t-0 pt-3 lg:pt-0 border-theme-border/60">
                    <button
                      onClick={() => handleOpenLead(item.leadId)}
                      className="px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-extrabold rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      Open Lead <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="p-2 bg-theme-bg-alt hover:bg-theme-card text-emerald-500 rounded-2xl border border-theme-border transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}

                    {item.email && (
                      <a
                        href={`mailto:${item.email}`}
                        className="p-2 bg-theme-bg-alt hover:bg-theme-card text-blue-400 rounded-2xl border border-theme-border transition-colors"
                        title="Email Customer"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}

                    {item.phone && (
                      <a
                        href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-theme-bg-alt hover:bg-theme-card text-emerald-400 rounded-2xl border border-theme-border transition-colors"
                        title="WhatsApp Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Work Details Panel */}
      <WorkDetailsPanel
        leadId={selectedLeadId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onLeadUpdated={fetchPriorityData}
      />
    </div>
  );
}
