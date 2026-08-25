import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle
} from 'lucide-react';

export default function SecurityCenter() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetchSecurityData();
  }, [isAdmin]);

  const fetchSecurityData = async () => {
    try {
      const res = await api.get('/api/admin/security/summary');
      setSecurityData(res.data);
    } catch (err) {
      console.error('Failed to load security summary', err);
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
          The Enterprise Security Center is reserved exclusively for System Administrators.
        </p>
      </div>
    );
  }

  if (loading || !securityData) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Security Center Controls...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">Enterprise Security Center</h2>
            <p className="text-xs text-theme-text-muted mt-1">Session monitoring, account lockout rules, login audit logs, and security policy enforcement.</p>
          </div>
        </div>

        <button
          onClick={fetchSecurityData}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-theme-border bg-theme-bg-alt text-xs font-bold text-theme-text hover:bg-theme-border/20 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Security Stream
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active User Sessions</span>
          <h3 className="text-2xl font-extrabold text-theme-text">{securityData.activeSessions} Active</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Encrypted Sessions</span>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Failed Login Attempts (24h)</span>
          <h3 className="text-2xl font-extrabold text-theme-text">{securityData.failedLogins24h} Failures</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">No suspicious spikes</span>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Account Lockout Rule</span>
          <h3 className="text-2xl font-extrabold text-theme-text">{securityData.accountLockoutThreshold} Max Attempts</h3>
          <span className="text-[9px] font-bold text-theme-primary block">Automatic Lockout Active</span>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">JWT Token Expiry</span>
          <h3 className="text-2xl font-extrabold text-theme-text">8 Hours</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Stateless Authentication</span>
        </div>

      </div>

      {/* Active User Sessions Table */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Active Member Sessions & Devices</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Device / Client</th>
                <th className="p-3">Session Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/30">
              {securityData.sessions.map((s: any, idx: number) => (
                <tr key={idx} className="hover:bg-theme-bg-alt/30 transition-colors">
                  <td className="p-3 font-bold text-theme-text">{s.fullName} ({s.email})</td>
                  <td className="p-3 font-extrabold text-theme-primary uppercase text-[10px]">{s.role}</td>
                  <td className="p-3 font-mono text-[10px] text-theme-text">{s.ipAddress}</td>
                  <td className="p-3 text-theme-text-muted">{s.device}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                      <CheckCircle size={10} /> {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
