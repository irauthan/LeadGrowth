import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  RefreshCw
} from 'lucide-react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

export default function AuditLogsView() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.some(r => r.toUpperCase().includes('ADMIN')) || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchAuditLogs();
  }, [isAdmin]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/audit-logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      try {
        const res2 = await api.get('/api/audit-logs');
        setLogs(Array.isArray(res2.data) ? res2.data : []);
      } catch {
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6 bg-theme-card border border-theme-border rounded-3xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-theme-text">Access Restricted</h2>
        <p className="text-xs text-theme-text-muted max-w-md">
          Security Audit Logs are accessible exclusively to System Administrators.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(l => 
    (l.action && l.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.userName && l.userName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && logs.length === 0) {
    return (
      <HoosshBeeLoader 
        text="Loading Security Audit Trail..." 
        subtext="Retrieving immutable audit history, user actions and security mutations" 
      />
    );
  }

  return (
    <div className="space-y-5">

      {/* Unified Security Audit Trail Container */}
      <div className="rounded-2xl border border-theme-border/70 bg-theme-card shadow-xs overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-theme-border/60">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary shadow-xs">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">Security Audit Trail</h2>
              <p className="text-xs text-theme-text-muted mt-0.5">Complete record of workspace security actions, user invitations, role changes, and system mutations.</p>
            </div>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-theme-border/80 bg-theme-bg-alt/60 text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="p-4 border-b border-theme-border/60 bg-theme-bg-alt/20">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Search audit actions, descriptions, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-theme-border/70 bg-theme-card py-2 pl-9 pr-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-bg-alt/50 border-b border-theme-border/60 text-theme-text-muted font-bold">
              <tr>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details / Description</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/30">
              {filteredLogs.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="hover:bg-theme-bg-alt/30 transition-colors">
                  <td className="p-3.5">
                    <span className="font-extrabold text-theme-primary uppercase text-[10px] bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-1 rounded-full">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-theme-text block">{log.userName || 'System'}</span>
                    <span className="text-[9px] text-theme-text-muted">{log.userEmail}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-[10px] text-theme-text">{log.targetType || 'WORKSPACE'}</span>
                  </td>
                  <td className="p-3.5 text-theme-text-muted max-w-xs truncate">{log.description}</td>
                  <td className="p-3.5 font-mono text-[10px] text-theme-text-muted">{log.createdAt ? log.createdAt.replace('T', ' ') : 'N/A'}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-theme-text-muted italic">
                    No audit records matching query "{searchQuery}".
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
