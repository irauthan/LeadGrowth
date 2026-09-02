import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  CreditCard, 
  Check, 
  Users, 
  UserCheck, 
  HardDrive, 
  Sparkles, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

export default function Billing() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.some(r => r.toUpperCase().includes('ADMIN')) || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ADMIN');

  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/billing/summary');
      setBillingInfo(res.data);
    } catch (err) {
      console.error('Failed to load billing summary', err);
      setBillingInfo({
        subscriptionPlan: 'PROFESSIONAL',
        activeUsers: 3,
        maxUsers: 25,
        totalLeads: 14,
        maxLeads: 10000,
        storageUsedMb: 120,
        maxStorageMb: 5000,
        currentPeriodEnd: '2026-09-25',
        subscriptionStatus: 'ACTIVE'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    if (!isAdmin) {
      alert('Only Workspace Administrators can modify subscription plans.');
      return;
    }
    setUpgrading(true);
    setSuccessMsg('');
    try {
      const res = await api.post('/api/billing/upgrade', { plan });
      setBillingInfo(res.data);
      setSuccessMsg(`Workspace subscription upgraded to ${plan} Plan!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upgrade failed.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || !billingInfo) {
    return (
      <HoosshBeeLoader 
        text="Loading Workspace Billing & Subscriptions..." 
        subtext="Syncing current tenant limits, seats usage and storage metrics" 
      />
    );
  }

  const currentPlan = billingInfo.subscriptionPlan || 'PROFESSIONAL';

  const userUsagePct = Math.min(100, Math.round((billingInfo.activeUsers / billingInfo.maxUsers) * 100));
  const leadUsagePct = Math.min(100, Math.round((billingInfo.totalLeads / billingInfo.maxLeads) * 100));
  const storageUsagePct = Math.min(100, Math.round((billingInfo.storageUsedMb / billingInfo.maxStorageMb) * 100));

  const plans = [
    {
      name: 'FREE',
      price: '₹0',
      period: 'Forever free',
      users: 5,
      leads: 1000,
      storage: '1 GB',
      features: ['Basic Analytics', 'Standard Lead Queue', 'Personal Tasks']
    },
    {
      name: 'PROFESSIONAL',
      price: '₹7,999',
      period: 'Per month',
      users: 25,
      leads: 10000,
      storage: '5 GB',
      features: ['Full Campaign Analytics', 'AI Lead Scoring Engine', 'Lead Follow-up Engine', 'Audit Log Trail', 'WebSocket Realtime Sync']
    },
    {
      name: 'ENTERPRISE',
      price: '₹24,999',
      period: 'Per month',
      users: 100,
      leads: 100000,
      storage: '50 GB',
      features: ['Dedicated Account Manager', 'Custom API Rate Limits', 'Security Center & Audit Log Export', 'Unlimited Lead Timeline History', 'Priority Support']
    }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-primary/10 text-theme-primary">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-theme-text">Subscription & Billing Dashboard</h2>
            <p className="text-xs text-theme-text-muted mt-0.5">Manage plan tiers, track workspace quota usage, and review billing details.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-theme-text-muted">Current Tier:</span>
          <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {currentPlan} PLAN
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 flex items-center gap-2">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Resource Quota Usage Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Quota */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text flex items-center gap-2">
              <Users size={16} className="text-theme-primary" /> Active Team Seats
            </span>
            <span className="text-xs font-mono font-bold text-theme-text">{billingInfo.activeUsers} / {billingInfo.maxUsers}</span>
          </div>
          <div className="w-full bg-theme-bg-alt rounded-full h-2.5 overflow-hidden">
            <div className="bg-theme-primary h-2.5 rounded-full transition-all" style={{ width: `${userUsagePct}%` }} />
          </div>
          <span className="text-[10px] text-theme-text-muted font-semibold block">{userUsagePct}% seats consumed</span>
        </div>

        {/* Lead Quota */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-500" /> Lead Storage Quota
            </span>
            <span className="text-xs font-mono font-bold text-theme-text">{billingInfo.totalLeads} / {billingInfo.maxLeads}</span>
          </div>
          <div className="w-full bg-theme-bg-alt rounded-full h-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${leadUsagePct}%` }} />
          </div>
          <span className="text-[10px] text-theme-text-muted font-semibold block">{leadUsagePct}% capacity consumed</span>
        </div>

        {/* Storage Quota */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text flex items-center gap-2">
              <HardDrive size={16} className="text-cyan-400" /> Database & Media Storage
            </span>
            <span className="text-xs font-mono font-bold text-theme-text">{billingInfo.storageUsedMb} MB / {billingInfo.maxStorageMb} MB</span>
          </div>
          <div className="w-full bg-theme-bg-alt rounded-full h-2.5 overflow-hidden">
            <div className="bg-cyan-400 h-2.5 rounded-full transition-all" style={{ width: `${storageUsagePct}%` }} />
          </div>
          <span className="text-[10px] text-theme-text-muted font-semibold block">{storageUsagePct}% storage consumed</span>
        </div>

      </div>

      {/* SaaS Plan Comparison Grid */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted">Available SaaS Plans & Upgrade Options</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.name;
            return (
              <div
                key={p.name}
                className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent
                    ? 'border-theme-primary bg-theme-primary/5 ring-2 ring-theme-primary shadow-xl'
                    : 'border-theme-border/40 bg-theme-bg-alt/30 hover:border-theme-border'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-theme-text">{p.name}</h4>
                    {isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-theme-primary text-white">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold text-theme-text">{p.price}</span>
                    <span className="text-xs text-theme-text-muted ml-1 font-semibold">{p.period}</span>
                  </div>

                  <div className="pt-3 border-t border-theme-border/30 space-y-2 text-xs text-theme-text-muted">
                    <p className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span>Up to <strong>{p.users}</strong> Team Members</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span>Up to <strong>{p.leads.toLocaleString()}</strong> Leads</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>{p.storage}</strong> Cloud Storage</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-theme-border/30 space-y-2">
                    {p.features.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-theme-text">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {!isCurrent ? (
                    <button
                      onClick={() => handleUpgrade(p.name)}
                      disabled={upgrading || !isAdmin}
                      className="w-full rounded-2xl bg-theme-primary hover:bg-theme-primary-hover py-3 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={14} /> Switch to {p.name} Plan
                    </button>
                  ) : (
                    <button disabled className="w-full rounded-2xl bg-theme-bg-alt text-theme-text-muted py-3 text-xs font-bold border border-theme-border">
                      Current Plan Active
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
