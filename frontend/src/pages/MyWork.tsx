import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  LayoutGrid, 
  Table as TableIcon, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  Building, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
  PhoneCall,
  ClipboardList,
  Send,
  Scale,
  MessageSquare,
  AlertCircle,
  Maximize2,
  Minimize2,
  Users,
  Flame,
  Download,
  FileText,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Award,
  ShieldCheck,
  User,
  Clock,
  Ban,
  Plus,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { isLeadFresh } from '../utils';
import { useAuthStore } from '../store/authStore';
import { downloadReport } from '../services/reportService';
import { followUpService, type FollowUp } from '../services/followUpService';
import FollowUpModal from '../components/FollowUpModal';
import WorkDetailsPanel from '../components/WorkDetailsPanel';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

const KANBAN_STAGES = [
  { key: 'New', title: 'New', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10', headerColor: 'from-blue-500/20 to-blue-500/5 text-blue-400', icon: Sparkles },
  { key: 'Interaction', title: 'Interaction', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', headerColor: 'from-amber-500/20 to-amber-500/5 text-amber-400', icon: MessageSquare },
  { key: 'Proposal Sent', title: 'Proposal Sent', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', headerColor: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400', icon: Send },
  { key: 'Negotiation', title: 'Negotiation', color: 'border-amber-500/40 text-amber-500 bg-amber-500/10', headerColor: 'from-amber-500/20 to-amber-500/5 text-amber-500', icon: Scale },
  { key: 'Converted', title: 'Converted', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', headerColor: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400', icon: CheckCircle2 },
  { key: 'Lost', title: 'Lost', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10', headerColor: 'from-rose-500/20 to-rose-500/5 text-rose-400', icon: XCircle }
];

const STAGES_TABLE_LIST = [
  'New',
  'Interaction',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Lost'
];

export default function MyWork() {
  const currentUser = useAuthStore((state) => state.user);
  const isManagementOrAdmin = (currentUser?.roles || []).some((r: any) => {
    const roleName = typeof r === 'string' ? r : r?.name || '';
    return ['ROLE_ADMIN', 'ADMIN', 'ROLE_SUPERADMIN', 'SUPERADMIN', 'ROLE_MANAGER', 'MANAGER'].includes(roleName.toUpperCase());
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'followups'>('kanban');
  const [isContactsFullWidth, setIsContactsFullWidth] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Follow-ups Tab & Filter State for Executive
  const [followupStatusTab, setFollowupStatusTab] = useState<'ALL' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [followupSearchTerm, setFollowupSearchTerm] = useState('');
  const [followupStageFilter, setFollowupStageFilter] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalLead, setModalLead] = useState<{ id: number; name: string; stage?: string; assignedUserId?: number } | null>(null);
  const [followupSuccessMsg, setFollowupSuccessMsg] = useState('');

  // Business-Critical Filters & Search (E4 Filter Streamlining)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a' | 'priority' | 'progress'>('newest');

  // Collapsed columns state for Kanban
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  // Maximized column state for Kanban (full-width multi-column grid view)
  const [maximizedStage, setMaximizedStage] = useState<string | null>(null);

  const toggleMaximizeStage = (stageKey: string) => {
    setMaximizedStage((prev) => (prev === stageKey ? null : stageKey));
  };

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStageKey, setDragOverStageKey] = useState<string | null>(null);

  // Idle Sweep notification
  const [sweepMessage, setSweepMessage] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<string>(searchParams.get('period') || 'all');

  useEffect(() => {
    const paramPeriod = searchParams.get('period');
    if (paramPeriod) {
      setSelectedPeriod(paramPeriod);
    }
  }, [searchParams]);

  useEffect(() => {
    const paramExec = searchParams.get('executiveId');
    if (paramExec && isManagementOrAdmin) {
      setSelectedExecutiveId(parseInt(paramExec, 10));
    }
  }, [searchParams, isManagementOrAdmin]);

  useEffect(() => {
    fetchMyWorkLeads();
  }, [selectedPeriod, searchParams, currentUser?.id, isManagementOrAdmin]);

  useEffect(() => {
    const paramLeadId = searchParams.get('leadId');
    if (paramLeadId && leads.length > 0) {
      const targetId = parseInt(paramLeadId);
      if (!isNaN(targetId)) {
        setSelectedLeadId(targetId);
        setIsPanelOpen(true);
      }
    }

    const paramStage = searchParams.get('stage');
    if (paramStage) {
      setSelectedStage(paramStage);
    }
  }, [searchParams, leads]);

  const fetchMyWorkLeads = async () => {
    setLoading(true);
    try {
      const params: any = {};
      const currentPeriod = searchParams.get('period') || selectedPeriod;
      if (currentPeriod && currentPeriod !== 'all') params.period = currentPeriod;
      const start = searchParams.get('startDate');
      const end = searchParams.get('endDate');
      if (start) params.startDate = start;
      if (end) params.endDate = end;

      const [leadsRes, contactsRes, membersRes, followupsRes] = await Promise.all([
        api.get('/api/leads', { params }).catch(() => api.get('/api/leads/pipeline', { params }).catch(() => ({ data: [] }))),
        api.get('/api/leads/contacts').catch(() => ({ data: [] })),
        api.get('/api/users/members').catch(() => ({ data: [] })),
        followUpService.getFollowups().catch(() => [])
      ]);

      const fetchedLeads = Array.isArray(leadsRes?.data) ? leadsRes.data : [];
      const fetchedContacts = Array.isArray(contactsRes?.data) ? contactsRes.data : [];
      let fetchedMembers = Array.isArray(membersRes?.data) ? membersRes.data : [];
      const fetchedFollowups = Array.isArray(followupsRes) ? followupsRes : ((followupsRes as any)?.data || []);

      if (fetchedMembers.length === 0 && currentUser) {
        fetchedMembers = [currentUser];
      }

      setLeads(fetchedLeads);
      setContacts(fetchedContacts);
      setTeamMembers(fetchedMembers);
      setFollowups(fetchedFollowups);
    } catch (err) {
      console.error('Failed to load My Work workspace leads', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteFollowup = async (id: number) => {
    try {
      await followUpService.complete(id);
      setFollowupSuccessMsg('Follow-up marked as completed!');
      fetchMyWorkLeads();
      setTimeout(() => setFollowupSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const handleCancelFollowup = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel and remove this follow-up?')) {
      return;
    }
    try {
      await followUpService.cancel(id);
      setFollowupSuccessMsg('Follow-up removed successfully!');
      fetchMyWorkLeads();
      setTimeout(() => setFollowupSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel follow-up');
    }
  };

  const handleIdleSweep = async () => {
    try {
      const res = await api.post('/api/leads/queue/idle-sweep');
      if (res.data) {
        setSweepMessage(`New lead auto-assigned: ${res.data.name}!`);
        fetchMyWorkLeads();
      } else {
        setSweepMessage('Queue empty. You are fully caught up!');
      }
      setTimeout(() => setSweepMessage(''), 4000);
    } catch (e) {
      setSweepMessage('Sweep active. All queue items currently assigned.');
      setTimeout(() => setSweepMessage(''), 4000);
    }
  };

  const handleExportPipelinePdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadReport('leads', 'pdf', selectedPeriod);
    } catch (err) {
      console.error('Failed to export pipeline PDF:', err);
      alert('Unable to generate Pipeline PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleStageChange = async (leadId: number, newStage: string) => {
    try {
      await api.patch(`/api/leads/${leadId}/status?status=${encodeURIComponent(newStage)}`);
      fetchMyWorkLeads();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update stage');
    }
  };

  const toggleCollapseColumn = (stageKey: string) => {
    setCollapsedColumns((prev) => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const openDetails = (id: number) => {
    setSelectedLeadId(id);
    setIsPanelOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('text/plain', String(leadId));
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStageKey !== stageKey) {
      setDragOverStageKey(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (dragOverStageKey === stageKey) {
      setDragOverStageKey(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setDragOverStageKey(null);
    const leadIdStr = e.dataTransfer.getData('text/plain') || String(draggedLeadId);
    const targetLeadId = parseInt(leadIdStr);
    if (isNaN(targetLeadId)) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === targetLeadId ? { ...l, status: targetStageKey } : l))
    );

    // Send API update
    await handleStageChange(targetLeadId, targetStageKey);
    setDraggedLeadId(null);
  };

  const isUserAdminRole = (userObj: any) => {
    const rList = userObj?.roles || [];
    return rList.some((r: any) => {
      const rName = typeof r === 'string' ? r : r?.name || '';
      return ['ROLE_ADMIN', 'ADMIN', 'ROLE_SUPERADMIN', 'SUPERADMIN'].includes(rName.toUpperCase());
    });
  };

  const safeLeads = Array.isArray(leads) ? leads : [];
  const rawMembers = Array.isArray(teamMembers) ? teamMembers : [];

  // Filter to sales executives / reps (exclude current logged-in admin / managers from sales rep cards)
  const salesRepMembers = rawMembers.filter((m) => {
    if (!m) return false;
    if (m.id === currentUser?.id) return false;
    if (isUserAdminRole(m) && safeLeads.filter(l => l && l.assignedToId === m.id).length === 0) return false;
    return true;
  });

  // Fallback: If no non-admin sales reps exist in workspace, show all members
  const safeMembers = salesRepMembers.length > 0 ? salesRepMembers : rawMembers.filter(m => m && m.id !== currentUser?.id);
  const unassignedLeads = safeLeads.filter((l) => l && !l.assignedToId);

  const safeFollowups = Array.isArray(followups) ? followups : [];

  const doesFollowupBelongToExecutive = (f: any, execId: number | null, execName?: string) => {
    if (!f) return false;
    if (execId === null) return true;
    if (execId === -1) {
      const lead = safeLeads.find(l => l && Number(l.id) === Number(f.leadId));
      return (!f.assignedToId || Number(f.assignedToId) === 0) && (!lead || !lead.assignedToId);
    }
    
    const targetId = Number(execId);
    const lead = safeLeads.find(l => l && Number(l.id) === Number(f.leadId));
    const leadAssignedId = lead?.assignedToId ? Number(lead.assignedToId) : null;
    const fAssignedId = f.assignedToId ? Number(f.assignedToId) : null;

    // 1. If lead is known in workspace, its assigned executive strictly determines ownership
    if (leadAssignedId) {
      return leadAssignedId === targetId;
    }

    // 2. If lead is not found or unassigned on lead entity, check followup's direct assignedToId
    if (fAssignedId) {
      return fAssignedId === targetId;
    }

    // 3. Match by name
    if (execName && f.assignedToName) {
      return String(f.assignedToName).trim().toLowerCase() === String(execName).trim().toLowerCase();
    }

    return false;
  };

  const membersWithStats = safeMembers
    .filter(Boolean)
    .map((member) => {
      const memberLeads = safeLeads.filter((l) => l && Number(l.assignedToId) === Number(member.id));
      const memberFollowups = safeFollowups.filter(f => doesFollowupBelongToExecutive(f, member.id, member.fullName));
      const activeFollowupsCount = memberFollowups.filter(f => f.status !== 'COMPLETED' && f.status !== 'CANCELLED').length;

      const newCount = memberLeads.filter((l) => {
        const s = String(l.status || 'New').toLowerCase();
        return s === 'new' || s === 'new lead' || s === 'fresh';
      }).length;
      const interactionCount = memberLeads.filter((l) => {
        const s = String(l.status || '').toLowerCase();
        return s === 'interaction' || s === 'contacted' || s === 'first call' || s === 'follow-up';
      }).length;
      const proposalCount = memberLeads.filter((l) => String(l.status || '').toLowerCase().includes('proposal')).length;
      const negotiationCount = memberLeads.filter((l) => String(l.status || '').toLowerCase().includes('negotiation')).length;
      const convertedCount = memberLeads.filter((l) => {
        const s = String(l.status || '').toLowerCase();
        return s === 'converted' || s === 'won' || s === 'closed won';
      }).length;
      const lostCount = memberLeads.filter((l) => String(l.status || '').toLowerCase().includes('lost')).length;
      const winRate = memberLeads.length > 0 ? Math.round((convertedCount / memberLeads.length) * 100) : 0;

      return {
        ...member,
        totalLeads: memberLeads.length,
        newCount,
        interactionCount,
        proposalCount,
        negotiationCount,
        convertedCount,
        lostCount,
        winRate,
        totalFollowups: memberFollowups.length,
        activeFollowupsCount
      };
    });

  const activeExecutive = isManagementOrAdmin 
    ? (selectedExecutiveId === -1 
        ? { id: -1, fullName: 'Unassigned Leads Pool', email: 'Unassigned Queue', designation: 'Queue' } 
        : (rawMembers.find(m => m && Number(m.id) === Number(selectedExecutiveId)) || { fullName: 'Sales Executive', email: '', designation: '' }))
    : currentUser;

  const activeExecutiveFollowups = safeFollowups.filter((f) => {
    const targetId = isManagementOrAdmin && selectedExecutiveId !== null ? selectedExecutiveId : (currentUser?.id || null);
    const targetName = isManagementOrAdmin && selectedExecutiveId !== null ? activeExecutive?.fullName : currentUser?.fullName;
    return doesFollowupBelongToExecutive(f, targetId, targetName);
  });

  const filteredExecutiveFollowups = activeExecutiveFollowups.filter((f) => {
    if (followupStatusTab === 'UPCOMING' && !(f.status === 'UPCOMING' || f.status === 'SCHEDULED' || f.status === 'PENDING')) return false;
    if (followupStatusTab === 'OVERDUE' && !(f.status === 'OVERDUE' || f.status === 'MISSED' || f.isOverdue)) return false;
    if (followupStatusTab === 'COMPLETED' && f.status !== 'COMPLETED') return false;
    if (followupStatusTab === 'CANCELLED' && f.status !== 'CANCELLED') return false;

    if (followupStageFilter !== 'ALL') {
      const sFilter = followupStageFilter.toLowerCase();
      const lStage = (f.leadStage || '').toLowerCase();
      if (!lStage.includes(sFilter) && !sFilter.includes(lStage)) return false;
    }

    if (followupSearchTerm) {
      const q = followupSearchTerm.toLowerCase();
      const matchName = f.leadName?.toLowerCase().includes(q);
      const matchType = f.type?.toLowerCase().includes(q);
      const matchStage = f.leadStage?.toLowerCase().includes(q);
      const matchNotes = f.notes?.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchStage && !matchNotes) return false;
    }

    return true;
  });

  const filteredMembers = membersWithStats.filter((m) =>
    !memberSearchTerm ||
    (m.fullName && String(m.fullName).toLowerCase().includes(memberSearchTerm.toLowerCase())) ||
    (m.email && String(m.email).toLowerCase().includes(memberSearchTerm.toLowerCase()))
  );

  // Filter Leads based on selected executive
  const targetScopeLeads = isManagementOrAdmin && selectedExecutiveId !== null
    ? (selectedExecutiveId === -1 ? unassignedLeads : safeLeads.filter(l => l && l.assignedToId === selectedExecutiveId))
    : safeLeads;

  // Filter & Search Logic
  const filteredLeads = targetScopeLeads.filter((lead) => {
    if (!lead) return false;
    const matchesSearch = 
      !searchTerm ||
      (lead.name && String(lead.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.company && String(lead.company).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && String(lead.phone).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.email && String(lead.email).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.campaignName && String(lead.campaignName).toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(lead.id || '').includes(searchTerm);

    const matchesPriority = selectedPriority === 'ALL' || lead.priority === selectedPriority;
    const matchesQuality = selectedQuality === 'ALL' || lead.qualityTier === selectedQuality;

    return matchesSearch && matchesPriority && matchesQuality;
  }).sort((a, b) => {
    if (!a || !b) return 0;
    if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    if (sortBy === 'a-z') return String(a.name || '').localeCompare(String(b.name || ''));
    if (sortBy === 'z-a') return String(b.name || '').localeCompare(String(a.name || ''));
    if (sortBy === 'priority') {
      const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    if (sortBy === 'progress') return (b.progressPercentage || 0) - (a.progressPercentage || 0);
    return 0;
  });

  const getStageLeads = (stageKey: string) => {
    return filteredLeads.filter((l) => {
      if (!l) return false;
      const st = String(l.status || 'New').trim();
      const stLower = st.toLowerCase();
      const isNewLead = stLower === 'new' || stLower === 'new lead' || stLower === 'fresh';

      if (stageKey === 'New') {
        return isNewLead;
      }
      if (isNewLead) {
        return false;
      }
      if (stageKey === 'Interaction') {
        return stLower === 'interaction' || stLower === 'contacted' || stLower === 'first call' || stLower === 'first_call' || stLower === 'follow-up' || stLower === 'followup' || stLower === 'requirement collection' || stLower === 'requirement_collection' || stLower === 'interested';
      }
      if (stageKey === 'Proposal Sent') return stLower === 'proposal sent' || stLower === 'proposal_sent' || stLower === 'proposal' || stLower === 'demo scheduled' || stLower === 'demo_scheduled' || stLower === 'qualified';
      if (stageKey === 'Negotiation') return stLower === 'negotiation' || stLower === 'negotiation_started' || stLower === 'closing';
      if (stageKey === 'Converted') {
        const s = stLower.trim();
        return s === 'converted' || s === 'closing' || s === 'payment' || s === 'payment completed' || s === 'payment_completed' || s === 'closed won' || s === 'closed_won';
      }
      if (stageKey === 'Lost') return stLower === 'lost' || stLower === 'rejected';
      return stLower === stageKey.toLowerCase();
    });
  };

  if (loading && leads.length === 0) {
    return (
      <HoosshBeeLoader 
        text="Loading Pipelines Workspace..." 
        subtext="Syncing assigned team pipelines, stage velocity, and active deals" 
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* VIEW 1: ADMIN TEAM EXECUTIVE SELECTION OVERVIEW */}
      {isManagementOrAdmin && selectedExecutiveId === null ? (
        <div className="space-y-6">
          {/* Top Header & Search in One Clean Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-theme-text flex items-center gap-2">
                <Users size={22} className="text-theme-primary" /> Team Pipelines
              </h1>
              <p className="text-xs text-theme-text-muted mt-1">
                Select a sales team member below to view their active pipeline, lead stages, and deal progression.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search executive..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl pl-9 pr-4 py-2 text-xs text-theme-text focus:outline-none focus:border-theme-primary font-medium"
                />
              </div>

              <button
                onClick={handleExportPipelinePdf}
                disabled={isExportingPdf}
                title="Download overall stage-wise pipeline report as PDF"
                className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download Pipeline PDF'}</span>
              </button>
            </div>
          </div>

          {/* Team Members Grid (Clean, Premium, Minimalist) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedExecutiveId(member.id)}
                className="group relative rounded-3xl bg-theme-card border border-theme-border hover:border-theme-primary hover:shadow-lg p-6 transition-all duration-300 cursor-pointer space-y-5"
              >
                {/* Header: Avatar, Name, Email, Role */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-center text-theme-primary font-black text-base group-hover:scale-105 transition-transform">
                      {member?.fullName && String(member.fullName).trim().length > 0 ? String(member.fullName).trim().charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-theme-text group-hover:text-theme-primary transition-colors flex items-center gap-1.5">
                        {member.fullName}
                      </h3>
                      <p className="text-[11px] text-theme-text-muted mt-0.5">{member.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-bg-alt border border-theme-border text-theme-text-muted">
                        {member.designation || (typeof member.roles?.[0] === 'string' ? member.roles[0].replace('ROLE_', '') : member.roles?.[0]?.name?.replace('ROLE_', '')) || 'Sales Executive'}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-theme-bg-alt border border-theme-border text-theme-text text-xs font-black">
                    {member.totalLeads} Leads
                  </span>
                </div>

                {/* Clean Metrics Summary */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-theme-border/60">
                  <div className="bg-theme-bg-alt/50 p-2.5 rounded-2xl border border-theme-border/50 text-center">
                    <span className="text-[10px] text-theme-text-muted font-bold block">Pipeline</span>
                    <span className="text-xs font-black text-theme-text mt-0.5 block">{member.totalLeads} Leads</span>
                  </div>
                  <div className="bg-theme-bg-alt/50 p-2.5 rounded-2xl border border-theme-border/50 text-center">
                    <span className="text-[10px] text-theme-text-muted font-bold block">Won Deals</span>
                    <span className="text-xs font-black text-emerald-500 mt-0.5 block">{member.convertedCount} Deals</span>
                  </div>
                  <div className="bg-theme-bg-alt/50 p-2.5 rounded-2xl border border-theme-border/50 text-center">
                    <span className="text-[10px] text-theme-text-muted font-bold block">Follow-ups</span>
                    <span className="text-xs font-black text-blue-500 mt-0.5 block">{member.activeFollowupsCount} Active</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-theme-text-muted">
                    Win Rate: <strong className="text-theme-text">{member.winRate}%</strong>
                  </span>

                  <span className="text-xs font-extrabold text-theme-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    View Pipeline <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}

            {/* Unassigned Pool Card */}
            {unassignedLeads.length > 0 && (
              <div
                onClick={() => setSelectedExecutiveId(-1)}
                className="group relative rounded-3xl bg-theme-card border border-dashed border-theme-border hover:border-amber-500/80 hover:shadow-lg p-6 transition-all duration-300 cursor-pointer space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-extrabold text-base">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-theme-text group-hover:text-amber-500 transition-colors">
                        Unassigned Lead Pool
                      </h3>
                      <p className="text-[11px] text-theme-text-muted mt-0.5">Leads awaiting sales routing</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Queue Pool
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black">
                    {unassignedLeads.length} Leads
                  </span>
                </div>

                <div className="bg-theme-bg-alt/50 p-3 rounded-2xl border border-theme-border/50">
                  <span className="text-[10px] text-theme-text-muted font-bold block">Queue Status</span>
                  <span className="text-xs font-extrabold text-theme-text mt-0.5 block">Ready for distribution</span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-theme-text-muted font-semibold">Unassigned Leads</span>
                  <span className="text-xs font-extrabold text-amber-500 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Inspect Pool <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {filteredMembers.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-theme-border rounded-3xl bg-theme-card/50 space-y-2">
              <Users size={28} className="mx-auto text-theme-text-muted" />
              <h4 className="text-sm font-bold text-theme-text">No Executives Found</h4>
              <p className="text-xs text-theme-text-muted">No sales team members match your search criteria.</p>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: INDIVIDUAL EXECUTIVE PIPELINE KANBAN & TABLE BOARD */
        <>
          {/* Top Header & Workspace Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-theme-border bg-theme-card shadow-xl">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-theme-text flex items-center gap-2">
                <Briefcase size={22} className="text-theme-primary" /> 
                {isManagementOrAdmin 
                  ? `${activeExecutive?.fullName || 'Executive'}'s Pipeline`
                  : 'My Work Pipeline'}
              </h1>
              <p className="text-xs text-theme-text-muted mt-1">
                {isManagementOrAdmin
                  ? `Auditing ${activeExecutive?.fullName || 'Executive'}'s stage progression, active client deals, and follow-ups.`
                  : 'Manage assigned leads, execute sales activities, complete client follow-ups, and auto-track progress from one interface.'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Follow-ups Quick Toggle Button */}
              <button
                onClick={() => setViewMode(viewMode === 'followups' ? 'kanban' : 'followups')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  viewMode === 'followups'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-theme-bg-alt text-theme-text hover:text-blue-500 border-theme-border/60 hover:border-blue-500/40'
                }`}
              >
                <Clock size={14} className={viewMode === 'followups' ? 'text-white' : 'text-blue-500'} />
                <span>Follow-ups</span>
                {activeExecutiveFollowups.length > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    viewMode === 'followups' 
                      ? 'bg-white text-blue-600' 
                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  }`}>
                    {activeExecutiveFollowups.length}
                  </span>
                )}
              </button>

              {/* Premium Styled View Switcher Dropdown (Kanban / Table only) */}
              <div className="relative flex items-center gap-2 bg-theme-bg-alt px-3.5 py-2.5 rounded-2xl border border-theme-border hover:border-theme-primary/50 transition-all shadow-xs">
                {viewMode === 'table' ? (
                  <TableIcon size={14} className="text-theme-primary flex-shrink-0" />
                ) : (
                  <LayoutGrid size={14} className="text-theme-primary flex-shrink-0" />
                )}
                <select
                  value={viewMode === 'followups' ? 'kanban' : viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'kanban' | 'table')}
                  className="bg-transparent text-xs font-bold text-theme-text outline-none cursor-pointer pr-4 appearance-none"
                >
                  <option value="kanban" className="bg-theme-card text-theme-text font-bold">Kanban Board</option>
                  <option value="table" className="bg-theme-card text-theme-text font-bold">Table View</option>
                </select>
                <ChevronDown size={13} className="text-theme-text-muted pointer-events-none absolute right-2.5" />
              </div>

              {/* Admin: Download Pipeline PDF (Placed AFTER dropdown) */}
              {isManagementOrAdmin && (
                <button
                  onClick={handleExportPipelinePdf}
                  disabled={isExportingPdf}
                  title="Download stage-wise pipeline report as PDF"
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>{isExportingPdf ? 'Generating PDF...' : 'Download Pipeline PDF'}</span>
                </button>
              )}
            </div>
          </div>

      {sweepMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {sweepMessage}
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-theme-card/60 p-4 rounded-3xl border border-theme-border">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search by Client, Company, Phone, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-theme-bg-alt border border-theme-border/60 rounded-2xl pl-9 pr-4 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text text-xs">
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-primary focus:outline-none focus:border-theme-primary"
          >
            <option value="all">Time: All Time</option>
            <option value="today">Time: Today</option>
            <option value="weekly">Time: This Week</option>
            <option value="monthly">Time: This Month</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-theme-bg-alt border border-theme-border/60 rounded-2xl px-3 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="a-z">Sort: A-Z</option>
            <option value="z-a">Sort: Z-A</option>
            <option value="priority">Sort: Priority</option>
            <option value="progress">Sort: Progress %</option>
          </select>

          <button
            onClick={fetchMyWorkLeads}
            className="p-2 rounded-2xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center space-y-3 flex-col">
          <RefreshCw size={36} className="animate-spin text-theme-primary" />
          <span className="text-xs font-bold text-theme-text-muted">Loading My Work Pipeline...</span>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: REDESIGNED ENTERPRISE HORIZONTAL KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="flex flex-nowrap overflow-x-auto gap-4 pb-6 pt-2 snap-x select-none custom-scrollbar min-h-[calc(100vh-230px)] items-start">
              {!isContactsFullWidth && (maximizedStage
                ? KANBAN_STAGES.filter((col) => col.key === maximizedStage)
                : selectedStage === 'ALL'
                ? KANBAN_STAGES
                : (KANBAN_STAGES.filter(col => {
                    const target = selectedStage.toLowerCase().trim();
                    const colKey = col.key.toLowerCase().trim();
                    if (target === 'proposal sent' || target === 'proposal') return colKey === 'proposal sent';
                    return colKey === target || col.title.toLowerCase().trim() === target;
                  }).length > 0
                    ? KANBAN_STAGES.filter(col => {
                        const target = selectedStage.toLowerCase().trim();
                        const colKey = col.key.toLowerCase().trim();
                        if (target === 'proposal sent' || target === 'proposal') return colKey === 'proposal sent';
                        return colKey === target || col.title.toLowerCase().trim() === target;
                      })
                    : KANBAN_STAGES
                  )
              ).map((col) => {
                const stageLeads = getStageLeads(col.key);
                const Icon = col.icon;
                const isMax = maximizedStage === col.key;
                const isCollapsed = !isMax && (collapsedColumns[col.key] ?? false);
                const isOver = dragOverStageKey === col.key;

                if (isCollapsed) {
                  return (
                    <div
                      key={col.key}
                      onClick={() => toggleCollapseColumn(col.key)}
                      className="w-12 min-w-[48px] max-w-[48px] h-[calc(100vh-250px)] rounded-3xl border border-theme-border/80 bg-theme-card/60 flex flex-col items-center justify-between py-6 cursor-pointer hover:border-theme-primary transition-all shadow-md group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center border ${col.color}`}>
                          <Icon size={14} />
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-theme-bg-alt text-theme-text-muted border border-theme-border/40">
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="rotate-90 whitespace-nowrap text-xs font-extrabold uppercase tracking-wider text-theme-text-muted group-hover:text-theme-primary transition-colors">
                        {col.title}
                      </div>

                      <button className="text-theme-text-muted group-hover:text-theme-text p-1">
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDragLeave={(e) => handleDragLeave(e, col.key)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className={`transition-all duration-300 flex-shrink-0 snap-start flex flex-col rounded-3xl border shadow-lg relative ${
                      isMax
                        ? 'w-full min-w-full'
                        : 'w-[310px] min-w-[310px] max-w-[310px]'
                    } ${
                      isOver 
                        ? 'border-2 border-dashed border-theme-primary bg-theme-primary/10 shadow-2xl scale-[1.01]' 
                        : 'border-theme-border/80 bg-theme-card/80 backdrop-blur-md'
                    }`}
                  >
                    {/* Column Header */}
                    <div className={`p-4 rounded-t-3xl border-b border-theme-border/60 bg-gradient-to-b ${col.headerColor} flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-xs ${col.color}`}>
                          <Icon size={14} />
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-text flex items-center gap-2">
                            {col.title}
                          </h3>
                          <span className="text-[9px] font-bold text-theme-text-muted block">
                            {stageLeads.length} {stageLeads.length === 1 ? 'Lead' : 'Leads'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-theme-card/90 text-theme-text border border-theme-border/60 shadow-xs">
                          {stageLeads.length}
                        </span>
                        <button
                          onClick={() => toggleMaximizeStage(col.key)}
                          title={isMax ? "Restore Standard Column View" : "Maximize Column to Full Width"}
                          className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt/60 transition-all"
                        >
                          {isMax ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Column Body Cards Scroll Area */}
                    <div className={`flex-1 overflow-y-auto max-h-[calc(100vh-280px)] p-3 space-y-3 custom-scrollbar min-h-[220px] ${
                      isMax ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 space-y-0' : ''
                    }`}>
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => openDetails(lead.id)}
                          className="group p-4 rounded-2xl border border-theme-border/80 bg-theme-card/90 hover:border-theme-primary/80 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing space-y-3 backdrop-blur-xs relative overflow-hidden"
                        >
                          {/* Priority, Fresh and Tier Top Badges */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                lead.priority === 'LOW' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {lead.priority || 'MEDIUM'}
                              </span>

                              {isLeadFresh(lead) && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                                  <Sparkles size={9} /> Fresh
                                </span>
                              )}
                            </div>

                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              lead.qualityTier === 'HOT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              lead.qualityTier === 'COLD' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              <Flame size={11} className="text-amber-400 fill-amber-400/20" />
                              <span>{lead.qualityTier || 'WARM'} ({lead.qualityScore || 75}pt)</span>
                            </span>
                          </div>

                          {/* Client Header Info */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex flex-shrink-0 items-center justify-center text-theme-primary font-black text-xs">
                              {lead.name?.substring(0, 2).toUpperCase() || 'LD'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors truncate">
                                {lead.name}
                              </h4>
                              <p className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1 mt-0.5 truncate">
                                <Building size={11} className="text-theme-text-muted flex-shrink-0" /> {lead.company || 'Enterprise Contact'}
                              </p>
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="text-[10px] text-theme-text-muted space-y-1 bg-theme-bg-alt/40 p-2.5 rounded-xl border border-theme-border/30">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-theme-text flex items-center gap-1 truncate">
                                <Phone size={10} className="text-theme-primary flex-shrink-0" /> {lead.phone || 'N/A'}
                              </span>
                              <Link
                                to="/campaigns"
                                className="text-[9px] font-extrabold text-theme-primary hover:underline px-1.5 py-0.5 rounded bg-theme-primary/10 border border-theme-primary/20 truncate transition-colors"
                                title="View Campaign Details"
                              >
                                {lead.campaignName || lead.sourcePlatform || 'Organic'}
                              </Link>
                            </div>
                            <div className="truncate text-theme-text-muted">
                              <Mail size={10} className="inline mr-1" /> {lead.email}
                            </div>
                          </div>

                          {/* Scheduled / Latest Follow-Up Badge Box */}
                          {(lead.nextFollowupDate || lead.lastFollowupDate || lead.followupNotes) && (
                            <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl text-[10px] space-y-1">
                              <div className="flex items-center justify-between font-extrabold text-purple-400">
                                <span className="flex items-center gap-1">
                                  <ClipboardList size={11} className="text-purple-400" />
                                  {lead.nextFollowupDate ? 'Scheduled Follow-up:' : 'Follow-up Info:'}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold uppercase">
                                  {lead.followupType || 'CALL'}
                                </span>
                              </div>
                              <div className="font-extrabold text-theme-text flex items-center gap-1">
                                <PhoneCall size={10} className="text-purple-400 flex-shrink-0" />
                                {lead.nextFollowupDate 
                                  ? new Date(lead.nextFollowupDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                  : lead.lastFollowupDate 
                                    ? new Date(lead.lastFollowupDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                                    : 'Pending Schedule'}
                              </div>
                              {(lead.followupNotes || lead.clientNotes) && (
                                <p className="text-theme-text-muted text-[9px] line-clamp-1 italic">
                                  "{lead.followupNotes || lead.clientNotes}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-theme-text-muted">
                              <span>Stage Progress</span>
                              <span className="text-theme-primary font-extrabold">{lead.progressPercentage || 0}%</span>
                            </div>
                            <div className="w-full bg-theme-bg-alt rounded-full h-1.5 overflow-hidden border border-theme-border/30">
                              <div
                                className="bg-gradient-to-r from-theme-primary to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${lead.progressPercentage || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Stage Transition Quick Actions & Work Button */}
                          <div className="pt-2 border-t border-theme-border/40 flex items-center justify-between gap-1 text-[10px]">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${lead.phone}`, '_self');
                                }}
                                title="Quick Call"
                                className="w-7 h-7 rounded-lg border border-theme-border/80 hover:border-theme-primary bg-theme-bg-alt flex items-center justify-center text-theme-text-muted hover:text-theme-primary transition-all"
                              >
                                <Phone size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`, '_blank');
                                }}
                                title="WhatsApp"
                                className="w-7 h-7 rounded-lg border border-theme-border/80 hover:border-emerald-500 bg-theme-bg-alt flex items-center justify-center text-theme-text-muted hover:text-emerald-400 transition-all"
                              >
                                <MessageSquare size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`mailto:${lead.email}`, '_self');
                                }}
                                title="Send Email"
                                className="w-7 h-7 rounded-lg border border-theme-border/80 hover:border-theme-primary bg-theme-bg-alt flex items-center justify-center text-theme-text-muted hover:text-theme-primary transition-all"
                              >
                                <Mail size={11} />
                              </button>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(lead.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-theme-primary font-bold hover:bg-theme-primary/10 transition-all flex items-center gap-1 text-[11px]"
                            >
                              Work Card <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-theme-border/50 rounded-2xl bg-theme-card/30 space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-theme-bg-alt border border-theme-border flex items-center justify-center mx-auto text-theme-text-muted">
                            <AlertCircle size={20} />
                          </div>
                          <h5 className="text-xs font-bold text-theme-text">No Leads Available</h5>
                          <p className="text-[10px] text-theme-text-muted">
                            Drag new contacts here or advance workflow stages.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* CRM CONTACTS REPOSITORY SECTION (AUTOMATICALLY SYNCHRONIZED AFTER LOST) */}
              {!maximizedStage && (
                <div
                  className={`transition-all duration-300 flex-shrink-0 snap-start flex flex-col rounded-3xl border border-theme-border bg-theme-card shadow-xl relative backdrop-blur-md ${
                    isContactsFullWidth ? 'w-full min-w-full' : 'w-[340px] min-w-[340px] max-w-[340px]'
                  }`}
                >
                {/* Contacts Header */}
                <div className="p-4 rounded-t-3xl border-b border-theme-border bg-gradient-to-r from-theme-primary/10 via-theme-bg-alt to-theme-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center border border-theme-primary/40 text-theme-primary bg-theme-primary/10 shadow-xs">
                      <Users size={14} />
                    </span>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-theme-primary flex items-center gap-1.5">
                        CONTACTS <span className="text-[9px] font-semibold text-theme-text-muted font-mono">(Repository)</span>
                      </h3>
                      <span className="text-[9px] font-bold text-theme-text-muted block">
                        {contacts.length} Synchronized Contacts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsContactsFullWidth(!isContactsFullWidth)}
                      title={isContactsFullWidth ? "Standard Column View" : "Full Width View"}
                      className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
                    >
                      {isContactsFullWidth ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Contacts Body */}
                <div className={`flex-1 overflow-y-auto max-h-[calc(100vh-270px)] p-4 space-y-3 custom-scrollbar min-h-[220px] ${
                  isContactsFullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 space-y-0' : ''
                }`}>
                    {contacts.map((contact) => (
                      <div
                        key={contact.leadId}
                        onClick={() => openDetails(contact.leadId)}
                        className="group p-4 rounded-2xl border border-theme-border/80 hover:border-theme-primary/80 bg-theme-bg-alt/60 hover:bg-theme-card shadow-xs hover:shadow-xl transition-all cursor-pointer space-y-3 relative overflow-hidden"
                      >
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                            {contact.currentStage || 'Contact'}
                          </span>

                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                            <Flame size={11} className="text-amber-500 fill-amber-500/20" />
                            <span>{contact.qualityTier || 'WARM'} ({contact.qualityScore || 75}pt)</span>
                          </span>
                        </div>

                        {/* Name & Company */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex flex-shrink-0 items-center justify-center text-theme-primary font-black text-xs">
                            {contact.name?.substring(0, 2).toUpperCase() || 'CT'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-theme-text group-hover:text-theme-primary transition-colors truncate">
                              {contact.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-theme-text-muted flex items-center gap-1 mt-0.5 truncate">
                              <Building size={11} className="text-theme-text-muted flex-shrink-0" /> {contact.company || 'Enterprise Contact'}
                            </p>
                          </div>
                        </div>

                        {/* Interaction Statistics Grid */}
                        <div className="grid grid-cols-3 gap-1 bg-theme-card p-2 rounded-xl border border-theme-border/60 text-center">
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">Calls</div>
                            <div className="text-xs font-extrabold text-emerald-500">{contact.totalCalls || 0}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">Emails</div>
                            <div className="text-xs font-extrabold text-theme-primary">{contact.totalEmails || 0}</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-theme-text-muted font-semibold">WhatsApp</div>
                            <div className="text-xs font-extrabold text-amber-500">{contact.totalWhatsApp || 0}</div>
                          </div>
                        </div>

                        {/* Dates & Owner */}
                        <div className="text-[10px] text-theme-text-muted space-y-1 bg-theme-card/60 p-2.5 rounded-xl border border-theme-border/40">
                          <div className="flex items-center justify-between">
                            <span>First Contact:</span>
                            <span className="text-theme-text font-semibold">{contact.firstContactDate ? new Date(contact.firstContactDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Last Contact:</span>
                            <span className="text-theme-text font-semibold">{contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          {contact.assignedToName && (
                            <div className="flex items-center justify-between pt-0.5 border-t border-theme-border/60">
                              <span>Owner:</span>
                              <span className="text-theme-primary font-bold">{contact.assignedToName}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-between pt-1 border-t border-theme-border/60 text-[10px]">
                          <span className="text-[9px] text-theme-text-muted truncate max-w-[170px]">
                            {contact.lastActivityDescription || 'Interaction recorded'}
                          </span>
                          <button
                            onClick={() => openDetails(contact.leadId)}
                            className="flex items-center gap-1 text-[10px] font-extrabold text-theme-primary hover:underline"
                          >
                            Timeline <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {contacts.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-theme-border/60 rounded-2xl bg-theme-card/40 space-y-2">
                        <Users size={20} className="mx-auto text-theme-text-muted" />
                        <h5 className="text-xs font-bold text-theme-text">No Contacts In Repository</h5>
                        <p className="text-[10px] text-theme-text-muted">
                          Leads automatically sync here upon their first successful interaction.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: TABLE VIEW (UNTOUCHED & PRESERVED) */}
          {viewMode === 'table' && (
            <div className="rounded-3xl border border-theme-border bg-theme-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg-alt border-b border-theme-border text-theme-text-muted font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Client Name & Company</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Source / Campaign</th>
                      <th className="p-4">Priority & Quality</th>
                      <th className="p-4">Stage Status</th>
                      <th className="p-4">Follow-up Schedule</th>
                      <th className="p-4">Progress %</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/30">
                    {(selectedStage === 'ALL' ? filteredLeads : filteredLeads.filter(l => getStageLeads(selectedStage).some(sl => sl.id === l.id))).map((lead) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => openDetails(lead.id)}
                        className="hover:bg-theme-bg-alt/40 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="font-extrabold text-theme-text">{lead.name}</div>
                          <div className="text-[10px] font-semibold text-theme-text-muted">{lead.company || 'Enterprise Contact'}</div>
                        </td>

                        <td className="p-4 space-y-0.5">
                          <div className="font-bold text-theme-text flex items-center gap-1">
                            <Phone size={12} className="text-theme-primary" /> {lead.phone || 'N/A'}
                          </div>
                          <div className="text-[10px] text-theme-text-muted">{lead.email}</div>
                        </td>

                        <td className="p-4">
                          <Link
                            to="/campaigns"
                            className="font-bold text-theme-text hover:text-theme-primary hover:underline transition-colors block"
                            title="Open Campaigns"
                          >
                            {lead.campaignName || 'Direct'}
                          </Link>
                          <span className="block text-[10px] text-theme-text-muted">{lead.sourcePlatform || 'Web'}</span>
                        </td>

                        <td className="p-4 space-y-1">
                          <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            lead.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {lead.priority || 'MEDIUM'}
                          </span>
                          <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <Flame size={11} className="text-amber-400 fill-amber-400/20" />
                            <span>{lead.qualityTier} ({lead.qualityScore}pt)</span>
                          </div>
                        </td>

                        <td className="p-4 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'New'}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="bg-theme-bg-alt border border-theme-border/50 rounded-xl px-2.5 py-1 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary block"
                          >
                            {STAGES_TABLE_LIST.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1 flex-wrap">
                            {isLeadFresh(lead) && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-0.5">
                                <Sparkles size={9} /> Fresh
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          {lead.nextFollowupDate ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-purple-400 flex items-center gap-1 text-xs">
                                <ClipboardList size={11} /> {new Date(lead.nextFollowupDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-theme-text-muted">
                                <span className="font-semibold text-purple-300 uppercase px-1 rounded bg-purple-500/10 border border-purple-500/20">{lead.followupType || 'CALL'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-theme-text-muted italic">N/A</span>
                          )}
                        </td>

                        <td className="p-4 w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-theme-bg-alt rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-theme-primary h-full rounded-full"
                                style={{ width: `${lead.progressPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-theme-text">{lead.progressPercentage || 0}%</span>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetails(lead.id); }}
                            className="px-3 py-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-[10px] font-bold text-white shadow"
                          >
                            Open Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-theme-text-muted">
                          No work items match your selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: EXECUTIVE FOLLOW-UPS MANAGEMENT VIEW */}
          {viewMode === 'followups' && (
            <div className="rounded-3xl border border-theme-border bg-theme-card shadow-md overflow-hidden animate-fade-in space-y-0">
              {followupSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-xs font-bold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={15} /> {followupSuccessMsg}
                </div>
              )}

              {/* Followups Toolbar */}
              <div className="p-4 space-y-4 border-b border-theme-border/60 bg-theme-card">
                {/* Status Tabs */}
                <div className="flex items-center justify-between gap-2 flex-wrap border-b border-theme-border/40 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { key: 'ALL', label: 'All Follow-ups', count: activeExecutiveFollowups.length },
                      { key: 'UPCOMING', label: 'Scheduled / Upcoming', count: activeExecutiveFollowups.filter(f => f.status === 'UPCOMING' || f.status === 'SCHEDULED' || f.status === 'PENDING').length },
                      { key: 'OVERDUE', label: 'Overdue', count: activeExecutiveFollowups.filter(f => f.status === 'OVERDUE' || f.status === 'MISSED' || f.isOverdue).length },
                      { key: 'COMPLETED', label: 'Completed', count: activeExecutiveFollowups.filter(f => f.status === 'COMPLETED').length },
                      { key: 'CANCELLED', label: 'Cancelled', count: activeExecutiveFollowups.filter(f => f.status === 'CANCELLED').length },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFollowupStatusTab(tab.key as any)}
                        className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                          followupStatusTab === tab.key
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-theme-bg-alt text-theme-text-muted hover:text-theme-text'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${followupStatusTab === tab.key ? 'bg-white/20 text-white' : 'bg-theme-border text-theme-text-muted'}`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (filteredLeads.length > 0) {
                        setModalLead({ id: filteredLeads[0].id, name: filteredLeads[0].name, stage: filteredLeads[0].status, assignedUserId: filteredLeads[0].assignedToId });
                        setShowScheduleModal(true);
                      } else {
                        alert('No active leads found for this executive to schedule a follow-up.');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <Plus size={14} /> Schedule Follow-up
                  </button>
                </div>

                {/* Search & Stage Filter for Followups */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search size={14} className="absolute left-3.5 top-2.5 text-theme-text-muted" />
                    <input
                      type="text"
                      placeholder="Search follow-ups by lead name, type, or notes..."
                      value={followupSearchTerm}
                      onChange={(e) => setFollowupSearchTerm(e.target.value)}
                      className="w-full rounded-2xl bg-theme-bg-alt pl-9 pr-3 py-2 text-xs font-semibold text-theme-text outline-none border border-theme-border/60 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-theme-text-muted flex items-center gap-1">
                      <Filter size={14} /> Stage:
                    </span>
                    <select
                      value={followupStageFilter}
                      onChange={(e) => setFollowupStageFilter(e.target.value)}
                      className="rounded-2xl border border-theme-border bg-theme-bg-alt px-3 py-2 text-xs font-bold text-theme-text outline-none focus:border-blue-500"
                    >
                      <option value="ALL">All Stages</option>
                      <option value="New">New Leads</option>
                      <option value="Interaction">Interaction</option>
                      <option value="Proposal Sent">Proposal Sent</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Followups Items List */}
              {filteredExecutiveFollowups.length === 0 ? (
                <div className="p-12 text-center text-theme-text-muted space-y-2">
                  <Calendar size={36} className="mx-auto text-theme-text-muted opacity-40" />
                  <h3 className="text-sm font-extrabold text-theme-text">No Follow-ups Scheduled</h3>
                  <p className="text-xs">No follow-ups found for this executive matching the current filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-theme-border/50">
                  {filteredExecutiveFollowups.map((f) => {
                    const isOverdue = f.isOverdue || f.status === 'OVERDUE' || f.status === 'MISSED';
                    return (
                      <div
                        key={f.id}
                        className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:bg-theme-bg-alt/30 ${
                          isOverdue ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        {/* Details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => {
                                setSelectedLeadId(f.leadId);
                                setIsPanelOpen(true);
                              }}
                              className="text-sm font-black text-theme-text cursor-pointer hover:text-theme-primary hover:underline flex items-center gap-1.5"
                            >
                              {f.leadName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-theme-bg-alt border text-theme-text border-theme-border/60">
                              Stage: {f.leadStage || 'Interaction'}
                            </span>
                            {isOverdue ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                                <AlertCircle size={11} /> Overdue
                              </span>
                            ) : f.status === 'COMPLETED' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Completed
                              </span>
                            ) : f.status === 'CANCELLED' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gray-500/10 text-gray-500 border border-gray-500/20 flex items-center gap-1">
                                <Ban size={11} /> Cancelled
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                                <Clock size={11} /> Scheduled
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold text-theme-text-muted flex-wrap">
                            <div className="flex items-center gap-1 text-blue-500 font-bold">
                              <Clock size={13} />
                              <span>{new Date(f.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded bg-theme-bg-alt border border-theme-border text-[10px] font-extrabold uppercase text-theme-text">
                              {f.type || 'CALL'}
                            </span>
                            {f.leadPhone && (
                              <div className="flex items-center gap-1">
                                <Phone size={12} /> {f.leadPhone}
                              </div>
                            )}
                            {f.leadEmail && (
                              <div className="flex items-center gap-1">
                                <Mail size={12} /> {f.leadEmail}
                              </div>
                            )}
                          </div>

                          {f.notes && (
                            <p className="text-xs text-theme-text italic bg-theme-bg-alt/60 p-2.5 rounded-xl border border-theme-border/40 inline-block">
                              "{f.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {f.status !== 'COMPLETED' && f.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => handleCompleteFollowup(f.id)}
                                title="Mark completed"
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all text-xs font-bold flex items-center gap-1"
                              >
                                <CheckCircle2 size={14} /> Done
                              </button>
                              <button
                                onClick={() => handleCancelFollowup(f.id)}
                                title="Cancel follow-up"
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all text-xs font-bold"
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedLeadId(f.leadId);
                              setIsPanelOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-bold shadow-sm transition-all"
                          >
                            <Sparkles size={13} /> Work on Lead
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )}

      {/* Full Screen Work Details Side Panel Drawer */}
      <WorkDetailsPanel
        leadId={selectedLeadId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onLeadUpdated={fetchMyWorkLeads}
        period={selectedPeriod}
        startDate={searchParams.get('startDate') || undefined}
        endDate={searchParams.get('endDate') || undefined}
      />

      {/* Follow-up Scheduling Modal */}
      {showScheduleModal && modalLead && (
        <FollowUpModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setModalLead(null);
          }}
          leadId={modalLead.id}
          leadName={modalLead.name}
          leadStage={modalLead.stage}
          assignedUserId={modalLead.assignedUserId || activeExecutive?.id || currentUser?.id}
          onSuccess={() => {
            fetchMyWorkLeads();
            setFollowupSuccessMsg('Follow-up scheduled successfully!');
            setTimeout(() => setFollowupSuccessMsg(''), 3000);
          }}
        />
      )}

    </div>
  );
}
