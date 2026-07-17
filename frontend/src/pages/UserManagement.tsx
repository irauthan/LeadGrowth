import { useState } from 'react';
import { 
  Search, 
  CheckCircle,
  Plus,
  Mail,
  UserPlus
} from 'lucide-react';

interface ManagedUser {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'USER'>('ALL');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [users, setUsers] = useState<ManagedUser[]>([
    { id: 1, fullName: 'John Doe', email: 'john@leadgrowth.com', role: 'ADMIN', status: 'ACTIVE', joinedDate: '2026-01-15' },
    { id: 2, fullName: 'Sarah Smith', email: 'sarah@leadgrowth.com', role: 'MANAGER', status: 'ACTIVE', joinedDate: '2026-02-10' },
    { id: 3, fullName: 'Jane Miller', email: 'jane@leadgrowth.com', role: 'USER', status: 'ACTIVE', joinedDate: '2026-03-24' },
    { id: 4, fullName: 'Robert Chen', email: 'robert@leadgrowth.com', role: 'USER', status: 'SUSPENDED', joinedDate: '2026-04-05' },
    { id: 5, fullName: 'Emily Davis', email: 'emily@leadgrowth.com', role: 'MANAGER', status: 'ACTIVE', joinedDate: '2026-05-18' },
  ]);

  const handleToggleStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
        };
      }
      return u;
    }));
  };

  const handleChangeRole = (id: number, newRole: 'ADMIN' | 'MANAGER' | 'USER') => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newUser: ManagedUser = {
      id: Date.now(),
      fullName: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, newUser]);
    setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(''), 3000);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Grid: Invite and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Invite Form */}
        <div className="lg:col-span-2 rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <UserPlus size={18} className="text-theme-primary" /> Invite Workspace Member
            </h3>
            <p className="text-xs text-theme-text-muted mt-1">Send an invitation email to add new staff or managers.</p>
          </div>

          {inviteSuccess && (
            <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-500 flex items-center gap-2">
              <CheckCircle size={16} />
              {inviteSuccess}
            </div>
          )}

          <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter staff email address..."
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 pl-10 text-xs font-semibold outline-none focus:border-theme-primary focus:bg-theme-card"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-bold outline-none focus:border-theme-primary"
            >
              <option value="USER">User Role</option>
              <option value="MANAGER">Manager Role</option>
              <option value="ADMIN">Admin Role</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 transition-all flex items-center gap-1.5 justify-center"
            >
              <Plus size={14} /> Send Invite
            </button>
          </form>
        </div>

        {/* Right: Quick stats */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Active Seats Limit</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold">{users.length}</span>
              <span className="text-xs text-theme-text-muted">/ Unlimited Seats</span>
            </div>
          </div>
          <div className="text-[10px] text-theme-text-muted leading-relaxed mt-4">
            Your workspace is currently under an enterprise license. You can add as many managers and users as required without extra billing.
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 pl-10 text-xs font-semibold outline-none focus:border-theme-primary"
          />
        </div>

        {/* Role selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 text-xs font-bold outline-none focus:border-theme-primary w-full"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin Only</option>
            <option value="MANAGER">Manager Only</option>
            <option value="USER">User Only</option>
          </select>
        </div>
      </div>

      {/* Users table list */}
      <div className="rounded-3xl border border-theme-border bg-theme-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-bg-alt/50 border-b border-theme-border/50 text-theme-text-muted font-bold">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Seat Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/30 font-medium">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-theme-bg-alt/20 transition-colors">
                  <td className="p-4 whitespace-nowrap font-bold text-theme-text">{item.fullName}</td>
                  <td className="p-4 whitespace-nowrap text-theme-text-muted font-mono">{item.email}</td>
                  <td className="p-4 whitespace-nowrap text-theme-text-muted">{item.joinedDate}</td>
                  <td className="p-4 whitespace-nowrap">
                    <select
                      value={item.role}
                      onChange={(e) => handleChangeRole(item.id, e.target.value as any)}
                      className="bg-theme-bg-alt border border-theme-border rounded-xl px-2.5 py-1 text-[11px] font-bold outline-none focus:border-theme-primary text-theme-text"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="USER">USER</option>
                    </select>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {item.status === 'ACTIVE' ? (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 whitespace-nowrap flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                        item.status === 'ACTIVE'
                          ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
                          : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'Suspend Seat' : 'Reactivate'}
                    </button>
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
