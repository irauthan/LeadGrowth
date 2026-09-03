import { useEffect, useState } from 'react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';
import api from '../services/api';
import { followUpService, type FollowUp } from '../services/followUpService';
import FollowUpModal from '../components/FollowUpModal';
import WorkDetailsPanel from '../components/WorkDetailsPanel';
import type { Lead } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search,
  Zap,
  Tag,
  User as UserIcon,
  Calendar,
  RefreshCw,
  Ban,
  Filter
} from 'lucide-react';

export default function Followups() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'ALL' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Selected Lead Modal / Panel
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Follow-up Scheduling Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLeadSelectModal, setShowLeadSelectModal] = useState(false);
  const [leadSelectSearch, setLeadSelectSearch] = useState('');
  const [modalLead, setModalLead] = useState<{ id: number; name: string; stage?: string; assignedUserId?: number } | null>(null);
  const [activeFollowupToReschedule, setActiveFollowupToReschedule] = useState<FollowUp | null>(null);

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchFollowups();
    fetchLeads();
  }, []);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const data = await followUpService.getFollowups();
      setFollowups(data || []);
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
      await followUpService.complete(id);
      setSuccessMsg('Follow-up marked as completed!');
      fetchFollowups();
      fetchLeads();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel and remove this follow-up? This will immediately free up the booked time slot.')) {
      return;
    }
    try {
      setFollowups((prev) => prev.filter((f) => f.id !== id));
      await followUpService.cancel(id);
      setSuccessMsg('Follow-up removed & time slot freed successfully!');
      fetchFollowups();
      fetchLeads();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      fetchFollowups();
      alert(err.response?.data?.message || 'Failed to cancel follow-up');
    }
  };

  const openScheduleModalForLead = (leadId: number, leadName: string, stage?: string, assignedUserId?: number) => {
    setActiveFollowupToReschedule(null);
    setModalLead({ id: leadId, name: leadName, stage, assignedUserId });
    setShowScheduleModal(true);
    setShowLeadSelectModal(false);
  };

  const openRescheduleModalForFollowup = (f: FollowUp) => {
    setActiveFollowupToReschedule(f);
    setModalLead({ id: f.leadId, name: f.leadName, stage: f.leadStage, assignedUserId: f.assignedToId });
    setShowScheduleModal(true);
  };

  // Filtered Follow-ups Logic
  const filteredFollowups = followups.filter((f) => {
    // 1. Status Filter
    if (statusTab === 'UPCOMING' && !(f.status === 'UPCOMING' || f.status === 'PENDING' || f.status === 'SCHEDULED')) return false;
    if (statusTab === 'OVERDUE' && !(f.status === 'OVERDUE' || f.status === 'MISSED' || f.isOverdue)) return false;
    if (statusTab === 'COMPLETED' && f.status !== 'COMPLETED') return false;
    if (statusTab === 'CANCELLED' && f.status !== 'CANCELLED') return false;

    // 2. Stage Filter (flexible matching so all ongoing work stages display)
    if (stageFilter !== 'ALL') {
      const sFilter = stageFilter.toLowerCase();
      const lStage = (f.leadStage || '').toLowerCase();
      if (!lStage.includes(sFilter) && !sFilter.includes(lStage)) return false;
    }

    // 3. Search Filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = f.leadName?.toLowerCase().includes(q);
      const matchType = f.type?.toLowerCase().includes(q);
      const matchStage = f.leadStage?.toLowerCase().includes(q);
      const matchNotes = f.notes?.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchStage && !matchNotes) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    if (isOverdue || status === 'OVERDUE' || status === 'MISSED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
          <AlertCircle size={12} /> Overdue
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-500/10 text-gray-500 border border-gray-500/20 flex items-center gap-1">
          <Ban size={12} /> Cancelled
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
        <Clock size={12} /> Scheduled
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-theme-card p-6 rounded-3xl border border-theme-border shadow-md">
        <div>
          <h1 className="text-2xl font-extrabold text-theme-text">Lead Follow-up & Scheduling</h1>
          <p className="text-xs text-theme-text-muted mt-1">
            Stage-independent follow-ups with conflict detection, 9 AM – 7 PM working hours enforcement, and smart auto-scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowLeadSelectModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus size={16} /> New Schedule
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Merged Card: Filters Toolbar + Follow-ups List */}
      <div className="rounded-3xl border border-theme-border bg-theme-card shadow-md overflow-hidden">
        
        {/* Top Filters & Tabs Bar */}
        <div className="p-4 space-y-4 border-b border-theme-border/60 bg-theme-card">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 flex-wrap border-b border-theme-border/40 pb-3">
            {[
              { key: 'ALL', label: 'All Follow-ups' },
              { key: 'UPCOMING', label: 'Scheduled / Upcoming' },
              { key: 'OVERDUE', label: 'Overdue' },
              { key: 'COMPLETED', label: 'Completed' },
              { key: 'CANCELLED', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                  statusTab === tab.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Stage Filters */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3.5 top-3 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Search by lead name, stage, follow-up type, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-theme-bg-alt pl-9 pr-3 py-2 text-xs font-semibold text-theme-text outline-none border border-theme-border/60 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-theme-text-muted flex items-center gap-1">
                <Filter size={14} /> Stage:
              </span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-2 text-xs font-bold text-theme-text outline-none focus:border-blue-500"
              >
                <option value="ALL">All Lead Stages</option>
                <option value="New">New Leads</option>
                <option value="Interaction">Interaction</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Follow-ups List */}
        {loading ? (
          <HoosshBeeLoader text="Loading Follow-ups & Schedules..." subtext="Retrieving reminders, call queues and upcoming meetings" />
        ) : filteredFollowups.length === 0 ? (
          <div className="p-12 text-center text-theme-text-muted space-y-2">
            <Calendar size={40} className="mx-auto text-theme-text-muted opacity-40" />
            <h3 className="text-sm font-extrabold text-theme-text">No Follow-ups Found</h3>
            <p className="text-xs">No scheduled follow-ups match your current tab or search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/50">
            {filteredFollowups.map((f) => {
              const isOverdue = f.isOverdue || f.status === 'OVERDUE' || f.status === 'MISSED';

              return (
                <div
                  key={f.id}
                  className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:bg-theme-bg-alt/30 ${
                    isOverdue ? 'bg-rose-500/5' : ''
                  }`}
                >
                  {/* Left Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => {
                          setSelectedLeadId(f.leadId);
                          setIsPanelOpen(true);
                        }}
                        className="text-sm font-black text-theme-text cursor-pointer hover:text-theme-primary hover:underline flex items-center gap-1.5"
                      >
                        {f.leadName}
                      </h3>

                      {/* Stage Badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-theme-bg-alt border text-theme-text border-theme-border/60">
                        Stage: {f.leadStage || 'Interaction'}
                      </span>

                      {/* Status Badge */}
                      {getStatusBadge(f.status, f.isOverdue)}

                      {/* High Priority Badge if escalated */}
                      {f.leadPriority === 'High' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-theme-text-muted flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-blue-500 font-extrabold">
                        <Clock size={14} /> {f.scheduledAt ? new Date(f.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>

                      <span className="flex items-center gap-1 font-bold">
                        <Tag size={13} className="text-theme-primary" /> {f.type}
                      </span>

                      {f.leadPhone && (
                        <a 
                          href={`tel:${f.leadPhone}`} 
                          className="flex items-center gap-1 text-emerald-500 hover:underline font-bold"
                          title="Call Lead"
                        >
                          📞 {f.leadPhone}
                        </a>
                      )}

                      {f.leadEmail && (
                        <span className="text-theme-text-muted">
                          ✉️ {f.leadEmail}
                        </span>
                      )}

                      {f.assignedToName && (
                        <span className="flex items-center gap-1">
                          <UserIcon size={13} /> Assigned: {f.assignedToName}
                        </span>
                      )}
                    </div>

                    {f.notes && (
                      <p className="text-xs text-theme-text-muted bg-theme-bg-alt/40 p-2.5 rounded-xl border border-theme-border/30 max-w-2xl font-medium">
                        "{f.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Primary Action: Work on Lead */}
                    <button
                      onClick={() => {
                        setSelectedLeadId(f.leadId);
                        setIsPanelOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Zap size={14} /> Work on Lead
                    </button>

                    {f.status !== 'COMPLETED' && f.status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => handleComplete(f.id)}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1 transition-all"
                          title="Mark Follow-up Completed"
                        >
                          <CheckCircle2 size={14} /> Complete
                        </button>

                        <button
                          onClick={() => openRescheduleModalForFollowup(f)}
                          className="px-3 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-card border border-theme-border font-bold text-xs text-theme-text flex items-center gap-1 transition-all"
                          title="Reschedule Follow-up"
                        >
                          <RefreshCw size={14} /> Reschedule
                        </button>

                        <button
                          onClick={() => handleCancel(f.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                          title="Cancel Follow-up (frees slot)"
                        >
                          <Ban size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LEAD SELECTOR MODAL FOR NEW SCHEDULE */}
      {showLeadSelectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
          <div className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div>
                <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                  <Calendar size={18} className="text-theme-primary" /> Select Lead to Schedule Follow-up
                </h3>
                <p className="text-xs text-theme-text-muted mt-0.5">
                  Pick a lead from your workspace to set a scheduled touchpoint.
                </p>
              </div>
              <button 
                onClick={() => setShowLeadSelectModal(false)}
                className="p-1 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Search leads by client name, company, phone, or email..."
                value={leadSelectSearch}
                onChange={(e) => setLeadSelectSearch(e.target.value)}
                className="w-full rounded-2xl bg-theme-bg-alt pl-9 pr-3 py-2.5 text-xs font-semibold text-theme-text outline-none border border-theme-border/60 focus:border-theme-primary"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-theme-border/40 custom-scrollbar max-h-96">
              {leads
                .filter((l) => {
                  if (!leadSelectSearch) return true;
                  const q = leadSelectSearch.toLowerCase();
                  return (
                    l.name?.toLowerCase().includes(q) ||
                    l.company?.toLowerCase().includes(q) ||
                    l.phone?.toLowerCase().includes(q) ||
                    l.email?.toLowerCase().includes(q)
                  );
                })
                .map((l) => {
                  const activeF = followups.find((f) => f.leadId === l.id && f.status !== 'COMPLETED' && f.status !== 'CANCELLED');

                  return (
                    <div
                      key={l.id}
                      onClick={() => {
                        if (activeF) {
                          openRescheduleModalForFollowup(activeF);
                        } else {
                          openScheduleModalForLead(l.id, l.name, l.status, l.assignedToId);
                        }
                      }}
                      className="p-3.5 hover:bg-theme-bg-alt/60 rounded-2xl cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-theme-text group-hover:text-theme-primary transition-colors">
                            {l.name}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-theme-bg-alt border border-theme-border text-theme-text-muted font-bold">
                            {l.status || 'New'}
                          </span>
                          {activeF && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-extrabold flex items-center gap-1">
                              <Clock size={10} /> Active Follow-up
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-theme-text-muted mt-0.5">
                          {l.company || 'No Company'} • {l.phone || 'No Phone'} • {l.email}
                        </div>
                      </div>
                      <button className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeF 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white border border-amber-500/20'
                          : 'bg-theme-primary/10 text-theme-primary group-hover:bg-theme-primary group-hover:text-white'
                      }`}>
                        {activeF ? 'Reschedule' : 'Schedule +'}
                      </button>
                    </div>
                  );
                })}
              {leads.length === 0 && (
                <div className="p-8 text-center text-xs text-theme-text-muted">
                  No leads found in workspace.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Scheduling Modal */}
      {modalLead && (
        <FollowUpModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setModalLead(null);
            setActiveFollowupToReschedule(null);
          }}
          leadId={modalLead.id}
          leadName={modalLead.name}
          leadStage={modalLead.stage}
          assignedUserId={modalLead.assignedUserId}
          existingFollowup={activeFollowupToReschedule}
          onSuccess={() => {
            fetchFollowups();
            fetchLeads();
            setSuccessMsg('Follow-up schedule updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
          }}
        />
      )}

      {/* WorkDetailsPanel */}
      <WorkDetailsPanel
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
        onLeadUpdated={() => {
          fetchFollowups();
          fetchLeads();
        }}
      />

    </div>
  );
}
