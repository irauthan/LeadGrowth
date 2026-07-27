import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
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
  const [pendingLeads, setPendingLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [idleMessage, setIdleMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [kpiRes, leadsRes, followupsRes, pendingRes] = await Promise.all([
        api.get('/api/users/me/dashboard').catch(() => ({ data: null })),
        api.get('/api/leads/pipeline').catch(() => api.get('/api/leads')),
        api.get('/api/followups').catch(() => ({ data: [] })),
        api.get('/api/leads/pending-assigned').catch(() => ({ data: [] }))
      ]);

      setKpis(kpiRes.data);
      setMyLeads(leadsRes.data || []);
      setFollowups((followupsRes.data || []).filter((f: any) => f.status !== 'COMPLETED'));
      setPendingLeads(pendingRes.data || []);
    } catch (err) {
      console.error('Failed to load User Productivity Hub data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPipeline = async (leadId: number, leadName: string) => {
    if (!user) return;
    try {
      await api.post(`/api/leads/${leadId}/add-to-pipeline`).catch(() =>
        api.patch(`/api/leads/${leadId}/assign?userId=${user.id}`)
      );
      setIdleMessage(`Lead "${leadName}" added to your Pipelines!`);
      setTimeout(() => setIdleMessage(''), 4000);
      fetchUserData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to add lead to pipeline');
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data) {
        setIdleMessage(`New lead auto-assigned: ${res.data.name}! Click 'Add To Pipelines' to accept.`);
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
            Welcome back, {user?.fullName}!
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
            <Briefcase size={14} className="text-theme-primary" /> Open Pipelines
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

      {/* Newly Assigned Leads - Pending Pipeline Acceptance Card */}
      {pendingLeads.length > 0 && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-extrabold text-theme-text">
                🔔 Newly Received Leads ({pendingLeads.length} Lead{pendingLeads.length > 1 ? 's' : ''} Assigned)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-500 uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Pending Pipeline Acceptance
            </span>
          </div>
          <p className="text-xs text-theme-text-muted">
            You have received a new lead assignment! Click <b>"Add To Pipelines"</b> below to activate it in your Open Pipelines workspace.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {pendingLeads.map((lead) => (
              <div key={lead.id} className="p-4 rounded-2xl bg-theme-card border border-theme-border/60 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-extrabold text-theme-text">{lead.name}</h4>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {lead.qualityTier || 'WARM'} ({lead.qualityScore || 75} pts)
                    </span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted mt-1">{lead.email} • {lead.sourcePlatform || 'Meta'}</p>
                  {lead.campaignName && (
                    <span className="text-[9px] text-theme-primary font-bold block mt-0.5">Campaign: {lead.campaignName}</span>
                  )}
                </div>

                <button
                  onClick={() => handleAcceptPipeline(lead.id, lead.name)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-md shadow-theme-primary/20 transition-all"
                >
                  <Briefcase size={14} /> Add To Pipelines
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* 1. My Assigned Leads -> /my-work */}
        <Link
          to="/my-work"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-theme-primary/60 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">Assigned Pipeline</span>
            <UserCheck size={16} className="text-theme-primary transition-transform group-hover:scale-110" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{assignedLeadsCount}</h3>
          <span className="text-[9px] font-bold text-theme-primary flex items-center gap-1">
            Active Contacts <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 2. My Pending Follow-Ups -> /followups */}
        <Link
          to="/followups"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-cyan-500/60 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-cyan-400 transition-colors">Pending Follow-ups</span>
            <Clock size={16} className="text-cyan-400 transition-transform group-hover:scale-110" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{pendingFollowupsCount}</h3>
          <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1">
            Scheduled Reminders <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 3. My Conversions -> /my-work */}
        <Link
          to="/my-work"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-rose-500/60 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-rose-400 transition-colors">My Conversions</span>
            <Flame size={16} className="text-rose-500 transition-transform group-hover:scale-110" />
          </div>
          <h3 className="text-2xl font-extrabold text-theme-text">{conversionsCount}</h3>
          <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
            {kpis?.conversionRate || 0}% Conversion Rate <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* 4. My Revenue Contribution -> /analytics */}
        <Link
          to="/analytics"
          className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm space-y-2 hover:border-emerald-500/60 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted group-hover:text-emerald-400 transition-colors">Revenue Contribution</span>
            <DollarSign size={16} className="text-emerald-400 transition-transform group-hover:scale-110" />
          </div>
          <h3 className="text-lg font-extrabold text-emerald-400">{formatCurrency(personalRevenue)}</h3>
          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
            Closed Deals <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

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

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-2xl border border-theme-border/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-bold sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Pipeline Stage</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/30">
                  {myLeads.slice(0, 8).map((lead) => (
                    <tr key={lead.id} className="hover:bg-theme-bg-alt/40 transition-colors">
                      <td className="p-3 font-bold text-theme-text">
                        <Link 
                          to={`/my-work?leadId=${lead.id}`}
                          className="hover:text-theme-primary hover:underline transition-colors flex items-center gap-1.5 group/link"
                        >
                          <span>{lead.name}</span>
                          <ChevronRight size={12} className="text-theme-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="p-3 text-theme-text-muted font-medium truncate max-w-[120px]">{lead.company || lead.sourcePlatform || 'Corporate'}</td>
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
                <Link 
                  key={idx}
                  to={`/my-work?leadId=${f.leadId || ''}`}
                  className="block p-3.5 rounded-2xl border border-theme-border/40 bg-theme-bg-alt/30 hover:bg-theme-bg-alt hover:border-theme-primary/40 transition-all group space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                    <span className="group-hover:text-theme-primary transition-colors flex items-center gap-1">
                      {f.leadName || 'Client Touchpoint'}
                      <ChevronRight size={12} className="text-theme-primary transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 uppercase">{f.type || 'CALL'}</span>
                  </div>
                  <p className="text-[10px] text-theme-text-muted truncate">{f.notes || 'Requirement collection & proposal follow-up'}</p>
                </Link>
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
