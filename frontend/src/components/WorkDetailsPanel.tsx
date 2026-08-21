import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  FileText, 
  History, 
  IndianRupee, 
  Plus, 
  Calendar, 
  Download,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Video,
  Building2,
  Activity,
  ArrowUpDown,
  AlertCircle,
  Eye,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  UserCheck,
  Loader2,
  Zap,
  XCircle,
  Lightbulb,
  Timer
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { downloadSingleLeadPdf } from '../services/reportService';
import type { SalesActivity, SalesActivityLog } from '../types';
import CallTimerWidget from './CallTimerWidget';
import CallHistoryLog from './CallHistoryLog';
import SchedulePreviewSidePanel from './SchedulePreviewSidePanel';

const formatLocalDateOnly = (val?: string | Date): string => {
  if (!val) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (typeof val === 'string') {
    const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}`;
};

const formatTimeDisplay = (timeStr?: string): string => {
  if (!timeStr) return '10:00 AM';
  let t = timeStr;
  if (t.includes('T')) {
    t = t.split('T')[1];
  }
  const parts = t.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return '10:00 AM';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = parts[1] ? parts[1].slice(0, 2) : '00';
  return `${h12}:${m} ${ampm}`;
};

interface WorkDetailsPanelProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  inline?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export default function WorkDetailsPanel({ 
  leadId, 
  isOpen, 
  onClose, 
  onLeadUpdated,
  inline = false,
  isMaximized,
  onToggleMaximize
}: WorkDetailsPanelProps) {
  const [internalMaximized, setInternalMaximized] = useState(false);
  const maximized = isMaximized !== undefined ? isMaximized : internalMaximized;
  const toggleMaximize = onToggleMaximize || (() => setInternalMaximized(!internalMaximized));

  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');
  const isManager = currentUser?.roles?.includes('ROLE_MANAGER');
  const isManagementUser = isAdmin || isManager;

  const [lead, setLead] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activityLogsHistory, setActivityLogsHistory] = useState<SalesActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'notes' | 'timeline' | 'followup'>('activities');
  const [historySubTab, setHistorySubTab] = useState<'all' | 'attempts'>('all');

  // Management Assignee State
  const [members, setMembers] = useState<any[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assigningLead, setAssigningLead] = useState<boolean>(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [clientNotes, setClientNotes] = useState('');
  const [proposalAmount, setProposalAmount] = useState<number | string>('');

  // Expandable Step Accordions State
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  // Sort order per step (true = Newest First, false = Oldest First)
  const [newestFirstSort, setNewestFirstSort] = useState<Record<string, boolean>>({});

  // Add Activity Modal State
  const [addModalStepKey, setAddModalStepKey] = useState<string | null>(null);
  const [communicationType, setCommunicationType] = useState('PHONE_CALL');
  const [outcome, setOutcome] = useState('BUSY');
  const [activityRemarks, setActivityRemarks] = useState('');
  const [activityDuration, setActivityDuration] = useState('5 mins');
  const [activityStatus, setActivityStatus] = useState('ATTEMPTED');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Complete Step Modal State
  const [completeModalStepKey, setCompleteModalStepKey] = useState<string | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Clickable Interaction Detail Modal State
  const [selectedInteractionDetail, setSelectedInteractionDetail] = useState<any | null>(null);
  const [copiedRemarks, setCopiedRemarks] = useState(false);

  // Followup form state
  const [followupType, setFollowupType] = useState('CALL');
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  const [schedulingFollowup, setSchedulingFollowup] = useState(false);

  useEffect(() => {
    if (leadId && isOpen) {
      fetchLeadDetails();
      if (isManagementUser) {
        fetchMembers();
      }
    }
  }, [leadId, isOpen, isManagementUser]);

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
      }
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !selectedAssigneeId) return;
    setAssigningLead(true);
    try {
      if (selectedAssigneeId === '-1') {
        await api.post(`/api/leads/${leadId}/auto-assign`);
        setAssignSuccessMsg('Lead successfully auto-assigned via Smart AI Hybrid Engine!');
      } else {
        await api.patch(`/api/leads/${leadId}/assign`, null, {
          params: { userId: parseInt(selectedAssigneeId, 10) }
        });
        setAssignSuccessMsg('Lead successfully assigned!');
      }
      setTimeout(() => setAssignSuccessMsg(''), 4000);
      fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign lead.');
    } finally {
      setAssigningLead(false);
    }
  };

  const handleAutoAssignLead = async () => {
    if (!leadId) return;
    setAssigningLead(true);
    try {
      await api.post(`/api/leads/${leadId}/auto-assign`);
      setAssignSuccessMsg('Lead successfully auto-assigned via Smart AI Hybrid Engine!');
      setTimeout(() => setAssignSuccessMsg(''), 4000);
      fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to auto-assign lead.');
    } finally {
      setAssigningLead(false);
    }
  };

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [leadRes, timelineRes, logsRes] = await Promise.all([
        api.get(`/api/leads/${leadId}`),
        api.get(`/api/leads/${leadId}/timeline`).catch(() => ({ data: [] })),
        api.get(`/api/leads/${leadId}/activities-history`).catch(() => ({ data: [] }))
      ]);
      setLead(leadRes.data);
      setClientNotes(leadRes.data?.clientNotes || '');
      setProposalAmount(leadRes.data?.proposalAmount || '');
      setTimeline(Array.isArray(timelineRes.data) ? timelineRes.data : []);
      setActivityLogsHistory(Array.isArray(logsRes.data) ? logsRes.data : []);

      // Auto-expand first non-completed step or first step
      if (leadRes.data && Array.isArray(leadRes.data.activities) && leadRes.data.activities.length > 0) {
        const initialExpand: Record<string, boolean> = {};
        let expandedOne = false;
        leadRes.data.activities.forEach((act: SalesActivity) => {
          if (!expandedOne && act.status !== 'COMPLETED') {
            initialExpand[act.activityKey] = true;
            expandedOne = true;
          }
        });
        if (!expandedOne) {
          initialExpand[leadRes.data.activities[0].activityKey] = true;
        }
        setExpandedSteps((prev) => ({ ...initialExpand, ...prev }));
      }
    } catch (err) {
      console.error('Failed to load lead details', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepExpanded = (activityKey: string) => {
    setExpandedSteps((prev) => ({ ...prev, [activityKey]: !prev[activityKey] }));
  };

  const toggleStepSort = (activityKey: string) => {
    setNewestFirstSort((prev) => ({ ...prev, [activityKey]: !(prev[activityKey] ?? true) }));
  };

  const handleOpenAddModal = (activityKey: string) => {
    setAddModalStepKey(activityKey);
    setCommunicationType('PHONE_CALL');
    setOutcome('BUSY');
    setActivityRemarks('');
    setActivityDuration('5 mins');
    setActivityStatus('ATTEMPTED');
    setNextFollowupDate('');
  };

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !addModalStepKey) return;
    setSubmittingActivity(true);
    try {
      const payload = {
        communicationType,
        outcome,
        remarks: activityRemarks,
        duration: activityDuration,
        status: activityStatus,
        nextFollowupDate: nextFollowupDate ? (nextFollowupDate.length === 16 ? `${nextFollowupDate}:00` : nextFollowupDate) : null
      };
      await api.post(`/api/leads/${leadId}/workflow-steps/${addModalStepKey}/activities`, payload);
      setAddModalStepKey(null);
      fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record activity log');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleOpenCompleteModal = (activityKey: string) => {
    setCompleteModalStepKey(activityKey);
    setCompletionRemarks('');
  };

  const handleCompleteStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !completeModalStepKey) return;
    setSubmittingCompletion(true);
    try {
      const payload: any = {
        completionRemarks
      };
      if (proposalAmount !== '' && proposalAmount !== undefined && proposalAmount !== null) {
        payload.proposalAmount = Number(proposalAmount);
      }
      await api.post(`/api/leads/${leadId}/workflow-steps/${completeModalStepKey}/complete`, payload);
      setCompleteModalStepKey(null);
      fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete workflow step');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleAutoSaveNotes = async (newNotes: string) => {
    setClientNotes(newNotes);
    setAutoSaveStatus('Auto-saving...');
    try {
      await api.patch(`/api/leads/${leadId}/auto-save`, {
        clientNotes: newNotes
      });
      setAutoSaveStatus('Saved Successfully');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (e) {
      setAutoSaveStatus('Failed to save');
    }
  };

  const handleProposalSave = async () => {
    if (!leadId) return;
    setSavingNotes(true);
    try {
      await api.patch(`/api/leads/${leadId}/auto-save`, {
        proposalAmount: Number(proposalAmount),
        proposalStatus: 'SENT'
      });
      setAutoSaveStatus('Proposal Details Saved');
      fetchLeadDetails();
      onLeadUpdated();
    } catch (e) {
      alert('Failed to save proposal');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !followupDate) return;
    setSchedulingFollowup(true);
    try {
      await api.post(`/api/followups`, {
        leadId,
        scheduledAt: followupDate,
        type: followupType,
        notes: followupNotes
      });
      alert('Follow-up scheduled successfully!');
      setFollowupDate('');
      setFollowupNotes('');
      fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule follow-up');
    } finally {
      setSchedulingFollowup(false);
    }
  };

  const handleCopyRemarks = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRemarks(true);
    setTimeout(() => setCopiedRemarks(false), 2500);
  };

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'PHONE_CALL': return <Phone size={13} className="text-blue-400" />;
      case 'WHATSAPP': return <MessageSquare size={13} className="text-emerald-400" />;
      case 'EMAIL': return <Mail size={13} className="text-amber-400" />;
      case 'GOOGLE_MEET':
      case 'ZOOM':
      case 'VIDEO_CALL': return <Video size={13} className="text-purple-400" />;
      case 'OFFICE_VISIT': return <Building2 size={13} className="text-indigo-400" />;
      default: return <Activity size={13} className="text-theme-primary" />;
    }
  };

  const getOutcomeBadgeClass = (out: string) => {
    switch (out) {
      case 'CONNECTED':
      case 'INTERESTED':
      case 'SUCCESSFUL':
      case 'CONVERTED':
      case 'MEETING_SCHEDULED':
      case 'DEMO_SCHEDULED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'BUSY':
      case 'NOT_ANSWERED':
      case 'REJECTED_CALL':
      case 'WRONG_NUMBER': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'NOT_INTERESTED':
      case 'LOST':
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  if (!isOpen) return null;

  const containerClass = inline
    ? 'rounded-3xl overflow-hidden min-h-[680px]'
    : `border-l ${maximized ? 'max-w-6xl w-[94vw]' : 'max-w-2xl w-full'}`;

  const panelInner = (
    <div className={`bg-theme-card border border-theme-border flex flex-col shadow-xl relative w-full h-full ${containerClass}`}>
      {/* Top Header */}
      <div className="p-5 border-b border-theme-border flex items-center justify-between bg-theme-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary font-black text-sm">
            {lead?.name?.substring(0, 2).toUpperCase() || 'LD'}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-theme-text flex items-center gap-2">
              {lead?.name || 'Lead Work Container'}
              <select
                value={lead?.status || 'New'}
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  if (!lead?.id) return;
                  try {
                    await api.patch(`/api/leads/${lead.id}/status`, null, { params: { status: newStatus } });
                    fetchLeadDetails();
                    onLeadUpdated();
                  } catch (err) {
                    console.error('Failed to update stage', err);
                  }
                }}
                className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-primary focus:outline-none focus:border-theme-primary cursor-pointer shadow-xs"
              >
                <option value="New">NEW</option>
                <option value="Interaction">INTERACTION</option>
                <option value="Follow-up">FOLLOW-UP</option>
                <option value="Proposal Sent">PROPOSAL SENT</option>
                <option value="Negotiation">NEGOTIATION</option>
                <option value="Converted">CONVERTED</option>
                <option value="Lost">LOST (DROP LEAD)</option>
              </select>
            </h2>
            <p className="text-xs text-theme-text-muted">
              {lead?.company || 'No Company'} • {lead?.email} • {lead?.phone || 'No Phone'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Maximize / Minimize Toggle Button */}
          <button
            type="button"
            onClick={toggleMaximize}
            title={maximized ? "Minimize Container" : "Maximize Container"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-primary hover:border-theme-primary transition-all text-xs font-bold shadow-xs"
          >
            {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline text-[11px]">{maximized ? 'Minimize' : 'Maximize'}</span>
          </button>

          {lead && (
            <button
              onClick={() => downloadSingleLeadPdf(lead)}
              title="Export Lead PDF"
              className="p-2 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text hover:border-theme-primary transition-all"
            >
              <Download size={16} />
            </button>
          )}

          {!inline && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text hover:border-rose-500 transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

          {/* Quick Metrics Bar */}
          <div className="px-6 py-3 bg-theme-card/30 border-b border-theme-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-theme-text-muted block">QUALITY TIER</span>
                <span className="font-extrabold text-amber-400">{lead?.qualityTier || 'WARM'}</span>
              </div>
              <div className="h-6 w-px bg-theme-border" />
              <div>
                <span className="text-[10px] font-bold text-theme-text-muted block">WORKFLOW PROGRESS</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-theme-bg-alt overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-theme-primary to-emerald-400"
                      style={{ width: `${lead?.progressPercentage || 0}%` }}
                    />
                  </div>
                  <span className="font-extrabold text-theme-text">{lead?.progressPercentage || 0}%</span>
                </div>
              </div>
              <div className="h-6 w-px bg-theme-border" />
              <div>
                <span className="text-[10px] font-bold text-theme-text-muted block">ASSIGNED REP</span>
                <span className="font-bold text-theme-text">{lead?.assignedToName || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Body Section */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center space-y-3 flex-col">
              <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-theme-text-muted">Loading Enterprise Multi-Activity Engine...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Call Duration Tracking Widget (Sales Reps Only) */}
              {lead && !isManagementUser && (
                <CallTimerWidget
                  leadId={lead.id}
                  leadName={lead.name}
                  assignedToId={lead.assignedToId}
                  onCallEnded={() => {
                    fetchLeadDetails();
                    onLeadUpdated();
                  }}
                />
              )}

              {/* Overdue Action Banner */}
              {lead && lead.nextFollowupDate && new Date(lead.nextFollowupDate).getTime() < Date.now() && lead.status !== 'Converted' && lead.status !== 'Lost' && lead.status !== 'Rejected' && lead.followupStatus !== 'COMPLETED' && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-extrabold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-400 animate-pulse" />
                        <span>OVERDUE ACTION REQUIRED FOR THIS LEAD!</span>
                      </p>
                      <p className="text-[11px] font-semibold text-rose-400 mt-0.5">
                        Scheduled follow-up ({new Date(lead.nextFollowupDate).toLocaleString()}) was missed.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('followup')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow shrink-0 self-start sm:self-auto transition-all"
                  >
                    Reschedule / View Slot
                  </button>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-theme-card border border-theme-border rounded-2xl">
                {[
                  { 
                    id: 'activities', 
                    label: isManagementUser ? 'Lead Assignment' : 'Workflow Stages', 
                    icon: isManagementUser ? UserCheck : CheckCircle2 
                  },
                  { id: 'notes', label: 'Proposal & Notes', icon: FileText },
                  { 
                    id: 'followup', 
                    label: 'Schedule Follow-up', 
                    icon: Calendar,
                    hasAlert: Boolean(lead && lead.nextFollowupDate && new Date(lead.nextFollowupDate).getTime() < Date.now() && lead.status !== 'Converted' && lead.status !== 'Lost' && lead.status !== 'Rejected' && lead.followupStatus !== 'COMPLETED')
                  },
                  { id: 'timeline', label: 'Interaction History', icon: History }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-extrabold transition-all relative ${
                        isActive
                          ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
                          : tab.hasAlert
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                          : 'bg-theme-bg-alt/50 text-theme-text-muted hover:text-theme-text'
                      }`}
                    >
                      <Icon size={14} /> 
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.hasAlert && (
                        <span className="text-[9px] font-extrabold bg-rose-500 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                          OVERDUE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: LEAD ASSIGNMENT (ADMIN/MANAGER) OR WORKFLOW STAGES (SALES REPS) */}
              {activeTab === 'activities' && (
                <div className="space-y-4">
                  {isManagementUser ? (
                    <div className="space-y-5">
                      {/* Lead Assignment Card */}
                      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-theme-border pb-4">
                          <div>
                            <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                              <UserCheck size={18} className="text-theme-primary" />
                              <span>Lead Assignment & Ownership Controls</span>
                            </h3>
                            <p className="text-xs text-theme-text-muted mt-0.5">
                              Assign or re-allocate this lead to an active sales executive for client follow-up.
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-theme-primary/10 text-theme-primary text-[10px] font-extrabold">
                            MANAGEMENT CONSOLE
                          </span>
                        </div>

                        {assignSuccessMsg && (
                          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                            <Check size={16} />
                            <span>{assignSuccessMsg}</span>
                          </div>
                        )}

                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-theme-text-muted mb-1.5">
                                CURRENT ASSIGNED EXECUTIVE
                              </label>
                              <div className="p-3 rounded-2xl border border-theme-border bg-theme-bg-alt/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-theme-primary/20 text-theme-primary font-extrabold text-xs flex items-center justify-center">
                                  {lead?.assignedToName ? lead.assignedToName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <span className="font-bold text-xs text-theme-text block">
                                    {lead?.assignedToName || 'Unassigned Lead'}
                                  </span>
                                  <span className="text-[10px] text-theme-text-muted">
                                    {lead?.assignedToName ? 'Active Owner' : 'Needs Assignment'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-theme-text-muted mb-1.5">
                                SELECT SALES EXECUTIVE TO ASSIGN
                              </label>
                              <select
                                value={selectedAssigneeId}
                                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt p-3 text-xs outline-none focus:border-theme-primary text-theme-text font-bold"
                              >
                                <option value="">-- Select Sales Executive --</option>
                                <option value="-1">Auto-Assign via Smart AI Hybrid Engine</option>
                                {members.map((m: any) => (
                                  <option key={m.id} value={m.id}>
                                    {m.fullName || m.name} ({m.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleAutoAssignLead}
                              disabled={assigningLead}
                              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-indigo-500 hover:opacity-90 px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                              title="Automatically assign to best sales rep based on workload score and live availability"
                            >
                              {assigningLead ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                              <span>Auto-Assign (Smart AI Engine)</span>
                            </button>

                            <button
                              type="submit"
                              disabled={assigningLead || !selectedAssigneeId}
                              className="flex items-center gap-2 rounded-2xl bg-theme-card border border-theme-border hover:bg-theme-bg-alt px-5 py-2.5 text-xs font-bold text-theme-text shadow-md disabled:opacity-50 transition-all cursor-pointer"
                            >
                              {assigningLead ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                              <span>Assign Lead to Selected Executive</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Manager Lead Status & Control Card */}
                      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">
                          Supervisory Controls & Pipeline Status
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-theme-text-muted uppercase mb-1">Pipeline Status</label>
                            <select
                              value={lead?.status || 'New'}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  await api.patch(`/api/leads/${lead.id}/status`, null, { params: { status: newStatus } });
                                  fetchLeadDetails();
                                  onLeadUpdated();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="w-full rounded-xl border border-theme-border bg-theme-bg-alt p-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
                            >
                              <option value="New">New</option>
                              <option value="Interaction">Interaction</option>
                              <option value="Qualified">Qualified</option>
                              <option value="Converted">Converted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-theme-text-muted uppercase mb-1">Quality Tier</label>
                            <div className="p-2.5 rounded-xl border border-theme-border bg-theme-bg-alt text-xs font-extrabold text-amber-400">
                              {lead?.qualityTier || 'WARM'}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-theme-text-muted uppercase mb-1">Source Platform</label>
                            <div className="p-2.5 rounded-xl border border-theme-border bg-theme-bg-alt text-xs font-bold text-theme-text">
                              {lead?.sourcePlatform || 'Direct'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                            Enterprise Multi-Activity Workflow Container
                          </h3>
                          <p className="text-[10px] text-theme-text-muted mt-0.5">
                            Record unlimited calls, meetings, WhatsApp & remarks. Stage completes ONLY when explicitly completed.
                          </p>
                        </div>
                        {autoSaveStatus && (
                          <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                            {autoSaveStatus}
                          </span>
                        )}
                      </div>

                  <div className="space-y-4">
                    {lead?.activities?.map((act: SalesActivity) => {
                      const isCompleted = act.status === 'COMPLETED';
                      const isExpanded = expandedSteps[act.activityKey] ?? false;
                      const isNewestFirst = newestFirstSort[act.activityKey] ?? true;
                      const isLostStep = act.activityKey === 'LEAD_LOST' || 
                                         act.activityKey === 'DROP_LEAD' || 
                                         act.title?.toLowerCase().includes('lost') || 
                                         act.title?.toLowerCase().includes('drop');

                      const logs = act.logs || [];
                      const sortedLogs = [...logs].sort((a, b) => 
                        isNewestFirst 
                          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      );

                      return (
                        <div
                          key={act.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isLostStep
                              ? isCompleted
                                ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/30 shadow-md shadow-rose-500/5'
                                : 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60'
                              : isCompleted 
                              ? 'bg-emerald-500/5 border-emerald-500/30' 
                              : 'bg-theme-card border-theme-border hover:border-theme-primary/40'
                          }`}
                        >
                          {/* Step Header */}
                          <div className={`p-4 flex items-center justify-between gap-4 ${isLostStep ? 'bg-rose-500/5' : 'bg-theme-card/80'}`}>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleStepExpanded(act.activityKey)}
                                className="p-1 rounded-lg hover:bg-theme-bg-alt text-theme-text-muted hover:text-theme-text transition-all"
                              >
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </button>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-xs font-extrabold flex items-center gap-1.5 ${
                                    isLostStep 
                                      ? 'text-rose-400' 
                                      : isCompleted 
                                      ? 'text-emerald-400' 
                                      : 'text-theme-text'
                                  }`}>
                                    {isLostStep && <AlertCircle size={14} className="text-rose-400 flex-shrink-0 animate-pulse" />}
                                    <span>{act.title}</span>
                                  </h4>
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                    isLostStep
                                      ? isCompleted
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                      : isCompleted 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                      : act.status === 'IN_PROGRESS'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : 'bg-theme-bg-alt text-theme-text-muted border-theme-border'
                                  }`}>
                                    {isLostStep ? (
                                      <>
                                        <XCircle size={10} className="text-rose-400" />
                                        <span>{isCompleted ? 'LEAD LOST / DROPPED' : 'DROP LEAD STAGE'}</span>
                                      </>
                                    ) : isCompleted ? (
                                      <>
                                        <CheckCircle2 size={10} className="text-emerald-400" />
                                        <span>COMPLETED</span>
                                      </>
                                    ) : (
                                      act.status
                                    )}
                                  </span>
                                  {!isCompleted && lead && lead.nextFollowupDate && new Date(lead.nextFollowupDate).getTime() < Date.now() && lead.status !== 'Converted' && lead.status !== 'Lost' && lead.status !== 'Rejected' && lead.followupStatus !== 'COMPLETED' && (
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse flex items-center gap-1">
                                      <AlertCircle size={10} /> OVERDUE ACTION PENDING
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-theme-text-muted px-2 py-0.5 rounded-md bg-theme-bg-alt/80 border border-theme-border/40">
                                    {logs.length} {logs.length === 1 ? 'Activity' : 'Activities'}
                                  </span>
                                </div>

                                {isCompleted ? (
                                  <p className={`text-[10px] font-medium mt-1 flex items-center gap-1.5 flex-wrap ${isLostStep ? 'text-rose-400/90' : 'text-emerald-400/90'}`}>
                                    {isLostStep ? (
                                      <>
                                        <XCircle size={12} className="text-rose-400 flex-shrink-0" />
                                        <span>Lead marked Lost / Dropped by</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                                        <span>Completed by</span>
                                      </>
                                    )}
                                    <strong className="font-bold">{act.completedByName || 'Sales Rep'}</strong> • {act.completedAt ? new Date(act.completedAt).toLocaleString() : ''}
                                    {act.completionRemarks && ` — "${act.completionRemarks}"`}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-theme-text-muted mt-0.5">
                                    {logs.length > 0 ? `Last activity logged ${new Date(logs[logs.length - 1].createdAt).toLocaleTimeString()}` : 'No activities recorded yet.'}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Header Action Buttons */}
                            <div className="flex items-center gap-2">
                              {!isCompleted && (
                                <button
                                  onClick={() => handleOpenAddModal(act.activityKey)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-white text-[11px] font-bold shadow-xs transition-all"
                                >
                                  <Plus size={13} /> Add Activity
                                </button>
                              )}

                              {!isCompleted && (
                                <button
                                  onClick={() => handleOpenCompleteModal(act.activityKey)}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold shadow-xs transition-all ${
                                    isLostStep
                                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                                      : 'bg-emerald-600 hover:bg-emerald-500'
                                  }`}
                                >
                                  {isLostStep ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                                  <span>{isLostStep ? 'Mark Lost / Drop' : 'Complete Step'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable Activity Timeline Section */}
                          {isExpanded && (
                            <div className="p-4 border-t border-theme-border/40 bg-theme-bg/60 space-y-3">
                              {(act.activityKey === 'NEGOTIATION' || act.activityKey === 'PROPOSAL_SENT') && (
                                <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                  <div className="space-y-0.5">
                                    <span className="text-[11px] font-extrabold uppercase text-theme-primary flex items-center gap-1">
                                      <IndianRupee size={13} className="text-emerald-500" /> Negotiated Deal Revenue (₹)
                                    </span>
                                    <p className="text-[10px] text-theme-text-muted">
                                      Enter agreed deal value during negotiation to calculate dashboard lead revenue.
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-500">₹</span>
                                      <input
                                        type="number"
                                        placeholder="e.g. 50000"
                                        value={proposalAmount}
                                        onChange={(e) => setProposalAmount(e.target.value)}
                                        className="w-36 bg-theme-bg-alt border border-theme-border rounded-xl pl-7 pr-3 py-1.5 text-xs font-extrabold text-theme-text focus:outline-none focus:border-theme-primary"
                                      />
                                    </div>
                                    <button
                                      onClick={handleProposalSave}
                                      disabled={savingNotes}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1"
                                    >
                                      {savingNotes ? 'Saving...' : 'Save Revenue'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[11px] font-bold text-theme-text-muted border-b border-theme-border/30 pb-2">
                                <span>Recorded Interaction Logs ({logs.length})</span>
                                {logs.length > 1 && (
                                  <button
                                    onClick={() => toggleStepSort(act.activityKey)}
                                    className="flex items-center gap-1 text-[10px] text-theme-primary hover:underline font-semibold"
                                  >
                                    <ArrowUpDown size={12} /> {isNewestFirst ? 'Newest First' : 'Oldest First'}
                                  </button>
                                )}
                              </div>

                              {/* Log Timeline Items */}
                              {sortedLogs.length > 0 ? (
                                <div className="space-y-2.5">
                                  {sortedLogs.map((log: SalesActivityLog) => (
                                    <div
                                      key={log.id}
                                      onClick={() => setSelectedInteractionDetail({ ...log, stepTitle: act.title, typeName: 'Activity Attempt' })}
                                      className="p-3 rounded-xl bg-theme-card border border-theme-border/60 hover:border-theme-primary hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer space-y-2 group relative"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-md bg-theme-bg-alt border border-theme-border flex items-center justify-center">
                                            {getCommIcon(log.communicationType)}
                                          </span>
                                          <span className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors flex items-center gap-1">
                                            Attempt #{log.activityNumber} <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </span>
                                          <span className="text-[10px] text-theme-text-muted font-medium">
                                            ({log.communicationType?.replace('_', ' ')})
                                          </span>
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getOutcomeBadgeClass(log.outcome)}`}>
                                            {log.outcome?.replace('_', ' ')}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] text-theme-text-muted">
                                          {log.duration && (
                                            <span className="flex items-center gap-1 bg-theme-bg-alt px-2 py-0.5 rounded-md border border-theme-border">
                                              <Clock size={10} /> {log.duration}
                                            </span>
                                          )}
                                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                      </div>

                                      {/* Remarks */}
                                      <p className="text-xs text-theme-text/90 bg-theme-bg-alt/40 p-2.5 rounded-lg border border-theme-border/30 italic line-clamp-2">
                                        "{log.remarks || 'No detailed remark provided.'}"
                                      </p>

                                      <div className="flex items-center justify-between text-[10px] text-theme-text-muted pt-1">
                                        <span>Logged by: <strong className="text-theme-text font-bold">{log.loggedByName || 'Sales Executive'}</strong></span>
                                        {log.nextFollowupDate && (
                                          <span className="text-amber-400 font-bold flex items-center gap-1">
                                            <Calendar size={11} /> Next Follow-up: {new Date(log.nextFollowupDate).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 bg-theme-card/30 rounded-xl border border-dashed border-theme-border/60 space-y-2">
                                  <AlertCircle size={24} className="mx-auto text-theme-text-muted" />
                                  <p className="text-xs text-theme-text-muted">
                                    No activities recorded for this step yet.
                                  </p>
                                  <button
                                    onClick={() => handleOpenAddModal(act.activityKey)}
                                    className="px-3 py-1 rounded-lg bg-theme-primary/10 border border-theme-primary/30 text-theme-primary text-xs font-bold hover:bg-theme-primary hover:text-white transition-all"
                                  >
                                    + Add First Interaction Attempt
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

              {/* TAB 2: PROPOSAL & NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Commercial Proposal Section */}
                  <div className="p-5 rounded-3xl bg-theme-card border border-theme-border space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                      <IndianRupee size={16} className="text-emerald-400" /> Commercial Proposal Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Proposal Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={proposalAmount}
                          onChange={(e) => setProposalAmount(e.target.value)}
                          className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-4 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleProposalSave}
                          disabled={savingNotes}
                          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <IndianRupee size={14} /> Update Commercial Proposal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* General Executive Notes */}
                  <div className="p-5 rounded-3xl bg-theme-card border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                        <FileText size={16} className="text-theme-primary" /> Executive Workspace Client Notes
                      </h3>
                      {autoSaveStatus && (
                        <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                          {autoSaveStatus}
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={6}
                      placeholder="Add key notes, business details, tech stack, budget limits..."
                      value={clientNotes}
                      onChange={(e) => handleAutoSaveNotes(e.target.value)}
                      className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-4 text-xs text-theme-text focus:outline-none focus:border-theme-primary leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SCHEDULE FOLLOW-UP */}
              {activeTab === 'followup' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <form onSubmit={handleScheduleFollowup} className="lg:col-span-7 p-5 rounded-3xl bg-theme-card border border-theme-border space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                      <Calendar size={16} className="text-theme-primary" /> Schedule Direct Follow-up Task
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Follow-up Type</label>
                        <select
                          value={followupType}
                          onChange={(e) => setFollowupType(e.target.value)}
                          className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                        >
                          <option value="CALL">Phone Call</option>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">Email</option>
                          <option value="MEETING">Meeting / Demo</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Scheduled Date *</label>
                        <input
                          type="date"
                          required
                          value={formatLocalDateOnly(followupDate || new Date())}
                          min={formatLocalDateOnly(new Date())}
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            if (!dateVal) return;
                            const timePart = followupDate && followupDate.includes('T') ? followupDate.split('T')[1].slice(0, 5) : '10:00';
                            setFollowupDate(`${dateVal}T${timePart}`);
                          }}
                          className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Scheduled Time *</label>
                        <input
                          type="time"
                          step="900"
                          required
                          value={followupDate && followupDate.includes('T') ? followupDate.split('T')[1].slice(0, 5) : '10:00'}
                          onChange={(e) => {
                            const timeVal = e.target.value;
                            if (!timeVal) return;
                            const datePart = followupDate ? formatLocalDateOnly(followupDate) : formatLocalDateOnly(new Date());
                            setFollowupDate(`${datePart}T${timeVal}`);
                          }}
                          className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                        />
                      </div>
                    </div>

                    {/* Selected Time Badge & Working Hours */}
                    <div className="pt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-xl">
                        <Clock size={13} />
                        <span>Selected Time: {formatTimeDisplay(followupDate)}</span>
                      </div>
                      <span className="text-[9px] text-theme-text-muted font-bold">Working Hours: 9:00 AM – 7:00 PM</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Follow-up Objectives / Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="Key topics to discuss in the upcoming call..."
                        value={followupNotes}
                        onChange={(e) => setFollowupNotes(e.target.value)}
                        className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={schedulingFollowup}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-xs font-bold text-white shadow-lg transition-all"
                    >
                      <Plus size={16} /> Schedule Reminder
                    </button>
                  </form>

                  <div className="lg:col-span-5 w-full">
                    <SchedulePreviewSidePanel
                      selectedDate={followupDate || formatLocalDateOnly(new Date())}
                      onSelectSlot={(slotTime) => setFollowupDate(slotTime)}
                      title="Day's Schedule & Free Slots"
                      compact={true}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: CLICKABLE CLIENT INTERACTION HISTORY TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                      <History size={16} className="text-theme-primary" /> Complete Audit Trail & Interactions
                    </h3>

                    {/* Sub-tab toggle */}
                    <div className="flex items-center gap-1 p-1 bg-theme-card border border-theme-border rounded-xl text-[10px]">
                      <button
                        onClick={() => setHistorySubTab('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          historySubTab === 'all'
                            ? 'bg-theme-primary text-white'
                            : 'text-theme-text-muted hover:text-theme-text'
                        }`}
                      >
                        All History ({timeline.length})
                      </button>
                      <button
                        onClick={() => setHistorySubTab('attempts')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          historySubTab === 'attempts'
                            ? 'bg-theme-primary text-white'
                            : 'text-theme-text-muted hover:text-theme-text'
                        }`}
                      >
                        Call Attempts ({activityLogsHistory.length})
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-theme-text-muted flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Click on any interaction record below to open and inspect full discussion notes, duration, and follow-up details.</span>
                  </p>

                  {/* Call History Duration Logs */}
                  {lead && <CallHistoryLog leadId={lead.id} />}

                  {/* Sub-tab 1: All System Audit & Multi-Activity Timeline */}
                  {historySubTab === 'all' && (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border">
                      {timeline.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedInteractionDetail({ ...item, typeName: item.activityType || 'Activity Event' })}
                          className="relative group cursor-pointer"
                        >
                          <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-theme-primary border-2 border-theme-bg group-hover:scale-125 transition-transform" />
                          <div className="p-4 rounded-2xl bg-theme-card border border-theme-border/70 hover:border-theme-primary/60 hover:shadow-md hover:scale-[1.01] transition-all space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-theme-text flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-theme-primary/10 border border-theme-primary/20 text-theme-primary text-[10px] font-extrabold uppercase">
                                  {item.activityType || 'EVENT'}
                                </span>
                                <span className="text-theme-primary font-extrabold group-hover:underline flex items-center gap-1">
                                  {item.action} <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-theme-text-muted">
                                {item.duration && (
                                  <span className="px-2 py-0.5 rounded-md bg-theme-bg-alt border border-theme-border font-bold text-amber-400 flex items-center gap-1">
                                    <Timer size={11} className="text-amber-400" />
                                    <span>{item.duration}</span>
                                  </span>
                                )}
                                <span className="font-semibold">{item.date || new Date(item.timestamp).toLocaleDateString()} at {item.time || new Date(item.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>

                            {/* Remarks / Description */}
                            <p className="text-xs text-theme-text-muted leading-relaxed line-clamp-2 italic bg-theme-bg-alt/40 p-2.5 rounded-xl border border-theme-border/30">
                              "{item.remarks || item.description || 'No detailed remark provided.'}"
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-theme-text-muted pt-1 border-t border-theme-border/20">
                              <span>User: <strong className="text-theme-text font-bold">{item.performedByName || 'System'}</strong></span>
                              <span className="font-bold text-emerald-400">Stage: {item.leadStage || lead?.status || 'New Lead'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {timeline.length === 0 && (
                        <p className="text-xs text-theme-text-muted text-center py-6">No historical activity records logged yet.</p>
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: Activity Logs & Call Attempts */}
                  {historySubTab === 'attempts' && (
                    <div className="space-y-3">
                      {activityLogsHistory.map((log: SalesActivityLog) => (
                        <div
                          key={log.id}
                          onClick={() => setSelectedInteractionDetail({ ...log, typeName: 'Activity Call Log' })}
                          className="p-4 rounded-2xl bg-theme-card border border-theme-border/70 hover:border-theme-primary/60 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer space-y-2.5 group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-theme-bg-alt border border-theme-border flex items-center justify-center">
                                {getCommIcon(log.communicationType)}
                              </span>
                              <span className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors flex items-center gap-1">
                                Attempt #{log.activityNumber} <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-theme-text-muted font-medium">
                                ({log.communicationType?.replace('_', ' ')})
                              </span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getOutcomeBadgeClass(log.outcome)}`}>
                                {log.outcome?.replace('_', ' ')}
                              </span>
                            </div>

                            <span className="text-[10px] text-theme-text-muted">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>

                          <p className="text-xs text-theme-text/90 bg-theme-bg-alt/40 p-3 rounded-xl border border-theme-border/30 italic">
                            "{log.remarks || 'No detailed remark provided.'}"
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-theme-text-muted">
                            <span>Logged by: <strong className="text-theme-text font-bold">{log.loggedByName || 'Sales Rep'}</strong></span>
                            <span className="text-theme-primary font-bold">Click to inspect →</span>
                          </div>
                        </div>
                      ))}

                      {activityLogsHistory.length === 0 && (
                        <p className="text-xs text-theme-text-muted text-center py-6">No call attempts or interaction logs recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODAL 1: ADD ACTIVITY LOG MODAL */}
          {addModalStepKey && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-theme-card border border-theme-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-theme-border pb-3">
                  <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                    <Plus size={16} className="text-theme-primary" /> Log Interaction Attempt
                  </h3>
                  <button onClick={() => setAddModalStepKey(null)} className="text-theme-text-muted hover:text-theme-text">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddActivitySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Communication Type</label>
                      <select
                        value={communicationType}
                        onChange={(e) => setCommunicationType(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      >
                        <option value="PHONE_CALL">Phone Call</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="EMAIL">Email</option>
                        <option value="GOOGLE_MEET">Google Meet</option>
                        <option value="ZOOM">Zoom</option>
                        <option value="OFFICE_VISIT">Office Visit</option>
                        <option value="VIDEO_CALL">Video Call</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Call / Interaction Outcome</label>
                      <select
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      >
                        <option value="BUSY">Client Busy</option>
                        <option value="NOT_ANSWERED">No Answer</option>
                        <option value="REJECTED_CALL">Rejected Call</option>
                        <option value="WRONG_NUMBER">Wrong Number</option>
                        <option value="CONNECTED">Connected & Discussed</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                        <option value="CALL_BACK_LATER">Call Back Later</option>
                        <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                        <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                        <option value="PROPOSAL_REQUESTED">Proposal Requested</option>
                        <option value="NEGOTIATION_STARTED">Negotiation Started</option>
                        <option value="CONVERTED">Converted</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 10 mins"
                        value={activityDuration}
                        onChange={(e) => setActivityDuration(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Attempt Status</label>
                      <select
                        value={activityStatus}
                        onChange={(e) => setActivityStatus(e.target.value)}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      >
                        <option value="ATTEMPTED">Attempted</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING">Waiting</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="SUCCESSFUL">Successful</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Detailed Remarks / Discussion Notes</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Client outside office, asked to call back at 6 PM..."
                      value={activityRemarks}
                      onChange={(e) => setActivityRemarks(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                    />
                  </div>



                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddModalStepKey(null)}
                      className="px-4 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs font-bold text-theme-text-muted hover:text-theme-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingActivity}
                      className="px-5 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-md"
                    >
                      Save Activity Log
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* MODAL 2: EXPLICITLY COMPLETE STEP MODAL */}
          {completeModalStepKey && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-theme-card border border-theme-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-theme-border pb-3">
                  <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Mark Workflow Step Completed
                  </h3>
                  <button onClick={() => setCompleteModalStepKey(null)} className="text-theme-text-muted hover:text-theme-text">
                    <X size={18} />
                  </button>
                </div>

                <p className="text-xs text-theme-text-muted">
                  Are you sure you want to complete this stage? This will mark the step completed and advance the lead pipeline stage.
                </p>

                <form onSubmit={handleCompleteStepSubmit} className="space-y-4">
                  {(completeModalStepKey === 'PROPOSAL_SENT' || completeModalStepKey === 'NEGOTIATION' || completeModalStepKey === 'CLOSING' || completeModalStepKey === 'PAYMENT_FOLLOWUP') && (
                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">
                        {completeModalStepKey === 'PROPOSAL_SENT' ? 'Proposal Amount (₹)' : 'Negotiated / Agreed Deal Value (₹)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-emerald-500">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 50000"
                          value={proposalAmount}
                          onChange={(e) => setProposalAmount(e.target.value)}
                          className="w-full bg-theme-bg border border-theme-border rounded-xl pl-7 pr-3 py-2 text-xs font-extrabold text-theme-text focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Final Completion Remark</label>
                    <textarea
                      rows={3}
                      placeholder="Summary of outcome / requirements gathered during this step..."
                      value={completionRemarks}
                      onChange={(e) => setCompletionRemarks(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-xs text-theme-text focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCompleteModalStepKey(null)}
                      className="px-4 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs font-bold text-theme-text-muted hover:text-theme-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCompletion}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                    >
                      Complete Step
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* MODAL 3: CLICKABLE INTERACTION DETAIL INSPECTOR MODAL */}
          {selectedInteractionDetail && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-theme-card border border-theme-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5"
              >
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between border-b border-theme-border/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary">
                      {selectedInteractionDetail.communicationType ? getCommIcon(selectedInteractionDetail.communicationType) : <History size={16} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-theme-primary uppercase tracking-wider block">
                        {selectedInteractionDetail.typeName || 'Interaction Detail'}
                      </span>
                      <h3 className="text-sm font-extrabold text-theme-text">
                        {selectedInteractionDetail.action || (selectedInteractionDetail.activityNumber ? `Attempt #${selectedInteractionDetail.activityNumber}` : 'Activity Log')}
                        {selectedInteractionDetail.stepTitle ? ` • ${selectedInteractionDetail.stepTitle}` : ''}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedInteractionDetail(null)}
                    className="p-1.5 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Badges and Attributes */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedInteractionDetail.communicationType && (
                    <div className="p-3 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/40 space-y-0.5">
                      <span className="text-[10px] font-bold text-theme-text-muted block">COMMUNICATION</span>
                      <span className="font-extrabold text-theme-text flex items-center gap-1.5">
                        {getCommIcon(selectedInteractionDetail.communicationType)}
                        {selectedInteractionDetail.communicationType?.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {selectedInteractionDetail.outcome && (
                    <div className="p-3 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/40 space-y-0.5">
                      <span className="text-[10px] font-bold text-theme-text-muted block">OUTCOME</span>
                      <span className={`text-[10px] font-extrabold inline-block px-2 py-0.5 rounded-md border ${getOutcomeBadgeClass(selectedInteractionDetail.outcome)}`}>
                        {selectedInteractionDetail.outcome?.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/40 space-y-0.5">
                    <span className="text-[10px] font-bold text-theme-text-muted block">PERFORMED BY</span>
                    <span className="font-bold text-theme-text">
                      {selectedInteractionDetail.loggedByName || selectedInteractionDetail.performedByName || 'Sales Rep / System'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-theme-bg-alt/60 border border-theme-border/40 space-y-0.5">
                    <span className="text-[10px] font-bold text-theme-text-muted block">DATE & TIME</span>
                    <span className="font-bold text-theme-text">
                      {new Date(selectedInteractionDetail.createdAt || selectedInteractionDetail.timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Duration & Followup */}
                {(selectedInteractionDetail.duration || selectedInteractionDetail.nextFollowupDate) && (
                  <div className="p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/40 flex items-center justify-between text-xs">
                    {selectedInteractionDetail.duration && (
                      <div className="flex items-center gap-1.5 font-bold text-theme-text">
                        <Clock size={14} className="text-theme-primary" /> Duration: {selectedInteractionDetail.duration}
                      </div>
                    )}
                    {selectedInteractionDetail.nextFollowupDate && (
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Calendar size={14} /> Next Follow-up: {new Date(selectedInteractionDetail.nextFollowupDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Remarks Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">
                      Full Remarks & Discussion Notes
                    </span>
                    <button
                      onClick={() => handleCopyRemarks(selectedInteractionDetail.remarks || selectedInteractionDetail.description || '')}
                      className="flex items-center gap-1 text-[10px] font-bold text-theme-primary hover:underline"
                    >
                      {copiedRemarks ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedRemarks ? 'Copied!' : 'Copy Notes'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-bg-alt border border-theme-border text-xs text-theme-text leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedInteractionDetail.remarks || selectedInteractionDetail.description || 'No detailed remarks provided.'}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-theme-border/60 pt-4">
                  <button
                    onClick={() => setSelectedInteractionDetail(null)}
                    className="px-5 py-2.5 rounded-xl bg-theme-primary text-white text-xs font-bold shadow-md hover:bg-theme-primary-hover transition-all"
                  >
                    Close Inspector
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      );

  if (inline) {
    return panelInner;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`h-full flex flex-col shadow-2xl relative transition-all duration-300 ${
            maximized ? 'max-w-6xl w-[94vw]' : 'max-w-2xl w-full'
          }`}
        >
          {panelInner}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
