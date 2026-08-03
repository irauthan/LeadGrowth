import React, { useEffect, useState } from 'react';
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
  Check, 
  Loader2, 
  Search,
  History,
  X,
  Phone,
  Mail,
  Zap,
  Tag,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Ban,
  TrendingUp,
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
  const [modalLead, setModalLead] = useState<{ id: number; name: string; stage?: string; assignedUserId?: number } | null>(null);
  const [activeFollowupToReschedule, setActiveFollowupToReschedule] = useState<FollowUp | null>(null);

  const [bulkScheduling, setBulkScheduling] = useState(false);
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
      const res = await api.get('/leads');
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
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const handleCancel = async (id: number) => {
    const reason = window.prompt('Enter reason for cancelling this follow-up (optional):');
    try {
      await followUpService.cancel(id, reason || undefined);
      setSuccessMsg('Follow-up cancelled. Time slot freed for Auto Schedule.');
      fetchFollowups();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel follow-up');
    }
  };

  const handleSingleAutoSchedule = async (leadId: number, leadName: string) => {
    try {
      await followUpService.autoSchedule(leadId);
      setSuccessMsg(`Auto-scheduled next available slot for ${leadName}!`);
      fetchFollowups();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Auto-schedule failed');
    }
  };

  const handleBulkAutoSchedule = async () => {
    const pendingLeads = followups
      .filter((f) => f.status === 'UPCOMING' || f.status === 'PENDING' || f.status === 'OVERDUE')
      .map((f) => f.leadId);

    const uniqueLeadIds = Array.from(new Set(pendingLeads));
    if (uniqueLeadIds.length === 0) {
      alert('No pending or overdue leads found to auto-schedule.');
      return;
    }

    if (!window.confirm(`Auto-schedule ${uniqueLeadIds.length} pending/overdue leads to nearest available working hour slots?`)) return;

    setBulkScheduling(true);
    try {
      await followUpService.bulkAutoSchedule(uniqueLeadIds);
      setSuccessMsg(`Successfully auto-scheduled ${uniqueLeadIds.length} leads without conflicts!`);
      fetchFollowups();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk auto schedule failed.');
    } finally {
      setBulkScheduling(false);
    }
  };

  const openScheduleModalForLead = (leadId: number, leadName: string, stage?: string, assignedUserId?: number) => {
    setActiveFollowupToReschedule(null);
    setModalLead({ id: leadId, name: leadName, stage, assignedUserId });
    setShowScheduleModal(true);
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

    // 2. Stage Filter
    if (stageFilter !== 'ALL' && f.leadStage !== stageFilter) return false;

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
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-extrabold uppercase border border-blue-500/20">
              Enterprise Scheduling Module
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-theme-text mt-1">Lead Follow-up & Scheduling</h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Stage-independent follow-ups with conflict detection, 9 AM – 7 PM working hours enforcement, and smart auto-scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleBulkAutoSchedule}
            disabled={bulkScheduling}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {bulkScheduling ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>Bulk Auto Schedule</span>
          </button>

          <button
            onClick={() => {
              if (leads.length > 0) {
                openScheduleModalForLead(leads[0].id, leads[0].name, leads[0].status, leads[0].assignedToId);
              } else {
                alert('No leads available to schedule.');
              }
            }}
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

      {/* Filter Toolbar & Status Tabs */}
      <div className="p-4 rounded-3xl border border-theme-border bg-theme-card shadow-md space-y-4">
        
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
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

      </div>

      {/* Follow-ups List Table / Cards */}
      <div className="rounded-3xl border border-theme-border bg-theme-card shadow-md overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center space-y-2 flex-col">
            <Loader2 size={36} className="animate-spin text-blue-600" />
            <span className="text-xs font-bold text-theme-text-muted">Loading follow-ups & schedules...</span>
          </div>
        ) : filteredFollowups.length === 0 ? (
          <div className="p-12 text-center text-theme-text-muted space-y-2">
            <Calendar size={40} className="mx-auto text-theme-text-muted opacity-40" />
            <h3 className="text-sm font-extrabold text-theme-text">No Follow-ups Found</h3>
            <p className="text-xs">No scheduled follow-ups match your current tab or search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/50">
            {filteredFollowups.map((f) => {
              const isDone = f.status === 'COMPLETED';
              const isOverdue = f.isOverdue || f.status === 'OVERDUE' || f.status === 'MISSED';

              return (
                <div
                  key={f.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-theme-bg-alt/30 ${
                    isOverdue ? 'bg-rose-500/5' : ''
                  }`}
                >
                  {/* Left Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => {
                          setSelectedLeadId(f.leadId);
                          setIsPanelOpen(true);
                        }}
                        className="text-sm font-extrabold text-theme-text cursor-pointer hover:text-blue-600 hover:underline"
                      >
                        {f.leadName}
                      </h3>

                      {/* Stage Badge (Rule 7: Works across every lead stage) */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-theme-bg-alt border text-theme-text border-theme-border/60">
                        Stage: {f.leadStage || 'New Lead'}
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
                      <span className="flex items-center gap-1 font-mono text-blue-600 font-bold">
                        <Clock size={14} /> {f.scheduledAt ? new Date(f.scheduledAt).toLocaleString() : 'N/A'}
                      </span>

                      <span className="flex items-center gap-1">
                        <Tag size={14} /> {f.type}
                      </span>

                      {f.assignedToName && (
                        <span className="flex items-center gap-1">
                          <UserIcon size={14} /> Assigned: {f.assignedToName}
                        </span>
                      )}
                    </div>

                    {f.notes && (
                      <p className="text-xs text-theme-text-muted bg-theme-bg-alt/40 p-2 rounded-xl border border-theme-border/30 max-w-2xl">
                        {f.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {f.status !== 'COMPLETED' && f.status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => handleComplete(f.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 size={14} /> Complete
                        </button>

                        <button
                          onClick={() => openRescheduleModalForFollowup(f)}
                          className="px-3 py-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-card border border-theme-border font-bold text-xs text-theme-text flex items-center gap-1 transition-all"
                        >
                          <RefreshCw size={14} /> Reschedule
                        </button>

                        <button
                          onClick={() => handleSingleAutoSchedule(f.leadId, f.leadName)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 flex items-center gap-1 transition-all"
                          title="Auto-schedule next free slot"
                        >
                          <Zap size={14} /> Auto
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
        onLeadUpdated={fetchFollowups}
      />

    </div>
  );
}
