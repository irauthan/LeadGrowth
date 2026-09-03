import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck,
  Loader2,
  Calendar,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  BarChart3,
  Users
} from 'lucide-react';
import { downloadReport } from '../services/reportService';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import TimeFilterDropdown, { type TimeFilterState } from '../components/TimeFilterDropdown';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

interface DailyBreakdownItem {
  date: string;
  dayOfWeek: string;
  callsCount: number;
  meetingsCount: number;
  emailsCount: number;
  whatsappCount: number;
  totalActivitiesCount: number;
  followupsCompletedCount: number;
}

interface TeamMember {
  id: number;
  fullName?: string;
  name?: string;
  email: string;
  roles?: any[];
}

export default function Reports() {
  const user = useAuthStore((state) => state.user);
  const isManagerOrAdmin = user?.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_MANAGER');

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'exports' | 'activity-table'>('exports');
  
  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilterState>({ period: 'monthly' });

  // User Filter State (Admin / Manager)
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0); // 0 = All Team Members

  // Auto-Generated Daily Activity State
  const [dailyData, setDailyData] = useState<DailyBreakdownItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [statsSummary, setStatsSummary] = useState({
    totalLeads: 0,
    totalCalls: 0,
    completedFollowups: 0,
    convertedLeads: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (isManagerOrAdmin) {
      fetchMembers();
    }
  }, [isManagerOrAdmin]);

  useEffect(() => {
    fetchAutoDailyActivity();
  }, [timeFilter, selectedUserId]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/members');
      const list = (res.data || []).map((m: any) => ({
        id: m.id,
        fullName: m.fullName || m.name || m.email,
        email: m.email,
        roles: m.roles
      }));
      setMembers(list);
    } catch (err) {
      console.error('Failed to load team members for report filter', err);
    }
  };

  const mapTimeFilterToTimeframe = (period: string) => {
    switch (period) {
      case 'today': return 'TODAY';
      case 'yesterday': return 'YESTERDAY';
      case 'this_week': return 'THIS_WEEK';
      case 'last_week': return 'LAST_WEEK';
      case 'monthly': return 'THIS_MONTH';
      case 'last_month': return 'LAST_MONTH';
      case 'custom': return 'CUSTOM';
      default: return 'THIS_MONTH';
    }
  };

  const fetchAutoDailyActivity = async () => {
    setLoadingData(true);
    try {
      const timeframe = mapTimeFilterToTimeframe(timeFilter.period);
      const params: any = { timeframe };
      if (selectedUserId > 0) {
        params.userId = selectedUserId;
      }
      if (timeFilter.period === 'custom') {
        if (timeFilter.startDate) params.startDate = timeFilter.startDate;
        if (timeFilter.endDate) params.endDate = timeFilter.endDate;
      }
      
      const res = await api.get('/api/admin/executive-work', { params });
      const summary = res.data;
      if (summary) {
        setDailyData(summary.dailyBreakdown || []);
        setStatsSummary({
          totalLeads: summary.totalAssignedLeads || 0,
          totalCalls: summary.totalCallsMade || 0,
          completedFollowups: summary.completedFollowupsCount || 0,
          convertedLeads: summary.totalConvertedLeads || 0,
          conversionRate: summary.conversionRate ? Math.round(summary.conversionRate * 100) : 0
        });
      }
    } catch (err) {
      console.error('Failed to load auto daily activity', err);
      setDailyData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Standard Lead & Campaign Exports (Passes selectedUserId for scoping)
  const handleDownloadReport = async (format: 'csv' | 'excel' | 'pdf', type: 'campaigns' | 'leads') => {
    const key = `${type}-${format}`;
    try {
      setLoadingKey(key);
      await downloadReport(
        type, 
        format, 
        timeFilter.period, 
        timeFilter.startDate, 
        timeFilter.endDate, 
        selectedUserId > 0 ? selectedUserId : undefined
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to download ${type} ${format.toUpperCase()} report.`);
    } finally {
      setLoadingKey(null);
    }
  };

  // Admin-Only: Call Duration Tracking & Productivity DB Export (Passes selectedUserId for scoping)
  const handleDownloadCallReports = async () => {
    try {
      setLoadingKey('call-audit');
      const params: any = {};
      if (selectedUserId > 0) params.userId = selectedUserId;
      if (timeFilter.period) params.period = timeFilter.period;
      if (timeFilter.startDate) params.startDate = timeFilter.startDate;
      if (timeFilter.endDate) params.endDate = timeFilter.endDate;

      const res = await api.get('/api/calls/reports', { params });
      const calls = res.data || [];
      if (calls.length === 0) {
        alert('No call duration records found for the selected filter.');
        return;
      }
      const headers = ['Session ID', 'Lead ID', 'Lead Name', 'Lead Phone', 'Sales Exec', 'Start Time', 'End Time', 'Duration Seconds', 'Formatted Duration', 'Status', 'Notes'];
      const rows = calls.map((c: any) => [
        c.id,
        c.leadId,
        `"${c.leadName || ''}"`,
        `"${c.leadPhone || ''}"`,
        `"${c.userName || ''}"`,
        c.startTime,
        c.endTime || '',
        c.durationSeconds || 0,
        `"${c.formattedDuration || ''}"`,
        c.status,
        `"${(c.notes || '').replace(/"/g, '""')}"`
      ]);

      const selectedName = selectedUserId > 0 ? members.find(m => m.id === selectedUserId)?.fullName?.replace(/\s+/g, '_') : 'workspace';
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `call_duration_${selectedName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to download call report');
    } finally {
      setLoadingKey(null);
    }
  };

  // System Auto-Generated Daily Activity Report Export
  const handleDownloadAutoDailyReport = () => {
    try {
      setLoadingKey('auto-daily');
      if (dailyData.length === 0) {
        alert('No activity records available for this period.');
        return;
      }

      const headers = ['Date', 'Day of Week', 'Total Activities', 'Calls Done', 'Meetings Held', 'Emails Sent', 'WhatsApp Sent', 'Follow-ups Completed', 'Status'];
      const rows = dailyData.map(d => [
        `"${d.date}"`,
        `"${d.dayOfWeek}"`,
        d.totalActivitiesCount || 0,
        d.callsCount || 0,
        d.meetingsCount || 0,
        d.emailsCount || 0,
        d.whatsappCount || 0,
        d.followupsCompletedCount || 0,
        `"System Auto-Logged"`
      ]);

      const selectedName = selectedUserId > 0 ? members.find(m => m.id === selectedUserId)?.fullName?.replace(/\s+/g, '_') : 'workspace';
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `daily_activity_${selectedName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to export daily report');
    } finally {
      setLoadingKey(null);
    }
  };

  const selectedMemberName = selectedUserId > 0 
    ? (members.find(m => m.id === selectedUserId)?.fullName || 'Selected User') 
    : 'All Team Members';

  return (
    <div className="space-y-6">
      
      {/* Header Banner with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
              <BarChart3 size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-theme-text">
              {isManagerOrAdmin ? 'Workspace Reports & Intelligence Console' : 'My Lead Reports & Exports'}
            </h1>
          </div>
          <p className="text-xs text-theme-text-muted">
            {isManagerOrAdmin 
              ? 'Complete enterprise reporting console with person-level filters, call duration logs, and instant multi-format downloads.'
              : 'Downloadable database reports and activity records for your assigned lead portfolio.'}
          </p>
        </div>

        {/* Filter Controls Bar (Integrated in Header) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin User Filter Dropdown */}
          {isManagerOrAdmin && (
            <div className="relative flex items-center">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-theme-bg-alt border border-theme-border text-xs font-bold text-theme-text shadow-xs">
                <Users size={14} className="text-theme-primary" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="bg-transparent text-theme-text text-xs font-bold outline-none cursor-pointer pr-2"
                >
                  <option value={0} className="bg-theme-card text-theme-text">👥 All Team Members (Workspace)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-theme-card text-theme-text">
                      👤 {m.fullName || m.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Time Filter Dropdown */}
          <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
        </div>
      </div>

      {/* Quick Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">
            {isManagerOrAdmin ? (selectedUserId > 0 ? `${selectedMemberName}'s Leads` : 'Workspace Leads') : 'My Portfolio Leads'}
          </span>
          <div className="text-xl font-black text-theme-text">{statsSummary.totalLeads}</div>
        </div>
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Calls Logged</span>
          <div className="text-xl font-black text-blue-400">{statsSummary.totalCalls}</div>
        </div>
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Follow-ups Handled</span>
          <div className="text-xl font-black text-purple-400">{statsSummary.completedFollowups}</div>
        </div>
        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Converted Leads</span>
          <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
            {statsSummary.convertedLeads}
            <span className="text-[10px] font-semibold text-emerald-500/80">({statsSummary.conversionRate}%)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-theme-border/40 pb-2">
        <button
          onClick={() => setActiveTab('exports')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'exports'
              ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
              : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
          }`}
        >
          <Download size={14} />
          <span>Database Export Downloads</span>
        </button>

        <button
          onClick={() => setActiveTab('activity-table')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'activity-table'
              ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
              : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
          }`}
        >
          <Clock size={14} />
          <span>Auto Activity Stream Preview</span>
        </button>
      </div>

      {/* TAB 1: DATABASE EXPORT DOWNLOADS (PRIMARY VIEW) */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Card 1: Leads Tracking Database (Visible to BOTH User and Admin, scoped to selected user if chosen) */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-5">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-theme-text">
                {isManagerOrAdmin 
                  ? (selectedUserId > 0 ? `${selectedMemberName}'s Leads Database` : 'Workspace Leads Tracking Database') 
                  : 'My Assigned Leads Portfolio'}
              </h3>
              <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                {isManagerOrAdmin
                  ? `Downloads customer leads database ${selectedUserId > 0 ? `specifically assigned to ${selectedMemberName}` : 'across all workspace team members'} with intake dates, source platforms, stages, and quality scores.`
                  : 'Downloads your active and completed assigned leads list with phone numbers, emails, quality scores, notes, and pipeline statuses.'}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                onClick={() => handleDownloadReport('csv', 'leads')}
                disabled={loadingKey === 'leads-csv'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingKey === 'leads-csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>CSV Spreadsheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('excel', 'leads')}
                disabled={loadingKey === 'leads-excel'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingKey === 'leads-excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span>Excel Sheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('pdf', 'leads')}
                disabled={loadingKey === 'leads-pdf'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingKey === 'leads-pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          {/* Card 2: Auto Daily Activity Export (Visible to BOTH User and Admin) */}
          <div className="glass-card rounded-3xl border border-indigo-500/30 bg-theme-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-5">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-black text-theme-text">
                {isManagerOrAdmin 
                  ? (selectedUserId > 0 ? `${selectedMemberName}'s Daily Work Summary` : 'Workspace Daily Executive Summary') 
                  : 'Auto Daily Activity Report'}
              </h3>
              <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                {isManagerOrAdmin
                  ? `Downloads system-compiled daily performance logs ${selectedUserId > 0 ? `for ${selectedMemberName}` : 'for all team members'} across the selected timeframe.`
                  : 'Downloads your automated daily work log with call counts, demo meetings, and completed follow-up metrics.'}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                onClick={handleDownloadAutoDailyReport}
                disabled={loadingKey === 'auto-daily' || dailyData.length === 0}
                className="flex items-center gap-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingKey === 'auto-daily' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Export Daily Log (CSV)</span>
              </button>
            </div>
          </div>

          {/* Card 3: Campaign Performance Database (ADMIN / MANAGER ONLY) */}
          {isManagerOrAdmin && (
            <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary mb-5">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-lg font-black text-theme-text">Campaign Performance Database</h3>
                <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                  Downloads multi-platform marketing campaign intelligence containing click-through rates, advertising spend, intake lead volume, and conversion ROI.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleDownloadReport('csv', 'campaigns')}
                  disabled={loadingKey === 'campaigns-csv'}
                  className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingKey === 'campaigns-csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>CSV Spreadsheet</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('excel', 'campaigns')}
                  disabled={loadingKey === 'campaigns-excel'}
                  className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingKey === 'campaigns-excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  <span>Excel Sheet</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('pdf', 'campaigns')}
                  disabled={loadingKey === 'campaigns-pdf'}
                  className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingKey === 'campaigns-pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  <span>PDF Document</span>
                </button>
              </div>
            </div>
          )}

          {/* Card 4: Call Duration Tracking & User Productivity Database (ADMIN / MANAGER ONLY) */}
          {isManagerOrAdmin && (
            <div className="glass-card rounded-3xl border border-rose-500/30 bg-theme-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-5">
                  <PhoneCall size={24} />
                </div>
                <h3 className="text-lg font-black text-theme-text">
                  Call Duration Tracking & User Productivity Database
                </h3>
                <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                  {selectedUserId > 0 
                    ? `Downloads call audit logs specifically for ${selectedMemberName} containing Start & End timestamps, duration seconds, and discussion notes.`
                    : 'Downloads complete workspace call audit logs containing Start & End timestamps, duration seconds, sales executive effort, and logged discussion notes.'}
                </p>
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button
                  onClick={handleDownloadCallReports}
                  disabled={loadingKey === 'call-audit'}
                  className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border border-rose-500 px-4 py-2.5 text-xs font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingKey === 'call-audit' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Export Call Duration Audit (CSV)</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: AUTO-GENERATED ACTIVITY STREAM PREVIEW TABLE */}
      {activeTab === 'activity-table' && (
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <span>System Auto-Compiled Work Activity Log</span>
              </h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                {isManagerOrAdmin && selectedUserId > 0
                  ? `Auto-compiled timeline for ${selectedMemberName}`
                  : 'Automatically compiled from logged calls, client meetings, messages, and completed follow-up workflows.'}
              </p>
            </div>

            <button
              onClick={handleDownloadAutoDailyReport}
              disabled={loadingKey === 'auto-daily' || dailyData.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border text-xs font-bold text-theme-text shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingKey === 'auto-daily' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Export Daily Log (CSV)</span>
            </button>
          </div>

          {loadingData ? (
            <HoosshBeeLoader 
              size="sm"
              showBrand={false}
              text="Compiling automated activity records..." 
              subtext="Aggregating phone calls, demos, and completed follow-up workflows" 
            />
          ) : (   
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Date & Day</th>
                    <th className="p-3.5">Total Activities</th>
                    <th className="p-3.5">Calls & Meetings</th>
                    <th className="p-3.5">Follow-ups Handled</th>
                    <th className="p-3.5">Log Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {dailyData.map((d, index) => (
                    <tr key={index} className="hover:bg-theme-bg-alt/30 transition-colors">
                      <td className="p-3.5 font-bold text-theme-text">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-theme-primary" />
                          <span>{d.date}</span>
                          <span className="text-[10px] font-semibold text-theme-text-muted px-2 py-0.5 rounded-md bg-theme-bg-alt border border-theme-border/60">
                            {d.dayOfWeek}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-black text-theme-text">
                        <span className="px-2.5 py-1 rounded-lg bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                          {d.totalActivitiesCount || 0} Actions
                        </span>
                      </td>
                      <td className="p-3.5 text-theme-text-muted font-medium">
                        <span className="text-blue-400 font-bold">{d.callsCount || 0}</span> Calls • <span className="text-purple-400 font-bold">{d.meetingsCount || 0}</span> Meetings
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-bold">{d.followupsCompletedCount || 0}</span> Completed
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Auto-Logged
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dailyData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-theme-text-muted">
                        <div className="space-y-1.5">
                          <Clock size={24} className="mx-auto text-theme-text-muted opacity-40" />
                          <p className="font-bold text-theme-text">No Activity Records for this Timeframe</p>
                          <p className="text-[11px]">As calls, meetings, and follow-ups are logged on leads, the system automatically records activity here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
