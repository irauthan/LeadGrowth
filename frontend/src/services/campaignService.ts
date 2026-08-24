import api from './api';
import type { Campaign, CampaignDetails } from '../types';

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

  createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
    const res = await api.post('/api/campaigns', data);
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

  deleteCampaign: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/api/campaigns/${id}`);
    return res.data;
  },
};
