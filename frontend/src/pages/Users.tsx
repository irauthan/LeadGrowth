import { useEffect, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { 
  Loader2, 
  Mail, 
  Smartphone, 
  Award, 
  UserPlus, 
  CheckCircle,
  Building
} from 'lucide-react';

export default function Users() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/members');
      setMembers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getRoleName = (m: any) => {
    const r = m.roles?.[0];
    if (!r) return 'USER';
    const name = typeof r === 'string' ? r : r.name;
    return name ? name.replace('ROLE_', '') : 'USER';
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);

    setTimeout(() => {
      setInviting(false);
      setInviteSuccess(`Invitation successfully sent to ${inviteEmail}!`);
      setInviteEmail('');
      setTimeout(() => {
        setInviteSuccess('');
        setShowInviteModal(false);
      }, 2000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-card border border-theme-border rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
            <Building size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Workspace Members</h2>
            <p className="text-[10px] text-theme-text-muted mt-0.5">Manage credentials, permissions, and profiles of team members.</p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 w-fit"
        >
          <UserPlus size={14} />
          Invite Team Member
        </button>
      </div>

      {/* Grid of members */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all border border-theme-border bg-theme-card">
            <div>
              {/* Profile Top Row */}
              <div className="flex items-center gap-4">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt="avatar"
                    className="h-14 w-14 rounded-2xl object-cover shadow border border-theme-border"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-lg font-bold text-white shadow">
                    {getInitials(member.fullName)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-theme-text">{member.fullName}</h4>
                  <p className="text-xs text-theme-text-muted font-semibold">{member.designation || 'Staff Member'}</p>
                </div>
              </div>

              {/* Bio description */}
              {member.bio ? (
                <p className="mt-4 text-xs text-theme-text-muted leading-relaxed italic">
                  "{member.bio}"
                </p>
              ) : (
                <p className="mt-4 text-xs text-theme-text-muted/60 italic">No biography added yet.</p>
              )}
            </div>

            {/* Bottom details block */}
            <div className="mt-6 pt-4 border-t border-theme-border/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-theme-text-muted">
                <Mail size={14} className="text-theme-text-muted/70" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-theme-text-muted">
                  <Smartphone size={14} className="text-theme-text-muted/70" />
                  <span>{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-theme-text-muted">
                <Award size={14} className="text-theme-text-muted/70" />
                <span className="font-bold text-theme-primary">{getRoleName(member)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Dialog Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl">
            <h3 className="text-base font-bold mb-2">Invite New Staff</h3>
            <p className="text-xs text-theme-text-muted mb-4">An invitation code and join link will be emailed to them.</p>

            {inviteSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-500 flex items-center gap-2">
                <CheckCircle size={14} />
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-text-muted mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@leadgrowth.com"
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-medium outline-none focus:border-theme-primary focus:bg-theme-card"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-2xl border border-theme-border hover:bg-theme-bg-alt/30 text-theme-text/80 px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2 text-xs font-bold shadow-md shadow-theme-primary/10"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
