import api from './api';
import type { 
  Campaign, 
  CampaignDetails, 
  CreatePlatformCampaignRequest, 
  PlatformCampaignResult, 
  CampaignSyncStatus, 
  AdAccountInfo 
} from '../types';

export const campaignService = {
  getCampaigns: async (isUserOnly: boolean = false): Promise<Campaign[]> => {
    const endpoint = isUserOnly ? '/api/campaigns/user-view' : '/api/campaigns';
    const res = await api.get(endpoint);
    return res.data;
  },

  getCampaignDetails: async (id: number): Promise<CampaignDetails> => {
    const res = await api.get(`/api/campaigns/${id}`);
    return res.data;
  },

  createPlatformCampaign: async (data: CreatePlatformCampaignRequest): Promise<PlatformCampaignResult> => {
    const res = await api.post('/api/campaigns/platform-create', data);
    return res.data;
  },

  syncCampaigns: async (platform?: string): Promise<CampaignSyncStatus> => {
    const endpoint = platform ? `/api/campaigns/sync?platform=${platform}` : '/api/campaigns/sync';
    const res = await api.post(endpoint);
    return res.data;
  },

  getSyncStatus: async (): Promise<CampaignSyncStatus> => {
    const res = await api.get('/api/campaigns/sync-status');
    return res.data;
  },

  getConnectedAdAccounts: async (platform?: string): Promise<AdAccountInfo[]> => {
    const endpoint = platform ? `/api/campaigns/ad-accounts?platform=${platform}` : '/api/campaigns/ad-accounts';
    const res = await api.get(endpoint);
    return res.data;
  },

  updateCampaign: async (id: number, data: Partial<Campaign>): Promise<Campaign> => {
    const res = await api.put(`/api/campaigns/${id}`, data);
    return res.data;
  },

  updateCampaignStatus: async (id: number, status: string): Promise<Campaign> => {
    const res = await api.patch(`/api/campaigns/${id}/status`, { status });
    return res.data;
  },

  updateCampaignBudget: async (id: number, budget: number): Promise<Campaign> => {
    const res = await api.patch(`/api/campaigns/${id}/budget`, { budget });
    return res.data;
  },

  deleteCampaign: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/api/campaigns/${id}`);
    return res.data;
  },
};

