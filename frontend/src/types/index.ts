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

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  sourcePlatform: string;
  campaignName: string;
  campaignId?: number;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected';
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
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
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In_Progress' | 'Completed';
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
