import { useState } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface LogEntry {
  id: number;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO';
  ip: string;
}

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'INFO'>('ALL');

  const [logs] = useState<LogEntry[]>([
    { id: 1, user: 'John Doe (Admin)', action: 'Google Ads Sync', details: 'Synced campaign ID: Google_Spring_24. Added 14 new leads.', timestamp: '2026-07-17 11:24:12', status: 'SUCCESS', ip: '192.168.1.15' },
    { id: 2, user: 'Sarah Smith (Manager)', action: 'Lead Reassigned', details: 'Sophia Williams reassigned to Sarah Smith.', timestamp: '2026-07-17 10:45:00', status: 'INFO', ip: '192.168.1.22' },
    { id: 3, user: 'System Bot', action: 'Webhook Error', details: 'Meta Ads Webhook subscription failed. Retrying...', timestamp: '2026-07-17 09:12:05', status: 'WARNING', ip: '127.0.0.1' },
    { id: 4, user: 'Jane Miller (User)', action: 'Exported Leads', details: 'Exported qualified leads list as PDF format.', timestamp: '2026-07-17 08:33:45', status: 'SUCCESS', ip: '192.168.1.84' },
    { id: 5, user: 'John Doe (Admin)', action: 'Workspace Config', details: 'Updated JWT Expiration time in application setting.', timestamp: '2026-07-16 18:22:10', status: 'SUCCESS', ip: '192.168.1.15' },
  ]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportLogs = () => {
    const headers = 'ID,User,Action,Details,Timestamp,Status,IPAddress\n';
    const csvContent = logs.map(l => `${l.id},"${l.user}","${l.action}","${l.details}","${l.timestamp}",${l.status},${l.ip}`).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'workspace_activity_logs.csv');
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-theme-text-muted">Chronological audit logs of actions taken within this workspace.</p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 w-fit"
        >
          <Download size={14} />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Filter logs by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 pl-10 text-xs font-semibold outline-none focus:border-theme-primary"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-theme-text-muted flex items-center gap-1.5 whitespace-nowrap">
            <Filter size={14} /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 text-xs font-bold outline-none focus:border-theme-primary w-full"
          >
            <option value="ALL">All Levels</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl border border-theme-border bg-theme-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-bg-alt/50 border-b border-theme-border/50 text-theme-text-muted font-bold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Audit Details</th>
                <th className="p-4">Level</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/30 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-theme-bg-alt/20 transition-colors">
                    <td className="p-4 whitespace-nowrap font-mono text-[11px] text-theme-text-muted">{log.timestamp}</td>
                    <td className="p-4 whitespace-nowrap font-bold text-theme-text">{log.action}</td>
                    <td className="p-4 whitespace-nowrap text-theme-text">{log.user}</td>
                    <td className="p-4 text-theme-text-muted leading-relaxed min-w-[280px]">{log.details}</td>
                    <td className="p-4 whitespace-nowrap">
                      {log.status === 'SUCCESS' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle size={10} /> Success
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                          <AlertCircle size={10} /> Warning
                        </span>
                      )}
                      {log.status === 'INFO' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">
                          <Info size={10} /> Info
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono text-[11px] text-theme-text-muted">{log.ip}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-theme-text-muted italic">
                    No activity logs found matching the filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
