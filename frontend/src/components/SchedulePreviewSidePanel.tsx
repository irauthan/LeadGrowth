import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import type { CalendarEvent } from '../types';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Plus, Loader2, Sparkles } from 'lucide-react';

interface Props {
  selectedDate?: string;
  onSelectSlot?: (slotTime: string) => void;
  title?: string;
  compact?: boolean;
}

const formatDateKey = (val?: string): string => {
  if (!val) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const match = val.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatTime12h = (hour: number): string => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
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

  // Working Hours Slots (9 AM to 7 PM)
  const workingHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const dateDisplayStr = (() => {
    if (!dateKey) return 'Today';
    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateKey;
  })();

  const handleSlotClick = (hour: number) => {
    if (!onSelectSlot || !dateKey) return;
    const parts = dateKey.split('-');
    if (parts.length === 3) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const slotStr = `${parts[0]}-${parts[1]}-${parts[2]}T${pad(hour)}:00`;
      onSelectSlot(slotStr);
    }
  };

  const selectedHour = selectedDate && selectedDate.includes('T') ? new Date(selectedDate).getHours() : undefined;

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

      {/* Busy Count & Status */}
      <div className="flex items-center justify-between text-[10px] font-extrabold px-1">
        <span className="text-theme-text-muted">Existing Commitments:</span>
        <span className={`px-2 py-0.5 rounded-full ${events.length > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
          {events.length} {events.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
        {workingHours.map((hour) => {
          const slotEvents = events.filter((e) => {
            if (!e.startTime) return false;
            const evHour = new Date(e.startTime).getHours();
            return evHour === hour;
          });

          const isBusy = slotEvents.length > 0;
          const isSelected = selectedHour === hour;

          return (
            <div
              key={hour}
              className={`p-2 rounded-2xl border text-xs transition-all flex items-center justify-between gap-2 ${
                isBusy
                  ? 'bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : isSelected
                  ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold shadow-xs'
                  : 'bg-theme-card border-theme-border/50 text-theme-text hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold font-mono text-theme-text-muted shrink-0">
                  {formatTime12h(hour)}
                </span>

                {isBusy ? (
                  <div className="min-w-0 truncate">
                    <span className="text-[10px] font-extrabold block truncate">
                      ⛔ {slotEvents[0].title}
                    </span>
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-bold block truncate">
                      {slotEvents[0].eventType || 'Occupied'}
                    </span>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    <CheckCircle2 size={12} /> {isSelected ? 'Selected Slot' : 'Available Slot'}
                  </span>
                )}
              </div>

              {!isBusy && onSelectSlot && (
                <button
                  type="button"
                  onClick={() => handleSlotClick(hour)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-500/20'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Pick Time'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto Pick Guidance Tip */}
      <div className="pt-2 border-t border-theme-border/40 text-[10px] text-theme-text-muted font-semibold flex items-center gap-1.5">
        <Sparkles size={13} className="text-amber-500 shrink-0" />
        <span>Click <strong>"Pick Time"</strong> on any available slot to auto-fill the schedule time.</span>
      </div>

    </div>
  );
}
