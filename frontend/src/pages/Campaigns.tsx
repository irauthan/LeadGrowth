import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Campaign } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  Plus, 
  Loader2
} from 'lucide-react';
import { downloadReport } from '../services/reportService';

export default function Campaigns() {
  const user = useAuthStore((state) => state.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<keyof Campaign>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Create Campaign modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    platform: 'Meta',
    status: 'Active',
    spend: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    revenue: 0,
  });

  const isAdmin = user?.roles.includes('ROLE_ADMIN');
  const isManager = user?.roles.includes('ROLE_MANAGER');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(res.data);
    } catch (e) {
      console.error('Error fetching campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/campaigns', createForm);
      setShowCreateModal(false);
      // Reset form
      setCreateForm({
        name: '',
        platform: 'Meta',
        status: 'Active',
        spend: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0,
      });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  // Sorting Handler
  const requestSort = (key: keyof Campaign) => {
    let order: 'asc' | 'desc' = 'asc';
    if (sortBy === key && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortBy(key);
    setSortOrder(order);
  };

  // Export Handlers
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await downloadReport('campaigns', format);
    } catch (err) {
      console.error(err);
      alert(`Failed to export campaigns as ${format.toUpperCase()}.`);
    }
  };

  // Filtered & Sorted campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = platformFilter === 'All' || c.platform === platformFilter;
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-theme-text">Campaigns</h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            Monitor spend, clicks, CTR, and platform return on ad spend (ROAS).
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap gap-3">
          {/* Export triggers */}
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-2xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-theme-bg-alt text-theme-text transition-all">
              <Download size={16} />
              <span>Export Report</span>
            </button>
            <div className="absolute right-0 top-11 hidden w-36 rounded-xl border border-theme-border bg-theme-card p-1 shadow-2xl group-hover:block z-10">
              <button onClick={() => handleExport('csv')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">CSV Spreadsheet</button>
              <button onClick={() => handleExport('excel')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">Excel Sheet</button>
              <button onClick={() => handleExport('pdf')} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-theme-text hover:bg-theme-bg-alt">PDF Document</button>
            </div>
          </div>

          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:scale-[1.01] hover:shadow-brand-500/30 nav-glow"
            >
              <Plus size={16} />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters block */}
      <div className="flex flex-col gap-4 rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-theme-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2 pl-9 pr-4 text-xs outline-none focus:border-theme-primary text-theme-text"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-theme-text-muted">Platform:</span>
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary"
            >
              <option value="All">All Platforms</option>
              <option value="Meta">Meta</option>
              <option value="Google">Google</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-theme-text-muted">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="glass-card overflow-hidden rounded-3xl border border-theme-border bg-theme-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-theme-bg-alt/50 font-bold text-theme-text-muted">
                <th onClick={() => requestSort('name')} className="cursor-pointer py-4 pl-6 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Campaign Name</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('platform')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Platform</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('impressions')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Impressions</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('clicks')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Clicks</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="py-4">CTR</th>
                <th className="py-4">CPC</th>
                <th onClick={() => requestSort('leadsCount')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Leads</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('conversions')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Conversions</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('spend')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Spend</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th onClick={() => requestSort('revenue')} className="cursor-pointer py-4 select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Revenue</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="py-4 pr-6">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60">
              {currentItems.map((c) => {
                const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0.0;
                const cpc = c.clicks > 0 ? c.spend / c.clicks : 0.0;
                const roas = c.spend > 0 ? c.revenue / c.spend : 0.0;

                return (
                  <tr key={c.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                    <td className="py-4 pl-6 font-bold text-theme-text">{c.name}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.platform === 'Meta' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-theme-text">{formatNumber(c.impressions)}</td>
                    <td className="py-4 font-semibold text-theme-text">{formatNumber(c.clicks)}</td>
                    <td className="py-4 font-semibold text-theme-text">{ctr.toFixed(2)}%</td>
                    <td className="py-4 font-semibold text-theme-text">${cpc.toFixed(2)}</td>
                    <td className="py-4 font-bold text-theme-primary">{c.leadsCount}</td>
                    <td className="py-4 font-bold text-emerald-400">{c.conversions}</td>
                    <td className="py-4 font-semibold text-theme-text">{formatCurrency(c.spend)}</td>
                    <td className="py-4 font-semibold text-theme-text">{formatCurrency(c.revenue)}</td>
                    <td className="py-4 pr-6 font-extrabold text-theme-primary">{roas.toFixed(2)}x</td>
                  </tr>
                );
              })}
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-theme-text-muted font-semibold">
                    No campaigns found. Change filter parameters or create a campaign!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-2">
          <span className="text-xs text-theme-text-muted">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="rounded-xl border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-theme-bg-alt disabled:opacity-40 text-theme-text"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  currentPage === i + 1
                    ? 'bg-theme-primary text-white shadow'
                    : 'border border-theme-border bg-theme-card hover:bg-theme-bg-alt text-theme-text'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="rounded-xl border border-theme-border bg-theme-card px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-theme-bg-alt disabled:opacity-40 text-theme-text"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-theme-card border border-theme-border p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-theme-text">Create Campaign</h3>
            <p className="text-xs text-theme-text-muted mb-4">Set up a manual simulation campaign.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meta Lead Generation Adset"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Platform</label>
                  <select
                    value={createForm.platform}
                    onChange={(e) => setCreateForm({ ...createForm, platform: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="Meta">Meta</option>
                    <option value="Google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Impressions</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.impressions}
                    onChange={(e) => setCreateForm({ ...createForm, impressions: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Clicks</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.clicks}
                    onChange={(e) => setCreateForm({ ...createForm, clicks: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Spend ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.spend}
                    onChange={(e) => setCreateForm({ ...createForm, spend: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Revenue ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.revenue}
                    onChange={(e) => setCreateForm({ ...createForm, revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-2xl border border-theme-border bg-theme-bg-alt px-5 py-2.5 text-sm font-semibold hover:bg-theme-bg text-theme-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-theme-primary/10 transition-all"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
