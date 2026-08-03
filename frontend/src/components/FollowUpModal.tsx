import { useState, useEffect } from 'react';
import { followUpService, type ConflictCheckResult, type FollowUp } from '../services/followUpService';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Loader2,
  AlertCircle
} from 'lucide-react';

import SchedulePreviewSidePanel from './SchedulePreviewSidePanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
  leadStage?: string;
  assignedUserId?: number;
  existingFollowup?: FollowUp | null;
  onSuccess: () => void;
}

export default function FollowUpModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadStage = 'New Lead',
  assignedUserId,
  existingFollowup,
  onSuccess
}: Props) {
  const isReschedule = Boolean(existingFollowup);

  // Form State
  const defaultDateStr = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  const [scheduledAt, setScheduledAt] = useState<string>(
    existingFollowup?.scheduledAt ? existingFollowup.scheduledAt.slice(0, 16) : defaultDateStr
  );
  const [type, setType] = useState<string>(existingFollowup?.type || 'CALL');
  const [notes, setNotes] = useState<string>(existingFollowup?.notes || '');
  
  // Validation & Conflict State
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [workingHoursError, setWorkingHoursError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingFollowup) {
      setScheduledAt(existingFollowup.scheduledAt.slice(0, 16));
      setType(existingFollowup.type || 'CALL');
      setNotes(existingFollowup.notes || '');
    } else {
      setScheduledAt(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
    }
  }, [existingFollowup]);

  // Real-time conflict & working hours validation
  useEffect(() => {
    if (!isOpen || !scheduledAt) return;

    const dt = new Date(scheduledAt);
    const now = new Date();

    // 1. Future Time Only Rule
    if (dt < now) {
      setPastError('Follow-up can only be scheduled to a future time.');
    } else if (existingFollowup && new Date(existingFollowup.scheduledAt) > dt) {
      setPastError('Follow-up can only be rescheduled to a future time (Backward rescheduling not allowed).');
    } else {
      setPastError(null);
    }

    // 2. Working Hours Rule (9 AM - 7 PM)
    const hour = dt.getHours();
    if (hour < 9 || hour >= 19) {
      setWorkingHoursError('Scheduling is only allowed during working hours (9:00 AM – 7:00 PM).');
    } else {
      setWorkingHoursError(null);
    }

    // 3. Conflict Check API
    if (assignedUserId && !isNaN(dt.getTime())) {
      setIsCheckingConflict(true);
      const timer = setTimeout(async () => {
        try {
          const res = await followUpService.checkConflict(
            assignedUserId, 
            scheduledAt, 
            existingFollowup?.id
          );
          setConflictResult(res);
        } catch (err) {
          console.error('Failed conflict check', err);
        } finally {
          setIsCheckingConflict(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scheduledAt, assignedUserId, isOpen, existingFollowup]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pastError || workingHoursError) return;

    setSubmitting(true);
    try {
      if (isReschedule && existingFollowup) {
        await followUpService.reschedule(existingFollowup.id, scheduledAt, false);
      } else {
        await followUpService.createFollowup({
          leadId,
          scheduledAt,
          type,
          notes,
          autoScheduleIfConflict: false
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to save follow-up.';
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSchedule = async () => {
    setSubmitting(true);
    try {
      if (isReschedule && existingFollowup) {
        await followUpService.reschedule(existingFollowup.id, scheduledAt, true);
      } else {
        await followUpService.autoSchedule(leadId, type, notes);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Auto schedule failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const applySuggestedSlot = (slotStr?: string) => {
    if (slotStr) {
      setScheduledAt(slotStr.slice(0, 16));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-5 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Stage: {leadStage}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-theme-text mt-1">
              {isReschedule ? `Reschedule Follow-up: ${leadName}` : `Schedule Follow-up: ${leadName}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text">
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Grid (Form Left + Schedule Side Panel Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Left Form Section */}
          <div className="md:col-span-7 space-y-4">

            {/* Validation Errors & Conflict Warnings */}
            <div className="space-y-2">
              {pastError && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{pastError}</span>
                </div>
              )}

              {workingHoursError && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                  <Clock size={16} className="shrink-0" />
                  <span>{workingHoursError}</span>
                </div>
              )}

              {conflictResult?.hasConflict && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2">
                  <div className="flex items-start gap-2 font-bold">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p>This time slot is already occupied. Please reschedule or use Auto Schedule.</p>
                      {conflictResult.suggestedSlot && (
                        <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                          Suggested free slot: {new Date(conflictResult.suggestedSlot).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {conflictResult.suggestedSlot && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => applySuggestedSlot(conflictResult.suggestedSlot)}
                        className="px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-[10px] shadow"
                      >
                        Use Suggested Slot
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoSchedule}
                        className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-[10px] shadow flex items-center gap-1"
                      >
                        <Zap size={12} /> Auto Schedule
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold uppercase tracking-wider text-theme-text-muted text-[10px] block mb-1">
                    Follow-up Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={scheduledAt ? scheduledAt.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        if (!dateVal) return;
                        const timePart = scheduledAt && scheduledAt.includes('T') ? scheduledAt.split('T')[1] : '10:00';
                        setScheduledAt(`${dateVal}T${timePart}`);
                      }}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-3 font-bold text-theme-text outline-none focus:border-blue-500"
                    />
                    {isCheckingConflict && (
                      <Loader2 size={14} className="absolute right-3 top-3 animate-spin text-blue-500" />
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-xl">
                      <Clock size={12} />
                      <span>Time: {scheduledAt && scheduledAt.includes('T') ? new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}</span>
                    </div>
                    <span className="text-[9px] text-theme-text-muted font-semibold">9:00 AM – 7:00 PM</span>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold uppercase tracking-wider text-theme-text-muted text-[10px] block mb-1">
                    Follow-up Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-3 font-bold text-theme-text outline-none focus:border-blue-500"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="MEETING">In-Person / Virtual Meeting</option>
                    <option value="DEMO">Product Demo</option>
                    <option value="EMAIL">Email Follow-up</option>
                    <option value="VISIT">Site Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold uppercase tracking-wider text-theme-text-muted text-[10px] block mb-1">
                  Notes & Agenda (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Discuss proposal details, address pricing objections..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt p-3 font-medium text-theme-text outline-none focus:border-blue-500"
                />
              </div>

              {/* Footer Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-theme-border/40">
                <button
                  type="button"
                  onClick={handleAutoSchedule}
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/30 flex items-center gap-1.5 transition-all text-xs"
                >
                  <Zap size={14} /> Auto Schedule
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-2xl border border-theme-border bg-theme-bg-alt font-semibold text-theme-text-muted text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || Boolean(pastError) || Boolean(workingHoursError)}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-lg shadow-blue-500/20 transition-all text-xs disabled:opacity-50"
                  >
                    {isReschedule ? 'Confirm Reschedule' : 'Save Schedule'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Right Schedule Side Panel Preview */}
          <div className="md:col-span-5 w-full">
            <SchedulePreviewSidePanel
              selectedDate={scheduledAt}
              onSelectSlot={(slotTime) => setScheduledAt(slotTime)}
            />
          </div>

        </div>

      </div>
    </div>
  );
}

