import React, { useState, useEffect } from 'react';
import { 
  X, 
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
  Calendar,
  BarChart3,
  Flame,
  Award
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import type { CampaignDetails, CampaignLead } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { useAuthStore } from '../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number | null;
  onUpdated?: () => void;
}

export default function CampaignDetailsModal({
  isOpen,
  onClose,
  campaignId,
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
    if (isOpen && campaignId) {
      loadCampaignDetails(campaignId);
    } else {
      setDetails(null);
      setActiveTab('overview');
      setSaveSuccess(false);
    }
  }, [isOpen, campaignId]);

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

  if (!isOpen) return null;

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
      }, 1200);
    } catch (err) {
      console.error('Failed to update campaign', err);
      alert('Failed to update campaign. Please check inputs.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignId) return;
    if (!window.confirm(`Are you sure you want to delete campaign "${details?.campaign.name}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await campaignService.deleteCampaign(campaignId);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to delete campaign', err);
      alert('Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  const campaign = details?.campaign;
  const metrics = details?.metrics;
  const leads = details?.leads || [];

  const filteredLeads = leads.filter((l: CampaignLead) => 
    l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.phone && l.phone.includes(leadSearch)) ||
    (l.status && l.status.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  const getPlatformBadge = (platform: string) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('meta') || p.includes('facebook') || p.includes('instagram')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Meta Ads
        </span>
      );
    }
    if (p.includes('google')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Google Ads
        </span>
      );
    }
    if (p.includes('linkedin')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          LinkedIn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <span className="h-2 w-2 rounded-full bg-purple-500" />
        {platform || 'Digital Campaign'}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          Active
        </span>
      );
    }
    if (s === 'PAUSED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <PauseCircle size={12} />
          Paused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-slate-500/15 text-slate-400 border border-slate-500/30">
        <CheckCircle size={12} />
        Completed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-theme-border bg-theme-card shadow-2xl overflow-hidden transition-all my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-theme-border bg-theme-bg-alt/40">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {campaign && getPlatformBadge(campaign.platform)}
              {campaign && getStatusBadge(campaign.status)}
              <span className="text-[11px] font-mono text-theme-text-muted bg-theme-card px-2 py-0.5 rounded-md border border-theme-border">
                ID #{campaignId}
              </span>
              {campaign?.createdAt && (
                <span className="text-[11px] text-theme-text-muted flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-theme-text flex items-center gap-2">
              {loading ? (
                <span className="h-7 w-48 bg-theme-border/50 rounded-lg animate-pulse inline-block" />
              ) : (
                campaign?.name || 'Campaign Overview'
              )}
            </h2>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {campaign && canEdit && (
              <div className="flex items-center gap-1.5 bg-theme-card p-1 rounded-2xl border border-theme-border">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusToggle(campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    campaign.status === 'ACTIVE'
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                  }`}
                  title={campaign.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                >
                  {isUpdatingStatus ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : campaign.status === 'ACTIVE' ? (
                    <>
                      <PauseCircle size={13} />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={13} />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Delete Campaign"
                  >
                    {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt border border-theme-border transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-theme-border bg-theme-card">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <BarChart3 size={16} />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'leads'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Users size={16} />
            <span>Connected Leads ({leads.length})</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === 'edit'
                  ? 'border-theme-primary text-theme-primary'
                  : 'border-transparent text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <Edit3 size={16} />
              <span>Edit Metrics & Info</span>
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 max-h-[calc(92vh-180px)] space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 size={36} className="animate-spin text-theme-primary" />
              <span className="text-sm font-semibold text-theme-text-muted">Loading Campaign Performance...</span>
            </div>
          ) : !campaign ? (
            <div className="py-16 text-center text-theme-text-muted">
              <AlertCircle size={40} className="mx-auto mb-2 text-amber-400" />
              <p className="font-bold">Campaign details could not be found.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & PERFORMANCE */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Key Performance Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Metric 1: Total Spend */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4 relative overflow-hidden">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Spend</span>
                        <DollarSign size={14} className="text-blue-400" />
                      </div>
                      <div className="text-lg font-black text-theme-text">
                        {formatCurrency(campaign.spend || 0)}
                      </div>
                      {campaign.budget && campaign.budget > 0 ? (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-[10px] text-theme-text-muted mb-0.5">
                            <span>Budget: {formatCurrency(campaign.budget)}</span>
                            <span>{metrics?.budgetUsedPercent || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-theme-border overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                (metrics?.budgetUsedPercent || 0) > 90 ? 'bg-rose-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(metrics?.budgetUsedPercent || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-theme-text-muted">Active ad spend</span>
                      )}
                    </div>

                    {/* Metric 2: Impressions & CTR */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Impressions</span>
                        <Eye size={14} className="text-purple-400" />
                      </div>
                      <div className="text-lg font-black text-theme-text">
                        {formatNumber(campaign.impressions || 0)}
                      </div>
                      <div className="text-[10px] text-purple-400 font-semibold mt-1">
                        CTR: {metrics?.ctr || ((campaign.clicks / (campaign.impressions || 1)) * 100).toFixed(2)}%
                      </div>
                    </div>

                    {/* Metric 3: Clicks & CPC */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Clicks</span>
                        <MousePointer size={14} className="text-indigo-400" />
                      </div>
                      <div className="text-lg font-black text-theme-text">
                        {formatNumber(campaign.clicks || 0)}
                      </div>
                      <div className="text-[10px] text-indigo-400 font-semibold mt-1">
                        CPC: ${metrics?.cpc || (campaign.spend / (campaign.clicks || 1)).toFixed(2)}
                      </div>
                    </div>

                    {/* Metric 4: Leads Count */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Leads</span>
                        <Users size={14} className="text-theme-primary" />
                      </div>
                      <div className="text-lg font-black text-theme-primary">
                        {formatNumber(campaign.leadsCount || leads.length)}
                      </div>
                      <div className="text-[10px] text-theme-text-muted font-semibold mt-1">
                        From Ad Form / Sync
                      </div>
                    </div>

                    {/* Metric 5: Conversions & CPA */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Conversions</span>
                        <Target size={14} className="text-emerald-400" />
                      </div>
                      <div className="text-lg font-black text-emerald-400">
                        {formatNumber(campaign.conversions || 0)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                        CPA: ${metrics?.cpa || (campaign.spend / (campaign.conversions || 1)).toFixed(2)}
                      </div>
                    </div>

                    {/* Metric 6: Revenue & ROAS */}
                    <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
                      <div className="flex items-center justify-between text-theme-text-muted mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Revenue / ROAS</span>
                        <Award size={14} className="text-amber-400" />
                      </div>
                      <div className="text-lg font-black text-emerald-400">
                        {formatCurrency(campaign.revenue || 0)}
                      </div>
                      <div className="text-[10px] font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                        <Flame size={11} />
                        ROAS: {metrics?.roas || (campaign.spend > 0 ? (campaign.revenue / campaign.spend).toFixed(2) : '0')}x
                      </div>
                    </div>
                  </div>

                  {/* Funnel Visualizer */}
                  <div className="rounded-3xl border border-theme-border bg-theme-bg-alt/30 p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                          <Layers size={18} className="text-theme-primary" />
                          Ad Conversion Funnel
                        </h3>
                        <p className="text-xs text-theme-text-muted">End-to-end journey from impression to revenue conversion.</p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                        Profit: {formatCurrency((campaign.revenue || 0) - (campaign.spend || 0))}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                      {/* Step 1: Impressions */}
                      <div className="flex flex-col p-4 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">1. Impressions</span>
                        <span className="text-lg font-extrabold text-theme-text mt-1">{formatNumber(campaign.impressions || 0)}</span>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-theme-text-muted">
                          <span>CTR</span>
                          <span className="font-bold text-purple-400">{metrics?.ctr || 0}%</span>
                        </div>
                      </div>

                      {/* Step 2: Clicks */}
                      <div className="flex flex-col p-4 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">2. Clicks</span>
                        <span className="text-lg font-extrabold text-indigo-400 mt-1">{formatNumber(campaign.clicks || 0)}</span>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-theme-text-muted">
                          <span>Click to Lead</span>
                          <span className="font-bold text-indigo-400">
                            {campaign.clicks > 0 ? (((campaign.leadsCount || leads.length) / campaign.clicks) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Step 3: Leads */}
                      <div className="flex flex-col p-4 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">3. Ingested Leads</span>
                        <span className="text-lg font-extrabold text-theme-primary mt-1">{formatNumber(campaign.leadsCount || leads.length)}</span>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-theme-text-muted">
                          <span>Lead to Won</span>
                          <span className="font-bold text-emerald-400">
                            {(campaign.leadsCount || leads.length) > 0 ? ((campaign.conversions / (campaign.leadsCount || leads.length)) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Step 4: Closed Won */}
                      <div className="flex flex-col p-4 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="text-[10px] font-extrabold uppercase text-theme-text-muted">4. Conversions</span>
                        <span className="text-lg font-extrabold text-emerald-400 mt-1">{formatNumber(campaign.conversions || 0)}</span>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-theme-text-muted">
                          <span>Total Return</span>
                          <span className="font-extrabold text-emerald-400">{formatCurrency(campaign.revenue || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI & Analytic Insights Card */}
                  <div className="rounded-3xl border border-theme-border bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-theme-text">Campaign Health & Growth Insights</h4>
                        <p className="text-xs text-theme-text-muted">Automated diagnostic performance audit for this campaign.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="font-bold text-theme-text flex items-center gap-1.5 mb-1">
                          <TrendingUp size={14} className="text-emerald-400" />
                          ROAS Multiplier
                        </span>
                        <p className="text-theme-text-muted leading-relaxed">
                          {(metrics?.roas || 0) >= 3 ? (
                            <span className="text-emerald-400 font-semibold">High Efficiency:</span>
                          ) : (
                            <span className="text-amber-400 font-semibold">Moderate Efficiency:</span>
                          )}{' '}
                          Campaign generates {metrics?.roas || (campaign.spend > 0 ? (campaign.revenue / campaign.spend).toFixed(1) : '0')}x return on every ad dollar spent.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-theme-card border border-theme-border">
                        <span className="font-bold text-theme-text flex items-center gap-1.5 mb-1">
                          <MousePointer size={14} className="text-blue-400" />
                          Click Quality & CPC
                        </span>
                        <p className="text-theme-text-muted leading-relaxed">
                          Average Cost Per Click is ${metrics?.cpc || (campaign.spend / (campaign.clicks || 1)).toFixed(2)}. 
                          Click-through rate of {metrics?.ctr || 0}% shows healthy ad relevance.
                        </p>
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
                      <h3 className="text-base font-bold text-theme-text">Campaign Leads</h3>
                      <p className="text-xs text-theme-text-muted">
                        Leads registered or ingested through {campaign.name}.
                      </p>
                    </div>

                    <input
                      type="text"
                      placeholder="Search leads by name, email, status..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-xs outline-none text-theme-text focus:border-theme-primary w-full sm:w-72"
                    />
                  </div>

                  {filteredLeads.length === 0 ? (
                    <div className="py-12 text-center rounded-3xl border border-theme-border bg-theme-bg-alt/30">
                      <Users size={32} className="mx-auto mb-2 text-theme-text-muted" />
                      <p className="text-sm font-semibold text-theme-text">No leads found for this campaign.</p>
                      <p className="text-xs text-theme-text-muted mt-1">
                        Leads will appear here as soon as they are assigned or captured with this campaign tag.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-theme-border bg-theme-bg-alt/60 font-bold text-theme-text-muted">
                              <th className="py-3 pl-4">Lead Name</th>
                              <th className="py-3 px-3">Contact</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Deal Value</th>
                              <th className="py-3 px-3">Assigned To</th>
                              <th className="py-3 pr-4">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border/50">
                            {filteredLeads.map((lead: CampaignLead) => (
                              <tr key={lead.id} className="hover:bg-theme-bg-alt/40 transition-colors">
                                <td className="py-3 pl-4 font-bold text-theme-text">
                                  {lead.name}
                                </td>
                                <td className="py-3 px-3 text-theme-text-muted">
                                  <div>{lead.email}</div>
                                  {lead.phone && <div className="text-[10px]">{lead.phone}</div>}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    (lead.status || '').toLowerCase().includes('won') || (lead.status || '').toLowerCase().includes('convert')
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}>
                                    {lead.status || 'New'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-theme-text">
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

              {/* TAB 3: EDIT CAMPAIGN & AD METRICS */}
              {activeTab === 'edit' && canEdit && (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {saveSuccess && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>Campaign updated successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary font-medium"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Platform
                      </label>
                      <select
                        value={editForm.platform}
                        onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      >
                        <option value="Meta">Meta (Facebook & Instagram)</option>
                        <option value="Google">Google Search & Display</option>
                        <option value="LinkedIn">LinkedIn Ads</option>
                        <option value="TikTok">TikTok Ads</option>
                        <option value="Organic">Organic / Direct</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PAUSED">PAUSED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Campaign Budget ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.budget}
                        onChange={(e) => setEditForm({ ...editForm, budget: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Total Ad Spend ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.spend}
                        onChange={(e) => setEditForm({ ...editForm, spend: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Impressions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.impressions}
                        onChange={(e) => setEditForm({ ...editForm, impressions: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Clicks
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.clicks}
                        onChange={(e) => setEditForm({ ...editForm, clicks: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Conversions (Closed Deals)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.conversions}
                        onChange={(e) => setEditForm({ ...editForm, conversions: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                        Total Generated Revenue ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.revenue}
                        onChange={(e) => setEditForm({ ...editForm, revenue: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt px-4 py-2.5 text-xs outline-none text-theme-text focus:border-theme-primary font-bold text-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-theme-border">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="px-4 py-2.5 rounded-2xl border border-theme-border text-xs font-bold text-theme-text hover:bg-theme-bg-alt"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-lg shadow-theme-primary/20 transition-all"
                    >
                      {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
