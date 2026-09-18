import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare,
  Building2,
  Activity,
  Layers,
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CornerDownRight,
  Plus
} from 'lucide-react';
import type { SalesActivityLog, SalesActivity } from '../types';
import type { FollowUp } from '../services/followUpService';

interface InteractionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  stepKey: string | null;
  onStepKeyChange: (key: string) => void;
  communicationType: string;
  setCommunicationType: (val: string) => void;
  outcome: string;
  setOutcome: (val: string) => void;
  activityRemarks: string;
  setActivityRemarks: (val: string | ((prev: string) => string)) => void;
  activityDuration: string;
  setActivityDuration: (val: string) => void;
  activityStatus: string;
  setActivityStatus: (val: string) => void;
  nextFollowupDate: string;
  setNextFollowupDate: (val: string) => void;
  submittingActivity: boolean;
  onSubmit: (e: React.FormEvent, openNext?: boolean, completeStage?: boolean) => Promise<void> | void;
  activityLogsHistory: SalesActivityLog[];
  leadActiveFollowup: FollowUp | null;
  hasNextLead?: boolean;
  hasPrevLead?: boolean;
  onNextLead?: () => void;
  onPrevLead?: () => void;
  nextLeadName?: string;
  prevLeadName?: string;
  leadPositionInfo?: { current: number; total: number };
  getCommIcon: (type: string) => React.ReactNode;
  getOutcomeBadgeClass: (outcome: string) => string;
}

const OUTCOME_PRESETS = [
  { key: 'BUSY', label: 'Client Busy', status: 'ATTEMPTED', color: 'amber' },
  { key: 'NOT_ANSWERED', label: 'No Answer', status: 'ATTEMPTED', color: 'amber' },
  { key: 'CONNECTED', label: 'Connected', status: 'SUCCESSFUL', color: 'emerald' },
  { key: 'INTERESTED', label: 'Interested', status: 'SUCCESSFUL', color: 'emerald' },
  { key: 'CALL_BACK_LATER', label: 'Call Back', status: 'WAITING', color: 'blue' },
  { key: 'MEETING_SCHEDULED', label: 'Meeting Set', status: 'SCHEDULED', color: 'purple' },
  { key: 'PROPOSAL_REQUESTED', label: 'Proposal Req', status: 'IN_PROGRESS', color: 'indigo' },
  { key: 'NOT_INTERESTED', label: 'Not Interested', status: 'ATTEMPTED', color: 'rose' },
  { key: 'LOST', label: 'Deal Lost', status: 'ATTEMPTED', color: 'rose' },
];

const NOTE_TEMPLATES = [
  'Client outside office, requested callback',
  'Interested in features, send pricing proposal on WhatsApp',
  'Confirmed budget and approved next discussion',
  'Scheduled demo walkthrough session',
  'Decision maker not available, follow up tomorrow'
];

export default function InteractionStudioModal({
  isOpen,
  onClose,
  lead,
  stepKey,
  onStepKeyChange,
  communicationType,
  setCommunicationType,
  outcome,
  setOutcome,
  activityRemarks,
  setActivityRemarks,
  activityDuration,
  setActivityDuration,
  activityStatus,
  setActivityStatus,
  nextFollowupDate,
  setNextFollowupDate,
  submittingActivity,
  onSubmit,
  activityLogsHistory,
  leadActiveFollowup,
  hasNextLead = false,
  hasPrevLead = false,
  onNextLead,
  onPrevLead,
  nextLeadName,
  prevLeadName,
  leadPositionInfo,
  getCommIcon,
  getOutcomeBadgeClass
}: InteractionStudioModalProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [autoCompleteStage, setAutoCompleteStage] = useState(false);

  if (!isOpen) return null;

  // Compile full history logs from all stages
  const combinedLogs: Array<SalesActivityLog & { stepTitle?: string; stepKey?: string }> = (() => {
    if (activityLogsHistory && activityLogsHistory.length > 0) {
      return [...activityLogsHistory].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (lead?.activities && Array.isArray(lead.activities)) {
      const extracted: Array<SalesActivityLog & { stepTitle?: string; stepKey?: string }> = [];
      lead.activities.forEach((act: SalesActivity) => {
        if (act.logs && Array.isArray(act.logs)) {
          act.logs.forEach((log) => {
            extracted.push({
              ...log,
              stepTitle: act.title,
              stepKey: act.activityKey
            });
          });
        }
      });
      return extracted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  })();

  const filteredLogs = combinedLogs.filter((log) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      log.remarks?.toLowerCase().includes(q) ||
      log.outcome?.toLowerCase().includes(q) ||
      log.communicationType?.toLowerCase().includes(q) ||
      log.stepTitle?.toLowerCase().includes(q) ||
      log.loggedByName?.toLowerCase().includes(q)
    );
  });

  const formatRelativeGroupDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return 'Earlier';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Earlier';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (itemDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  const formatUpcomingFollowupDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const rel = formatRelativeGroupDate(d);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${rel} at ${time}`;
  };

  const setQuickFollowupPreset = (preset: '2hours' | 'tomorrow11' | 'tomorrow15' | 'in2days' | 'nextMonday') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === '2hours') {
      const target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      setNextFollowupDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`);
    } else if (preset === 'tomorrow11' || preset === 'tomorrow15') {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      const hour = preset === 'tomorrow11' ? 11 : 15;
      setNextFollowupDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(hour)}:00`);
    } else if (preset === 'in2days') {
      const target = new Date(now);
      target.setDate(target.getDate() + 2);
      setNextFollowupDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T11:00`);
    } else if (preset === 'nextMonday') {
      const target = new Date(now);
      const day = target.getDay();
      const daysUntilMonday = ((1 - day + 7) % 7) || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      setNextFollowupDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T11:00`);
    }
  };

  const handleCopyHistoryRemark = (id: number, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertHistoryRemark = (text: string) => {
    if (!text) return;
    setActivityRemarks((prev) => (prev ? `${prev}\n• Previous note: "${text}"` : `• Previous note: "${text}"`));
  };

  const handleSelectOutcomePreset = (item: typeof OUTCOME_PRESETS[0]) => {
    setOutcome(item.key);
    setActivityStatus(item.status);
  };

  // Group filtered history logs by relative dates
  const groupedLogs: Record<string, typeof filteredLogs> = {};
  filteredLogs.forEach((log) => {
    const groupKey = formatRelativeGroupDate(log.createdAt);
    if (!groupedLogs[groupKey]) {
      groupedLogs[groupKey] = [];
    }
    groupedLogs[groupKey].push(log);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-theme-border/70 flex items-center justify-between bg-theme-bg/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 text-theme-primary flex items-center justify-center flex-shrink-0 shadow-xs">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-theme-text truncate">
                  Log Interaction & History
                </h3>
                {lead?.name && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-theme-bg-alt border border-theme-border text-theme-text truncate">
                    {lead.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-theme-text-muted mt-0.5 flex-wrap">
                {lead?.phone && (
                  <a href={`tel:${lead.phone}`} className="hover:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Phone size={11} /> {lead.phone}
                  </a>
                )}
                {lead?.phone && lead?.email && <span>•</span>}
                {lead?.email && (
                  <a href={`mailto:${lead.email}`} className="hover:text-theme-primary flex items-center gap-1 truncate max-w-[200px]">
                    <Mail size={11} /> {lead.email}
                  </a>
                )}
                {lead?.company && lead.company !== 'N/A' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-theme-text-muted">
                      <Building2 size={11} /> {lead.company}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {leadPositionInfo && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-theme-bg-alt border border-theme-border text-theme-text-muted">
                Lead {leadPositionInfo.current} of {leadPositionInfo.total}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt border border-transparent hover:border-theme-border transition-all"
              title="Close (Esc)"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (DUAL PANE SPLIT LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-theme-border/60">
          
          {/* LEFT PANE: CURRENT INTERACTION LOGGING FORM (Col 7) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 bg-theme-card">
            
            {/* 1. Workflow Stage Manager */}
            <div className="p-3.5 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5">
                  <Layers size={14} className="text-theme-primary" /> Active Workflow Stage
                </label>
                <span className="text-[10px] text-theme-text-muted font-semibold">
                  Select stage
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={stepKey || ''}
                  onChange={(e) => onStepKeyChange(e.target.value)}
                  className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all cursor-pointer"
                >
                  {lead?.activities && lead.activities.length > 0 ? (
                    lead.activities.map((act: SalesActivity) => (
                      <option key={act.activityKey} value={act.activityKey}>
                        {act.title} {act.status === 'COMPLETED' ? '(Done)' : act.status === 'IN_PROGRESS' ? '(In Progress)' : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="FIRST_CALL">1. First Introduction Call</option>
                      <option value="FOLLOW_UP_CALL">2. Follow-up & Requirement Analysis</option>
                      <option value="DEMO_MEETING">3. Product Demo / Meeting</option>
                      <option value="PROPOSAL_SENT">4. Commercial Proposal</option>
                      <option value="NEGOTIATION">5. Negotiation & Deal Finalization</option>
                      <option value="CLOSING">6. Final Deal Closure</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={(e) => onSubmit(e, false, autoCompleteStage)} className="space-y-4">
              
              {/* 2. Quick Outcome Preset Pills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-theme-text">
                    Call Outcome
                  </label>
                  <span className="text-[10px] text-theme-text-muted font-medium">Quick select</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                  {OUTCOME_PRESETS.map((item) => {
                    const isSelected = outcome === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectOutcomePreset(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-theme-primary text-white border-theme-primary shadow-xs'
                            : 'bg-theme-bg border-theme-border/70 text-theme-text hover:border-theme-primary/60 hover:bg-theme-bg-alt'
                        }`}
                      >
                        <span className="truncate text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Communication Channel & Attempt Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-theme-text block mb-1.5">Communication Channel</label>
                  <select
                    value={communicationType}
                    onChange={(e) => setCommunicationType(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all cursor-pointer"
                  >
                    <option value="PHONE_CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom</option>
                    <option value="OFFICE_VISIT">Office Visit</option>
                    <option value="VIDEO_CALL">Video Call</option>
                    <option value="OTHER">Other Channel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-theme-text block mb-1.5">Attempt Status</label>
                  <select
                    value={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all cursor-pointer"
                  >
                    <option value="ATTEMPTED">Attempted (Unreached)</option>
                    <option value="IN_PROGRESS">In Progress (Active Discussions)</option>
                    <option value="WAITING">Waiting (Client to reply)</option>
                    <option value="SCHEDULED">Scheduled (Next Step Fixed)</option>
                    <option value="SUCCESSFUL">Successful (Discussion Done)</option>
                  </select>
                </div>
              </div>

              {/* 4. Duration with Quick Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-theme-text flex items-center gap-1">
                    <Clock size={12} className="text-theme-text-muted" /> Duration
                  </label>
                  <span className="text-[10px] text-theme-text-muted">Presets:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 5 mins, 15 mins"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(e.target.value)}
                    className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all"
                  />
                  <div className="flex items-center gap-1">
                    {['2 mins', '5 mins', '10 mins', '15 mins', '30 mins'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setActivityDuration(preset)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          activityDuration === preset
                            ? 'bg-theme-primary/15 border-theme-primary/50 text-theme-primary font-bold'
                            : 'bg-theme-bg border-theme-border/60 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Notes & Remarks with Quick Snippets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-theme-primary" /> Discussion Summary & Notes
                  </label>
                  <span className="text-[10px] font-semibold text-rose-500">Required</span>
                </div>

                <textarea
                  required
                  rows={4}
                  placeholder="Summarize client discussion, requirements, confirmed budget or next steps..."
                  value={activityRemarks}
                  onChange={(e) => setActivityRemarks(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border rounded-2xl p-3.5 text-xs text-theme-text leading-relaxed focus:outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all placeholder:text-theme-text-muted/60"
                />

                {/* Quick note snippets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-theme-text-muted font-bold flex items-center gap-0.5">
                    <Plus size={10} /> Quick tags:
                  </span>
                  {NOTE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setActivityRemarks((prev) => (prev ? `${prev} | ${tmpl}` : tmpl))
                      }
                      className="px-2 py-0.5 rounded-lg text-[10px] bg-theme-bg border border-theme-border/60 text-theme-text-muted hover:text-theme-primary hover:border-theme-primary/40 hover:bg-theme-bg-alt transition-all truncate max-w-[220px]"
                      title={tmpl}
                    >
                      +{tmpl.slice(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Integrated Next Follow-up Picker */}
              <div className="p-3.5 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                    <Calendar size={13} className="text-theme-primary" /> Schedule Next Follow-up
                  </label>
                  {nextFollowupDate && (
                    <button
                      type="button"
                      onClick={() => setNextFollowupDate('')}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="datetime-local"
                    value={nextFollowupDate}
                    onChange={(e) => setNextFollowupDate(e.target.value)}
                    className="sm:col-span-6 bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                  />
                  <div className="sm:col-span-6 flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQuickFollowupPreset('2hours')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-theme-bg border border-theme-border hover:border-theme-primary text-theme-text"
                    >
                      +2 Hrs
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFollowupPreset('tomorrow11')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-theme-bg border border-theme-border hover:border-theme-primary text-theme-text"
                    >
                      Tmrw 11 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFollowupPreset('tomorrow15')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-theme-bg border border-theme-border hover:border-theme-primary text-theme-text"
                    >
                      Tmrw 3 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickFollowupPreset('in2days')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-theme-bg border border-theme-border hover:border-theme-primary text-theme-text"
                    >
                      In 2 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Auto Complete Stage Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-theme-text select-none">
                  <input
                    type="checkbox"
                    checked={autoCompleteStage}
                    onChange={(e) => setAutoCompleteStage(e.target.checked)}
                    className="w-4 h-4 rounded-md text-theme-primary border-theme-border focus:ring-theme-primary/20 accent-theme-primary cursor-pointer"
                  />
                  <span>Mark <strong className="text-theme-primary font-bold">{stepKey?.replace(/_/g, ' ') || 'current stage'}</strong> as completed upon saving</span>
                </label>
              </div>

              {/* 8. Action Buttons Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs font-bold text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={submittingActivity}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-theme-bg-alt border border-theme-border hover:border-theme-primary text-theme-text text-xs font-bold shadow-xs hover:bg-theme-card transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingActivity ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    )}
                    <span>Save Activity Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => onSubmit(e, true, autoCompleteStage)}
                    disabled={submittingActivity}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-md shadow-theme-primary/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                    title={hasNextLead ? (nextLeadName ? `Save and jump to next lead: ${nextLeadName}` : 'Save and open next lead') : 'Save and refresh'}
                  >
                    {submittingActivity ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Open Next Lead</span>
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT PANE: INTERACTION HISTORY & LIVE PREVIEW (Col 5) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-theme-bg/40 overflow-hidden">
            
            {/* History Panel Header */}
            <div className="p-4 border-b border-theme-border/60 bg-theme-card/60 backdrop-blur-xs flex-shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-text">
                    Interaction History
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-bg-alt border border-theme-border text-theme-text-muted">
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'Attempt' : 'Attempts'}
                  </span>
                </div>
              </div>

              {/* History Search Bar */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search past notes, outcomes..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-theme-bg border border-theme-border/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-theme-text placeholder:text-theme-text-muted/60 focus:outline-none focus:border-theme-primary"
                />
                {historySearchQuery && (
                  <button
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-theme-text-muted hover:text-theme-text"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Upcoming Follow-up Highlight Box */}
            {(leadActiveFollowup || lead?.nextFollowupDate) && (
              <div className="m-3 p-3 rounded-2xl bg-theme-card border border-theme-border flex-shrink-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-theme-primary flex items-center gap-1">
                    <Calendar size={12} /> Upcoming Follow-up
                  </span>
                  <span className="text-[10px] font-semibold text-theme-text">
                    {formatUpcomingFollowupDate(leadActiveFollowup?.scheduledAt || lead?.nextFollowupDate)}
                  </span>
                </div>
                {leadActiveFollowup?.notes && (
                  <p className="text-[11px] text-theme-text-muted italic truncate">
                    "{leadActiveFollowup.notes}"
                  </p>
                )}
              </div>
            )}

            {/* History Items Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4">
              {Object.keys(groupedLogs).length > 0 ? (
                Object.entries(groupedLogs).map(([groupDate, logs]) => (
                  <div key={groupDate} className="space-y-2">
                    {/* Date Sticky Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-theme-text-muted bg-theme-card px-2.5 py-0.5 rounded-md border border-theme-border/60 shadow-xs">
                        {groupDate}
                      </span>
                      <div className="h-px flex-1 bg-theme-border/40" />
                    </div>

                    {/* Timeline items for this date */}
                    <div className="space-y-2.5">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-2xl bg-theme-card border border-theme-border/70 hover:border-theme-primary/60 transition-all space-y-2 group shadow-xs"
                        >
                          {/* Top Row: Outcome Badge & Channel */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-theme-bg-alt border border-theme-border flex items-center justify-center flex-shrink-0">
                                {getCommIcon(log.communicationType)}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getOutcomeBadgeClass(log.outcome)}`}>
                                {log.outcome?.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-theme-text-muted">
                              {log.duration && (
                                <span className="flex items-center gap-1 bg-theme-bg-alt px-1.5 py-0.5 rounded-md border border-theme-border font-medium">
                                  <Clock size={9} /> {log.duration}
                                </span>
                              )}
                              <span>
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                            </div>
                          </div>

                          {/* Stage Name */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-theme-text-muted flex items-center gap-1">
                              <Layers size={10} className="text-theme-primary" /> {log.stepTitle || log.stepKey?.replace(/_/g, ' ') || 'Sales Attempt'}
                            </span>
                            <span className="text-theme-text-muted">
                              By: <strong className="text-theme-text font-bold">{log.loggedByName?.split(' ')[0] || 'Executive'}</strong>
                            </span>
                          </div>

                          {/* Remarks Box */}
                          <div className="p-2.5 rounded-xl bg-theme-bg-alt/50 border border-theme-border/40 text-[11px] text-theme-text leading-relaxed italic">
                            "{log.remarks || 'No detailed notes provided.'}"
                          </div>

                          {/* Action links */}
                          <div className="flex items-center justify-between pt-1 border-t border-theme-border/30 text-[10px]">
                            {log.nextFollowupDate ? (
                              <span className="text-amber-400 font-medium flex items-center gap-1">
                                <Calendar size={10} /> Next: {new Date(log.nextFollowupDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyHistoryRemark(log.id, log.remarks || '')}
                                className="text-theme-text-muted hover:text-theme-text flex items-center gap-1 font-semibold"
                                title="Copy remark"
                              >
                                {copiedId === log.id ? (
                                  <>
                                    <Check size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleInsertHistoryRemark(log.remarks || '')}
                                className="text-theme-primary hover:underline flex items-center gap-1 font-semibold"
                                title="Insert note into form"
                              >
                                <CornerDownRight size={11} />
                                <span>Quote</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 px-4 text-center space-y-2 bg-theme-card/30 rounded-2xl border border-dashed border-theme-border/60">
                  <div className="w-10 h-10 rounded-2xl bg-theme-bg-alt border border-theme-border flex items-center justify-center mx-auto text-theme-text-muted">
                    <Activity size={18} />
                  </div>
                  <p className="text-xs font-bold text-theme-text">No Previous Interactions Found</p>
                  <p className="text-[11px] text-theme-text-muted max-w-xs mx-auto">
                    {historySearchQuery
                      ? 'No history matches your search filter.'
                      : 'This is the first interaction for this client. Log your call or message on the left panel.'}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Footer info */}
            {hasPrevLead || hasNextLead ? (
              <div className="p-3 border-t border-theme-border/60 bg-theme-card/40 flex items-center justify-between text-[11px] text-theme-text-muted flex-shrink-0">
                <button
                  type="button"
                  onClick={onPrevLead}
                  disabled={!hasPrevLead}
                  className="flex items-center gap-1 font-semibold hover:text-theme-text disabled:opacity-30"
                >
                  <ChevronLeft size={13} /> {prevLeadName ? `Prev: ${prevLeadName.slice(0, 12)}` : 'Prev Lead'}
                </button>

                <span className="text-[10px] font-semibold text-theme-text-muted">
                  Alt+N for next
                </span>

                <button
                  type="button"
                  onClick={onNextLead}
                  disabled={!hasNextLead}
                  className="flex items-center gap-1 font-semibold hover:text-theme-primary disabled:opacity-30"
                >
                  {nextLeadName ? `Next: ${nextLeadName.slice(0, 12)}` : 'Next Lead'} <ChevronRight size={13} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
