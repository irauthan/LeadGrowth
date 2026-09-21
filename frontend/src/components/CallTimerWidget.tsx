import { useState, useEffect } from 'react';
import { PhoneCall, Square, Play, Timer, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { CallSession } from '../types';
import { toast } from '../store/toastStore';

interface CallTimerWidgetProps {
  leadId: number;
  leadName: string;
  assignedToId?: number;
  currentUserId?: number;
  compact?: boolean;
  onCallEnded?: (durationStr: string, totalSec: number) => void;
}

export default function CallTimerWidget({
  leadId,
  leadName,
  compact = true,
  onCallEnded
}: CallTimerWidgetProps) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [submittingEnd, setSubmittingEnd] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveCall();
  }, [leadId]);

  // Timer interval for live tracking
  useEffect(() => {
    let interval: any = null;
    if (activeCall && activeCall.status === 'ACTIVE') {
      interval = setInterval(() => {
        const startMs = new Date(activeCall.startTime).getTime();
        const nowMs = new Date().getTime();
        const diffSec = Math.floor(Math.max(0, nowMs - startMs) / 1000);
        setElapsedSeconds(diffSec);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall]);

  const fetchActiveCall = async () => {
    try {
      const res = await api.get('/api/calls/active');
      if (res.data && res.data.status === 'ACTIVE') {
        setActiveCall(res.data);
      } else {
        setActiveCall(null);
      }
    } catch (e) {
      setActiveCall(null);
    }
  };

  const handleStartCall = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/calls/start', { leadId });
      setActiveCall(res.data);
      toast.info(`Calling ${leadName}... Timer started.`, 'Call Connected');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start call. Ensure you have no other active calls running.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall || submittingEnd) return;
    setSubmittingEnd(true);
    try {
      await api.post('/api/calls/end', {
        callId: activeCall.id,
        notes: ''
      });
      const readable = getReadableDuration(elapsedSeconds);
      setActiveCall(null);
      toast.success(`Call ended (${readable}). Call duration recorded!`, 'Call Finished');
      if (onCallEnded) onCallEnded(readable, elapsedSeconds);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to end call session.');
    } finally {
      setSubmittingEnd(false);
    }
  };

  const getReadableDuration = (totalSec: number) => {
    if (totalSec <= 0) return '0s';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatHHMMSS = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentLeadCall = activeCall && activeCall.leadId === leadId;

  // Compact Mode (Ideal for Lead Header Row - minimal theory, clean button & icon)
  if (compact) {
    if (activeCall) {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <Timer size={13} className="animate-pulse" />
            <span>{formatHHMMSS(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={handleEndCall}
            disabled={submittingEnd}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="End Call Session"
          >
            {submittingEnd ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span className="hidden xs:inline text-[11px]">Ending...</span>
              </>
            ) : (
              <>
                <Square size={11} fill="currentColor" />
                <span className="text-[11px]">End Call</span>
              </>
            )}
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleStartCall}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        title={`Start call with ${leadName}`}
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <PhoneCall size={13} />
            <span>Start Call</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-theme-bg-alt/60 border border-theme-border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary">
            <PhoneCall size={16} />
          </span>
          <div>
            <h4 className="text-xs font-extrabold text-theme-text flex items-center gap-1.5">
              Call Duration Tracker <span className="text-[9px] font-semibold text-theme-text-muted">(User Productivity)</span>
            </h4>
            <span className="text-[10px] text-theme-text-muted block">
              Record time spent engaging with {leadName}.
            </span>
          </div>
        </div>

        {activeCall && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Call In Progress
            </span>
          </div>
        )}
      </div>

      {activeCall ? (
        <div className="bg-theme-card border border-rose-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">
              {isCurrentLeadCall ? `Active Call on ${leadName}` : `Active Call on Lead #${activeCall.leadId}`}
            </span>
            <div className="text-xl font-black text-rose-500 font-mono tracking-wider flex items-center gap-1.5">
              <Timer size={18} className="animate-pulse flex-shrink-0" />
              <span>{formatHHMMSS(elapsedSeconds)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEndCall}
            disabled={submittingEnd}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {submittingEnd ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Ending Call...
              </>
            ) : (
              <>
                <Square size={13} fill="currentColor" /> End Call Session
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStartCall}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Starting...
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> Start Call Session
            </>
          )}
        </button>
      )}
    </div>
  );
}
