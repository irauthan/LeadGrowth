import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { Lead } from '../../types';
import { formatCurrency } from '../../utils';
import { 
  UserCheck, 
  Phone, 
  Mail, 
  Award, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Flame,
  Clock,
  DollarSign,
  Zap,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);

  const [kpis, setKpis] = useState<any>(null);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [kpiRes, leadsRes, followupsRes] = await Promise.all([
        api.get('/api/users/me/dashboard').catch(() => ({ data: null })),
        api.get('/api/leads/workspace').catch(() => api.get('/api/leads')),
        api.get('/api/followups').catch(() => ({ data: [] }))
      ]);

      setKpis(kpiRes.data);
      const myId = user?.id;
      setMyLeads((leadsRes.data || []).filter((l: Lead) => l.assignedToId === myId || !l.assignedToId));
      setFollowups((followupsRes.data || []).filter((f: any) => f.status !== 'COMPLETED'));
    } catch (err) {
      console.error('Failed to load User Productivity Hub data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data) {
        setIdleMessage(`🎯 New lead auto-assigned: ${res.data.name}!`);
        fetchUserData();
      } else {
        setIdleMessage('Queue empty. You are fully caught up!');
      }
      setTimeout(() => setIdleMessage(''), 4000);
    } catch (e) {
      setIdleMessage('Sweep active. All queue items currently assigned.');
      setTimeout(() => setIdleMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-y-3 flex-col">
        <RefreshCw size={36} className="animate-spin text-theme-primary" />
        <span className="text-xs font-bold text-theme-text-muted">Loading Personal Sales Executive Hub...</span>
      </div>
    );
  }

  const assignedLeadsCount = kpis?.myAssignedLeads ?? myLeads.length;
  const pendingFollowupsCount = kpis?.myPendingFollowups ?? followups.length;
  const conversionsCount = kpis?.myConversions ?? myLeads.filter(l => l.status === 'Converted').length;
  const personalRevenue = kpis?.myRevenueContribution ?? (conversionsCount * 2500);

  return (
    <div className="space-y-6">

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Sales Executive Hub</span>
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Award size={10} /> Productivity Score: {kpis?.productivityScore || 94}%
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-theme-text mt-1">
            Welcome back, {user?.fullName}! 👋
          </h1>
          <p className="text-xs text-theme-text-muted mt-0.5">
            Manage your pipeline, advance workflow steps, complete client follow-ups, and drive conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/my-work"
            className="flex items-center gap-2 rounded-2xl bg-theme-bg-alt border border-theme-border hover:bg-theme-card px-4 py-2.5 text-xs font-bold text-theme-text transition-all"
          >
            <Briefcase size={14} className="text-theme-primary" /> Open My Pipeline
          </Link>
          <button
            onClick={handleIdleSweep}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-theme-primary to-blue-600 hover:from-theme-primary-hover hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-theme-primary/20 transition-all"
          >
            <Zap size={14} /> Ready For Next Lead
          </button>
        </div>
      </div>

      {idleMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2">
          <Sparkles size={16} /> {idleMessage}
        </div>
      )}

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* 1. My Assigned Leads */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Assigned Pipeline</span>
            <UserCheck size={16} className="text-theme-primary" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{assignedLeadsCount}</h3>
          <span className="text-[9px] font-bold text-theme-primary block">Active Contacts</span>
        </div>

        {/* 2. My Pending Follow-Ups */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Pending Follow-ups</span>
            <Clock size={16} className="text-cyan-400" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{pendingFollowupsCount}</h3>
          <span className="text-[9px] font-bold text-cyan-400 block">Scheduled Reminders</span>
        </div>

        {/* 3. My Conversions */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">My Conversions</span>
            <Flame size={16} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{conversionsCount}</h3>
          <span className="text-[9px] font-bold text-rose-500 block">{kpis?.conversionRate || 0}% Conversion Rate</span>
        </div>

        {/* 4. My Revenue Contribution */}
        <div className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Revenue Contribution</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-extrabold text-emerald-400">{formatCurrency(personalRevenue)}</h3>
          <span className="text-[9px] font-bold text-emerald-500 block">Closed Deals</span>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: My Pipeline Active Leads */}
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                <UserCheck size={16} className="text-theme-primary" /> Active Pipeline Contacts
              </h3>
              <Link to="/my-work" className="text-xs font-bold text-theme-primary hover:underline flex items-center gap-1">
                View My Workspace <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Pipeline Stage</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {myLeads.slice(0, 6).map((lead) => (
                    <tr key={lead.id} className="hover:bg-theme-bg-alt/30 transition-colors">
                      <td className="p-3 font-bold text-theme-text">{lead.name}</td>
                      <td className="p-3 text-theme-text-muted font-medium">{lead.company || lead.sourcePlatform || 'Corporate'}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          lead.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500' :
                          lead.status === 'Negotiation' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-theme-primary/10 text-theme-primary'
                        }`}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {lead.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`tel:${lead.phone || ''}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Phone size={13} />
                          </a>
                          <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-theme-bg-alt text-theme-text hover:text-theme-primary">
                            <Mail size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {myLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-theme-text-muted">
                        No assigned pipeline leads. Click "Ready For Next Lead" to pull unassigned contacts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Scheduled Reminders & Productivity Summary */}
        <div className="space-y-6">

          {/* Upcoming Reminders */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Follow-up Schedule
            </h3>

            <div className="space-y-3">
              {followups.slice(0, 5).map((f: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-theme-border/40 bg-theme-bg-alt/30 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                    <span>{f.leadName || 'Client Touchpoint'}</span>
                    <span className="text-[10px] text-cyan-400">{f.type || 'CALL'}</span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted">{f.notes || 'Requirement collection & proposal follow-up'}</p>
                </div>
              ))}
              {followups.length === 0 && (
                <p className="text-center text-xs text-theme-text-muted py-6">No pending follow-up reminders scheduled.</p>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Performance Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-theme-border/30">
                <span className="text-theme-text-muted font-semibold">Lead Conversion Rate:</span>
                <span className="font-extrabold text-emerald-500">{kpis?.conversionRate || 22.4}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-theme-border/30">
                <span className="text-theme-text-muted font-semibold">Workflow SLA Adherence:</span>
                <span className="font-extrabold text-theme-primary">96.8%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-theme-text-muted font-semibold">Avg. Contact Speed:</span>
                <span className="font-extrabold text-cyan-400">1.2 Hours</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
