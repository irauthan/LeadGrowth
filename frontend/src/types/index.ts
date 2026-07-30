export interface User {
  id: number;
  email: string;
  fullName: string;
  designation?: string;
  bio?: string;
  profileImage?: string;
  phone?: string;
  roles: string[];
  workspaceId?: number;
  workspaceName?: string;
  workspaceSlug?: string;
  inviteCode?: string;
  department?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  lastActiveAt?: string;
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'OFFLINE' | 'ON_LEAVE';
}

export interface Workspace {
  id: number;
  name: string;
  companyName?: string;
  industry?: string;
  teamSize?: number;
  website?: string;
  timezone?: string;
  inviteCode: string;
  slug: string;
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  platform: string; // Meta, Google
  status: string; // Active, Paused, Completed
  spend: number;
  clicks: number;
  impressions: number;
  leadsCount: number;
  conversions: number;
  revenue: number;
  createdAt: string;
}

export type CommunicationType = 'PHONE_CALL' | 'WHATSAPP' | 'EMAIL' | 'GOOGLE_MEET' | 'ZOOM' | 'OFFICE_VISIT' | 'VIDEO_CALL' | 'OTHER';
export type OutcomeType = 'BUSY' | 'NOT_ANSWERED' | 'REJECTED_CALL' | 'WRONG_NUMBER' | 'INTERESTED' | 'NOT_INTERESTED' | 'CALL_BACK_LATER' | 'MEETING_SCHEDULED' | 'DEMO_SCHEDULED' | 'PROPOSAL_REQUESTED' | 'NEGOTIATION_STARTED' | 'CONVERTED' | 'LOST' | 'CUSTOM_OUTCOME';
export type ActivityStatusType = 'ATTEMPTED' | 'IN_PROGRESS' | 'WAITING' | 'SCHEDULED' | 'SUCCESSFUL' | 'COMPLETED' | 'CANCELLED';

export interface SalesActivityLog {
  id: number;
  salesActivityId: number;
  leadId: number;
  activityNumber: number;
  communicationType: CommunicationType;
  outcome: OutcomeType;
  remarks: string;
  duration?: string;
  status: ActivityStatusType;
  nextFollowupDate?: string;
  attachments?: string;
  loggedById: number;
  loggedByName: string;
  createdAt: string;
}

export interface SalesActivity {
  id: number;
  leadId: number;
  activityKey: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  completedById?: number;
  completedByName?: string;
  completionRemarks?: string;
  remarks?: string;
  createdAt: string;
  logs?: SalesActivityLog[];
  totalActivitiesCount?: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  sourcePlatform: string;
  campaignName: string;
  campaignId?: number;
  status: 'New' | 'Interaction' | 'Contacted' | 'Interested' | 'Follow-Up' | 'Follow-up' | 'Proposal Sent' | 'Negotiation' | 'Qualified' | 'Converted' | 'Rejected' | 'Lost';
  assignedToId?: number;
  assignedToName?: string;
  qualityScore?: number;
  qualityTier?: string;
  conversionProbability?: number;
  queueStatus?: string;
  company?: string;
  location?: string;
  priority?: string;
  clientNotes?: string;
  proposalAmount?: number;
  proposalStatus?: string;
  progressPercentage?: number;
  lastFollowupDate?: string;
  nextFollowupDate?: string;
  followupNotes?: string;
  followupType?: string;
  followupStatus?: string;
  activities?: SalesActivity[];
  createdAt: string;
}

export interface ContactRepoItem {
  leadId: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  sourcePlatform: string;
  currentStage: string;
  assignedToId?: number;
  assignedToName?: string;
  qualityScore?: number;
  qualityTier?: string;
  conversionProbability?: number;
  firstContactDate?: string;
  lastContactDate?: string;
  totalCalls: number;
  totalEmails: number;
  totalWhatsApp: number;
  totalInteractionsCount: number;
  lastActivityDescription?: string;
  createdAt: string;
}

export interface PriorityItem {
  leadId: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  sourcePlatform: string;
  currentStage: string;
  qualityScore?: number;
  qualityTier?: string;
  conversionProbability?: number;
  priorityLevel: string;
  priorityLabel: string;
  dueDate?: string;
  dueTime?: string;
  urgencyReason: string;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  lastActivityAt?: string;
  lastActivityDescription?: string;
}

export interface PriorityStats {
  todaysWorkCount: number;
  overdueCount: number;
  highPriorityCount: number;
  todaysFollowupsCount: number;
  negotiationsCount: number;
  newLeadsCount: number;
  completedTodayCount: number;
}

export interface LeadNote {
  id: number;
  note: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedByName?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'Pending' | 'In_Progress' | 'In Progress' | 'Completed' | 'Rejected' | 'PENDING' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'Pending_Review' | 'APPROVED' | 'Approved' | 'REJECTED' | 'Rejected' | 'COMPLETED' | 'SUSPENDED' | 'Suspended';
  createdAt: string;
}

export interface PlatformShare {
  platform: string;
  count: number;
  value?: number;
}

export interface TrendDataPoint {
  date: string;
  clicks: number;
  impressions: number;
  conversions: number;
  leads: number;
  spend: number;
  revenue: number;
}

export interface SyncLog {
  id: number;
  platform: string;
  status: 'Success' | 'Failed';
  details: string;
  createdAt: string;
}

export interface Integration {
  id: number;
  platform: string;
  apiKey: string;
  status: 'Connected' | 'Disconnected';
  lastSyncedAt?: string;
}

export interface TeamActivity {
  id: number;
  userEmail: string;
  userName: string;
  action: string;
  description: string;
  timestamp: string;
}

export interface WorkspaceStat {
  name: string;
  teamSize: number;
  activeCampaigns: number;
  totalLeads: number;
  industry: string;
}

export interface DashboardKpis {
  totalLeads: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  ctr: number;
  cpc: number;
  recentLeads: Lead[];
  platformLeadsShare: PlatformShare[];
  platformRevenueShare: PlatformShare[];
  trends: TrendDataPoint[];
  funnel: Record<string, number>;
  teamActivities: TeamActivity[];
  workspaceStats: WorkspaceStat[];
}

export interface FollowupReminder {
  id: number;
  leadId: number;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  assignedToId?: number;
  assignedToName?: string;
  scheduledAt: string;
  nextFollowupDate?: string;
  status: 'UPCOMING' | 'PENDING' | 'COMPLETED' | 'MISSED' | string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'DEMO' | 'WHATSAPP' | string;
  notes?: string;
  remarks?: string;
  outcome?: string;
  createdByName?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface CallSession {
  id: number;
  leadId: number;
  leadName?: string;
  leadPhone?: string;
  leadCompany?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  durationMinutes?: number;
  formattedDuration?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  notes?: string;
  createdAt: string;
}

export interface CallAnalytics {
  todayCallTimeSeconds: number;
  todayCallTimeFormatted: string;
  todayCallsCount: number;
  avgDurationSeconds: number;
  avgDurationFormatted: string;
  longestCallSeconds: number;
  longestCallFormatted: string;
  activeCallSession?: CallSession;
  weeklyCallTimeSeconds?: number;
  weeklyCallTimeFormatted?: string;
  monthlyCallTimeSeconds?: number;
  monthlyCallTimeFormatted?: string;
  totalTeamCallsToday?: number;
  totalTeamCallTimeSeconds?: number;
  totalTeamCallTimeFormatted?: string;
  topCallingUser?: string;
  leastActiveUser?: string;
  dailyCallDurationChart?: Array<{ date: string; minutes: number; seconds: number }>;
  userProductivityLeaderboard?: Array<{
    rank: number;
    userId: number;
    userName: string;
    callsCount: number;
    callTimeSeconds: number;
    callTimeFormatted: string;
    avgDurationFormatted: string;
  }>;
}

export interface WorkloadScore {
  userId: number;
  userName: string;
  userEmail: string;
  activeLeads: number;
  pendingFollowups: number;
  todayActiveTasks: number;
  todayCallTimeSeconds: number;
  todayCallTimeFormatted: string;
  overdueTasks: number;
  workloadScore: number;
  preferredForAutoAssignment: boolean;
}

