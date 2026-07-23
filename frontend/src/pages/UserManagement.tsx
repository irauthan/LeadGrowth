import { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle,
  Plus,
  Mail,
  UserPlus,
  Loader2,
  Trash2,
  Key,
  ShieldAlert,
  Edit2,
  UserCheck,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface ManagedUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  bio: string;
  department: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  status: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
  lastActiveAt: string;
}

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'USER'>('ALL');
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'Marketing' | 'Sales' | 'Support' | 'Management'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'ACTIVE_DESC'>('NAME_ASC');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  // Modal / Operations states
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [transferUser, setTransferUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users/members');
      const mapped = res.data.map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone || '',
        designation: u.designation || '',
        bio: u.bio || '',
        department: u.department || 'Marketing',
        role: (u.roles?.[0]?.name || 'ROLE_USER').replace('ROLE_', '') as any,
        status: u.status || 'ACTIVE',
        joinedDate: u.createdAt ? u.createdAt.split('T')[0] : 'N/A',
        lastActiveAt: u.lastActiveAt ? u.lastActiveAt.split('T')[0] : 'N/A'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/api/users/${id}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (id: number, newRole: 'ADMIN' | 'MANAGER' | 'USER') => {
    try {
      await api.put(`/api/users/${id}/role`, { role: newRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change user role.');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setGeneratedLink('');
    setInviteSuccess('');
    try {
      const res = await api.post('/api/users/invite', { email: inviteEmail, role: inviteRole });
      const link = `${window.location.origin}/auth?inviteToken=${res.data.token}`;
      setGeneratedLink(link);
      setInviteSuccess(`Invitation created successfully!`);
      setInviteEmail('');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite user.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to remove this user from the workspace?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.put(`/api/users/${editUser.id}/details`, {
        fullName: editUser.fullName,
        phone: editUser.phone,
        designation: editUser.designation,
        bio: editUser.bio,
        department: editUser.department
      });
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update details.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    try {
      await api.post(`/api/users/${resetUser.id}/reset-password?newPassword=${newPassword}`);
      alert(`Password for ${resetUser.fullName} reset successfully.`);
      setResetUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleTransferOwnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUser) return;
    try {
      await api.post(`/api/users/transfer-ownership?newOwnerId=${transferUser.id}`);
      alert(`Workspace ownership successfully transferred to ${transferUser.fullName}. Your role is now MANAGER.`);
      setTransferUser(null);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to transfer ownership.');
    }
  };

  // Filter & Search
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortOrder === 'NAME_ASC') {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortOrder === 'NAME_DESC') {
      return b.fullName.localeCompare(a.fullName);
    } else if (sortOrder === 'ACTIVE_DESC') {
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary">
            <Building size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-theme-text uppercase tracking-wider">Team Management Portal</h2>
            <p className="text-[11px] text-theme-text-muted mt-1">Suspend, reset passwords, edit roles and details, or transfer workspace ownership.</p>
          </div>
        </div>
      </div>

      {/* Grid: Invite and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Invite Form */}
        <div className="lg:col-span-2 rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-theme-text flex items-center gap-2 uppercase tracking-wider">
              <UserPlus size={16} className="text-cyan-400" /> Send Invite Link
            </h3>
            <p className="text-xs text-theme-text-muted mt-1">Generate a register invitation link with specific workspace credentials role permissions.</p>
          </div>

          {inviteSuccess && (
            <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-400 flex items-center gap-2">
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
                className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 pl-10 text-xs font-medium text-theme-text outline-none focus:border-theme-primary"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
            >
              <option value="USER">User Role</option>
              <option value="MANAGER">Manager Role</option>
              <option value="ADMIN">Admin Role</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-theme-primary/10 transition-all flex items-center gap-1.5 justify-center"
            >
              <Plus size={14} /> Send Invite
            </button>
          </form>

          {generatedLink && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-2">
              <p className="font-bold flex items-center gap-1.5"><CheckCircle size={14} /> Link Created! Share this link with the user:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 rounded-xl bg-theme-bg-alt border border-theme-border px-3 py-2 text-[10px] font-mono select-all outline-none text-theme-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert('Copied to clipboard!');
                  }}
                  className="bg-theme-primary hover:bg-theme-primary-hover text-white px-3 py-2 rounded-xl text-[10px] font-bold"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick stats */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">Total Active Seats</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-theme-text">{users.length}</span>
              <span className="text-xs text-theme-text-muted">/ Unlimited Seats</span>
            </div>
          </div>
          <div className="text-[10px] text-theme-text-muted leading-relaxed mt-4">
            Your workspace is under an enterprise license. Suspend user seats to prevent access or transfer workspace ownership below.
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
            className="w-full rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 pl-10 text-xs font-semibold text-theme-text outline-none focus:border-theme-primary"
          />
        </div>

        {/* Sorting and Filters */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin Only</option>
            <option value="MANAGER">Manager Only</option>
            <option value="USER">User Only</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Departments</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="Management">Management</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="ACTIVE_DESC">Last Active</option>
          </select>
        </div>
      </div>

      {/* Users table list */}
      <div className="rounded-3xl border border-theme-border bg-theme-card overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 size={32} className="animate-spin text-theme-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
                <tr>
                  <th className="p-4">Profile</th>
                  <th className="p-4">Email / Phone</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/40 font-medium">
                {paginatedUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary font-extrabold">
                          {getInitials(item.fullName)}
                        </div>
                        <div>
                          <div className="font-bold text-theme-text text-xs">{item.fullName}</div>
                          <div className="text-[10px] text-theme-text-muted">{item.designation || 'Specialist'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-theme-text font-mono text-[11px]">{item.email}</div>
                      <div className="text-[10px] text-theme-text-muted">{item.phone || 'No phone'}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-theme-text">{item.department}</td>
                    <td className="p-4 whitespace-nowrap">
                      <select
                        value={item.role}
                        disabled={item.id === currentUser?.id}
                        onChange={(e) => handleChangeRole(item.id, e.target.value as any)}
                        className="bg-theme-bg-alt border border-theme-border rounded-xl px-2 py-1 text-[10px] font-bold outline-none focus:border-theme-primary text-theme-text disabled:opacity-50"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="USER">USER</option>
                      </select>
                    </td>
                    <td className="p-4 whitespace-nowrap text-theme-text-muted">{item.lastActiveAt}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => setEditUser(item)}
                        className="p-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-theme-text-muted hover:text-theme-text border border-theme-border"
                        title="Edit Details"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => setResetUser(item)}
                        className="p-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-theme-text-muted hover:text-theme-text border border-theme-border"
                        title="Reset Password"
                      >
                        <Key size={12} />
                      </button>
                      {item.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleToggleStatus(item.id)}
                            className={`p-2 rounded-xl border transition-colors ${
                              item.status === 'ACTIVE'
                                ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
                                : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'
                            }`}
                            title={item.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          >
                            <ShieldAlert size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item.id)}
                            className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400"
                            title="Remove User"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={() => setTransferUser(item)}
                            className="p-2 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-400"
                            title="Transfer Admin Ownership"
                          >
                            <UserCheck size={12} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-theme-border pt-4">
          <span className="text-xs text-theme-text-muted">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-card border border-theme-border hover:bg-theme-bg-alt text-theme-text disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-card border border-theme-border hover:bg-theme-bg-alt text-theme-text disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">Edit Team Member details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUser.fullName}
                  onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Designation</label>
                <input
                  type="text"
                  value={editUser.designation}
                  onChange={(e) => setEditUser({ ...editUser, designation: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Phone</label>
                <input
                  type="text"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Department</label>
                <select
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Support">Support</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Bio Description</label>
                <textarea
                  rows={3}
                  value={editUser.bio}
                  onChange={(e) => setEditUser({ ...editUser, bio: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-xs font-bold text-theme-text-muted border border-theme-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-xs font-bold text-white shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5"><Key size={16} /> Reset Password</h3>
            <p className="text-xs text-theme-text-muted">Directly set a new password for <span className="font-bold text-theme-text">{resetUser.fullName}</span>.</p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setResetUser(null); setNewPassword(''); }}
                  className="px-4 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-xs font-bold text-theme-text-muted border border-theme-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-xs font-bold text-white"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      {transferUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-theme-card p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><UserCheck size={16} /> Transfer Workspace Owner</h3>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              WARNING: This action transfers full <span className="font-bold text-theme-text">ADMINISTRATOR</span> rights of the workspace to <span className="font-bold text-theme-text">{transferUser.fullName}</span>. 
              Your role will immediately be changed to <span className="font-bold text-theme-text">MANAGER</span> and you will lose access to system settings.
            </p>
            <form onSubmit={handleTransferOwnershipSubmit} className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferUser(null)}
                className="px-4 py-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-xs font-bold text-theme-text-muted border border-theme-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg"
              >
                Transfer Now
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
