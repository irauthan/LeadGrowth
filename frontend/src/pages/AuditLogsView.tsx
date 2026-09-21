import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  RefreshCw,
  Lock,
  Key,
  Users,
  Layers,
  Download
} from 'lucide-react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

type CategoryFilter = 'ALL' | 'SECURITY' | 'API_KEYS' | 'LEADS' | 'WORKSPACE';

export default function AuditLogsView() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.some(r => r.toUpperCase().includes('ADMIN')) || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');

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

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_trail_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const action = (l.action || '').toUpperCase();
      const target = (l.targetType || '').toUpperCase();
      const desc = (l.description || '').toLowerCase();
      const userName = (l.userName || (l.user ? l.user.fullName : '') || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = 
        action.toLowerCase().includes(query) ||
        desc.includes(query) ||
        userName.includes(query) ||
        (l.userEmail || (l.user ? l.user.email : '') || '').toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (category === 'SECURITY') {
        return action.includes('LOGIN') || action.includes('AUTH') || action.includes('LOCK') || action.includes('FAILED') || action.includes('SECURITY') || action.includes('UNLOCK');
      }
      if (category === 'API_KEYS') {
        return action.includes('KEY') || target.includes('API');
      }
      if (category === 'LEADS') {
        return action.includes('LEAD') || action.includes('ASSIGN') || action.includes('IMPORT') || action.includes('QUEUE');
      }
      if (category === 'WORKSPACE') {
        return action.includes('WORKSPACE') || action.includes('USER') || action.includes('ROLE') || action.includes('INVITE') || action.includes('POLICY');
      }

      return true;
    });
  }, [logs, searchQuery, category]);

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

  if (loading && logs.length === 0) {
    return (
      <HoosshBeeLoader 
        text="Loading Security Audit Trail..." 
        subtext="Retrieving immutable audit history, user actions and security mutations" 
      />
    );
  }

  const getActionBadgeClass = (actionName: string) => {
    const a = actionName.toUpperCase();
    if (a.includes('FAILED') || a.includes('LOCK') || a.includes('REVOKED') || a.includes('SUSPENDED')) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400';
    }
    if (a.includes('KEY') || a.includes('API')) {
      return 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400';
    }
    if (a.includes('SUCCESS') || a.includes('UNLOCKED') || a.includes('INITIALIZATION') || a.includes('ACTIVE')) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    }
    if (a.includes('LEAD') || a.includes('ASSIGN')) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
    }
    return 'bg-theme-bg-alt border-theme-border text-theme-text';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Unified Security Audit Trail Container */}
      <div className="rounded-2xl border border-theme-border/70 bg-theme-card shadow-xs overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-theme-border/60">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary shadow-xs">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">Security Audit Trail</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-theme-bg-alt border border-theme-border text-theme-text-muted">
                  Immutable Ledger
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Complete forensic record of failed login attempts, account lockouts, API key creations, role changes, and system mutations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-theme-border/80 bg-theme-bg-alt/60 text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all shadow-xs"
              title="Export filtered records as JSON"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-theme-border/80 bg-theme-bg-alt/60 text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all shadow-xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-theme-primary' : ''} /> Refresh Logs
            </button>
          </div>
        </div>

        {/* Category Filters and Search Bar */}
        <div className="p-4 border-b border-theme-border/60 bg-theme-bg-alt/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === 'ALL'
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text'
              }`}
            >
              All Events ({logs.length})
            </button>

            <button
              onClick={() => setCategory('SECURITY')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === 'SECURITY'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Lock size={12} />
              <span>Logins & Lockouts</span>
            </button>

            <button
              onClick={() => setCategory('API_KEYS')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === 'API_KEYS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Key size={12} />
              <span>API Credentials</span>
            </button>

            <button
              onClick={() => setCategory('LEADS')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === 'LEADS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Layers size={12} />
              <span>Lead Assignments</span>
            </button>

            <button
              onClick={() => setCategory('WORKSPACE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === 'WORKSPACE'
                  ? 'bg-theme-card text-theme-text border border-theme-primary font-bold shadow-xs'
                  : 'bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Users size={12} />
              <span>Workspace & Users</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Search actions, users, IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-theme-border/70 bg-theme-card py-2 pl-9 pr-4 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-bg-alt/50 border-b border-theme-border/60 text-theme-text-muted font-bold text-[10px] uppercase">
              <tr>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details & Forensic Description</th>
                <th className="p-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/30">
              {filteredLogs.map((log: any, idx: number) => {
                const userFullName = log.userName || (log.user ? log.user.fullName : 'System / Unknown');
                const userEmail = log.userEmail || (log.user ? log.user.email : '');

                return (
                  <tr key={log.id || idx} className="hover:bg-theme-bg-alt/30 transition-colors">
                    <td className="p-3.5">
                      <span className={`font-extrabold uppercase text-[10px] border px-2.5 py-1 rounded-md inline-block ${getActionBadgeClass(log.action || '')}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-theme-text block">{userFullName}</span>
                      {userEmail && <span className="text-[10px] text-theme-text-muted font-normal">{userEmail}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] text-theme-text bg-theme-bg-alt px-2 py-0.5 rounded border border-theme-border/60">
                        {log.targetType || 'WORKSPACE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-theme-text-muted max-w-md leading-relaxed text-xs">
                      {log.description}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-theme-text-muted text-right whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-xs text-theme-text-muted italic">
                    No audit records matching category "{category}" and query "{searchQuery}".
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
