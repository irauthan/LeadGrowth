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
  Zap, 
  BarChart3, 
  Users,
  UserCheck,
  Search,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadReport, downloadSingleLeadPdf } from '../services/reportService';
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
  const selectedMemberName = members.find(m => m.id === selectedUserId)?.fullName || 'Team Member';


  // Auto-Generated Daily Activity State
  const [dailyData, setDailyData] = useState<DailyBreakdownItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Individual Specific Lead Report State
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadIdForReport, setSelectedLeadIdForReport] = useState<number | ''>('');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [isDownloadingLeadPdf, setIsDownloadingLeadPdf] = useState(false);

  useEffect(() => {
    if (isManagerOrAdmin) {
      fetchMembers();
    }
    fetchLeads();
  }, [isManagerOrAdmin]);

  useEffect(() => {
    fetchAutoDailyActivity();
  }, [timeFilter, selectedUserId]);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await api.get('/api/leads');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLeadsList(list);
      if (list.length > 0 && !selectedLeadIdForReport) {
        setSelectedLeadIdForReport(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load leads list for individual report generation', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleDownloadSingleLeadPdf = async (leadId?: number) => {
    const targetId = leadId || (typeof selectedLeadIdForReport === 'number' ? selectedLeadIdForReport : null);
    if (!targetId) {
      alert('Please select a valid lead to generate report.');
      return;
    }
    try {
      setIsDownloadingLeadPdf(true);
      await downloadSingleLeadPdf(targetId);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF report for the selected lead.');
    } finally {
      setIsDownloadingLeadPdf(false);
    }
  };

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

  const filteredLeads = leadsList.filter((l: any) => {
    if (!leadSearchQuery.trim()) return true;
    const q = leadSearchQuery.toLowerCase();
    return (
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone && String(l.phone).includes(q)) ||
      (l.company || '').toLowerCase().includes(q) ||
      String(l.id).includes(q)
    );
  });

  const selectedLead = leadsList.find((l: any) => l.id === Number(selectedLeadIdForReport));

  return (
    <div className="space-y-6">
      
      {/* Unified Header, Metrics & Tab Controls Container */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Header Row with Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                <BarChart3 size={20} />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-theme-text">
                {isManagerOrAdmin ? 'Workspace Reports & Intelligence Console' : 'My Lead Reports & Exports'}
              </h1>
            </div>
          </div>

          {/* Filter Controls Bar (Integrated in Header) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Admin User Filter Dropdown */}
            {isManagerOrAdmin && (
              <div className="relative flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-bg-alt border border-theme-border text-xs font-semibold text-theme-text shadow-xs">
                  <Users size={14} className="text-theme-primary" />
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="bg-transparent text-theme-text text-xs font-semibold outline-none cursor-pointer pr-1"
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


        {/* Navigation Tabs */}
        <div className="border-t border-theme-border/60 pt-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('exports')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'exports'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Download size={14} />
            <span>Database Export Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab('activity-table')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'activity-table'
                ? 'bg-theme-primary text-white shadow-xs'
                : 'bg-theme-bg-alt border border-theme-border text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Clock size={14} />
            <span>Auto Activity Stream Preview</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DATABASE EXPORT DOWNLOADS (PRIMARY VIEW) */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Card 0: Specific Lead Dossier / Individual Report (Visible to BOTH User and Admin) */}
          <div className="glass-card rounded-3xl border border-theme-primary/40 bg-theme-card p-6 shadow-sm flex flex-col justify-between col-span-1 lg:col-span-2">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary shadow-xs flex-shrink-0">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text flex items-center gap-2 flex-wrap">
                      <span>Specific Lead Dossier & Detailed Report</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                        Individual Lead Export
                      </span>
                    </h3>
                    <p className="text-xs text-theme-text-muted mt-0.5">
                      Generate and download a comprehensive, professional PDF dossier for any specific lead containing contact info, proposal details, sales steps, and call logs.
                    </p>
                  </div>
                </div>

                {/* Quick Search Input */}
                <div className="relative min-w-[240px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                  <input
                    type="text"
                    placeholder="Search lead by name, phone or email..."
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-theme-bg-alt border border-theme-border text-xs text-theme-text placeholder-theme-text-muted outline-none focus:border-theme-primary transition-all"
                  />
                </div>
              </div>

              {/* Lead Selector & Selected Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Selector Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-theme-text">Select Lead to Generate Report:</label>
                    <span className="text-[10px] text-theme-text-muted font-medium">
                      {loadingLeads ? 'Loading leads...' : `${filteredLeads.length} lead${filteredLeads.length === 1 ? '' : 's'} available`}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedLeadIdForReport}
                      onChange={(e) => setSelectedLeadIdForReport(e.target.value ? Number(e.target.value) : '')}
                      className="w-full p-3 rounded-xl bg-theme-bg-alt border border-theme-border text-xs font-semibold text-theme-text outline-none focus:border-theme-primary cursor-pointer transition-all"
                    >
                      <option value="">-- Choose a Lead to Export --</option>
                      {filteredLeads.map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.name} • {l.phone || l.email || 'No contact'} [{l.status || 'New'}]
                        </option>
                      ))}
                    </select>
                  </div>
                  {filteredLeads.length === 0 && (
                    <p className="text-[11px] text-amber-500 font-medium pt-1">
                      No leads match your search query. Try typing another name, phone or email.
                    </p>
                  )}
                </div>

                {/* Selected Lead Info Preview Box */}
                {selectedLead ? (
                  <div className="p-3.5 rounded-2xl bg-theme-bg-alt/70 border border-theme-border/80 flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-theme-text">{selectedLead.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            (selectedLead.status || '').toLowerCase().includes('convert') || (selectedLead.status || '').toLowerCase().includes('won')
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : (selectedLead.status || '').toLowerCase().includes('lost')
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {selectedLead.status || 'New'}
                          </span>
                        </div>
                        <div className="text-[11px] text-theme-text-muted mt-1 space-x-2">
                          {selectedLead.email && <span>📧 {selectedLead.email}</span>}
                          {selectedLead.phone && <span>📞 {selectedLead.phone}</span>}
                          {selectedLead.sourcePlatform && <span>🌐 {selectedLead.sourcePlatform}</span>}
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex-shrink-0">
                        {selectedLead.qualityTier || 'WARM'} ({selectedLead.qualityScore || 75} pts)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-theme-border/40 text-[10px]">
                      <span className="text-theme-text-muted">
                        Lead ID: <strong className="font-mono text-theme-text">#{selectedLead.id}</strong>
                      </span>
                      <Link
                        to={`/my-work?period=all`}
                        className="font-semibold text-theme-primary hover:underline flex items-center gap-1"
                      >
                        <span>Open in Pipelines</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-theme-bg-alt/40 border border-dashed border-theme-border flex items-center justify-center text-xs text-theme-text-muted text-center">
                    <span>Select a lead from the dropdown to preview details and generate report.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-4 border-t border-theme-border/60 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-theme-text-muted flex items-center gap-1.5">
                <Sparkles size={14} className="text-theme-primary" />
                Multi-page dossier export includes complete customer profile, sales activities, and call timeline.
              </span>
              <button
                type="button"
                onClick={() => handleDownloadSingleLeadPdf()}
                disabled={!selectedLeadIdForReport || isDownloadingLeadPdf}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2.5 shadow-md shadow-theme-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDownloadingLeadPdf ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Generating Dossier PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    <span>Generate & Download Lead Dossier (PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 1: Leads Tracking Database (Visible to BOTH User and Admin, scoped to selected user if chosen) */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-5">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-semibold text-theme-text">
                {isManagerOrAdmin 
                  ? (selectedUserId > 0 ? `${selectedMemberName}'s Leads Database` : 'Workspace Leads Tracking Database') 
                  : 'My Assigned Leads'}
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
              <h3 className="text-lg font-semibold text-theme-text">
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
                <h3 className="text-lg font-semibold text-theme-text">Campaign Performance Database</h3>
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
                <h3 className="text-lg font-semibold text-theme-text">
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
                  className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border border-rose-500 px-4 py-2.5 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
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
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-semibold uppercase text-[10px] tracking-wider">
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
                      <td className="p-3.5 font-bold text-theme-text">
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
                        <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 w-fit">
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
