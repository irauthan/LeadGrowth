import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Building, 
  RefreshCw, 
  Users, 
  Database, 
  ShieldAlert,
  ArrowRight,
  Check,
  Zap,
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function WorkspaceManagement() {
  const user = useAuthStore((state) => state.user);
  const setWorkspace = useAuthStore((state) => state.setWorkspace);

  const [workspaceName, setWorkspaceName] = useState(user?.workspaceName || 'Default Workspace');
  const [workspaceSlug, setWorkspaceSlug] = useState(user?.workspaceSlug || 'default-slug');
  const [inviteCode, setInviteCode] = useState(user?.inviteCode || 'LG-DEFAULT');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get('/api/workspaces/current');
      const ws = res.data;
      setWorkspaceName(ws.name);
      setWorkspaceSlug(ws.slug);
      setInviteCode(ws.inviteCode);
      setCompanyName(ws.companyName || '');
      setIndustry(ws.industry || '');
      setTeamSize(ws.teamSize || 1);
      setWebsite(ws.website || '');
      setTimezone(ws.timezone || 'UTC');
    } catch (err) {
      console.error('Failed to load workspace settings', err);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.put('/api/workspaces/current', {
        name: workspaceName,
        companyName,
        industry,
        teamSize,
        website,
        timezone,
        inviteCode,
        slug: workspaceSlug
      });

      setSuccessMsg('Workspace configurations saved successfully!');
      
      // Update local Zustand store so changes propagate globally
      setWorkspace(
        res.data.id,
        res.data.name,
        res.data.slug,
        res.data.inviteCode,
        user?.roles[0]
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newCode = 'LG-';
    for (let i = 0; i < 6; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(newCode);
    setSuccessMsg('New invite code generated! Make sure to save changes.');
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE you want to delete this workspace? This will permanently delete all leads, tasks, campaigns, and API integrations!")) {
      return;
    }
    try {
      await api.delete('/api/workspaces/current');
      const logout = useAuthStore.getState().logout;
      logout();
      window.location.href = '/auth';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete workspace.');
    }
  };

  if (loadingWorkspace) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upper Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Workspace Status</span>
            <h3 className="text-lg font-extrabold mt-1 text-emerald-500 flex items-center gap-1.5">
              <Zap size={18} className="fill-current" /> Active (Enterprise)
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Building size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Active Integrations</span>
            <h3 className="text-lg font-extrabold mt-1 text-theme-text">2 Services Connected</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-theme-primary">
            <Database size={20} />
          </div>
        </div>

        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Workspace Team Size</span>
            <h3 className="text-lg font-extrabold mt-1 text-theme-text">{teamSize} Members</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Users size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Editor */}
        <div className="lg:col-span-2 rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold">General Workspace Profile</h3>
            <p className="text-xs text-theme-text-muted">Adjust names, branding identifiers, and access levels.</p>
          </div>

          {successMsg && (
            <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-500 flex items-center gap-2">
              <Check size={16} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleUpdateWorkspace} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Team Size</label>
                <input
                  type="number"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                  placeholder="e.g. 15"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. UTC+5:30"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-text-muted mb-2">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-text-muted mb-2">Workspace Slug (URL slug identifier)</label>
              <div className="flex rounded-2xl border border-theme-border bg-theme-bg-alt/50 overflow-hidden focus-within:border-theme-primary">
                <span className="bg-theme-bg-alt px-4 py-2.5 text-xs text-theme-text-muted font-mono flex items-center border-r border-theme-border/20">
                  /workspaces/
                </span>
                <input
                  type="text"
                  required
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  placeholder="slug"
                  className="flex-1 bg-transparent px-4 py-2.5 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-text-muted mb-2">Workspace Access Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteCode}
                  className="flex-1 rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-mono font-bold text-theme-primary outline-none"
                />
                <button
                  type="button"
                  onClick={handleResetInviteCode}
                  className="flex items-center gap-1.5 rounded-2xl border border-theme-border hover:bg-theme-bg-alt px-4 py-2.5 text-xs font-bold transition-all"
                >
                  <RefreshCw size={14} />
                  Reset Code
                </button>
              </div>
              <p className="text-[10px] text-theme-text-muted mt-2">New members can use this invitation code to join your workspace automatically.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 transition-all"
            >
              {loading ? 'Saving...' : 'Save Workspace Profile'}
            </button>
          </form>
        </div>

        {/* Info Column */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-1.5 text-rose-500">
              <ShieldAlert size={14} /> Danger Zone
            </h4>
            <p className="text-[11px] text-theme-text-muted mt-2">Actions here cannot be undone. Exercise extreme caution.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5">
              <span className="text-xs font-bold text-rose-500">Transfer Ownership</span>
              <p className="text-[10px] text-theme-text-muted mt-1 leading-relaxed">Promote another admin and remove yourself from primary ownership role.</p>
              <button className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 px-3 py-1.5 text-[10px] font-bold mt-3">
                Transfer <ArrowRight size={12} />
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5">
              <span className="text-xs font-bold text-rose-500">Archive / Delete Workspace</span>
              <p className="text-[10px] text-theme-text-muted mt-1 leading-relaxed">Permanently purge all data, including campaigns, leads, and API sync records.</p>
              <button
                type="button"
                onClick={handleDeleteWorkspace}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 text-[10px] font-bold mt-3"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
