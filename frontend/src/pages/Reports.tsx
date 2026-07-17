import { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  TrendingUp, 
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { formatDate } from '../utils';

export default function Reports() {
  const [reports] = useState([
    { id: 1, type: 'Daily Activity Summary', format: 'Excel', date: '2026-07-16T18:00:00Z', size: '24 KB', generatedBy: 'Sarah Jenkins' },
    { id: 2, type: 'Weekly Campaign Audit', format: 'PDF', date: '2026-07-10T12:00:00Z', size: '1.2 MB', generatedBy: 'Alexander Wright' },
    { id: 3, type: 'Monthly Spend Analysis', format: 'CSV', date: '2026-07-01T08:00:00Z', size: '14 KB', generatedBy: 'Alexander Wright' },
  ]);

  const handleDownloadReport = (format: 'csv' | 'excel' | 'pdf', type: 'campaigns' | 'leads') => {
    const url = `http://localhost:8080/api/reports/${type}/${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">Reports Console</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Download analytical spreadsheet databases and PDF summaries for executive presentations.
        </p>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaigns reports block */}
        <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 mb-6">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Campaign Performance Database</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads detailed spreadsheet databases containing campaign names, platform budgets, click tracking, conversions count, and ROAS calculations.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => handleDownloadReport('csv', 'campaigns')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download size={14} />
              <span>CSV Spreadsheet</span>
            </button>
            <button
              onClick={() => handleDownloadReport('excel', 'campaigns')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileSpreadsheet size={14} />
              <span>Excel Sheet</span>
            </button>
            <button
              onClick={() => handleDownloadReport('pdf', 'campaigns')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileText size={14} />
              <span>PDF Document</span>
            </button>
          </div>
        </div>

        {/* Leads reports block */}
        <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-6">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Leads Tracking Database</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Downloads the list of captured customer leads, source platforms, date of intake, current conversion pipeline status, and assigned specialists.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => handleDownloadReport('csv', 'leads')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Download size={14} />
              <span>CSV Spreadsheet</span>
            </button>
            <button
              onClick={() => handleDownloadReport('excel', 'leads')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileSpreadsheet size={14} />
              <span>Excel Sheet</span>
            </button>
            <button
              onClick={() => handleDownloadReport('pdf', 'leads')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileText size={14} />
              <span>PDF Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report logs timeline */}
      <div className="glass-card rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Historical Archives</h3>
        <p className="text-xs text-slate-400 mb-6">Archive history of generated reports in workspace</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 dark:border-slate-800 pb-3">
                <th className="pb-3">Report Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Generated By</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">File Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    <span>{rep.type}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="rounded bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {rep.format}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{rep.generatedBy}</td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">{formatDate(rep.date)}</td>
                  <td className="py-3.5 text-right font-semibold">{rep.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
