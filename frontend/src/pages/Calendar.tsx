import { useState, useEffect } from 'react';
import { calendarService } from '../services/calendarService';
import type { CalendarEvent, CreateCalendarEventRequest, EventType } from '../types';
import { useAuthStore } from '../store/authStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User as UserIcon, 
  CheckCircle, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  X,
  Search,
  Settings,
  HelpCircle,
  Menu,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

import CalendarSettingsModal, { type CalendarCategory } from '../components/CalendarSettingsModal';
import SchedulePreviewSidePanel from '../components/SchedulePreviewSidePanel';

const formatLocalDateTime = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateKey = (d: Date | string): string => {
  if (!d) return '';
  if (typeof d === 'string') {
    const match = d.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar() {
  const user = useAuthStore((state) => state.user);

  // Calendar State
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [miniDate, setMiniDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Sub-Calendars & Categories State
  const [categories, setCategories] = useState<CalendarCategory[]>([
    { id: 'cat_meetings', name: user?.fullName || 'My Schedule', color: '#6366f1', enabled: true, isSystem: true },
    { id: 'cat_followups', name: 'Lead Follow-ups', color: '#f59e0b', enabled: true, isSystem: true },
    { id: 'cat_tasks', name: 'Tasks & Deadlines', color: '#10b981', enabled: true, isSystem: true },
    { id: 'cat_personal', name: 'Personal Reminders', color: '#a855f7', enabled: true, isSystem: true },
  ]);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [defaultReminder, setDefaultReminder] = useState(15);

  // Layout & Dropdown Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');

  // Filter Checkboxes (Same as Google Calendar "My Calendars")
  const [showCompleted, setShowCompleted] = useState(true);
  const [showWeekends, setShowWeekends] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form State
  const [createForm, setCreateForm] = useState<CreateCalendarEventRequest>({
    title: '',
    description: '',
    eventType: 'MEETING',
    startTime: formatLocalDateTime(new Date(Date.now() + 5 * 60000)),
    endTime: formatLocalDateTime(new Date(Date.now() + 65 * 60000)),
    allDay: false,
    leadName: '',
    priority: 'Medium',
    reminderMinutes: 15,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const openCreateModalWithDate = (targetDate?: Date) => {
    const now = new Date();
    let start: Date;

    if (targetDate) {
      start = new Date(targetDate);
      if (formatDateKey(targetDate) === formatDateKey(now)) {
        start = new Date(now.getTime() + 5 * 60000);
      } else if (start.getTime() < now.getTime()) {
        start = new Date(now.getTime() + 5 * 60000);
      } else {
        start.setHours(9, 0, 0, 0);
      }
    } else {
      start = new Date(now.getTime() + 5 * 60000);
    }

    const end = new Date(start.getTime() + 3600000);

    setCreateForm({
      title: '',
      description: '',
      eventType: 'MEETING',
      startTime: formatLocalDateTime(start),
      endTime: formatLocalDateTime(end),
      allDay: false,
      leadName: '',
      priority: 'Medium',
      reminderMinutes: 15,
      notes: ''
    });
    setShowCreateModal(true);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      let start: Date;
      let end: Date;

      if (view === 'year') {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
      } else if (view === 'month') {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month + 2, 0);
      } else if (view === 'week') {
        start = new Date(currentDate);
        start.setDate(currentDate.getDate() - 7);
        end = new Date(currentDate);
        end.setDate(currentDate.getDate() + 14);
      } else {
        start = new Date(currentDate);
        start.setDate(currentDate.getDate() - 2);
        end = new Date(currentDate);
        end.setDate(currentDate.getDate() + 3);
      }

      const data = await calendarService.getEvents(
        formatDateKey(start),
        formatDateKey(end)
      );
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.title.trim()) {
      alert('Please enter a title for the event.');
      return;
    }

    const startLocalStr = createForm.startTime || formatLocalDateTime(new Date());
    const startDate = new Date(startLocalStr);
    const now = new Date();

    if (startDate.getTime() < now.getTime() - 60000) {
      alert('⚠️ Event start time cannot be in the past. Please select a future date and time.');
      return;
    }

    setSubmitting(true);
    try {
      const endDate = createForm.endTime && new Date(createForm.endTime) > startDate
        ? new Date(createForm.endTime)
        : new Date(startDate.getTime() + 3600000);

      const payload: CreateCalendarEventRequest = {
        ...createForm,
        title: createForm.title.trim(),
        startTime: startLocalStr,
        endTime: formatLocalDateTime(endDate)
      };
      await calendarService.createEvent(payload);
      setShowCreateModal(false);
      const resetNow = new Date(Date.now() + 5 * 60000);
      setCreateForm({
        title: '',
        description: '',
        eventType: 'MEETING',
        startTime: formatLocalDateTime(resetNow),
        endTime: formatLocalDateTime(new Date(resetNow.getTime() + 3600000)),
        allDay: false,
        leadName: '',
        priority: 'Medium',
        reminderMinutes: 15,
        notes: ''
      });
      fetchEvents();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create calendar event.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteEvent = async (eventId: number) => {
    try {
      await calendarService.completeEvent(eventId);
      setEvents(events.map((e) => (e.id === eventId ? { ...e, status: 'COMPLETED' } : e)));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent({ ...selectedEvent, status: 'COMPLETED' });
      }
    } catch (err) {
      alert('Failed to complete event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await calendarService.deleteEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
      setSelectedEvent(null);
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const navigateDate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') {
      const now = new Date();
      setCurrentDate(now);
      setMiniDate(now);
      return;
    }
    const step = dir === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);
    if (view === 'year') {
      newDate.setFullYear(currentDate.getFullYear() + step);
    } else if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + step);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + step * 7);
    } else {
      newDate.setDate(currentDate.getDate() + step);
    }
    setCurrentDate(newDate);
    setMiniDate(newDate);
  };

  // Color Mapping Helper
  const getEventStyle = (type: EventType | string) => {
    switch (type?.toUpperCase()) {
      case 'FOLLOW_UP':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', bar: 'bg-amber-500' };
      case 'MEETING':
        return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500', bar: 'bg-indigo-500' };
      case 'PERSONAL_REMINDER':
        return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', bar: 'bg-purple-500' };
      case 'TASK':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', bar: 'bg-emerald-500' };
      case 'CALL_REMINDER':
        return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', bar: 'bg-rose-500' };
      case 'DEADLINE':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', bar: 'bg-red-500' };
      case 'LEAD_REMINDER':
        return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500', bar: 'bg-cyan-500' };
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', bar: 'bg-blue-500' };
    }
  };

  // Filter events based on checkbox state & dynamic sub-calendars
  const filteredEvents = events.filter((e) => {
    if (!showCompleted && (e.status === 'COMPLETED' || e.status === 'Completed')) return false;
    const type = e.eventType?.toUpperCase();
    if (type === 'FOLLOW_UP') {
      const cat = categories.find((c) => c.id === 'cat_followups');
      if (cat && !cat.enabled) return false;
    }
    if (type === 'MEETING') {
      const cat = categories.find((c) => c.id === 'cat_meetings');
      if (cat && !cat.enabled) return false;
    }
    if (type === 'TASK') {
      const cat = categories.find((c) => c.id === 'cat_tasks');
      if (cat && !cat.enabled) return false;
    }
    if (type === 'PERSONAL_REMINDER') {
      const cat = categories.find((c) => c.id === 'cat_personal');
      if (cat && !cat.enabled) return false;
    }
    return true;
  });

  // Mini Month Grid Calculation
  const getMiniMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  // Main Month Grid Calculation
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  // Week Days Calculation
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push(d);
    }
    return days;
  };

  const getHeaderTitle = () => {
    if (view === 'year') {
      return `${currentDate.getFullYear()}`;
    }
    if (view === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (view === 'week') {
      const weekDays = getWeekDays();
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleString('default', { month: 'short' })} ${first.getFullYear()}`;
      }
      return `${first.toLocaleString('default', { month: 'short' })} – ${last.toLocaleString('default', { month: 'short' })} ${last.getFullYear()}`;
    }
    return currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const todayStr = formatDateKey(new Date());

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-theme-bg text-theme-text rounded-3xl border border-theme-border shadow-2xl overflow-hidden">
      
      {/* --- TOP GOOGLE CALENDAR HEADER --- */}
      <header className="flex h-16 items-center justify-between border-b border-theme-border/60 bg-theme-card px-4 shrink-0 z-30">
        
        {/* Left Section: Menu, Branding, Today, Nav, Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors"
            title="Toggle main menu"
          >
            <Menu size={20} />
          </button>

          {/* Google Calendar Logo Icon */}
          <div className="flex items-center gap-2.5 mr-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
              <span>{new Date().getDate()}</span>
            </div>
            <span className="text-xl font-bold text-theme-text tracking-tight hidden sm:inline">Calendar</span>
          </div>

          {/* Today Button */}
          <button
            onClick={() => navigateDate('today')}
            className="rounded-full border border-theme-border px-5 py-2 text-xs font-bold text-theme-text hover:bg-theme-bg-alt shadow-2xs transition-all"
          >
            Today
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate('prev')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors"
              title="Previous period"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors"
              title="Next period"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dynamic Header Date Range */}
          <h2 className="text-lg sm:text-xl font-bold text-theme-text ml-2 tracking-tight">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Right Section: Search, Settings, View Dropdown, Upgrade */}
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors">
            <Search size={18} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors hidden sm:flex">
            <HelpCircle size={18} />
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-theme-text-muted hover:bg-theme-bg-alt transition-colors"
            title="Calendar Settings"
          >
            <Settings size={18} />
          </button>

          {/* GOOGLE CALENDAR VIEW SWITCHER DROPDOWN */}
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-xs font-bold text-theme-text hover:bg-theme-card transition-all"
            >
              <span className="capitalize">{view}</span>
              <ChevronDown size={14} className="text-theme-text-muted" />
            </button>

            {isViewDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-theme-border bg-theme-card p-2 shadow-2xl z-50 space-y-1">
                {[
                  { key: 'day', label: 'Day', shortcut: 'D' },
                  { key: 'week', label: 'Week', shortcut: 'W' },
                  { key: 'month', label: 'Month', shortcut: 'M' },
                  { key: 'year', label: 'Year', shortcut: 'Y' },
                  { key: 'schedule', label: 'Schedule', shortcut: 'A' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setView(item.key as ViewMode);
                      setIsViewDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      view === item.key
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'text-theme-text hover:bg-theme-bg-alt'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-theme-text-muted font-mono">{item.shortcut}</span>
                  </button>
                ))}

                <div className="my-1.5 border-t border-theme-border/50" />

                <label className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-theme-text cursor-pointer hover:bg-theme-bg-alt">
                  <input
                    type="checkbox"
                    checked={showWeekends}
                    onChange={(e) => setShowWeekends(e.target.checked)}
                    className="h-4 w-4 rounded border-theme-border text-blue-600"
                  />
                  <span>Show weekends</span>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-theme-text cursor-pointer hover:bg-theme-bg-alt">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="h-4 w-4 rounded border-theme-border text-blue-600"
                  />
                  <span>Show completed tasks</span>
                </label>
              </div>
            )}
          </div>

          <button
            onClick={() => openCreateModalWithDate()}
            className="hidden lg:flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all ml-2"
          >
            <Plus size={16} /> Create
          </button>
        </div>
      </header>

      {/* --- MAIN CALENDAR WORKSPACE (SIDEBAR + GRID) --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- LEFT GOOGLE CALENDAR SIDEBAR --- */}
        {isSidebarOpen && (
          <aside className="w-64 border-r border-theme-border/60 bg-theme-card p-4 space-y-6 shrink-0 overflow-y-auto hidden md:block">
            
            {/* Floating Create Button */}
            <div className="relative">
              <button
                onClick={() => openCreateModalWithDate()}
                className="flex items-center gap-3 rounded-full border border-theme-border bg-theme-card px-6 py-3 text-sm font-bold text-theme-text shadow-lg hover:bg-theme-bg-alt transition-all w-max"
              >
                <Plus size={22} className="text-blue-600" />
                <span>Create</span>
                <ChevronDown size={14} className="text-theme-text-muted ml-1" />
              </button>
            </div>

            {/* Mini Month Calendar Widget */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-theme-text">
                  {miniDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const d = new Date(miniDate);
                      d.setMonth(d.getMonth() - 1);
                      setMiniDate(d);
                    }}
                    className="p-1 rounded-full text-theme-text-muted hover:bg-theme-bg-alt"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(miniDate);
                      d.setMonth(d.getMonth() + 1);
                      setMiniDate(d);
                    }}
                    className="p-1 rounded-full text-theme-text-muted hover:bg-theme-bg-alt"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Mini Month Grid */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-theme-text-muted">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
                {getMiniMonthDays(miniDate).map((dayObj, idx) => {
                  const dayStr = formatDateKey(dayObj.date);
                  const isSelected = formatDateKey(currentDate) === dayStr;
                  const isToday = todayStr === dayStr;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentDate(dayObj.date);
                      }}
                      className={`h-7 w-7 rounded-full mx-auto flex items-center justify-center font-semibold transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : isSelected
                          ? 'bg-blue-500/20 text-blue-600 font-bold'
                          : dayObj.isCurrentMonth
                          ? 'text-theme-text hover:bg-theme-bg-alt'
                          : 'text-theme-text-muted opacity-40'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* People Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Search for people"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                className="w-full rounded-2xl bg-theme-bg-alt pl-9 pr-3 py-2 text-xs font-semibold text-theme-text outline-none border border-transparent focus:border-blue-500"
              />
            </div>

            {/* My Calendars Filters (Exact Google Calendar Checkboxes & Dynamic Categories) */}
            <div className="space-y-3 pt-2 border-t border-theme-border/50">
              <div className="flex items-center justify-between text-xs font-extrabold text-theme-text">
                <span>My calendars</span>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1 rounded-lg hover:bg-theme-bg-alt text-theme-text-muted transition-colors"
                  title="Manage Calendars & Settings"
                >
                  <Settings size={14} />
                </button>
              </div>

              <div className="space-y-2 text-xs font-semibold">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-theme-bg-alt/50 p-1.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={() => {
                        setCategories(
                          categories.map((c) => (c.id === cat.id ? { ...c, enabled: !c.enabled } : c))
                        );
                      }}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: cat.color }}
                    />
                    <span className="flex-1 text-theme-text truncate">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Calendars Section */}
            <div className="space-y-2 pt-2 border-t border-theme-border/50">
              <div className="flex items-center justify-between text-xs font-extrabold text-theme-text">
                <span>Other calendars</span>
                <Plus size={14} className="text-theme-text-muted cursor-pointer" />
              </div>
            </div>

          </aside>
        )}

        {/* --- MAIN CALENDAR VIEWS AREA --- */}
        <main className="flex-1 bg-theme-card overflow-auto relative">
          
          {loading ? (
            <div className="flex h-full items-center justify-center space-y-3 flex-col">
              <Loader2 size={36} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold text-theme-text-muted">Syncing Google Calendar View...</span>
            </div>
          ) : (
            <>
              {/* 1. MONTH VIEW */}
              {view === 'month' && (
                <div className="h-full flex flex-col min-w-[750px]">
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 border-b border-theme-border/60 py-2 text-center text-xs font-bold uppercase tracking-wider text-theme-text-muted shrink-0">
                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                  </div>

                  {/* Month Cells Grid */}
                  <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-theme-border/40">
                    {getMonthDays().map((dayObj, idx) => {
                      const dayStr = formatDateKey(dayObj.date);
                      const dayEvents = filteredEvents.filter((ev) => ev.startTime && formatDateKey(ev.startTime) === dayStr);
                      const isToday = todayStr === dayStr;

                      return (
                        <div
                          key={idx}
                          onClick={() => openCreateModalWithDate(dayObj.date)}
                          className={`bg-theme-card p-1.5 flex flex-col justify-between overflow-hidden transition-all cursor-pointer hover:bg-theme-bg-alt/30 ${
                            !dayObj.isCurrentMonth ? 'opacity-40 bg-theme-bg-alt/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between px-1">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isToday
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-theme-text'
                              }`}
                            >
                              {dayObj.date.getDate()}
                            </span>
                          </div>

                          {/* Event Pills inside Day Cell */}
                          <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[100px]">
                            {dayEvents.slice(0, 4).map((ev) => {
                              const style = getEventStyle(ev.eventType);
                              return (
                                <button
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(ev);
                                  }}
                                  className={`w-full text-left px-2 py-0.5 rounded-md text-[11px] font-bold truncate flex items-center gap-1.5 shadow-2xs transition-transform hover:scale-[1.02] ${style.bg} ${style.text}`}
                                >
                                  <span className={`h-2 w-2 rounded-full ${style.dot} shrink-0`} />
                                  <span className="truncate">{ev.title}</span>
                                </button>
                              );
                            })}
                            {dayEvents.length > 4 && (
                              <span className="text-[10px] font-extrabold text-blue-600 block px-1">
                                {dayEvents.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. WEEK VIEW */}
              {view === 'week' && (
                <div className="h-full flex flex-col min-w-[800px]">
                  {/* Week Days Header */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-theme-border/60 py-3 shrink-0 text-center">
                    <div className="text-[10px] font-bold text-theme-text-muted">GMT+05:30</div>
                    {getWeekDays().map((d, i) => {
                      const dStr = formatDateKey(d);
                      const isToday = todayStr === dStr;
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">
                            {d.toLocaleString('default', { weekday: 'short' })}
                          </span>
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-extrabold mt-0.5 ${
                              isToday ? 'bg-blue-600 text-white shadow-md' : 'text-theme-text'
                            }`}
                          >
                            {d.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hours & Events Slot Grid */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] divide-x divide-y divide-theme-border/40">
                      {hours.map((hour) => (
                        <div key={hour} className="contents">
                          <div className="py-3 px-2 text-[10px] font-bold text-theme-text-muted text-right pr-3 border-b border-theme-border/30">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </div>
                          {getWeekDays().map((day, dayIdx) => {
                            const dayStr = formatDateKey(day);
                            const hourEvents = filteredEvents.filter((ev) => {
                              if (!ev.startTime || formatDateKey(ev.startTime) !== dayStr) return false;
                              const evHour = new Date(ev.startTime).getHours();
                              return evHour === hour;
                            });

                            return (
                              <div key={dayIdx} className="min-h-[48px] p-1 border-b border-theme-border/30 relative hover:bg-theme-bg-alt/20">
                                {hourEvents.map((ev) => {
                                  const style = getEventStyle(ev.eventType);
                                  return (
                                    <button
                                      key={ev.id}
                                      onClick={() => setSelectedEvent(ev)}
                                      className={`w-full text-left p-1.5 rounded-lg text-xs font-bold shadow-xs truncate flex flex-col ${style.bg} ${style.text} border-l-4 ${style.border}`}
                                    >
                                      <span className="truncate font-extrabold">{ev.title}</span>
                                      <span className="text-[9px] opacity-80">{ev.startTime ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DAY VIEW */}
              {view === 'day' && (
                <div className="h-full flex flex-col max-w-4xl mx-auto p-4">
                  <div className="border-b border-theme-border/60 pb-3 flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold ${todayStr === formatDateKey(currentDate) ? 'bg-blue-600 text-white' : 'bg-theme-bg-alt text-theme-text'}`}>
                      {currentDate.getDate()}
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-theme-text">{currentDate.toLocaleString('default', { weekday: 'long' })}</h3>
                      <p className="text-xs text-theme-text-muted">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-theme-border/40 pt-2">
                    {hours.map((hour) => {
                      const dayStr = formatDateKey(currentDate);
                      const hourEvents = filteredEvents.filter((ev) => {
                        if (!ev.startTime || formatDateKey(ev.startTime) !== dayStr) return false;
                        return new Date(ev.startTime).getHours() === hour;
                      });

                      return (
                        <div key={hour} className="flex items-start gap-4 py-3 min-h-[50px]">
                          <span className="w-16 text-right text-xs font-bold text-theme-text-muted">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </span>
                          <div className="flex-1 space-y-1">
                            {hourEvents.map((ev) => {
                              const style = getEventStyle(ev.eventType);
                              return (
                                <button
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className={`w-full text-left p-3 rounded-2xl border ${style.bg} ${style.border} flex items-center justify-between shadow-xs`}
                                >
                                  <div>
                                    <h4 className={`text-sm font-extrabold ${style.text}`}>{ev.title}</h4>
                                    <p className="text-xs text-theme-text-muted mt-0.5">{ev.description || 'No description'}</p>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-theme-text-muted">
                                    {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. YEAR VIEW (12 Mini Month Grids) */}
              {view === 'year' && (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const monthDate = new Date(currentDate.getFullYear(), monthIdx, 1);
                    return (
                      <div key={monthIdx} className="rounded-2xl border border-theme-border bg-theme-bg-alt/20 p-4 space-y-2">
                        <h4 className="text-sm font-extrabold text-theme-text">
                          {monthDate.toLocaleString('default', { month: 'long' })}
                        </h4>
                        <div className="grid grid-cols-7 text-center text-[9px] font-bold text-theme-text-muted">
                          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                          {getMiniMonthDays(monthDate).map((dayObj, dIdx) => {
                            const dStr = formatDateKey(dayObj.date);
                            const hasEvents = events.some((ev) => ev.startTime && formatDateKey(ev.startTime) === dStr);
                            const isToday = todayStr === dStr;

                            return (
                              <button
                                key={dIdx}
                                onClick={() => {
                                  setCurrentDate(dayObj.date);
                                  setView('day');
                                }}
                                className={`h-6 w-6 rounded-full flex items-center justify-center font-semibold mx-auto ${
                                  isToday
                                    ? 'bg-blue-600 text-white font-bold'
                                    : hasEvents
                                    ? 'bg-blue-500/20 text-blue-600 font-bold'
                                    : dayObj.isCurrentMonth
                                    ? 'text-theme-text hover:bg-theme-card'
                                    : 'text-theme-text-muted opacity-30'
                                }`}
                              >
                                {dayObj.date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. SCHEDULE / AGENDA VIEW */}
              {view === 'schedule' && (
                <div className="p-6 max-w-4xl mx-auto space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                    <Tag size={16} /> Scheduled Workspace Agenda
                  </h3>

                  <div className="space-y-3">
                    {filteredEvents.map((ev) => {
                      const style = getEventStyle(ev.eventType);
                      const isDone = ev.status === 'COMPLETED';

                      return (
                        <div
                          key={ev.id}
                          className={`p-4 rounded-2xl border ${style.bg} ${style.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:scale-[1.01]`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 h-3 w-3 rounded-full ${style.dot} shrink-0`} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-sm font-bold ${style.text} ${isDone ? 'line-through opacity-60' : ''}`}>
                                  {ev.title}
                                </h4>
                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-theme-card/60 text-theme-text">
                                  {ev.eventType}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-theme-text-muted mt-1 flex-wrap font-mono">
                                <span><Clock size={12} className="inline mr-1" /> {ev.startTime ? new Date(ev.startTime).toLocaleString() : ''}</span>
                                {ev.assignedUserName && <span><UserIcon size={12} className="inline mr-1" /> {ev.assignedUserName}</span>}
                              </div>

                              {ev.description && <p className="text-xs text-theme-text-muted mt-2">{ev.description}</p>}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedEvent(ev)}
                            className="px-3.5 py-1.5 rounded-xl border border-theme-border bg-theme-card text-xs font-bold text-theme-text hover:bg-theme-bg-alt transition-all"
                          >
                            Details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* --- CREATE EVENT MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <h3 className="text-base font-extrabold text-theme-text">Create New Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-xl bg-theme-bg-alt text-theme-text-muted">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              
              {/* Form Section */}
              <div className="md:col-span-7 space-y-4">
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales Meeting / Lead Outreach"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-xs font-bold text-theme-text outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={createForm.eventType}
                      onChange={(e) => setCreateForm({ ...createForm, eventType: e.target.value as EventType })}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-3 text-xs font-bold text-theme-text outline-none focus:border-blue-500"
                    >
                      <option value="MEETING">Meeting</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="PERSONAL_REMINDER">Personal Reminder</option>
                      <option value="TASK">Task</option>
                      <option value="CALL_REMINDER">Call Reminder</option>
                    </select>
                  </div>

                  {createForm.startTime && new Date(createForm.startTime).getTime() < Date.now() - 60000 && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Event time is in the past. Meetings can only be scheduled for present or future times.</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      min={formatLocalDateTime(new Date()).slice(0, 10)}
                      value={createForm.startTime ? createForm.startTime.slice(0, 10) : formatLocalDateTime(new Date()).slice(0, 10)}
                      onChange={(e) => {
                        const dateVal = e.target.value;
                        if (!dateVal) return;
                        const timePart = createForm.startTime && createForm.startTime.includes('T') ? createForm.startTime.split('T')[1] : '10:00';
                        const newStart = `${dateVal}T${timePart}`;
                        const startDate = new Date(newStart);
                        const endDate = !isNaN(startDate.getTime()) ? formatLocalDateTime(new Date(startDate.getTime() + 3600000)) : '';
                        setCreateForm({ ...createForm, startTime: newStart, endTime: endDate });
                      }}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-3 text-xs text-theme-text font-bold outline-none focus:border-blue-500"
                    />
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-600/10 border border-blue-500/20 px-2.5 py-1 rounded-xl w-max">
                      <Clock size={12} />
                      <span>Selected Time: {createForm.startTime && createForm.startTime.includes('T') ? new Date(createForm.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Description & Agenda</label>
                    <textarea
                      rows={3}
                      placeholder="Meeting agenda or details..."
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt p-3 text-xs text-theme-text outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-xs font-semibold text-theme-text-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              </div>

              {/* Side Schedule Agenda Preview */}
              <div className="md:col-span-5 w-full">
                <SchedulePreviewSidePanel
                  selectedDate={createForm.startTime}
                  onSelectSlot={(slotTime) => {
                    const startDt = new Date(slotTime);
                    const endDt = new Date(startDt.getTime() + 3600000);
                    setCreateForm({
                      ...createForm,
                      startTime: slotTime,
                      endTime: formatLocalDateTime(endDt)
                    });
                  }}
                />
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- EVENT DETAIL MODAL --- */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {selectedEvent.eventType}
                </span>
                <h3 className="text-lg font-extrabold text-theme-text mt-1">{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-xl bg-theme-bg-alt text-theme-text-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-theme-text">Scheduled Time:</span>
                  <span className="font-mono text-blue-600 font-bold">{new Date(selectedEvent.startTime).toLocaleString()}</span>
                </div>
                {selectedEvent.assignedUserName && (
                  <div className="flex items-center justify-between text-theme-text-muted">
                    <span>Assigned Specialist:</span>
                    <span className="font-bold text-theme-text">{selectedEvent.assignedUserName}</span>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div className="p-3 rounded-2xl bg-theme-bg-alt/40 border border-theme-border/30 space-y-1">
                  <span className="font-bold text-theme-text">Description:</span>
                  <p className="text-theme-text-muted">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-theme-border/30">
              {selectedEvent.leadId && (
                <Link to="/leads" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                  Open Lead <ExternalLink size={12} />
                </Link>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                  title="Delete Event"
                >
                  <Trash2 size={14} />
                </button>
                {selectedEvent.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCompleteEvent(selectedEvent.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow transition-all"
                  >
                    <CheckCircle size={14} /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CALENDAR SETTINGS & CATEGORY MANAGEMENT MODAL --- */}
      <CalendarSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        events={events}
        onEventsUpdated={fetchEvents}
        categories={categories}
        onCategoriesUpdated={setCategories}
        defaultView={view}
        onDefaultViewChange={setView}
        defaultReminder={defaultReminder}
        onDefaultReminderChange={setDefaultReminder}
      />

    </div>
  );
}
