import { useState } from 'react';
import type { Task, RescheduleTaskRequest } from '../types';
import api from '../services/api';
import { Calendar, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Props {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task) => void;
}

export default function TaskRescheduleModal({ task, isOpen, onClose, onSuccess }: Props) {
  const [newDate, setNewDate] = useState<string>(task.dueDate || new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>(task.dueTime || '14:00');
  const [priority, setPriority] = useState<string>(task.priority || 'Medium');
  const [reminderMinutes, setReminderMinutes] = useState<number>(task.reminderMinutes || 15);
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newDate) {
      setErrorMsg('Please select a new date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: RescheduleTaskRequest = {
        newDate,
        newTime,
        priority,
        reminderMinutes,
        notes,
      };

      const res = await api.post(`/api/tasks/${task.id}/reschedule`, payload);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reschedule task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-theme-text">Reschedule Task</h3>
              <p className="text-[10px] text-theme-text-muted">Task #{task.id} - {task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-bold text-rose-500 flex items-center gap-2">
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">New Date *</label>
              <div className="flex items-center gap-2 bg-theme-bg-alt border border-theme-border rounded-2xl px-3 py-2 text-xs font-bold text-theme-text">
                <Calendar size={14} className="text-theme-primary" />
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-theme-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">New Time</label>
              <div className="flex items-center gap-2 bg-theme-bg-alt border border-theme-border rounded-2xl px-3 py-2 text-xs font-bold text-theme-text">
                <Clock size={14} className="text-indigo-400" />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-transparent outline-none text-theme-text"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs font-bold outline-none text-theme-text"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Reminder Alert</label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs font-bold outline-none text-theme-text"
              >
                <option value={15}>15 Minutes Before</option>
                <option value={30}>30 Minutes Before</option>
                <option value={60}>1 Hour Before</option>
                <option value={120}>2 Hours Before</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Reschedule Reason & Notes</label>
            <textarea
              rows={3}
              placeholder="State reason for date change or special follow-up instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt p-3 text-xs text-theme-text outline-none focus:border-theme-primary"
            />
          </div>

          <div className="p-3 rounded-2xl bg-theme-primary/5 border border-theme-primary/20 text-[10px] font-bold text-theme-text-muted flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Automatically syncs with Google Calendar module & notifies assigned team manager.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-xs font-semibold text-theme-text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-5 py-2 text-xs font-bold text-white shadow-lg transition-all"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
