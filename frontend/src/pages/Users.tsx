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
  ExternalLink,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export default function Users() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.roles.includes('ROLE_ADMIN');

  // States
  const [members, setMembers] = useState<MemberType[]>([]);
  const [productivity, setProductivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'USER'>('ALL');
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'Marketing' | 'Sales' | 'Support' | 'Management'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'ACTIVE_DESC' | 'PROD_DESC'>('NAME_ASC');

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, prodRes] = await Promise.all([
        api.get('/api/users/members'),
        api.get('/api/users/productivity')
      ]);
      setMembers(membersRes.data);
      setProductivity(prodRes.data);
    } catch (e) {
      console.error('Failed to fetch team details', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/users/members');
      setMembers(res.data);
    } catch (e) {
      console.error(e);
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
    } else if (sortOrder === 'PROD_DESC') {
      const scoreA = productivity.find(p => p.userId === a.id)?.productivityScore || 0;
      const scoreB = productivity.find(p => p.userId === b.id)?.productivityScore || 0;
      return scoreB - scoreA;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-card border border-theme-border rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary">
            <Building size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-theme-text uppercase tracking-wider">Team Performance & Directory</h2>
            <p className="text-[11px] text-theme-text-muted mt-0.5">Track workload distribution, live team availability, and productivity scores.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/admin/users"
              className="flex items-center gap-1.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-4 py-2.5 text-xs font-bold shadow-lg"
            >
              Manage Seats <ExternalLink size={12} />
            </Link>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-theme-bg-alt hover:bg-theme-card text-theme-text px-4 py-2.5 text-xs font-bold"
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 pl-10 text-xs font-semibold text-theme-text outline-none focus:border-theme-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value as any); setCurrentPage(1); }}
            className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
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
            className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="ACTIVE_DESC">Last Active</option>
            <option value="PROD_DESC">Top Performers</option>
          </select>
        </div>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginated.map((item) => {
          const prod = productivity.find(p => p.userId === item.id);
          
          return (
            <div key={item.id} className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-xl space-y-4 flex flex-col justify-between hover:shadow-2xl transition-all">
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary font-extrabold text-base border border-theme-primary/10 relative">
                    {getInitials(item.fullName)}
                    {/* Live Availability dot on avatar */}
                    <span className={`absolute -bottom-0.5 -right-0.5 block h-3.5 w-3.5 rounded-full border-2 border-theme-card ${
                      item.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500' :
                      item.availabilityStatus === 'BUSY' ? 'bg-amber-500' :
                      item.availabilityStatus === 'ON_BREAK' ? 'bg-blue-400' :
                      item.availabilityStatus === 'OFFLINE' ? 'bg-slate-500' :
                      'bg-purple-500'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-theme-text leading-tight">{item.fullName}</h4>
                    <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-wider mt-0.5">{item.designation || 'CRM Specialist'}</p>
                  </div>
                </div>

                {/* Productivity Section */}
                {prod && (
                  <div className="bg-theme-bg-alt border border-theme-border rounded-2xl p-3 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-indigo-600 dark:text-indigo-400" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-theme-text-muted font-bold uppercase tracking-wider">Performance Index</span>
                        <span className="text-xs font-black text-theme-text">{Math.round(prod.productivityScore)}% Score</span>
                      </div>
                    </div>
                    <span className={`rounded-xl px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wide ${
                      prod.performanceCategory === 'Top Performer' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      prod.performanceCategory === 'Average Performer' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {prod.performanceCategory}
                    </span>
                  </div>
                )}



                {/* Contact details */}
                <div className="space-y-2 border-t border-theme-border pt-3">
                  <div className="flex items-center gap-2 text-theme-text-muted">
                    <Mail size={13} className="text-theme-text-muted" />
                    <span className="text-[10px] font-mono truncate">{item.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-theme-text-muted">
                    <Smartphone size={13} className="text-theme-text-muted" />
                    <span className="text-[10px]">{item.phone || 'No phone listed'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-theme-text-muted">
                    <Building size={13} className="text-theme-text-muted" />
                    <span className="text-[10px] font-semibold text-theme-text-muted">Department: {item.department || 'Marketing'}</span>
                  </div>
                </div>
              </div>

              {/* Status details footer */}
              <div className="flex items-center justify-between border-t border-theme-border pt-3 text-[10px] font-bold">
                <span className="text-theme-text-muted uppercase">Role: <span className="text-theme-primary">{getRoleName(item)}</span></span>
                
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded-full ${
                    item.availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                    item.availabilityStatus === 'BUSY' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                    item.availabilityStatus === 'ON_BREAK' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                    'bg-theme-bg-alt text-theme-text-muted'
                  }`}>
                    {item.availabilityStatus || 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {paginated.length === 0 && (
          <div className="col-span-full py-12 text-center text-theme-text-muted italic">No workspace members match the filters.</div>
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
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-bg-alt hover:bg-theme-card text-theme-text disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-theme-border bg-theme-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-theme-border pb-2">
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5"><UserPlus size={16} /> Invite Team Member</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteSuccess(''); setGeneratedLink(''); }} className="text-theme-text-muted hover:text-theme-text text-xs font-bold">Close</button>
            </div>
            
            {inviteSuccess && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs text-theme-text outline-none focus:border-theme-primary"
                />
              </div>

              {generatedLink && (
                <div className="p-3 rounded-xl bg-theme-bg-alt border border-theme-border space-y-2">
                  <span className="block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 select-all overflow-x-auto">{generatedLink}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      alert('Link copied to clipboard!');
                    }}
                    className="w-full py-1 text-[10px] bg-theme-primary hover:bg-theme-primary-hover text-white rounded font-bold"
                  >
                    Copy Link
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="w-full py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
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
