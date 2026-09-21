import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle,
  Unlock,
  Activity,
  UserX,
  Lock
} from 'lucide-react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

export default function SecurityCenter() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.some(r => r.toUpperCase().includes('ADMIN')) || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');

  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchSecurityData();
  }, [isAdmin]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/security/summary');
      setSecurityData(res.data);
    } catch (err) {
      console.error('Failed to load security summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockUser = async (userId: number, userName: string) => {
    setUnlockingId(userId);
    setActionFeedback(null);
    try {
      const res = await api.post(`/api/admin/security/unlock-user/${userId}`);
      setActionFeedback(res.data?.message || `User "${userName}" has been unlocked successfully.`);
      await fetchSecurityData();
    } catch (err: any) {
      console.error('Failed to unlock user', err);
      alert(err.response?.data?.message || 'Failed to unlock user.');
    } finally {
      setUnlockingId(null);
      setTimeout(() => setActionFeedback(null), 5000);
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

  if (loading && !securityData) {
    return (
      <HoosshBeeLoader 
        text="Auditing Security Center Controls..." 
        subtext="Inspecting active sessions, failed authentication logs, and account lockouts" 
      />
    );
  }

  const lockedAccounts = securityData?.lockedAccounts || [];
  const recentEvents = securityData?.recentSecurityEvents || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Unified Enterprise Security Center Card */}
      <div className="bg-theme-card border border-theme-border/70 rounded-2xl p-5 shadow-xs space-y-5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">Enterprise Security Center</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Policy Active
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Real-time failed login detection, brute-force account lockout protections, active member sessions, and security incident audit stream.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSecurityData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-theme-border/80 bg-theme-bg-alt/60 text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Stream
          </button>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{actionFeedback}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-xs opacity-70 hover:opacity-100 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* LOCKED ACCOUNTS ALERT BANNER (Shows if any user is locked out) */}
        {lockedAccounts.length > 0 && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <ShieldAlert size={18} />
                <span>Security Alert: {lockedAccounts.length} User Account(s) Currently Locked Out</span>
              </div>
              <span className="text-[10px] uppercase font-bold bg-rose-500 text-white px-2 py-0.5 rounded-md">
                5 Failed Attempts
              </span>
            </div>
            <p className="text-xs text-theme-text leading-relaxed">
              The following account(s) have been temporarily locked out due to exceeding the maximum failed login threshold (5 attempts). Administrators can unlock them immediately:
            </p>
            <div className="space-y-2 pt-1">
              {lockedAccounts.map((acc: any) => (
                <div key={acc.id} className="p-3 rounded-xl bg-theme-card border border-rose-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs">
                      <UserX size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-theme-text">{acc.fullName} ({acc.email})</div>
                      <div className="text-[10px] text-theme-text-muted">
                        Failed attempts: <strong className="text-rose-500">{acc.failedAttempts}</strong> • Lockout active until {new Date(acc.lockoutEnd).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={unlockingId === acc.id}
                    onClick={() => handleUnlockUser(acc.id, acc.fullName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    <Unlock size={13} />
                    <span>{unlockingId === acc.id ? 'Unlocking...' : 'Unlock Account'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Status Badges Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active User Sessions</span>
            <h3 className="text-xl font-extrabold text-theme-text">{securityData.activeSessions} Active</h3>
            <span className="text-[9px] font-bold text-emerald-500 block">Encrypted Sessions</span>
          </div>

          <div className={`rounded-xl border p-3.5 space-y-1 ${
            (securityData.failedLogins24h || 0) > 0 
              ? 'border-amber-500/30 bg-amber-500/10' 
              : 'border-theme-border/50 bg-theme-bg-alt/40'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Failed Logins (24h)</span>
            <h3 className={`text-xl font-extrabold ${(securityData.failedLogins24h || 0) > 0 ? 'text-amber-500' : 'text-theme-text'}`}>
              {securityData.failedLogins24h} Attempts
            </h3>
            <span className={`text-[9px] font-bold block ${(securityData.failedLogins24h || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {(securityData.failedLogins24h || 0) > 0 ? 'Detected & Logged' : 'No suspicious failures'}
            </span>
          </div>

          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Account Lockout Rule</span>
            <h3 className="text-xl font-extrabold text-theme-text">{securityData.accountLockoutThreshold} Max Attempts</h3>
            <span className="text-[9px] font-bold text-theme-primary block">Automatic Lockout Active</span>
          </div>

          <div className="rounded-xl border border-theme-border/50 bg-theme-bg-alt/40 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Locked Accounts</span>
            <h3 className={`text-xl font-extrabold ${(securityData.lockedAccountsCount || 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {securityData.lockedAccountsCount || 0} Locked
            </h3>
            <span className="text-[9px] font-bold text-theme-text-muted block">
              {(securityData.lockedAccountsCount || 0) > 0 ? 'Admin Intervention Available' : 'All Accounts Clear'}
            </span>
          </div>
        </div>

        {/* Active User Sessions Table */}
        <div className="pt-2 border-t border-theme-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-text-muted">
              Active Member Sessions & Status
            </h3>
            <span className="text-xs text-theme-text-muted font-medium">
              Threshold: 5 attempts before 15m lockout
            </span>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-theme-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-bg-alt/50 border-b border-theme-border/60 text-theme-text-muted font-bold">
                <tr>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Device / Client</th>
                  <th className="p-3">Failed Attempts</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {securityData.sessions.map((s: any, idx: number) => (
                  <tr key={idx} className="hover:bg-theme-bg-alt/30 transition-colors">
                    <td className="p-3 font-bold text-theme-text">
                      <div>{s.fullName}</div>
                      <div className="text-[10px] text-theme-text-muted font-normal">{s.email}</div>
                    </td>
                    <td className="p-3 font-extrabold text-theme-primary uppercase text-[10px]">{s.role}</td>
                    <td className="p-3 font-mono text-[10px] text-theme-text">{s.ipAddress}</td>
                    <td className="p-3 text-theme-text-muted">{s.device}</td>
                    <td className="p-3">
                      <span className={`font-mono font-bold text-xs ${
                        s.failedLoginAttempts >= 5 ? 'text-rose-500' : s.failedLoginAttempts > 0 ? 'text-amber-500' : 'text-theme-text-muted'
                      }`}>
                        {s.failedLoginAttempts} / 5
                      </span>
                    </td>
                    <td className="p-3">
                      {s.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase">
                          <Lock size={10} /> LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                          <CheckCircle size={10} /> {s.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {s.isLocked && (
                        <button
                          disabled={unlockingId === s.id}
                          onClick={() => handleUnlockUser(s.id, s.fullName)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Security Incidents & Auth Stream */}
        <div className="pt-4 border-t border-theme-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-text flex items-center gap-1.5">
              <Activity size={14} className="text-theme-primary" />
              <span>Live Security Incident & Auth Events Stream</span>
            </h3>
            <span className="text-[10px] text-theme-text-muted">Last 25 Security Events</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-theme-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-bg-alt/50 border-b border-theme-border/60 text-theme-text-muted font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Event Action</th>
                  <th className="p-3">Target Identity</th>
                  <th className="p-3">Incident Description</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {recentEvents.map((evt: any) => {
                  const isFailure = evt.action.includes('FAILED') || evt.action.includes('LOCK');
                  const isKey = evt.action.includes('KEY');

                  return (
                    <tr key={evt.id} className="hover:bg-theme-bg-alt/30 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase ${
                          isFailure 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                            : isKey 
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        }`}>
                          {evt.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-theme-text">
                        <div>{evt.userName}</div>
                        {evt.userEmail && <div className="text-[10px] text-theme-text-muted font-normal">{evt.userEmail}</div>}
                      </td>
                      <td className="p-3 text-theme-text-muted text-xs max-w-md">
                        {evt.description}
                      </td>
                      <td className="p-3 text-right font-mono text-[10px] text-theme-text-muted whitespace-nowrap">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  );
                })}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-theme-text-muted italic">
                      No security incident events recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
