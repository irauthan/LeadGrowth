import { useEffect, useState } from 'react';
import api from '../services/api';
import type { User as MemberType } from '../types';
import { 
  Loader2, 
  Mail, 
  Smartphone, 
  Building,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export default function Users() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.roles.includes('ROLE_ADMIN');

  // States
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'USER'>('ALL');
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'Marketing' | 'Sales' | 'Support' | 'Management'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'ACTIVE_DESC'>('NAME_ASC');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
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

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setGeneratedLink('');
    setInviteSuccess('');

    try {
      const res = await api.post('/api/users/invite', { email: inviteEmail, role: 'USER' });
      const link = `${window.location.origin}/auth?inviteToken=${res.data.token}`;
      setGeneratedLink(link);
      setInviteSuccess(`Invitation created successfully!`);
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
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

  // Filters
  const filtered = members.filter(m => {
    const matchesSearch = m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleName = getRoleName(m);
    const matchesRole = roleFilter === 'ALL' || roleName === roleFilter;
    const matchesDept = deptFilter === 'ALL' || (m.department || 'Marketing') === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'NAME_ASC') {
      return (a.fullName || '').localeCompare(b.fullName || '');
    } else if (sortOrder === 'NAME_DESC') {
      return (b.fullName || '').localeCompare(a.fullName || '');
    } else if (sortOrder === 'ACTIVE_DESC') {
      return (b.lastActiveAt || '').localeCompare(a.lastActiveAt || '');
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
            <Building size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Workspace Members Directory</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Explore active profiles, departments, and communication handles of the team.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/admin/users"
              className="flex items-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-blue-500/10"
            >
              Manage Seats <ExternalLink size={12} />
            </Link>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 text-xs font-bold"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-2xl border border-slate-800 bg-[#111827] px-4 py-2.5 pl-10 text-xs font-semibold text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="Management">Management</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-slate-800 bg-[#111827] px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
          >
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="ACTIVE_DESC">Last Active</option>
          </select>
        </div>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-500 font-extrabold text-base">
                  {getInitials(item.fullName)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{item.fullName}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{item.designation || 'Specialist'}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-800/40 pt-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail size={14} className="text-slate-500" />
                  <span className="text-[11px] font-mono">{item.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Smartphone size={14} className="text-slate-500" />
                  <span className="text-[11px]">{item.phone || 'No phone listed'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building size={14} className="text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-400">Dept: {item.department || 'Marketing'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 text-[10px] font-bold">
              <span className="text-slate-500 uppercase">Role: <span className="text-blue-400">{getRoleName(item)}</span></span>
              <span className={`px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {item.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 italic">No workspace members match the filters.</div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-400">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><UserPlus size={16} /> Invite Team Member</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteSuccess(''); setGeneratedLink(''); }} className="text-slate-500 hover:text-white text-xs font-bold">Close</button>
            </div>
            
            {inviteSuccess && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              {generatedLink && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <span className="block text-[10px] font-mono text-emerald-400 select-all overflow-x-auto">{generatedLink}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert('Link copied to clipboard!');
                    }}
                    className="w-full py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
                  >
                    Copy Link
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : 'Create Invite Link'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
