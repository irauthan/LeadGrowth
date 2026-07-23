import { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { formatDate } from '../utils';
import { downloadReport } from '../services/reportService';

export default function Reports() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [reports] = useState([
    { id: 1, type: 'Daily Activity Summary', format: 'Excel', date: '2026-07-16T18:00:00Z', size: '24 KB', generatedBy: 'Sarah Jenkins' },
    { id: 2, type: 'Weekly Campaign Audit', format: 'PDF', date: '2026-07-10T12:00:00Z', size: '1.2 MB', generatedBy: 'Alexander Wright' },
    { id: 3, type: 'Monthly Spend Analysis', format: 'CSV', date: '2026-07-01T08:00:00Z', size: '14 KB', generatedBy: 'Alexander Wright' },
  ]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-theme-text font-sans">Reports Console</h1>
        <p className="mt-1 text-sm text-theme-text-muted">
          Download analytical spreadsheet databases and PDF summaries for executive presentations.
        </p>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaigns reports block */}
        <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary mb-6">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-lg font-bold text-theme-text">Campaign Performance Database</h3>
            <p className="mt-2 text-xs text-theme-text-muted leading-relaxed">
              Downloads detailed spreadsheet databases containing campaign names, platform budgets, click tracking, conversions count, and ROAS calculations.
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
              Downloads the list of captured customer leads, source platforms, date of intake, current conversion pipeline status, and assigned specialists.
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

      {/* Generated Report logs timeline */}
      <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-theme-text">Historical Archives</h3>
        <p className="text-xs text-theme-text-muted mb-6">Archive history of generated reports in workspace</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-theme-border text-xs font-bold text-theme-text-muted pb-3">
                <th className="pb-3">Report Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Generated By</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">File Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60 text-xs md:text-sm">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                  <td className="py-3.5 font-bold text-theme-text flex items-center gap-2">
                    <CalendarDays size={16} className="text-theme-text-muted" />
                    <span>{rep.type}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="rounded bg-theme-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-theme-primary">
                      {rep.format}
                    </span>
                  </td>
                  <td className="py-3.5 text-theme-text-muted">{rep.generatedBy}</td>
                  <td className="py-3.5 text-theme-text-muted">{formatDate(rep.date)}</td>
                  <td className="py-3.5 text-right font-semibold text-theme-text">{rep.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
