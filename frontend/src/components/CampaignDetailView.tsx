import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MousePointer, 
  Eye, 
  Target, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  PauseCircle, 
  PlayCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Save, 
  Loader2, 
  ArrowRight,
  Calendar,
  Search,
  RefreshCw,
  Award
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import type { Campaign, CampaignDetails, CampaignLead } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { useAuthStore } from '../store/authStore';

interface Props {
  campaignId: number;
  onBack: () => void;
  onUpdated?: () => void;
}

export default function CampaignDetailView({
  campaignId,
  onBack,
  onUpdated
}: Props) {
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = userRoles.includes('ROLE_ADMIN');
  const isManager = userRoles.includes('ROLE_MANAGER');
  const canEdit = isAdmin || isManager;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<CampaignDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'edit'>('overview');
  const [leadSearch, setLeadSearch] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    platform: 'Meta',
    status: 'ACTIVE',
    budget: 0,
    spend: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails(campaignId);
    }
  }, [campaignId]);

  const loadCampaignDetails = async (id: number) => {
    setLoading(true);
    try {
      const data = await campaignService.getCampaignDetails(id);
      setDetails(data);
      if (data?.campaign) {
        setEditForm({
          name: data.campaign.name || '',
          platform: data.campaign.platform || 'Meta',
          status: data.campaign.status || 'ACTIVE',
          budget: data.campaign.budget || 0,
          spend: data.campaign.spend || 0,
          clicks: data.campaign.clicks || 0,
          impressions: data.campaign.impressions || 0,
          conversions: data.campaign.conversions || 0,
          revenue: data.campaign.revenue || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load campaign details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (newStatus: string) => {
    if (!campaignId) return;
    setIsUpdatingStatus(true);
    try {
      await campaignService.updateCampaignStatus(campaignId, newStatus);
      if (details) {
        setDetails({
          ...details,
          campaign: { ...details.campaign, status: newStatus }
        });
        setEditForm(prev => ({ ...prev, status: newStatus }));
      }
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update campaign status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) return;
    setIsSavingEdit(true);
    try {
      await campaignService.updateCampaign(campaignId, editForm);
      setSaveSuccess(true);
      await loadCampaignDetails(campaignId);
      if (onUpdated) onUpdated();
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('overview');
      }, 1000);
    } catch (err) {
      console.error('Failed to update campaign', err);
      alert('Failed to update campaign.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignId) return;
    if (!window.confirm(`Are you sure you want to delete campaign "${details?.campaign.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await campaignService.deleteCampaign(campaignId);
      if (onUpdated) onUpdated();
      onBack();
    } catch (err) {
      console.error('Failed to delete campaign', err);
      alert('Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-theme-primary" />
        <span className="text-xs font-semibold text-theme-text-muted">Loading Campaign Details...</span>
      </div>
    );
  }

  if (!details?.campaign) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-amber-500" />
        <h3 className="text-lg font-bold text-theme-text">Campaign Not Found</h3>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-primary text-white text-xs font-bold"
        >
          <ArrowLeft size={14} /> Back to Campaigns
        </button>
      </div>
    );
  }

  const campaign = details.campaign;
  const metrics = details.metrics;
  const leads = details.leads || [];

  const filteredLeads = leads.filter((l: CampaignLead) => 
    (l.name || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.phone && l.phone.includes(leadSearch)) ||
    (l.status && l.status.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  const isActive = (campaign.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
  const isPaused = (campaign.status || '').toUpperCase() === 'PAUSED';

  return (
    <div className="space-y-6 animate-fadeIn w-full pb-10">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-theme-border/60 pb-5">
        <div className="space-y-2">
          {/* Back Navigation & Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-theme-text-muted">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-semibold hover:text-theme-primary transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-theme-bg-alt"
            >
              <ArrowLeft size={14} />
              <span>Campaigns</span>
            </button>
            <span>/</span>
            <span className="font-medium text-theme-text truncate max-w-[200px] sm:max-w-xs">
              {campaign.name}
            </span>
          </div>

          {/* Title & Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-text">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-theme-bg-alt border border-theme-border text-theme-text">
                {campaign.platform}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : isPaused
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-500/10 border-slate-500/30 text-slate-500'
              }`}>
                {campaign.status || 'ACTIVE'}
              </span>
              {campaign.createdAt && (
                <span className="text-xs text-theme-text-muted hidden md:inline-flex items-center gap-1 ml-2">
                  <Calendar size={12} />
                  {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusToggle(isActive ? 'PAUSED' : 'ACTIVE')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isActive ? (
                  <>
                    <PauseCircle size={14} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} />
                    <span>Activate</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab(activeTab === 'edit' ? 'overview' : 'edit')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  activeTab === 'edit'
                    ? 'bg-theme-primary text-white border-theme-primary'
                    : 'border-theme-border text-theme-text hover:bg-theme-bg-alt'
                }`}
              >
                <Edit3 size={14} />
                <span>{activeTab === 'edit' ? 'Close Edit' : 'Edit'}</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                  title="Delete Campaign"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </>
          )}

          <button
            onClick={() => loadCampaignDetails(campaignId)}
            className="p-2 text-theme-text-muted hover:text-theme-text border border-theme-border rounded-xl hover:bg-theme-bg-alt transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Modern Clean Tabs */}
      <div className="flex items-center gap-2 border-b border-theme-border/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 ${
            activeTab === 'overview'
              ? 'border-theme-primary text-theme-primary'
              : 'border-transparent text-theme-text-muted hover:text-theme-text'
          }`}
        >
          Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 ${
            activeTab === 'leads'
              ? 'border-theme-primary text-theme-primary'
              : 'border-transparent text-theme-text-muted hover:text-theme-text'
          }`}
        >
          Connected Leads ({leads.length})
        </button>

        {canEdit && (
          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all px-2 ${
              activeTab === 'edit'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            Edit Settings
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Clean 6-Card KPI Grid (Minimalist & Professional) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: Total Spend */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Total Spend
              </span>
              <div className="text-xl font-bold text-theme-text">
                {formatCurrency(campaign.spend || 0)}
              </div>
              <div className="text-[11px] text-theme-text-muted pt-1">
                {campaign.budget && campaign.budget > 0 ? (
                  <span>Budget: {formatCurrency(campaign.budget)} ({metrics?.budgetUsedPercent || 0}%)</span>
                ) : (
                  <span>Ad budget</span>
                )}
              </div>
            </div>

            {/* Card 2: Impressions */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Impressions
              </span>
              <div className="text-xl font-bold text-theme-text">
                {formatNumber(campaign.impressions || 0)}
              </div>
              <div className="text-[11px] text-theme-text-muted pt-1">
                CTR: <strong className="text-theme-text">{metrics?.ctr || 0}%</strong>
              </div>
            </div>

            {/* Card 3: Clicks */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Clicks
              </span>
              <div className="text-xl font-bold text-theme-text">
                {formatNumber(campaign.clicks || 0)}
              </div>
              <div className="text-[11px] text-theme-text-muted pt-1">
                CPC: <strong className="text-theme-text">${metrics?.cpc || 0}</strong>
              </div>
            </div>

            {/* Card 4: Leads */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Leads Captured
              </span>
              <div className="text-xl font-bold text-theme-primary">
                {formatNumber(campaign.leadsCount || leads.length)}
              </div>
              <div className="text-[11px] text-theme-text-muted pt-1">
                From Ad form / sync
              </div>
            </div>

            {/* Card 5: Conversions */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Conversions
              </span>
              <div className="text-xl font-bold text-theme-text">
                {formatNumber(campaign.conversions || 0)}
              </div>
              <div className="text-[11px] text-theme-text-muted pt-1">
                CPA: <strong className="text-theme-text">${metrics?.cpa || 0}</strong>
              </div>
            </div>

            {/* Card 6: Revenue & ROAS */}
            <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
              <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
                Revenue / ROAS
              </span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(campaign.revenue || 0)}
              </div>
              <div className="text-[11px] font-semibold text-theme-text-muted pt-1">
                ROAS: <strong className="text-emerald-600 dark:text-emerald-400">{metrics?.roas || 0}x</strong>
              </div>
            </div>
          </div>

          {/* Clean Step Conversion Funnel */}
          <div className="rounded-2xl border border-theme-border bg-theme-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-theme-text">
                  Conversion Funnel Pipeline
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Flow from ad views to captured leads and closed won deals.
                </p>
              </div>
              <div className="text-xs font-semibold text-theme-text bg-theme-bg-alt px-3 py-1.5 rounded-xl border border-theme-border w-fit">
                Net Profit: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency((campaign.revenue || 0) - (campaign.spend || 0))}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {/* Step 1: Impressions */}
              <div className="rounded-xl border border-theme-border bg-theme-bg-alt/40 p-4 space-y-2">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
                  1. Impressions
                </span>
                <div className="text-lg font-bold text-theme-text">
                  {formatNumber(campaign.impressions || 0)}
                </div>
                <div className="text-xs text-theme-text-muted">
                  CTR: <span className="font-semibold text-theme-text">{metrics?.ctr || 0}%</span>
                </div>
              </div>

              {/* Step 2: Clicks */}
              <div className="rounded-xl border border-theme-border bg-theme-bg-alt/40 p-4 space-y-2">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
                  2. Clicks
                </span>
                <div className="text-lg font-bold text-theme-text">
                  {formatNumber(campaign.clicks || 0)}
                </div>
                <div className="text-xs text-theme-text-muted">
                  Click to Lead: <span className="font-semibold text-theme-text">
                    {campaign.clicks > 0 ? (((campaign.leadsCount || leads.length) / campaign.clicks) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Step 3: Leads */}
              <div className="rounded-xl border border-theme-border bg-theme-bg-alt/40 p-4 space-y-2">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
                  3. Ingested Leads
                </span>
                <div className="text-lg font-bold text-theme-primary">
                  {formatNumber(campaign.leadsCount || leads.length)}
                </div>
                <div className="text-xs text-theme-text-muted">
                  Lead to Won: <span className="font-semibold text-theme-text">
                    {(campaign.leadsCount || leads.length) > 0 ? ((campaign.conversions / (campaign.leadsCount || leads.length)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Step 4: Conversions */}
              <div className="rounded-xl border border-theme-border bg-theme-bg-alt/40 p-4 space-y-2">
                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
                  4. Closed Conversions
                </span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(campaign.conversions || 0)}
                </div>
                <div className="text-xs text-theme-text-muted">
                  Revenue: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(campaign.revenue || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTED LEADS */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-theme-text">Campaign Leads</h3>
              <p className="text-xs text-theme-text-muted">
                Leads received through {campaign.name}.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-card py-2 pl-9 pr-3 text-xs outline-none text-theme-text focus:border-theme-primary"
              />
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
              <Users size={32} className="mx-auto mb-2 text-theme-text-muted" />
              <p className="text-sm font-semibold text-theme-text">No leads found for this campaign.</p>
              <p className="text-xs text-theme-text-muted mt-1">
                Leads captured from ad webhooks or assigned to this campaign will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-theme-border bg-theme-bg-alt font-semibold text-theme-text-muted">
                      <th className="py-3 pl-4">Lead Name</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Deal Value</th>
                      <th className="py-3 px-3">Assigned To</th>
                      <th className="py-3 pr-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/50">
                    {filteredLeads.map((lead: CampaignLead) => (
                      <tr key={lead.id} className="hover:bg-theme-bg-alt/50 transition-colors">
                        <td className="py-3 pl-4 font-semibold text-theme-text">
                          {lead.name}
                        </td>
                        <td className="py-3 px-3 text-theme-text-muted">
                          <div>{lead.email}</div>
                          {lead.phone && <div className="text-[11px] text-theme-text-muted">{lead.phone}</div>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-theme-bg-alt border border-theme-border text-theme-text">
                            {lead.status || 'New'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-theme-text">
                          {lead.dealValue ? formatCurrency(lead.dealValue) : '—'}
                        </td>
                        <td className="py-3 px-3 text-theme-text-muted">
                          {lead.assignedToName || 'Unassigned'}
                        </td>
                        <td className="py-3 pr-4 text-theme-text-muted whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EDIT SETTINGS */}
      {activeTab === 'edit' && canEdit && (
        <div className="max-w-2xl rounded-2xl border border-theme-border bg-theme-card p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-theme-text">Edit Campaign Settings</h3>
            <p className="text-xs text-theme-text-muted">Update budget, ad performance metrics, and status.</p>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={15} />
              <span>Campaign updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary font-medium"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Platform
                </label>
                <select
                  value={editForm.platform}
                  onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                >
                  <option value="Meta">Meta (Facebook & Instagram)</option>
                  <option value="Google">Google Search & Display</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="TikTok">TikTok Ads</option>
                  <option value="Organic">Organic / Direct</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Budget ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Ad Spend ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.spend}
                  onChange={(e) => setEditForm({ ...editForm, spend: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Impressions
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.impressions}
                  onChange={(e) => setEditForm({ ...editForm, impressions: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Clicks
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.clicks}
                  onChange={(e) => setEditForm({ ...editForm, clicks: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Conversions
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.conversions}
                  onChange={(e) => setEditForm({ ...editForm, conversions: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Generated Revenue ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.revenue}
                  onChange={(e) => setEditForm({ ...editForm, revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs outline-none text-theme-text focus:border-theme-primary font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-theme-border/60">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-bg-alt"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold transition-all"
              >
                {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
