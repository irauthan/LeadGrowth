import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import type { AppTheme } from '../store/themeStore';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Lock, 
  Bell, 
  Building,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import axios from 'axios';

import { useLayoutStore } from '../store/layoutStore';
import type { SidebarPosition } from '../store/layoutStore';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const { theme, setTheme } = useThemeStore();
  const { sidebarPosition, setSidebarPosition, enabledNavItems, toggleNavItem, resetNavItems } = useLayoutStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'notifications' | 'workspace'>('profile');

  const allNavItemsList = [
    { id: '/dashboard', label: 'Dashboard', category: 'General' },
    { id: '/campaigns', label: 'Campaigns', category: 'General' },
    { id: '/leads', label: 'Leads', category: 'General' },
    { id: '/analytics', label: 'Analytics', category: 'General' },
    { id: '/reports', label: 'Reports', category: 'General' },
    { id: '/tasks', label: 'Tasks', category: 'General' },
    { id: '/users', label: 'Team Management', category: 'General' },
    { id: '/activity-logs', label: 'Activity Logs', category: 'General' },
    { id: '/notifications-page', label: 'Notifications', category: 'General' },
    { id: '/settings', label: 'Settings', category: 'General' },
    { id: '/admin/users', label: 'User Management', category: 'Admin' },
    { id: '/admin/workspace', label: 'Workspace Control', category: 'Admin' },
    { id: '/admin/api', label: 'API Management', category: 'Admin' },
    { id: '/admin/system', label: 'System Monitoring', category: 'Admin' },
  ];

  // Security Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [loading, setLoading] = useState(false);

  // Notifications Form State
  const [notificationsConfig, setNotificationsConfig] = useState({
    emailAlerts: true,
    slackAlerts: false,
    leadQualifications: true,
    weeklyReportSummary: true
  });

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:8080/api/users/password',
        { oldPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSecuritySuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || 'Failed to update password. Verify your old password.');
    } finally {
      setLoading(false);
    }
  };

  const themesList: { id: AppTheme; name: string; desc: string; bg: string; text: string; previewBg: string }[] = [
    { id: 'light', name: 'Light Slate', desc: 'Clean, professional slate look.', bg: 'bg-[#F8FAFC]', text: 'text-slate-900', previewBg: 'from-blue-600 to-indigo-500' },
    { id: 'dark', name: 'Dark Charcoal', desc: 'Standard slate dark mode.', bg: 'bg-[#0F172A]', text: 'text-white', previewBg: 'from-blue-500 to-cyan-400' },
    { id: 'midnight', name: 'Midnight Neon', desc: 'Deep cosmic space feel.', bg: 'bg-[#030712]', text: 'text-indigo-200', previewBg: 'from-indigo-600 to-purple-500' },
    { id: 'ocean', name: 'Deep Ocean', desc: 'Deep aquatic teals and greens.', bg: 'bg-[#04151F]', text: 'text-cyan-200', previewBg: 'from-cyan-500 to-emerald-400' },
    { id: 'purple', name: 'Royal Velvet', desc: 'Vibrant neon purple accents.', bg: 'bg-[#0D0714]', text: 'text-purple-200', previewBg: 'from-purple-600 to-pink-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/10'
                : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            <User size={16} />
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'appearance'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/10'
                : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            <Palette size={16} />
            Theme & Appearance
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/10'
                : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            <Lock size={16} />
            Security & Passwords
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'notifications'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/10'
                : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            <Bell size={16} />
            Notification Rules
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'workspace'
                ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/10'
                : 'text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text'
            }`}
          >
            <Building size={16} />
            Workspace Info
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 rounded-3xl border border-theme-border bg-theme-card p-6 md:p-8 shadow-sm">
          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-base font-bold">Profile Info</h3>
                <p className="text-xs text-theme-text-muted">Manage your credentials and email contacts.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.fullName || ''}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">System Role</label>
                  <input
                    type="text"
                    disabled
                    value={user?.roles[0]?.replace('ROLE_', '') || 'MEMBER'}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">Workspace Slug</label>
                  <input
                    type="text"
                    disabled
                    value={user?.workspaceSlug || ''}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none opacity-70"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* THEME & APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-base font-bold">Theme & Appearance</h3>
                <p className="text-xs text-theme-text-muted">Choose your interface layout experience.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {themesList.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`group flex flex-col text-left rounded-2xl border p-4 transition-all ${
                        isActive
                          ? 'border-theme-primary bg-theme-primary/5 ring-2 ring-theme-primary'
                          : 'border-theme-border bg-theme-bg-alt/30 hover:border-theme-primary/30'
                      }`}
                    >
                      <div className={`h-24 w-full rounded-xl p-2 flex flex-col justify-between ${t.bg} border border-theme-border/20 shadow-inner mb-3`}>
                        <div className="flex justify-between items-center">
                          <span className={`h-2 w-2 rounded-full ${t.previewBg}`} />
                          <span className={`text-[8px] font-bold ${t.text}`}>Header Text</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="h-4 w-12 rounded bg-theme-primary/20" />
                          <span className="h-4 w-6 rounded bg-slate-500/20" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="text-xs font-bold text-theme-text">{t.name}</span>
                          <p className="text-[10px] text-theme-text-muted mt-0.5">{t.desc}</p>
                        </div>
                        {isActive && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-theme-primary text-white shadow-sm">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* PC Navbar Position Settings */}
              <div className="pt-6 border-t border-theme-border/40 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-theme-text">PC Navigation Bar & Sidebar Position</h4>
                  <p className="text-xs text-theme-text-muted">Customize where the primary navigation sidebar is docked on desktop screens (PC).</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'left', label: 'Left Side', icon: '⬅️', desc: 'Standard left panel' },
                    { id: 'right', label: 'Right Side', icon: '➡️', desc: 'Dock panel on right' },
                    { id: 'top', label: 'Top Bar', icon: '⬆️', desc: 'Top navigation bar' },
                    { id: 'bottom', label: 'Bottom Dock', icon: '⬇️', desc: 'Bottom floating dock' }
                  ].map((pos) => {
                    const isSelected = sidebarPosition === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setSidebarPosition(pos.id as SidebarPosition)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-theme-primary bg-theme-primary/10 ring-2 ring-theme-primary font-bold text-theme-primary'
                            : 'border-theme-border bg-theme-bg-alt/40 hover:bg-theme-bg-alt text-theme-text/80'
                        }`}
                      >
                        <span className="text-2xl mb-1">{pos.icon}</span>
                        <span className="text-xs font-bold">{pos.label}</span>
                        <span className="text-[9px] text-theme-text-muted mt-0.5">{pos.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navbar Items Customization Section */}
              <div className="pt-6 border-t border-theme-border/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-theme-text">Navbar & Sidebar Items Customization</h4>
                    <p className="text-xs text-theme-text-muted">Select which items to show or hide in your navigation menu.</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetNavItems}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-bg-alt text-xs font-semibold text-theme-text hover:bg-theme-border/20 transition-all self-start sm:self-auto"
                  >
                    <RotateCcw size={14} />
                    Reset Default
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {allNavItemsList.map((item) => {
                    const isEnabled = enabledNavItems.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleNavItem(item.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                          isEnabled
                            ? 'border-theme-primary/40 bg-theme-primary/5 text-theme-text ring-1 ring-theme-primary/20'
                            : 'border-theme-border/30 bg-theme-bg-alt/20 opacity-50 hover:opacity-80 text-theme-text-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${isEnabled ? 'bg-theme-primary' : 'bg-slate-500'}`} />
                          <div>
                            <span className="text-xs font-bold block">{item.label}</span>
                            <span className="text-[9px] text-theme-text-muted font-semibold">{item.category}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {isEnabled ? 'Shown' : 'Hidden'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY & PASSWORDS TAB */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-base font-bold">Security Settings</h3>
                <p className="text-xs text-theme-text-muted">Update your login security password.</p>
              </div>

              {securitySuccess && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-500 flex items-center gap-2">
                  <Check size={16} />
                  {securitySuccess}
                </div>
              )}
              {securityError && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-semibold text-rose-500 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {securityError}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">Old Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* NOTIFICATION RULES TAB */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-base font-bold">Workspace Notifications</h3>
                <p className="text-xs text-theme-text-muted">Configure notification triggers for lead alerts.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 justify-between p-4 rounded-2xl border border-theme-border bg-theme-bg-alt/25">
                  <div>
                    <span className="text-xs font-bold text-theme-text">Email Notifications</span>
                    <p className="text-[10px] text-theme-text-muted mt-0.5">Receive daily summaries of sync activity.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.emailAlerts}
                    onChange={(e) => setNotificationsConfig({ ...notificationsConfig, emailAlerts: e.target.checked })}
                    className="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
                  />
                </label>

                <label className="flex items-center gap-3 justify-between p-4 rounded-2xl border border-theme-border bg-theme-bg-alt/25">
                  <div>
                    <span className="text-xs font-bold text-theme-text">Slack Integration Webhooks</span>
                    <p className="text-[10px] text-theme-text-muted mt-0.5">Broadcast qualified lead alerts to team channel.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.slackAlerts}
                    onChange={(e) => setNotificationsConfig({ ...notificationsConfig, slackAlerts: e.target.checked })}
                    className="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
                  />
                </label>

                <label className="flex items-center gap-3 justify-between p-4 rounded-2xl border border-theme-border bg-theme-bg-alt/25">
                  <div>
                    <span className="text-xs font-bold text-theme-text">Qualified Leads Trigger</span>
                    <p className="text-[10px] text-theme-text-muted mt-0.5">Alert immediately when WebSocket broadcast logs a lead.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsConfig.leadQualifications}
                    onChange={(e) => setNotificationsConfig({ ...notificationsConfig, leadQualifications: e.target.checked })}
                    className="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* WORKSPACE INFO TAB */}
          {activeTab === 'workspace' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h3 className="text-base font-bold">Workspace Configuration</h3>
                <p className="text-xs text-theme-text-muted">Details for your current marketing workspace.</p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/20 p-4 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-theme-border/20">
                  <span className="text-xs font-semibold text-theme-text-muted">Workspace Name</span>
                  <span className="text-xs font-bold text-theme-text">{user?.workspaceName || 'Default'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-theme-border/20">
                  <span className="text-xs font-semibold text-theme-text-muted">Workspace Invite Code</span>
                  <span className="text-xs font-mono font-bold text-theme-primary">{user?.inviteCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-theme-border/20">
                  <span className="text-xs font-semibold text-theme-text-muted">Workspace Slug</span>
                  <span className="text-xs font-bold text-theme-text">/{user?.workspaceSlug || ''}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
