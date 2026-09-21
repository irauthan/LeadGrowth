import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft,
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  History, 
  IndianRupee, 
  Calendar, 
  Download,
  ChevronRight,
  MessageSquare,
  Building2,
  AlertCircle,
  Eye,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  UserCheck,
  Loader2,
  Zap,
  Timer,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Search,
  CornerDownRight,
  Video,
  Activity,
  Save,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { downloadSingleLeadPdf } from '../services/reportService';
import { followUpService, type FollowUp } from '../services/followUpService';
import { isLeadFresh } from '../utils';
import FollowUpModal from './FollowUpModal';
import InteractionStudioModal from './InteractionStudioModal';
import type { SalesActivity, SalesActivityLog } from '../types';
import CallTimerWidget from './CallTimerWidget';
import { toast } from '../store/toastStore';

interface WorkDetailsPanelProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
  onUpdate?: () => void;
  inline?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  period?: string;
  startDate?: string;
  endDate?: string;
  onNextLead?: () => void;
  onPrevLead?: () => void;
  hasNextLead?: boolean;
  hasPrevLead?: boolean;
  nextLeadName?: string;
  prevLeadName?: string;
  leadPositionInfo?: { current: number; total: number };
}

export default function WorkDetailsPanel({ 
  leadId, 
  isOpen, 
  onClose, 
  onLeadUpdated,
  onUpdate,
  inline = false,
  isMaximized,
  onToggleMaximize,
  period,
  startDate,
  endDate,
  onNextLead,
  onPrevLead,
  hasNextLead = false,
  hasPrevLead = false,
  nextLeadName,
  prevLeadName,
  leadPositionInfo
}: WorkDetailsPanelProps) {
  const triggerUpdate = () => {
    onLeadUpdated?.();
    onUpdate?.();
  };

  const getInitialHistoryFilter = (): 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' => {
    if (period === 'today' || period === 'daily') return 'TODAY';
    if (period === 'weekly' || period === '7days') return 'WEEK';
    if (period === 'monthly' || period === '30days') return 'MONTH';
    return 'ALL';
  };

  const [historyDateFilter, setHistoryDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>(getInitialHistoryFilter());

  useEffect(() => {
    if (isOpen) {
      setHistoryDateFilter(getInitialHistoryFilter());
    }
  }, [isOpen, period]);

  const isWithinDateFilter = (dateVal?: string | Date | null) => {
    if (!dateVal) return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    
    if (historyDateFilter === 'TODAY') {
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    }
    if (historyDateFilter === 'WEEK') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return d >= weekStart && d <= now;
    }
    if (historyDateFilter === 'MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return d >= monthStart && d <= now;
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return d >= s && d <= e;
      }
    }
    return true;
  };
  const [internalMaximized, setInternalMaximized] = useState(false);
  const maximized = isMaximized !== undefined ? isMaximized : internalMaximized;
  const toggleMaximize = onToggleMaximize || (() => setInternalMaximized(!internalMaximized));

  const currentUser = useAuthStore((state) => state.user);
  const userRoles: any[] = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.roles
    ? [currentUser.roles]
    : [];
  const directRole = (currentUser as any)?.role || '';
  const isAdmin = userRoles.some((r: any) => {
    const roleName = typeof r === 'string' ? r : r?.name || '';
    return roleName.toUpperCase().includes('ADMIN');
  }) || directRole.toUpperCase().includes('ADMIN');
  const isManager = userRoles.some((r: any) => {
    const roleName = typeof r === 'string' ? r : r?.name || '';
    return roleName.toUpperCase().includes('MANAGER');
  }) || directRole.toUpperCase().includes('MANAGER');
  const isManagementUser = isAdmin || isManager;

  const [lead, setLead] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activityLogsHistory, setActivityLogsHistory] = useState<SalesActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'timeline'>('activities');

  // Management Assignee State
  const [members, setMembers] = useState<any[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assigningLead, setAssigningLead] = useState<boolean>(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [proposalAmount, setProposalAmount] = useState<number | string>('');

  // Studio Workflow & History State
  const [activeStudioStepKey, setActiveStudioStepKey] = useState<string>('FIRST_CALL');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [studioHistoryScope, setStudioHistoryScope] = useState<'all' | 'step'>('all');

  // Add Activity State
  const [addModalStepKey, setAddModalStepKey] = useState<string | null>(null);
  const [communicationType, setCommunicationType] = useState('PHONE_CALL');
  const [outcome, setOutcome] = useState('BUSY');
  const [activityRemarks, setActivityRemarks] = useState('');
  const [activityDuration, setActivityDuration] = useState('--');
  const [activityStatus, setActivityStatus] = useState('ATTEMPTED');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Clickable Interaction Detail Modal State
  const [selectedInteractionDetail, setSelectedInteractionDetail] = useState<any | null>(null);
  const [copiedRemarks, setCopiedRemarks] = useState(false);

  // Followup state
  const [leadActiveFollowup, setLeadActiveFollowup] = useState<FollowUp | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [completingFollowup, setCompletingFollowup] = useState(false);

  // Safe Lead Shift Navigation State
  const [isNavigatingLead, setIsNavigatingLead] = useState(false);
  const [showSafeNavWarning, setShowSafeNavWarning] = useState(false);
  const [pendingNavDirection, setPendingNavDirection] = useState<'next' | 'prev' | null>(null);
  const [activeCallWarning, setActiveCallWarning] = useState(false);

  const handleSafeLeadNavigation = async (direction: 'next' | 'prev') => {
    if (isNavigatingLead) return;
    if (direction === 'next' && !hasNextLead) return;
    if (direction === 'prev' && !hasPrevLead) return;

    // Check unsaved modal forms inside panel
    const hasUnsavedModal = (addModalStepKey !== null && activityRemarks.trim().length > 0) || (activityRemarks.trim().length > 0);

    // Check active call session on the current lead
    let hasActiveCall = false;
    try {
      const res = await api.get('/api/calls/active');
      if (res.data && res.data.status === 'ACTIVE' && res.data.leadId === leadId) {
        hasActiveCall = true;
      }
    } catch (e) {
      // Ignore call fetch error
    }

    if (hasUnsavedModal || hasActiveCall) {
      setActiveCallWarning(hasActiveCall);
      setPendingNavDirection(direction);
      setShowSafeNavWarning(true);
      return;
    }

    executeLeadShift(direction);
  };

  const executeLeadShift = (direction: 'next' | 'prev') => {
    setIsNavigatingLead(true);
    setShowSafeNavWarning(false);
    setPendingNavDirection(null);

    // Reset inner temporary modal states safely
    setAddModalStepKey(null);

    if (direction === 'next' && onNextLead) {
      onNextLead();
    } else if (direction === 'prev' && onPrevLead) {
      onPrevLead();
    }

    setTimeout(() => {
      setIsNavigatingLead(false);
    }, 400);
  };

  // Keyboard navigation: Alt + ArrowRight (or Alt + N) for Next, Alt + ArrowLeft (or Alt + P) for Prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.altKey && (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        if (hasNextLead && onNextLead) {
          handleSafeLeadNavigation('next');
        }
      } else if (e.altKey && (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        if (hasPrevLead && onPrevLead) {
          handleSafeLeadNavigation('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNextLead, hasPrevLead, onNextLead, onPrevLead, isNavigatingLead, addModalStepKey, activityRemarks, leadId]);

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
        toast.success('Lead auto-assigned via Smart AI Engine!', 'Lead Assigned');
      } else {
        await api.patch(`/api/leads/${leadId}/assign`, null, {
          params: { userId: parseInt(selectedAssigneeId, 10) }
        });
        setAssignSuccessMsg('Lead successfully assigned!');
        toast.success('Lead successfully assigned!', 'Lead Assigned');
      }
      setTimeout(() => setAssignSuccessMsg(''), 4000);
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
      fetchLeadDetails();
      triggerUpdate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assign lead.');
    } finally {
      setAssigningLead(false);
    }
  };

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [leadRes, timelineRes, logsRes, followupsRes] = await Promise.all([
        api.get(`/api/leads/${leadId}`),
        api.get(`/api/leads/${leadId}/timeline`).catch(() => ({ data: [] })),
        api.get(`/api/leads/${leadId}/activities-history`).catch(() => ({ data: [] })),
        followUpService.getFollowups().catch(() => [])
      ]);
      setLead(leadRes.data);
      setProposalAmount(leadRes.data?.proposalAmount || '');
      setTimeline(Array.isArray(timelineRes.data) ? timelineRes.data : []);
      setActivityLogsHistory(Array.isArray(logsRes.data) ? logsRes.data : []);

      // Check active follow-up for this lead
      const activeF = (followupsRes || []).find(
        (f: any) => f.leadId === leadId && f.status !== 'COMPLETED' && f.status !== 'CANCELLED'
      );
      setLeadActiveFollowup(activeF || null);

      // Set activeStudioStepKey to first non-completed step or first step
      if (leadRes.data && Array.isArray(leadRes.data.activities) && leadRes.data.activities.length > 0) {
        const firstPending = leadRes.data.activities.find((act: SalesActivity) => act.status !== 'COMPLETED');
        setActiveStudioStepKey(firstPending?.activityKey || leadRes.data.activities[0].activityKey || 'FIRST_CALL');
      }
    } catch (err) {
      console.error('Failed to load lead details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivitySubmit = async (e: React.FormEvent, openNext: boolean = false, completeStage: boolean = false) => {
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

      if (completeStage) {
        await api.post(`/api/leads/${leadId}/workflow-steps/${addModalStepKey}/complete`, {
          completionRemarks: activityRemarks || 'Workflow stage auto-completed along with interaction log.'
        }).catch((err) => console.error('Stage completion notice:', err));
      }

      toast.success(
        openNext && hasNextLead 
          ? 'Activity saved! Opening next lead...' 
          : 'Interaction activity recorded successfully!', 
        'Activity Saved'
      );
      
      setAddModalStepKey(null);
      setActivityRemarks('');
      setNextFollowupDate('');
      triggerUpdate();

      if (openNext && hasNextLead && onNextLead) {
        handleSafeLeadNavigation('next');
      } else {
        fetchLeadDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record activity log');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleStudioSave = async (e?: React.FormEvent, openNext: boolean = false, completeStage: boolean = false) => {
    if (e) e.preventDefault();
    if (!leadId) return;
    const targetStepKey = activeStudioStepKey || lead?.activities?.find((a: any) => a.status !== 'COMPLETED')?.activityKey || lead?.activities?.[0]?.activityKey || 'FIRST_CALL';

    setSubmittingActivity(true);
    setAutoSaveStatus('Saving activity...');
    try {
      // 1. Save Activity Log
      if (activityRemarks.trim()) {
        const payload = {
          communicationType,
          outcome,
          remarks: activityRemarks,
          duration: activityDuration && activityDuration !== '--' ? activityDuration : '1 min',
          status: activityStatus,
          nextFollowupDate: nextFollowupDate ? (nextFollowupDate.length === 16 ? `${nextFollowupDate}:00` : nextFollowupDate) : null
        };
        await api.post(`/api/leads/${leadId}/workflow-steps/${targetStepKey}/activities`, payload);
      }

      // 2. Schedule Follow-up if date is set
      if (nextFollowupDate) {
        await followUpService.createFollowup({
          leadId,
          scheduledAt: nextFollowupDate,
          type: communicationType === 'PHONE_CALL' ? 'CALL' : communicationType === 'WHATSAPP' ? 'WHATSAPP' : 'MEETING',
          notes: activityRemarks ? `Follow-up (${targetStepKey.replace(/_/g, ' ')}): ${activityRemarks}` : 'Scheduled client follow-up reminder.',
          autoScheduleIfConflict: false
        }).catch((err) => console.error('Followup sync note:', err));
      }

      // 3. Save Proposal Deal Value if provided
      if (proposalAmount !== '' && proposalAmount !== undefined && proposalAmount !== null) {
        await api.patch(`/api/leads/${leadId}/auto-save`, {
          proposalAmount: Number(proposalAmount),
          proposalStatus: 'SENT'
        }).catch((err) => console.error('Proposal sync note:', err));
      }

      // 4. Complete stage if requested
      if (completeStage) {
        await api.post(`/api/leads/${leadId}/workflow-steps/${targetStepKey}/complete`, {
          completionRemarks: activityRemarks || 'Workflow stage marked completed.',
          proposalAmount: proposalAmount ? Number(proposalAmount) : undefined
        }).catch((err) => console.error('Stage complete error:', err));
      }

      toast.success(
        openNext && hasNextLead 
          ? 'Saved successfully! Opening next lead...' 
          : completeStage 
          ? 'Workflow stage completed and advanced!'
          : 'Interaction activity recorded successfully!',
        'Activity Saved'
      );

      setActivityRemarks('');
      setNextFollowupDate('');
      triggerUpdate();

      if (openNext && hasNextLead && onNextLead) {
        handleSafeLeadNavigation('next');
      } else {
        await fetchLeadDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record activity log');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleCopyRemarks = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRemarks(true);
    setTimeout(() => setCopiedRemarks(false), 2500);
  };

  const handleCompleteActiveFollowup = async () => {
    if (!leadActiveFollowup) return;
    setCompletingFollowup(true);
    try {
      await followUpService.complete(leadActiveFollowup.id, 'Follow-up successfully completed.');
      setLeadActiveFollowup(null);
      toast.success('Follow-up marked as completed!', 'Follow-up Done');
      fetchLeadDetails();
      triggerUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete follow-up');
    } finally {
      setCompletingFollowup(false);
    }
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
    ? 'rounded-2xl shadow-xs h-full flex flex-col overflow-hidden'
    : `border-l ${maximized ? 'max-w-7xl w-[96vw]' : 'max-w-5xl lg:max-w-6xl w-full'} h-full flex flex-col shadow-2xl`;

  const panelInner = (
    <div className={`bg-theme-card border border-theme-border flex flex-col relative w-full ${containerClass}`}>
      {/* Top Header */}
      <div className="p-3 sm:p-5 border-b border-theme-border flex items-center justify-between bg-theme-card/90 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text active:scale-95 transition-all flex-shrink-0"
              title="Back"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary font-black text-xs sm:text-sm flex-shrink-0">
            {lead?.name?.substring(0, 2).toUpperCase() || 'LD'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-theme-text truncate">
                {lead?.name || 'Lead Work Container'}
              </h2>
              {!isManagementUser && (
                <select
                  value={lead?.status || 'New'}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (!lead?.id) return;
                    try {
                      await api.patch(`/api/leads/${lead.id}/status`, null, { params: { status: newStatus } });
                      fetchLeadDetails();
                      triggerUpdate();
                    } catch (err) {
                      console.error('Failed to update stage', err);
                    }
                  }}
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-theme-bg-alt border border-theme-border text-theme-primary focus:outline-none focus:border-theme-primary cursor-pointer shadow-xs"
                >
                  <option value="New">NEW</option>
                  <option value="Interaction">INTERACTION</option>
                  <option value="Proposal Sent">PROPOSAL SENT</option>
                  <option value="Negotiation">NEGOTIATION</option>
                  <option value="Converted">CONVERTED</option>
                  <option value="Lost">LOST (DROP)</option>
                </select>
              )}

              {isLeadFresh(lead) && (
                <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 items-center gap-1">
                  <Sparkles size={10} /> FRESH
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 mt-1 flex-wrap text-xs sm:text-[13px]">
              {lead?.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1.5 font-semibold text-theme-text hover:text-theme-primary transition-colors group"
                  title="Send Email"
                >
                  <Mail size={13} className="text-theme-text-muted group-hover:text-theme-primary flex-shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{lead.email}</span>
                </a>
              )}

              {lead?.email && lead?.phone && (
                <span className="text-theme-border flex-shrink-0">•</span>
              )}

              {lead?.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 font-semibold text-theme-text hover:text-emerald-500 transition-colors group"
                  title="Call Lead"
                >
                  <Phone size={13} className="text-theme-text-muted group-hover:text-emerald-500 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              )}

              {lead?.company && lead.company !== 'N/A' && (
                <>
                  <span className="text-theme-border flex-shrink-0">•</span>
                  <span className="flex items-center gap-1 text-theme-text-muted text-xs font-medium">
                    <Building2 size={13} className="flex-shrink-0" />
                    <span>{lead.company}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Call Action (Header Placement) */}
          {lead && !isManagementUser && (
            <CallTimerWidget
              leadId={lead.id}
              leadName={lead.name}
              assignedToId={lead.assignedToId}
              compact={true}
              onCallEnded={(durationStr) => {
                if (durationStr) {
                  setActivityDuration(durationStr);
                  setCommunicationType('PHONE_CALL');
                }
                fetchLeadDetails();
                triggerUpdate();
              }}
            />
          )}

          {/* Maximize / Minimize Toggle Button (Desktop only) */}
          <button
            type="button"
            onClick={toggleMaximize}
            title={maximized ? "Minimize Container" : "Maximize Container"}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-primary hover:border-theme-primary transition-all text-xs font-bold shadow-xs"
          >
            {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline text-[11px]">{maximized ? 'Minimize' : 'Maximize'}</span>
          </button>

          {lead && (
            <button
              onClick={async () => {
                if (!lead?.id || isDownloadingPdf) return;
                setIsDownloadingPdf(true);
                try {
                  await downloadSingleLeadPdf(lead.id);
                } catch (err) {
                  console.error('Failed to download lead PDF:', err);
                  toast.error('Unable to generate Lead PDF. Please try again.');
                } finally {
                  setIsDownloadingPdf(false);
                }
              }}
              disabled={isDownloadingPdf}
              title="Export Complete Lead Dossier (PDF)"
              className="p-1.5 sm:p-2 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-primary hover:border-theme-primary transition-all disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 size={15} className="animate-spin text-theme-primary" />
              ) : (
                <Download size={15} />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text hover:border-rose-500 transition-all active:scale-95"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="px-4 sm:px-6 py-2 bg-theme-bg-alt/40 border-b border-theme-border flex items-center justify-between text-xs flex-shrink-0 gap-3">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap min-w-0">
          {/* <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-theme-text-muted block">QUALITY TIER</span>
            <span className="font-extrabold text-amber-400 text-xs sm:text-sm">{lead?.qualityTier || 'WARM'}</span>
          </div> */}

          <div className="h-6 w-px bg-theme-border/60 hidden sm:block" />

          <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-theme-text-muted block">WORKFLOW PROGRESS</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-16 sm:w-20 h-1.5 rounded-full bg-theme-bg-alt border border-theme-border/50 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-theme-primary to-emerald-400"
                  style={{ width: `${lead?.progressPercentage || 0}%` }}
                />
              </div>
              <span className="font-extrabold text-xs text-theme-text">{lead?.progressPercentage || 0}%</span>
            </div>
          </div>

          <div className="h-6 w-px bg-theme-border/60 hidden sm:block" />

          {/* <div>
            <span className="text-[9px] sm:text-[10px] font-bold text-theme-text-muted block">ASSIGNED REP</span>
            <span className={`font-bold text-xs flex items-center gap-1 ${isLeadAssigned(lead) ? 'text-emerald-400' : 'text-theme-text-muted'}`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
              {lead?.assignedToName && lead.assignedToName !== 'Unassigned' ? lead.assignedToName : 'Unassigned'}
            </span>
          </div> */}
        </div>

        {/* Lead Shift Navigation (Red Box Location in Lead Header) */}
        {(onNextLead || onPrevLead) && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {onPrevLead && (
              <button
                type="button"
                onClick={() => handleSafeLeadNavigation('prev')}
                disabled={!hasPrevLead || isNavigatingLead}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-theme-border/80 bg-theme-bg-alt/70 hover:bg-theme-card text-theme-text-muted hover:text-theme-text disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1 font-bold text-xs cursor-pointer"
                title={hasPrevLead ? (prevLeadName ? `Previous Lead: ${prevLeadName} (Alt+←)` : 'Previous Lead (Alt+←)') : 'No previous lead'}
              >
                <ChevronLeft size={14} />
                <span className="hidden lg:inline text-[11px]">Prev</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSafeLeadNavigation('next')}
              disabled={!hasNextLead || isNavigatingLead}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
                hasNextLead && !isNavigatingLead
                  ? 'bg-theme-primary hover:bg-theme-primary-hover text-white shadow-theme-primary/20 ring-1 ring-white/10 cursor-pointer'
                  : 'bg-theme-bg-alt/80 border border-theme-border text-theme-text-muted opacity-40 cursor-not-allowed'
              }`}
              title={hasNextLead ? (nextLeadName ? `Shift to Next: ${nextLeadName} (Alt+→)` : 'Next Lead (Alt+→)') : 'No more leads in list'}
            >
              {isNavigatingLead ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-[11px]">Loading...</span>
                </>
              ) : (
                <>
                  <span className="tracking-wide">Next</span>
                  
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Body Section */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center space-y-3 flex-col py-20">
          <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-theme-text-muted">Loading Activity Engine...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-0">
          {/* Overdue Action Banner (Sales Reps Only) */}
          {lead && !isManagementUser && lead.nextFollowupDate && new Date(lead.nextFollowupDate).getTime() < Date.now() && lead.status !== 'Converted' && lead.status !== 'Lost' && lead.status !== 'Rejected' && lead.followupStatus !== 'COMPLETED' && (
            <div className="p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-extrabold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                    <span>OVERDUE ACTION REQUIRED</span>
                  </p>
                  <p className="text-[11px] font-semibold text-rose-400 mt-0.5">
                    Scheduled follow-up was missed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow shrink-0 self-start sm:self-auto transition-all"
              >
                Reschedule Slot
              </button>
            </div>
          )}

          {/* MANAGEMENT VIEW: LEAD ASSIGNMENT & ACTIVITY AUDIT TABS */}
          {isManagementUser ? (
            <div className="space-y-4">
              {/* Management Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-theme-bg-alt/60 border border-theme-border rounded-xl flex-shrink-0">
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'activities'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'bg-theme-card/60 text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  <UserCheck size={14} />
                  <span>Lead Assignment</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === 'timeline'
                      ? 'bg-theme-primary text-white shadow-xs'
                      : 'bg-theme-card/60 text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Activity Audit</span>
                </button>
              </div>

              {activeTab === 'activities' ? (
                <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-6">
                  {/* Lead Assignment Controls */}
                  <div className="space-y-4">
                    <div className="border-b border-theme-border pb-3">
                      <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                        <UserCheck size={18} className="text-theme-primary" />
                        <span>Lead Assignment</span>
                      </h3>
                      <p className="text-xs text-theme-text-muted mt-0.5">
                        Assign or re-allocate this lead to an active sales executive.
                      </p>
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
                            CURRENT OWNER
                          </label>
                          <div className="h-14 px-3.5 rounded-2xl border border-theme-border bg-theme-bg-alt/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-theme-primary/20 text-theme-primary font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                              {lead?.assignedToName ? lead.assignedToName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-theme-text block truncate">
                                {lead?.assignedToName || 'Unassigned Lead'}
                              </span>
                              <span className="text-[10px] text-theme-text-muted block truncate">
                                {lead?.assignedToName ? 'Active Owner' : 'Needs Assignment'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-theme-text-muted mb-1.5">
                            ASSIGN TO
                          </label>
                          <select
                            value={selectedAssigneeId}
                            onChange={(e) => setSelectedAssigneeId(e.target.value)}
                            className="w-full h-14 px-3.5 rounded-2xl border border-theme-border bg-theme-bg-alt text-xs outline-none focus:border-theme-primary text-theme-text font-bold cursor-pointer"
                          >
                            <option value="">-- Select Sales Executive --</option>
                            <option value="-1">Auto-Assign (Smart Engine)</option>
                            {members
                              .filter((m: any) => {
                                const roles = Array.isArray(m.roles)
                                  ? m.roles.map((r: any) => (typeof r === 'string' ? r : r.name || ''))
                                  : [];
                                const roleStr = (m.role || m.designation || '').toUpperCase();
                                const isAdminUser = roles.some((r: string) => r.toUpperCase().includes('ADMIN')) || roleStr.includes('ADMIN');
                                return !isAdminUser;
                              })
                              .map((m: any) => (
                                <option key={m.id} value={m.id}>
                                  {m.fullName || m.name} ({m.email})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={assigningLead || !selectedAssigneeId}
                          className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-theme-primary/20 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {assigningLead ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : selectedAssigneeId === '-1' ? (
                            <Zap size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          <span>
                            {selectedAssigneeId === '-1' ? 'Auto-Assign Lead' : 'Assign Lead'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pipeline Status */}
                  <div className="border-t border-theme-border pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted">
                      Pipeline Status & Attributes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-theme-text-muted uppercase mb-1">Pipeline Stage</label>
                        <div className="p-2.5 rounded-xl border border-theme-border bg-theme-bg-alt text-xs font-bold text-theme-primary uppercase">
                          {lead?.status || 'New'}
                        </div>
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

                  {/* Commercials & Discussion Summary */}
                  <div className="border-t border-theme-border pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                        <FileText size={14} className="text-theme-primary" />
                        <span>Commercials & Discussion Summary</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('timeline')}
                        className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Timeline</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/50 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted block">
                          Proposal Amount
                        </span>
                        <div className="text-lg font-black text-theme-text">
                          {lead?.proposalAmount ? `₹${Number(lead.proposalAmount).toLocaleString('en-IN')}` : 'No Proposal Logged'}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-theme-primary/10 text-theme-primary uppercase">
                          Status: {lead?.proposalStatus || 'NOT_SENT'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/50 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted block">
                          Executive Notes
                        </span>
                        <p className="text-xs text-theme-text-muted italic line-clamp-3">
                          {lead?.clientNotes ? `"${lead.clientNotes}"` : 'No notes recorded yet.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Activity Audit for Managers */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                      <History size={16} className="text-theme-primary" /> Complete Audit Trail & Interactions
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 p-1 bg-theme-bg-alt rounded-xl border border-theme-border text-[10px] font-bold">
                        {(
                          [
                            { id: 'ALL', label: 'All Time' },
                            { id: 'TODAY', label: "Today" },
                            { id: 'WEEK', label: 'This Week' },
                            { id: 'MONTH', label: 'This Month' }
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setHistoryDateFilter(f.id)}
                            className={`px-2 py-1 rounded-lg transition-all ${
                              historyDateFilter === f.id
                                ? 'bg-theme-primary text-white shadow-xs'
                                : 'text-theme-text-muted hover:text-theme-text'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border">
                    {timeline
                      .filter((item: any) => isWithinDateFilter(item.timestamp || item.createdAt || item.date))
                      .map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedInteractionDetail({ ...item, typeName: item.activityType || 'Activity Event' })}
                          className="relative group cursor-pointer"
                        >
                          <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-theme-primary border-2 border-theme-bg group-hover:scale-125 transition-transform" />
                          <div className="p-4 rounded-2xl bg-theme-card border border-theme-border/70 hover:border-theme-primary/60 hover:shadow-md transition-all space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-theme-text flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-theme-primary/10 border border-theme-primary/20 text-theme-primary text-[10px] font-extrabold uppercase">
                                  {item.activityType || 'EVENT'}
                                </span>
                                <span className="text-theme-primary font-extrabold flex items-center gap-1">
                                  {item.action} <Eye size={12} />
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
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SALES REP VIEW: UNIFIED DUAL-PANE SALES WORKFLOW STUDIO */
            <div className="space-y-4 sm:space-y-5">
              {/* TOP PIPELINE STAGE STEPPER */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-theme-card border border-theme-border shadow-xs">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-theme-text-muted">
                      Pipeline Workflow Stages
                    </span>
                  </div>

                  {autoSaveStatus && (
                    <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                      {autoSaveStatus}
                    </span>
                  )}
                </div>

                {/* 6 Stage Chips Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { key: 'FIRST_CALL', number: 1, title: 'First Call', shortTitle: '1. First Call' },
                    { key: 'REQUIREMENT_COLLECTION', number: 2, title: 'Requirement Gathering', shortTitle: '2. Requirements' },
                    { key: 'DEMO_SCHEDULED', number: 3, title: 'Product Demo', shortTitle: '3. Demo' },
                    { key: 'PROPOSAL_SENT', number: 4, title: 'Commercial Proposal', shortTitle: '4. Proposal' },
                    { key: 'NEGOTIATION', number: 5, title: 'Negotiation', shortTitle: '5. Negotiation' },
                    { key: 'CLOSING', number: 6, title: 'Final Deal Closure', shortTitle: '6. Close' }
                  ].map((stage) => {
                    const act = lead?.activities?.find((a: any) => a.activityKey === stage.key);
                    const isCompleted = act?.status === 'COMPLETED';
                    const isInProgress = act?.status === 'IN_PROGRESS';
                    const isActiveInStudio = activeStudioStepKey === stage.key;
                    const logCount = act?.logs?.length || 0;

                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => setActiveStudioStepKey(stage.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                          isActiveInStudio
                            ? 'bg-theme-primary/10 border-theme-primary ring-1 ring-theme-primary/30 shadow-xs'
                            : isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60'
                            : isInProgress
                            ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                            : 'bg-theme-bg-alt/40 border-theme-border hover:border-theme-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1 mb-1">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isInProgress
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-theme-bg-alt text-theme-text-muted border-theme-border'
                          }`}>
                            {isCompleted ? 'Done' : isInProgress ? 'In Progress' : 'Pending'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className={`text-xs font-extrabold block truncate ${
                            isActiveInStudio ? 'text-theme-primary' : isCompleted ? 'text-emerald-400' : 'text-theme-text'
                          }`}>
                            {stage.title}
                          </span>
                          <span className="text-[10px] text-theme-text-muted block mt-0.5">
                            {logCount} {logCount === 1 ? 'Log' : 'Logs'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DUAL-PANE WORKSPACE: LEFT FORM + RIGHT LIVE HISTORY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                
                {/* LEFT COLUMN (LG:COL-SPAN-7): CURRENT INTERACTION FORM */}
                <div className="lg:col-span-7 bg-theme-card border border-theme-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                  {/* Current Stage Context Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-theme-border/70 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary font-bold text-xs">
                        <Zap size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-theme-text">
                            {activeStudioStepKey.replace(/_/g, ' ')}
                          </h3>
                        </div>
                        <p className="text-[11px] text-theme-text-muted mt-0.5">
                          Record interaction outcome, discussion notes, commercials & follow-up.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1 & 2: Sleek Outcome Pills & Unified Metadata Bar */}
                  <div className="space-y-2.5 p-3 rounded-2xl bg-theme-bg-alt/30 border border-theme-border/60">
                    {/* Header + Outcome Pills */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-theme-text-muted">
                          Call Outcome
                        </label>
                        <span className="text-[10px] font-bold text-theme-primary">
                          {outcome.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Primary Pills + More Dropdown */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { value: 'CONNECTED', label: 'Connected', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
                          { value: 'BUSY', label: 'Client Busy', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
                          { value: 'NO_ANSWER', label: 'No Answer', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
                          { value: 'CALLBACK_REQUESTED', label: 'Callback', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
                          { value: 'MEETING_SCHEDULED', label: 'Meeting Set', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setOutcome(item.value);
                              if (['BUSY', 'NO_ANSWER'].includes(item.value)) {
                                setActivityStatus('ATTEMPTED');
                              } else if (['CONNECTED', 'CALLBACK_REQUESTED'].includes(item.value)) {
                                setActivityStatus('IN_PROGRESS');
                              } else if (item.value === 'MEETING_SCHEDULED') {
                                setActivityStatus('COMPLETED');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                              outcome === item.value
                                ? `${item.color} ring-1 ring-current shadow-xs`
                                : 'bg-theme-card/80 border-theme-border/70 text-theme-text-muted hover:text-theme-text hover:bg-theme-card'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}

                        {/* More Outcomes Dropdown Pill */}
                        <div className={`relative flex items-center rounded-xl border text-xs font-bold transition-all ${
                          ['INTERESTED', 'PROPOSAL_REQUESTED', 'NOT_INTERESTED', 'LOST'].includes(outcome)
                            ? 'border-theme-primary bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/30 shadow-xs'
                            : 'bg-theme-card/80 border-theme-border/70 text-theme-text-muted hover:text-theme-text hover:bg-theme-card'
                        }`}>
                          <select
                            value={['INTERESTED', 'PROPOSAL_REQUESTED', 'NOT_INTERESTED', 'LOST'].includes(outcome) ? outcome : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setOutcome(e.target.value);
                                if (e.target.value === 'LOST' || e.target.value === 'NOT_INTERESTED') {
                                  setActivityStatus('COMPLETED');
                                } else {
                                  setActivityStatus('IN_PROGRESS');
                                }
                              }
                            }}
                            className="py-1.5 pl-2.5 pr-6 bg-transparent text-xs font-bold text-inherit outline-none cursor-pointer appearance-none"
                          >
                            <option value="" disabled>
                              {(() => {
                                const map: Record<string, string> = {
                                  INTERESTED: 'Interested',
                                  PROPOSAL_REQUESTED: 'Proposal Req',
                                  NOT_INTERESTED: 'Not Interested',
                                  LOST: 'Deal Lost'
                                };
                                return map[outcome] || 'More...';
                              })()}
                            </option>
                            <option value="INTERESTED" className="bg-theme-card text-theme-text">Interested</option>
                            <option value="PROPOSAL_REQUESTED" className="bg-theme-card text-theme-text">Proposal Req</option>
                            <option value="NOT_INTERESTED" className="bg-theme-card text-theme-text">Not Interested</option>
                            <option value="LOST" className="bg-theme-card text-theme-text">Deal Lost</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 pointer-events-none opacity-60" />
                        </div>
                      </div>
                    </div>

                    {/* Integrated Metadata Toolbar (Channel + Duration + Status) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-theme-border/40 flex-wrap">
                      {/* Channel Chip */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-card border border-theme-border/80 text-xs font-bold text-theme-text hover:border-theme-primary/40 transition-all">
                        <Phone size={12} className="text-theme-primary shrink-0" />
                        <span className="text-theme-text-muted text-[10px] uppercase tracking-wide font-extrabold">Ch:</span>
                        <select
                          value={communicationType}
                          onChange={(e) => setCommunicationType(e.target.value)}
                          className="bg-transparent text-xs font-bold text-theme-text focus:outline-none cursor-pointer"
                        >
                          <option value="PHONE_CALL" className="bg-theme-card text-theme-text">Phone Call</option>
                          <option value="WHATSAPP" className="bg-theme-card text-theme-text">WhatsApp</option>
                          <option value="EMAIL" className="bg-theme-card text-theme-text">Email</option>
                          <option value="MEETING" className="bg-theme-card text-theme-text">Meeting / Demo</option>
                        </select>
                      </div>

                      {/* Duration Display (Auto-populated from Start Call timer) */}
                      <div 
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                          activityDuration && activityDuration !== '--' && activityDuration !== '0s'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-xs'
                            : 'bg-theme-card border-theme-border/80 text-theme-text-muted'
                        }`}
                        title="Call duration is automatically recorded from the Start Call timer"
                      >
                        <Clock size={12} className={activityDuration && activityDuration !== '--' && activityDuration !== '0s' ? 'text-amber-400' : 'text-theme-text-muted'} />
                        <span className="text-theme-text-muted text-[10px] uppercase tracking-wide font-extrabold">Dur:</span>
                        <span className="font-bold text-xs">{activityDuration || '--'}</span>
                      </div>

                      {/* Attempt Status Chip */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-theme-card border border-theme-border/80 text-xs font-bold text-theme-text hover:border-theme-primary/40 transition-all">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          activityStatus === 'COMPLETED' ? 'bg-emerald-400' : activityStatus === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />
                        <span className="text-theme-text-muted text-[10px] uppercase tracking-wide font-extrabold">Status:</span>
                        <select
                          value={activityStatus}
                          onChange={(e) => setActivityStatus(e.target.value)}
                          className="bg-transparent text-xs font-bold text-theme-text focus:outline-none cursor-pointer"
                        >
                          <option value="ATTEMPTED" className="bg-theme-card text-theme-text">Attempted</option>
                          <option value="IN_PROGRESS" className="bg-theme-card text-theme-text">In Progress</option>
                          <option value="COMPLETED" className="bg-theme-card text-theme-text">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Commercial Proposal Amount (₹) */}
                  <div className="p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border flex items-center justify-between gap-3">
                    <label className="text-xs font-bold text-theme-text flex items-center gap-2 cursor-pointer">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <IndianRupee size={13} />
                      </div>
                      <span>Commercial Proposal Value (₹)</span>
                    </label>

                    <div className="relative w-40 sm:w-48 flex-shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={proposalAmount}
                        onChange={(e) => setProposalAmount(e.target.value)}
                        className="w-full bg-theme-card border border-theme-border rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Section 4: Discussion Notes & Quick Templates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                        <FileText size={13} className="text-theme-primary" />
                        <span>Discussion Notes & Takeaways *</span>
                      </label>
                      <span className="text-[10px] text-theme-text-muted font-medium">
                        {activityRemarks.length} chars
                      </span>
                    </div>

                    {/* 1-Click Quick Note Templates */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        'Client requested pricing quote & deck',
                        'Call rescheduled - client busy in meeting',
                        'Product demo completed successfully',
                        'Commercial negotiation in progress',
                        'Shared brochure via WhatsApp'
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setActivityRemarks(tpl)}
                          className="px-2.5 py-1 rounded-lg bg-theme-bg-alt hover:bg-theme-primary/10 hover:text-theme-primary hover:border-theme-primary/40 border border-theme-border text-[10px] font-medium text-theme-text-muted transition-all truncate max-w-full"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Type detailed discussion notes, client pain points, objections, deliverables..."
                      value={activityRemarks}
                      onChange={(e) => setActivityRemarks(e.target.value)}
                      className="w-full bg-theme-card border border-theme-border rounded-xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary leading-relaxed resize-none transition-all placeholder:text-theme-text-muted/60"
                    />
                  </div>

                  {/* Section 5: Schedule Next Follow-Up */}
                  <div className="p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-500" />
                        <span>Next Follow-Up Reminder</span>
                      </label>

                      {nextFollowupDate && (
                        <button
                          type="button"
                          onClick={() => setNextFollowupDate('')}
                          className="text-[10px] font-bold text-rose-400 hover:underline ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-60 flex-shrink-0">
                      <input
                        type="datetime-local"
                        value={nextFollowupDate}
                        onChange={(e) => setNextFollowupDate(e.target.value)}
                        className="w-full bg-theme-card border border-theme-border rounded-xl px-3 py-1.5 text-xs font-semibold text-theme-text focus:outline-none focus:border-theme-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Section 6: Action Footer (Save In Progress vs Mark Stage Done) */}
                  <div className="pt-2 border-t border-theme-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Option 1: Save log and keep stage In Progress */}
                    <button
                      type="button"
                      disabled={submittingActivity}
                      onClick={() => handleStudioSave(undefined, false, false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-theme-bg-alt hover:bg-theme-card border border-theme-border text-theme-text hover:border-theme-primary/50 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                    >
                      {submittingActivity ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} className="text-theme-primary" />
                      )}
                      <span>Save (In Progress)</span>
                    </button>

                    {/* Option 2: Save log and mark stage Done / Completed */}
                    <button
                      type="button"
                      disabled={submittingActivity}
                      onClick={() => handleStudioSave(undefined, false, true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                    >
                      {submittingActivity ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>Save & Mark Stage Done</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN (LG:COL-SPAN-5): LIVE INTERACTION HISTORY & INSIGHTS */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Upcoming Follow-Up Card (if active) */}
                  {leadActiveFollowup && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-xs font-extrabold uppercase text-blue-400">
                            Upcoming Follow-Up
                          </span>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                          {leadActiveFollowup.type || 'CALL'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-theme-text">
                        <Clock size={13} className="text-blue-400 flex-shrink-0" />
                        <span>
                          {leadActiveFollowup.scheduledAt ? new Date(leadActiveFollowup.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                        </span>
                      </div>

                      {leadActiveFollowup.notes && (
                        <p className="text-[11px] text-theme-text-muted italic bg-theme-card/60 p-2 rounded-lg border border-theme-border/40 line-clamp-2">
                          "{leadActiveFollowup.notes}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCompleteActiveFollowup}
                          disabled={completingFollowup}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={12} /> Done
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRescheduleModal(true)}
                          className="flex-1 py-1.5 rounded-lg bg-theme-bg-alt border border-theme-border hover:bg-theme-card text-theme-text text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <RefreshCw size={11} /> Reschedule
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Commercial Deal Card (if proposal amount exists) */}
                  {lead?.proposalAmount && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <IndianRupee size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-theme-text-muted block uppercase">
                            {['converted', 'won', 'closed won', 'payment completed'].includes((lead.status || '').toLowerCase())
                              ? 'Realized Revenue'
                              : 'Expected Deal Value'}
                          </span>
                          <span className="text-xs font-black text-emerald-400">₹{Number(lead.proposalAmount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                        ['converted', 'won', 'closed won', 'payment completed'].includes((lead.status || '').toLowerCase())
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {['converted', 'won', 'closed won', 'payment completed'].includes((lead.status || '').toLowerCase())
                          ? 'CONVERTED'
                          : 'PIPELINE (UNREALIZED)'}
                      </span>
                    </div>
                  )}

                  {/* History Header, Search & Scope Toggle */}
                  <div className="bg-theme-card border border-theme-border rounded-2xl sm:rounded-3xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
                        <History size={14} className="text-theme-primary" />
                        <span>Interaction History</span>
                      </h4>

                      {/* Scope Toggle: All vs This Stage */}
                      <div className="flex items-center gap-1 p-0.5 bg-theme-bg-alt rounded-lg border border-theme-border text-[10px]">
                        <button
                          type="button"
                          onClick={() => setStudioHistoryScope('all')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                            studioHistoryScope === 'all'
                              ? 'bg-theme-primary text-white shadow-xs'
                              : 'text-theme-text-muted hover:text-theme-text'
                          }`}
                        >
                          All ({activityLogsHistory.length || (lead?.activities || []).flatMap((a: any) => a.logs || []).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudioHistoryScope('step')}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                            studioHistoryScope === 'step'
                              ? 'bg-theme-primary text-white shadow-xs'
                              : 'text-theme-text-muted hover:text-theme-text'
                          }`}
                        >
                          This Stage
                        </button>
                      </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                      <input
                        type="text"
                        placeholder="Search past notes, outcomes..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="w-full bg-theme-bg-alt border border-theme-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                      />
                      {historySearchTerm && (
                        <button
                          type="button"
                          onClick={() => setHistorySearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Chronological Timeline Grouped by Relative Date */}
                    {(() => {
                      const allLogs = activityLogsHistory && activityLogsHistory.length > 0
                        ? activityLogsHistory
                        : (lead?.activities || []).flatMap((act: any) => 
                            (act.logs || []).map((l: any) => ({ ...l, stepTitle: act.title, stepKey: act.activityKey }))
                          );

                      const filteredLogs = allLogs.filter((log: any) => {
                        if (studioHistoryScope === 'step') {
                          const matchStep = log.stepKey === activeStudioStepKey || 
                            (lead?.activities?.find((a: any) => a.activityKey === activeStudioStepKey)?.logs || []).some((sl: any) => sl.id === log.id);
                          if (!matchStep) return false;
                        }
                        if (!historySearchTerm.trim()) return true;
                        const q = historySearchTerm.toLowerCase();
                        return (
                          (log.remarks || '').toLowerCase().includes(q) ||
                          (log.outcome || '').toLowerCase().includes(q) ||
                          (log.communicationType || '').toLowerCase().includes(q) ||
                          (log.loggedByName || '').toLowerCase().includes(q)
                        );
                      });

                      // Group logs by relative date
                      const groups: Record<string, typeof filteredLogs> = {};
                      filteredLogs.forEach((log: any) => {
                        const d = new Date(log.createdAt);
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const logDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

                        let grp = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        if (logDate.getTime() === today.getTime()) grp = 'Today';
                        else if (logDate.getTime() === yesterday.getTime()) grp = 'Yesterday';

                        if (!groups[grp]) groups[grp] = [];
                        groups[grp].push(log);
                      });

                      if (filteredLogs.length === 0) {
                        return (
                          <div className="text-center py-8 text-xs text-theme-text-muted space-y-1.5 bg-theme-bg-alt/30 rounded-2xl border border-dashed border-theme-border/60">
                            <Clock size={20} className="mx-auto text-theme-text-muted opacity-40" />
                            <p className="font-semibold">No interaction logs found.</p>
                            <p className="text-[10px]">Use the left form to log your first client attempt.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                          {Object.entries(groups).map(([dateLabel, logsInGroup]) => (
                            <div key={dateLabel} className="space-y-2">
                              {/* Date Group Header */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-theme-text-muted bg-theme-bg-alt px-2 py-0.5 rounded-md border border-theme-border/50">
                                  {dateLabel}
                                </span>
                                <div className="flex-1 h-px bg-theme-border/40" />
                              </div>

                              {/* Group Log Cards */}
                              {logsInGroup.map((log: any) => (
                                <div
                                  key={log.id}
                                  className="p-3 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/60 hover:border-theme-primary/50 transition-all space-y-2 group relative"
                                >
                                  {/* Log Top Row */}
                                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-md bg-theme-card border border-theme-border flex items-center justify-center text-theme-text-muted">
                                        {getCommIcon(log.communicationType)}
                                      </span>
                                      <span className="text-xs font-black text-theme-text">
                                        Attempt #{log.activityNumber || 1}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getOutcomeBadgeClass(log.outcome)}`}>
                                        {log.outcome?.replace(/_/g, ' ')}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-[10px] text-theme-text-muted">
                                      {log.duration && (
                                        <span className="px-1.5 py-0.5 rounded bg-theme-card border border-theme-border/50">
                                          {log.duration}
                                        </span>
                                      )}
                                      <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </div>

                                  {/* Remarks Box */}
                                  <p className="text-xs text-theme-text/90 italic bg-theme-card/70 p-2.5 rounded-xl border border-theme-border/40 leading-relaxed">
                                    "{log.remarks || 'No remarks recorded.'}"
                                  </p>

                                  {/* Log Footer */}
                                  <div className="flex items-center justify-between text-[10px] text-theme-text-muted pt-0.5">
                                    <span>By: <strong className="text-theme-text">{log.loggedByName?.split(' ')[0] || 'Executive'}</strong></span>
                                    
                                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                      {/* Copy Note */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(log.remarks || '');
                                          toast.success('Note copied to clipboard!');
                                        }}
                                        className="p-1 rounded-md hover:bg-theme-card text-theme-text-muted hover:text-theme-text transition-all"
                                        title="Copy Note"
                                      >
                                        <Copy size={11} />
                                      </button>

                                      {/* Quote in Reply */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActivityRemarks((prev) => prev ? `${prev}\n> "${log.remarks}"` : `> "${log.remarks}"`);
                                          toast.info('Quoted in discussion notes');
                                        }}
                                        className="p-1 rounded-md hover:bg-theme-card text-theme-text-muted hover:text-theme-primary transition-all"
                                        title="Quote in Note"
                                      >
                                        <CornerDownRight size={11} />
                                      </button>

                                      {/* Detail Modal */}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedInteractionDetail({ ...log, typeName: 'Activity Attempt' })}
                                        className="text-theme-primary font-bold hover:underline ml-1"
                                      >
                                        Details →
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 1: DUAL-PANE INTERACTION & HISTORY STUDIO */}
          <InteractionStudioModal
            isOpen={!!addModalStepKey}
            onClose={() => setAddModalStepKey(null)}
            lead={lead}
            stepKey={addModalStepKey}
            onStepKeyChange={(newKey) => setAddModalStepKey(newKey)}
            communicationType={communicationType}
            setCommunicationType={setCommunicationType}
            outcome={outcome}
            setOutcome={setOutcome}
            activityRemarks={activityRemarks}
            setActivityRemarks={setActivityRemarks}
            activityDuration={activityDuration}
            setActivityDuration={setActivityDuration}
            activityStatus={activityStatus}
            setActivityStatus={setActivityStatus}
            nextFollowupDate={nextFollowupDate}
            setNextFollowupDate={setNextFollowupDate}
            submittingActivity={submittingActivity}
            onSubmit={handleAddActivitySubmit}
            activityLogsHistory={activityLogsHistory}
            leadActiveFollowup={leadActiveFollowup}
            hasNextLead={hasNextLead}
            hasPrevLead={hasPrevLead}
            onNextLead={() => handleSafeLeadNavigation('next')}
            onPrevLead={() => handleSafeLeadNavigation('prev')}
            nextLeadName={nextLeadName}
            prevLeadName={prevLeadName}
            leadPositionInfo={leadPositionInfo}
            getCommIcon={getCommIcon}
            getOutcomeBadgeClass={getOutcomeBadgeClass}
          />

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

          {/* FollowUpModal for Rescheduling from Panel */}
          {lead && showRescheduleModal && (
            <FollowUpModal
              isOpen={showRescheduleModal}
              onClose={() => setShowRescheduleModal(false)}
              leadId={lead.id}
              leadName={lead.name}
              leadStage={lead.status}
              assignedUserId={lead.assignedToId}
              existingFollowup={leadActiveFollowup}
              onSuccess={() => {
                setShowRescheduleModal(false);
                fetchLeadDetails();
                triggerUpdate();
              }}
            />
          )}

          {/* Safe Navigation Confirmation Modal */}
          {showSafeNavWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs animate-fade-in">
              <div className="w-full max-w-md rounded-2xl bg-theme-card border border-amber-500/40 p-6 shadow-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-theme-text">
                      {activeCallWarning ? 'Active Call Session in Progress' : 'Unsaved Changes Detected'}
                    </h3>
                    <p className="text-xs text-theme-text-muted mt-1.5 leading-relaxed">
                      {activeCallWarning 
                        ? `You currently have an active call session timer running for ${lead?.name || 'this lead'}. Shifting to ${pendingNavDirection === 'next' ? (nextLeadName || 'the next lead') : (prevLeadName || 'the previous lead')} will not automatically stop your call.`
                        : `You have an open activity form with unsaved notes for ${lead?.name || 'this lead'}. Shifting now will discard unsaved form inputs.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-theme-border/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSafeNavWarning(false);
                      setPendingNavDirection(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-theme-border bg-theme-bg-alt text-xs font-semibold text-theme-text-muted hover:text-theme-text transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingNavDirection) {
                        executeLeadShift(pendingNavDirection);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </div>
          )}
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
