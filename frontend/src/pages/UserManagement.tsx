import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  CheckCircle, 
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
  ChevronRight, 
  BarChart3, 
  Smartphone, 
  Award, 
  Users as UsersIcon, 
  LayoutGrid, 
  ListFilter, 
  Shield 
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getProfileImageUrl } from '../utils/imageUrl';

export interface ManagedUser {
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
  profileImage?: string;
  availabilityStatus?: string;
  productivityScore?: number;
  performanceCategory?: string;
}

export default function UserManagement() {
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.roles.includes('ROLE_ADMIN');
  const isManager = currentUser?.roles.includes('ROLE_MANAGER');

  // States
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'DIRECTORY' | 'TABLE'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'USER'>('ALL');
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'Marketing' | 'Sales' | 'Support' | 'Management'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'ACTIVE_DESC' | 'PROD_DESC'>('NAME_ASC');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = viewMode === 'DIRECTORY' ? 6 : 8;

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'USER'>('USER');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Modal / Operations states
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [transferUser, setTransferUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    const paramSearch = searchParams.get('search');
    if (paramSearch && paramSearch !== searchQuery) {
      setSearchQuery(paramSearch);
    }
  }, [searchParams]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const [membersRes, prodRes] = await Promise.all([
        api.get('/api/users/members').catch(() => ({ data: [] })),
        api.get('/api/users/productivity').catch(() => ({ data: [] }))
      ]);

      const prodMap = new Map((prodRes.data || []).map((p: any) => [p.userId, p]));

      const mapped = (membersRes.data || []).map((u: any) => {
        const prod = prodMap.get(u.id) as any;
        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || '',
          designation: u.designation || '',
          bio: u.bio || '',
          department: u.department || 'Marketing',
          role: (u.roles?.[0]?.name || u.roles?.[0] || 'ROLE_USER').replace('ROLE_', '') as any,
          status: u.status || 'ACTIVE',
          joinedDate: u.createdAt ? u.createdAt.split('T')[0] : 'N/A',
          lastActiveAt: u.lastActiveAt ? u.lastActiveAt.split('T')[0] : 'N/A',
          profileImage: u.profileImage || '',
          availabilityStatus: u.availabilityStatus || 'OFFLINE',
          productivityScore: prod?.score || 0,
          performanceCategory: prod?.category || 'Average Performer'
        };
      });

      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch user management data', err);
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
    setInviting(true);
    setGeneratedLink('');
    setInviteSuccess('');
    try {
      const res = await api.post('/api/users/invite', { email: inviteEmail, role: inviteRole });
      const link = `${window.location.origin}/auth?inviteToken=${res.data.token}`;
      setGeneratedLink(link);
      setInviteSuccess(`Invitation link created successfully!`);
      setInviteEmail('');
      fetchUsersData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite user.');
    } finally {
      setInviting(false);
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
      fetchUsersData();
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
    } else if (sortOrder === 'PROD_DESC') {
      return (b.productivityScore || 0) - (a.productivityScore || 0);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const activeSeats = users.filter(u => u.status === 'ACTIVE').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const topPerformersCount = users.filter(u => (u.productivityScore || 0) >= 75).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header Command Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-theme-card border border-theme-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-theme-primary to-indigo-500 text-white shadow-lg nav-glow">
            <UsersIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-theme-text">Team & User Management</h2>
            <p className="text-xs text-theme-text-muted mt-1">Manage user roles, access permissions, live status availability, and team performance metrics.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center rounded-2xl bg-theme-bg-alt border border-theme-border p-1">
            <button
              onClick={() => { setViewMode('TABLE'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'TABLE' ? 'bg-theme-card text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <ListFilter size={14} /> Access Table
            </button>
            <button
              onClick={() => { setViewMode('DIRECTORY'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'DIRECTORY' ? 'bg-theme-card text-theme-primary shadow-sm' : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <LayoutGrid size={14} /> Directory Cards
            </button>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-theme-primary/20 transition-all"
          >
            <UserPlus size={15} /> Send Invite
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-theme-primary font-bold">
            <UsersIcon size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">Total Members</span>
            <h4 className="text-lg font-extrabold text-theme-text">{users.length}</h4>
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">Active Seats</span>
            <h4 className="text-lg font-extrabold text-theme-text">{activeSeats}</h4>
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 font-bold">
            <Shield size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">Admins</span>
            <h4 className="text-lg font-extrabold text-theme-text">{adminCount}</h4>
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">Top Performers</span>
            <h4 className="text-lg font-extrabold text-theme-text">{topPerformersCount}</h4>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 pl-10 text-xs font-semibold text-theme-text outline-none focus:border-theme-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value as any); setCurrentPage(1); }}
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
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-theme-border bg-theme-card px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="ACTIVE_DESC">Last Active</option>
            <option value="PROD_DESC">Top Performers</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-theme-border bg-theme-card">
          <Loader2 size={32} className="animate-spin text-theme-primary" />
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VIEW MODE 1: DIRECTORY GRID CARDS                                          */}
          {/* ========================================================================= */}
          {viewMode === 'DIRECTORY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedUsers.map((item) => (
                <div key={item.id} className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl space-y-4 flex flex-col justify-between hover:border-theme-primary/30 transition-all">
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary font-extrabold text-base border border-theme-primary/20 overflow-hidden shadow-2xs">
                          {item.profileImage ? (
                            <img src={getProfileImageUrl(item.profileImage)} alt={item.fullName} className="h-full w-full object-cover" />
                          ) : (
                            getInitials(item.fullName)
                          )}
                          {/* Live Availability dot */}
                          <span className={`absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full border-2 border-theme-card ${
                            item.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500' :
                            item.availabilityStatus === 'BUSY' ? 'bg-amber-500' :
                            item.availabilityStatus === 'ON_BREAK' ? 'bg-blue-400' :
                            'bg-slate-500'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-theme-text leading-tight">{item.fullName}</h4>
                          <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-wider mt-0.5">{item.designation || 'CRM Specialist'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        item.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        item.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-theme-bg-alt text-theme-text-muted border border-theme-border'
                      }`}>
                        {item.role}
                      </span>
                    </div>

                    {/* Productivity Score */}
                    <div className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-theme-primary" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-theme-text-muted font-bold uppercase tracking-wider">Performance Index</span>
                          <span className="text-xs font-black text-theme-text">{Math.round(item.productivityScore || 0)}% Score</span>
                        </div>
                      </div>
                      <span className={`rounded-xl px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide ${
                        item.performanceCategory === 'Top Performer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.performanceCategory === 'Average Performer' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.performanceCategory}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2 border-t border-theme-border/40 pt-3">
                      <div className="flex items-center gap-2 text-theme-text-muted">
                        <Mail size={13} className="text-theme-text-muted opacity-70" />
                        <span className="text-[10px] font-mono truncate">{item.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-theme-text-muted">
                        <Smartphone size={13} className="text-theme-text-muted opacity-70" />
                        <span className="text-[10px]">{item.phone || 'No phone listed'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-theme-text-muted">
                        <Building size={13} className="text-theme-text-muted opacity-70" />
                        <span className="text-[10px] font-semibold text-theme-text-muted">Department: {item.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-theme-border/40 pt-3 text-[10px] font-bold">
                    <span className={`px-2 py-0.5 rounded-full ${
                      item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.status}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/admin/work-monitor?userId=${item.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all font-extrabold text-[10px]"
                        title="View Executive Work & Activity Audit Monitor"
                      >
                        <BarChart3 size={11} /> Work Monitor
                      </Link>

                      <button
                        onClick={() => setEditUser(item)}
                        disabled={isManager && item.role === 'ADMIN'}
                        className="p-1.5 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-theme-text-muted hover:text-theme-text border border-theme-border disabled:opacity-30"
                        title="Edit Details"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {paginatedUsers.length === 0 && (
                <div className="col-span-full py-12 text-center text-theme-text-muted italic">No workspace members match the filters.</div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: ADMIN ACCESS TABLE                                           */}
          {/* ========================================================================= */}
          {viewMode === 'TABLE' && (
            <div className="rounded-3xl border border-theme-border bg-theme-card overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
                    <tr>
                      <th className="p-4">Profile</th>
                      <th className="p-4">Email / Phone</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Performance Index</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/40 font-medium">
                    {paginatedUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary font-extrabold flex-shrink-0">
                              {item.profileImage ? (
                                <img
                                  src={getProfileImageUrl(item.profileImage)}
                                  alt={item.fullName}
                                  className="h-9 w-9 rounded-xl object-cover border border-theme-border shadow-2xs"
                                />
                              ) : (
                                getInitials(item.fullName)
                              )}
                              <span className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border border-theme-card ${
                                item.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500' :
                                item.availabilityStatus === 'BUSY' ? 'bg-amber-500' :
                                item.availabilityStatus === 'ON_BREAK' ? 'bg-blue-400' :
                                'bg-slate-500'
                              }`} />
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
                            disabled={!isAdmin || item.id === currentUser?.id}
                            onChange={(e) => handleChangeRole(item.id, e.target.value as any)}
                            className="bg-theme-bg-alt border border-theme-border rounded-xl px-2 py-1 text-[10px] font-bold outline-none focus:border-theme-primary text-theme-text disabled:opacity-50"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="USER">USER</option>
                          </select>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-theme-text text-[11px]">{Math.round(item.productivityScore || 0)}%</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.performanceCategory === 'Top Performer' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-theme-bg-alt text-theme-text-muted'
                            }`}>
                              {item.performanceCategory}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-right space-x-1.5">
                          {/* Work Monitor Link */}
                          <Link
                            to={`/admin/work-monitor?userId=${item.id}`}
                            className="inline-flex items-center p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all"
                            title="View Work Monitor"
                          >
                            <BarChart3 size={12} />
                          </Link>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditUser(item)}
                            disabled={isManager && item.role === 'ADMIN'}
                            className="p-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-theme-text-muted hover:text-theme-text border border-theme-border disabled:opacity-30"
                            title="Edit Details"
                          >
                            <Edit2 size={12} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => setResetUser(item)}
                            disabled={isManager && item.role === 'ADMIN'}
                            className="p-2 rounded-xl bg-theme-bg-alt hover:bg-theme-bg text-theme-text-muted hover:text-theme-text border border-theme-border disabled:opacity-30"
                            title="Reset Password"
                          >
                            <Key size={12} />
                          </button>

                          {item.id !== currentUser?.id && (
                            <>
                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => handleToggleStatus(item.id)}
                                disabled={isManager && item.role === 'ADMIN'}
                                className={`p-2 rounded-xl border transition-colors disabled:opacity-30 ${
                                  item.status === 'ACTIVE'
                                    ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
                                    : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                                title={item.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                              >
                                <ShieldAlert size={12} />
                              </button>

                              {/* Delete User - Admin Only */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteUser(item.id)}
                                  className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400"
                                  title="Remove User"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}

                              {/* Transfer Ownership - Admin Only */}
                              {isAdmin && (
                                <button
                                  onClick={() => setTransferUser(item)}
                                  className="p-2 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 text-amber-400"
                                  title="Transfer Admin Ownership"
                                >
                                  <UserCheck size={12} />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}

                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-theme-text-muted italic">No workspace members match the filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

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

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-theme-border/40 pb-2">
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus size={16} className="text-theme-primary" /> Invite Team Member
              </h3>
              <button onClick={() => { setShowInviteModal(false); setInviteSuccess(''); setGeneratedLink(''); }} className="text-theme-text-muted hover:text-theme-text text-xs font-bold">Close</button>
            </div>
            
            {inviteSuccess && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle size={14} /> {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Email Address</label>
                <div className="relative mt-1">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="user@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 pl-9 pr-3 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary font-bold"
                >
                  <option value="USER">User Role</option>
                  <option value="MANAGER">Manager Role</option>
                  <option value="ADMIN">Admin Role</option>
                </select>
              </div>

              {generatedLink && (
                <div className="p-3 rounded-xl bg-theme-bg-alt border border-theme-border space-y-2">
                  <span className="block text-[10px] font-mono text-emerald-400 select-all overflow-x-auto">{generatedLink}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert('Invitation link copied to clipboard!');
                    }}
                    className="w-full py-1 text-[10px] bg-theme-primary hover:bg-theme-primary-hover text-white rounded-xl font-bold"
                  >
                    Copy Link
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2.5 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-theme-primary/20"
              >
                {inviting ? <Loader2 size={15} className="animate-spin" /> : 'Create Invite Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">Edit Team Member Details</h3>
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
            <p className="text-xs text-theme-text-muted">Set a new password for <span className="font-bold text-theme-text">{resetUser.fullName}</span>.</p>
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
              Your role will immediately be changed to <span className="font-bold text-theme-text">MANAGER</span>.
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
