import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import type { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, Loader2, Sparkles, Ban } from 'lucide-react';

interface Props {
  selectedDate?: string;
  onSelectSlot?: (slotTime: string) => void;
  title?: string;
  compact?: boolean;
}

const formatDateKey = (val: string | Date | undefined): string => {
  if (!val) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTime12hFromMinutes = (totalMinutes: number): string => {
  const hour = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const padMins = String(mins).padStart(2, '0');
  if (hour === 0) return `12:${padMins} AM`;
  if (hour < 12) return `${hour}:${padMins} AM`;
  if (hour === 12) return `12:${padMins} PM`;
  return `${hour - 12}:${padMins} PM`;
};

export default function SchedulePreviewSidePanel({
  selectedDate,
  onSelectSlot,
  title = "Day's Agenda & Free Slots",
  compact = false
}: Props) {
  const dateKey = formatDateKey(selectedDate);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const slotInterval = 30;

  useEffect(() => {
    if (!dateKey) return;
    let isMounted = true;
    setLoading(true);

    calendarService.getEvents(dateKey, dateKey)
      .then((data) => {
        if (isMounted) setEvents(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch schedule preview', err);
        if (isMounted) setEvents([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dateKey]);

  // Generate Working Hours Slots (9:00 AM to 7:00 PM = 540 to 1140 minutes)
  const slots = (() => {
    const list: Array<{ timeStr: string; label: string; totalMinutes: number }> = [];
    const startMins = 9 * 60; // 9:00 AM
    const endMins = 19 * 60; // 7:00 PM

    for (let mins = startMins; mins < endMins; mins += slotInterval) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(h)}:${pad(m)}`;
      const label = formatTime12hFromMinutes(mins);
      list.push({ timeStr, label, totalMinutes: mins });
    }
    return list;
  })();

  const dateDisplayStr = (() => {
    if (!dateKey) return 'Today';
    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateKey;
  })();

  const handleSlotClick = (timeStr: string) => {
    if (!onSelectSlot || !dateKey) return;
    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const slotStr = `${parts[0]}-${parts[1]}-${parts[2]}T${timeStr}`;
      onSelectSlot(slotStr);
    }
  };

  const selectedTimeStr = selectedDate && selectedDate.includes('T')
    ? selectedDate.split('T')[1].slice(0, 5)
    : undefined;

  return (
    <div className={`flex flex-col bg-theme-bg-alt/70 border border-theme-border/60 rounded-3xl p-4 space-y-3 ${compact ? 'w-full' : 'w-full max-w-xs'}`}>
      
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-theme-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-theme-text leading-tight">{title}</h4>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{dateDisplayStr}</p>
          </div>
        </div>

        {loading && <Loader2 size={14} className="animate-spin text-blue-600" />}
      </div>

      {/* Commitments Count */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold px-1">
        <span className="text-theme-text-muted">Working Hours Free Slots:</span>
        <span className={`px-2 py-0.5 rounded-full ${events.length > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
          {events.length} {events.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {/* Minute-Level Slot List */}
      <div className="space-y-1 flex-1 overflow-y-auto max-h-[330px] pr-1">
        {slots.map((slot) => {
          // Check collision with calendar events
          const slotStartMinutes = slot.totalMinutes;
          const slotEndMinutes = slot.totalMinutes + slotInterval;

          const slotEvents = events.filter((e) => {
            if (!e.startTime) return false;
            const evStart = new Date(e.startTime);
            const evStartMins = evStart.getHours() * 60 + evStart.getMinutes();
            const evEnd = e.endTime ? new Date(e.endTime) : new Date(evStart.getTime() + 30 * 60000);
            const evEndMins = evEnd.getHours() * 60 + evEnd.getMinutes();

            return (slotStartMinutes < evEndMins && slotEndMinutes > evStartMins);
          });

          const isBusy = slotEvents.length > 0;
          const isSelected = selectedTimeStr === slot.timeStr;

          return (
            <div
              key={slot.timeStr}
              className={`p-2.5 rounded-2xl border text-xs transition-all flex items-center justify-between gap-2 ${
                isBusy
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 cursor-not-allowed opacity-90'
                  : isSelected
                  ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs'
                  : 'bg-theme-card border-theme-border/50 text-theme-text hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-bold font-mono text-theme-text-muted shrink-0 w-16">
                  {slot.label}
                </span>

                {isBusy ? (
                  <div className="min-w-0 truncate">
                    <span className="text-[10px] font-extrabold flex items-center gap-1 truncate text-rose-500">
                      <Ban size={11} className="shrink-0" />
                      <span className="truncate">Slot Booked ({slotEvents[0].title || 'Busy'})</span>
                    </span>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    <CheckCircle2 size={12} /> {isSelected ? 'Selected' : 'Available'}
                  </span>
                )}
              </div>

              {!isBusy && onSelectSlot ? (
                <button
                  type="button"
                  onClick={() => handleSlotClick(slot.timeStr)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-500/20'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Pick Slot'}
                </button>
              ) : (
                <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-rose-500/10 shrink-0">
                  Booked
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Guidance Footer */}
      <div className="pt-2 border-t border-theme-border/40 text-[10px] text-theme-text-muted font-semibold flex items-center gap-1.5">
        <Sparkles size={13} className="text-amber-500 shrink-0" />
        <span>Click any free slot to auto-fill date & exact time.</span>
      </div>

    </div>
  );
}
