import { useState } from 'react';
import type { CalendarEvent } from '../types';
import { 
  X, 
  Settings, 
  Trash2, 
  Plus, 
  Sliders, 
  Palette, 
  Search,
  CheckCircle
} from 'lucide-react';
import { calendarService } from '../services/calendarService';

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  isSystem?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onEventsUpdated: () => void;
  categories: CalendarCategory[];
  onCategoriesUpdated: (categories: CalendarCategory[]) => void;
  defaultView: string;
  onDefaultViewChange: (view: any) => void;
  defaultReminder: number;
  onDefaultReminderChange: (minutes: number) => void;
}

export default function CalendarSettingsModal({
  isOpen,
  onClose,
  events,
  onEventsUpdated,
  categories,
  onCategoriesUpdated,
  defaultView,
  onDefaultViewChange,
  defaultReminder,
  onDefaultReminderChange
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'calendars' | 'events'>('general');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [eventSearch, setEventSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!isOpen) return null;

  // Add new Custom Sub-Calendar Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: CalendarCategory = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      color: newCatColor,
      enabled: true,
      isSystem: false,
    };
    onCategoriesUpdated([...categories, newCat]);
    setNewCatName('');
  };

  // Toggle or Delete Sub-Calendar
  const handleToggleCategory = (catId: string) => {
    onCategoriesUpdated(
      categories.map((c) => (c.id === catId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find((c) => c.id === catId);
    if (target?.isSystem) {
      alert('System calendars cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete calendar category "${target?.name}"?`)) {
      onCategoriesUpdated(categories.filter((c) => c.id !== catId));
    }
  };

  // Bulk Delete Event
  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event from calendar?')) return;
    setDeletingId(eventId);
    try {
      await calendarService.deleteEvent(eventId);
      onEventsUpdated();
    } catch (err) {
      alert('Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  // Clear Completed Events
  const handleClearCompletedEvents = async () => {
    const completed = events.filter((e) => e.status === 'COMPLETED' || e.status === 'Completed');
    if (completed.length === 0) {
      alert('No completed events to clear.');
      return;
    }
    if (!window.confirm(`Clear all ${completed.length} completed events from calendar history?`)) return;

    try {
      for (const ev of completed) {
        await calendarService.deleteEvent(ev.id);
      }
      onEventsUpdated();
      alert('Completed events cleared successfully.');
    } catch (err) {
      alert('Failed to clear completed events.');
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(eventSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-5 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-500/20">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-theme-text">Scheduler Settings & Preferences</h3>
              <p className="text-xs text-theme-text-muted">Manage default views, schedulers, categories, and bulk event cleanup.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-theme-border/40 pb-2">
          {[
            { key: 'general', label: 'General Preferences', icon: Sliders },
            { key: 'calendars', label: 'My Calendars & Categories', icon: Palette },
            { key: 'events', label: 'Bulk Event Cleanup', icon: Trash2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: General Preferences */}
        {activeTab === 'general' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-theme-border/60 bg-theme-bg-alt/30 space-y-2">
                <label className="font-extrabold text-theme-text uppercase tracking-wider text-[10px] block">Default Calendar View</label>
                <select
                  value={defaultView}
                  onChange={(e) => onDefaultViewChange(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-card p-2.5 font-bold text-theme-text outline-none focus:border-blue-500"
                >
                  <option value="month">Month View (Default)</option>
                  <option value="week">Week View</option>
                  <option value="day">Day View</option>
                  <option value="year">Year View</option>
                  <option value="schedule">Schedule / Agenda View</option>
                </select>
                <p className="text-[10px] text-theme-text-muted">The initial view mode opened when entering the Calendar page.</p>
              </div>

              <div className="p-4 rounded-2xl border border-theme-border/60 bg-theme-bg-alt/30 space-y-2">
                <label className="font-extrabold text-theme-text uppercase tracking-wider text-[10px] block">Default Event Reminder Alert</label>
                <select
                  value={defaultReminder}
                  onChange={(e) => onDefaultReminderChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-theme-border bg-theme-card p-2.5 font-bold text-theme-text outline-none focus:border-blue-500"
                >
                  <option value={15}>15 Minutes Before</option>
                  <option value={30}>30 Minutes Before</option>
                  <option value={60}>1 Hour Before</option>
                  <option value={120}>2 Hours Before</option>
                </select>
                <p className="text-[10px] text-theme-text-muted">Automatic background notification alert time for upcoming events.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Calendar automatically syncs with Spring Boot WebSocket notifications & background scanner.</span>
            </div>
          </div>
        )}

        {/* Tab 2: Manage My Calendars & Categories */}
        {activeTab === 'calendars' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-extrabold text-theme-text uppercase tracking-wider text-[10px] block">Active Sub-Calendars & Custom Categories</span>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl border border-theme-border bg-theme-bg-alt/40">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-theme-text">{cat.name}</span>
                      {cat.isSystem && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Primary</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`px-3 py-1 rounded-xl font-bold text-[10px] ${
                          cat.enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {cat.enabled ? 'Visible' : 'Hidden'}
                      </button>
                      {!cat.isSystem && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Category Form */}
            <form onSubmit={handleAddCategory} className="p-4 rounded-2xl border border-theme-border bg-theme-bg-alt/30 space-y-3">
              <span className="font-extrabold text-theme-text uppercase tracking-wider text-[10px] block">Add Custom Calendar / Category</span>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="e.g. VIP Client Demos, Team Sync, Project Deadlines"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 font-bold text-theme-text outline-none focus:border-blue-500"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="h-9 w-12 rounded-xl cursor-pointer bg-transparent border border-theme-border"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Bulk Event Cleanup */}
        {activeTab === 'events' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search events to delete or manage..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full rounded-2xl bg-theme-bg-alt pl-9 pr-3 py-2 text-xs font-semibold text-theme-text outline-none border border-theme-border focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleClearCompletedEvents}
                className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold border border-rose-500/20 flex items-center gap-1.5 shrink-0"
              >
                <Trash2 size={14} /> Clear Completed Events
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-2xl border border-theme-border bg-theme-bg-alt/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-theme-text">{ev.title}</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-theme-card border text-theme-text-muted">
                        {ev.eventType}
                      </span>
                    </div>
                    <p className="text-[10px] text-theme-text-muted mt-0.5">
                      {new Date(ev.startTime).toLocaleString()} {ev.assignedUserName ? `• ${ev.assignedUserName}` : ''}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    disabled={deletingId === ev.id}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className="p-8 text-center text-theme-text-muted italic">No calendar events found matching your search.</div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-theme-border/40">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
