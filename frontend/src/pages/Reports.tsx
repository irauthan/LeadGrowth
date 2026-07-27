import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { downloadReport } from '../services/reportService';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Reports() {
  const user = useAuthStore((state) => state.user);
  const isManagerOrAdmin = user?.roles.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_MANAGER');

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my-reports' | 'review' | 'exports'>('my-reports');

  const [myReports, setMyReports] = useState<any[]>([]);
  const [workspaceReports, setWorkspaceReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Submit Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    completedLeads: 0,
    pendingLeads: 0,
    completedCalls: 8,
    followupsCount: 5,
    remarks: '',
    problemsFaced: '',
    nextDayPlan: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Review Modal State for Manager
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [managerComment, setManagerComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      if (activeTab === 'my-reports') {
        const res = await api.get('/api/reports/my-reports');
        setMyReports(res.data || []);
      } else if (activeTab === 'review' && isManagerOrAdmin) {
        const res = await api.get('/api/reports/workspace-reports');
        setWorkspaceReports(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDownloadReport = async (format: 'csv' | 'excel' | 'pdf', type: 'campaigns' | 'leads') => {
    const key = `${type}-${format}`;
    try {
      setLoadingKey(key);
      await downloadReport(type, format);
    } catch (err) {
      console.error(err);
      alert(`Failed to download ${type} ${format.toUpperCase()} report.`);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/reports/daily', submitForm);
      setSuccessMsg('Daily Report submitted successfully! Sent to manager for approval.');
      setShowSubmitModal(false);
      setSubmitForm({
        completedLeads: 0,
        pendingLeads: 0,
        completedCalls: 8,
        followupsCount: 5,
        remarks: '',
        problemsFaced: '',
        nextDayPlan: ''
      });
      fetchReports();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewReport = async (reportId: number, status: 'APPROVED' | 'REJECTED') => {
    setReviewing(true);
    try {
      await api.patch(`/api/reports/${reportId}/review`, {
        status,
        managerComment
      });
      alert(`Report ${status.toLowerCase()} successfully!`);
      setSelectedReport(null);
      setManagerComment('');
      fetchReports();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to review report.');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Connected Report System
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1">
            Daily Sales Reports & Export Console 📊
          </h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Submit daily activity reports to your manager, track review statuses, and download analytical database exports.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={16} /> Submit Daily Report
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-500 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-theme-border/40 pb-2">
        <button
          onClick={() => setActiveTab('my-reports')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'my-reports'
              ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
              : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
          }`}
        >
          My Daily Reports 📝
        </button>

        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
              activeTab === 'review'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
                : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
            }`}
          >
            Team Report Approvals 👑
          </button>
        )}

        <button
          onClick={() => setActiveTab('exports')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
            activeTab === 'exports'
              ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
              : 'bg-theme-card border border-theme-border text-theme-text-muted hover:bg-theme-bg-alt'
          }`}
        >
          Database Export Downloads 📁
        </button>
      </div>

      {/* TAB 1: MY DAILY REPORTS */}
      {activeTab === 'my-reports' && (
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">
            Submitted Daily Activity Log
          </h3>

          {loadingReports ? (
            <div className="flex h-48 items-center justify-center space-y-2 flex-col">
              <Loader2 size={24} className="animate-spin text-theme-primary" />
              <span className="text-xs text-theme-text-muted font-bold">Fetching submitted reports...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Completed / Pending Leads</th>
                    <th className="p-3">Calls & Follow-ups</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Manager Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {myReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-theme-bg-alt/30 transition-colors">
                      <td className="p-3 font-bold text-theme-text">
                        {rep.submittedAt ? new Date(rep.submittedAt).toLocaleString() : 'Today'}
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-bold">{rep.completedLeads || 0} Converted</span> • {rep.pendingLeads || 0} Active
                      </td>
                      <td className="p-3 text-theme-text-muted font-medium">
                        {rep.completedCalls || 8} Calls • {rep.followupsCount || 5} Follow-ups
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          rep.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          rep.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-3 text-theme-text-muted italic">
                        {rep.managerComment || 'No feedback yet'}
                      </td>
                    </tr>
                  ))}
                  {myReports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme-text-muted">
                        You have not submitted any daily activity reports yet. Click "Submit Daily Report" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM REPORT APPROVALS (MANAGER ONLY) */}
      {activeTab === 'review' && isManagerOrAdmin && (
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">
            Team Submitted Reports Pending Review
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Sales Executive</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Report Metrics</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {workspaceReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-theme-bg-alt/30 transition-colors">
                    <td className="p-3 font-extrabold text-theme-text">{rep.generatedByName}</td>
                    <td className="p-3 text-theme-text-muted">{rep.submittedAt ? new Date(rep.submittedAt).toLocaleString() : 'Today'}</td>
                    <td className="p-3 space-y-0.5">
                      <div className="font-bold text-theme-text">{rep.completedLeads} Converted | {rep.pendingLeads} Pending</div>
                      <div className="text-[10px] text-theme-text-muted">{rep.completedCalls} Calls | {rep.followupsCount} Follow-ups</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        rep.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                        rep.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {rep.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-3 py-1.5 rounded-xl bg-theme-primary text-white text-[10px] font-bold shadow"
                      >
                        Review Report
                      </button>
                    </td>
                  </tr>
                ))}
                {workspaceReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-theme-text-muted">
                      No pending team reports requiring manager review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPORTS */}
      {activeTab === 'exports' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Campaigns reports block */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary mb-6">
                <TrendingUp size={22} />
              </div>
              <h3 className="text-lg font-bold text-theme-text">Campaign Performance Database</h3>
              <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                Downloads detailed spreadsheet databases containing campaign names, platform click tracking, and conversion counts.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => handleDownloadReport('csv', 'campaigns')}
                disabled={loadingKey === 'campaigns-csv'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'campaigns-csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>CSV Spreadsheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('excel', 'campaigns')}
                disabled={loadingKey === 'campaigns-excel'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'campaigns-excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span>Excel Sheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('pdf', 'campaigns')}
                disabled={loadingKey === 'campaigns-pdf'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'campaigns-pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          {/* Leads reports block */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-theme-text">Leads Tracking Database</h3>
              <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
                Downloads the list of captured customer leads, source platforms, date of intake, pipeline status, and assigned specialists.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => handleDownloadReport('csv', 'leads')}
                disabled={loadingKey === 'leads-csv'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'leads-csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>CSV Spreadsheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('excel', 'leads')}
                disabled={loadingKey === 'leads-excel'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'leads-excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span>Excel Sheet</span>
              </button>
              <button
                onClick={() => handleDownloadReport('pdf', 'leads')}
                disabled={loadingKey === 'leads-pdf'}
                className="flex items-center gap-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg border border-theme-border px-4 py-2.5 text-xs font-bold text-theme-text transition-colors disabled:opacity-50"
              >
                {loadingKey === 'leads-pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                <span>PDF Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT DAILY REPORT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-theme-text">Submit Daily Activity Report</h3>
            <p className="text-xs text-theme-text-muted">Report your day's lead progress, calls, challenges, and plan for tomorrow.</p>

            <form onSubmit={handleDailySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 text-xs">
                <div>
                  <span className="text-[10px] text-theme-text-muted font-bold block">Calls Done Today</span>
                  <input
                    type="number"
                    value={submitForm.completedCalls}
                    onChange={(e) => setSubmitForm({ ...submitForm, completedCalls: Number(e.target.value) })}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1 text-xs font-bold text-theme-text"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-theme-text-muted font-bold block">Follow-ups Handled</span>
                  <input
                    type="number"
                    value={submitForm.followupsCount}
                    onChange={(e) => setSubmitForm({ ...submitForm, followupsCount: Number(e.target.value) })}
                    className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-1 text-xs font-bold text-theme-text"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Today's Summary & Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Completed initial calls for 8 leads, scheduled 3 demos..."
                  value={submitForm.remarks}
                  onChange={(e) => setSubmitForm({ ...submitForm, remarks: e.target.value })}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Problems Faced / Blockers</label>
                <textarea
                  rows={2}
                  placeholder="Client requested custom pricing approval..."
                  value={submitForm.problemsFaced}
                  onChange={(e) => setSubmitForm({ ...submitForm, problemsFaced: e.target.value })}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Next Day Plan</label>
                <textarea
                  rows={2}
                  placeholder="Follow up on sent proposals, conduct scheduled demos..."
                  value={submitForm.nextDayPlan}
                  onChange={(e) => setSubmitForm({ ...submitForm, nextDayPlan: e.target.value })}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-2xl border border-theme-border bg-theme-bg-alt px-5 py-2.5 text-xs font-semibold text-theme-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGER REVIEW MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-3">
              <h3 className="text-sm font-extrabold text-theme-text">Review Report by {selectedReport.generatedByName}</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-xl bg-theme-bg-alt text-theme-text-muted">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 space-y-1">
                <span className="font-bold text-theme-text">Remarks:</span>
                <p className="text-theme-text-muted">{selectedReport.remarks || 'No remarks entered'}</p>
              </div>
              {selectedReport.problemsFaced && (
                <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-1 text-rose-400">
                  <span className="font-bold block">Problems Faced:</span>
                  <p>{selectedReport.problemsFaced}</p>
                </div>
              )}
              {selectedReport.nextDayPlan && (
                <div className="p-3 rounded-2xl bg-theme-bg-alt/50 border border-theme-border/30 space-y-1">
                  <span className="font-bold text-theme-text">Next Day Plan:</span>
                  <p className="text-theme-text-muted">{selectedReport.nextDayPlan}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Manager Feedback / Comments</label>
                <textarea
                  rows={3}
                  placeholder="Great progress on call volume. Approved!"
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleReviewReport(selectedReport.id, 'REJECTED')}
                disabled={reviewing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-bold transition-all"
              >
                <XCircle size={14} /> Request Revision
              </button>
              <button
                onClick={() => handleReviewReport(selectedReport.id, 'APPROVED')}
                disabled={reviewing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all"
              >
                <CheckCircle2 size={14} /> Approve Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
