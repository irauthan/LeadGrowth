import api from './api';

export interface ApiKeyItem {
  id: number;
  name: string;
  keyPrefix: string;
  key?: string;
  scope: 'Full-Access' | 'Read-Only';
  createdById?: number;
  createdByName?: string;
  lastUsed: string;
  createdDate: string;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  id: number;
  name: string;
  key: string;
  keyPrefix: string;
  scope: 'Full-Access' | 'Read-Only';
  createdDate: string;
  lastUsed: string;
  createdByName: string;
  message: string;
}

export const apiKeyService = {
  getApiKeys: async (): Promise<ApiKeyItem[]> => {
    const res = await api.get('/api/admin/api-keys');
    return Array.isArray(res.data) ? res.data : [];
  },

  createApiKey: async (name: string, scope: 'Full-Access' | 'Read-Only'): Promise<CreateApiKeyResponse> => {
    const res = await api.post('/api/admin/api-keys', { name, scope });
    return res.data;
  },

  revokeApiKey: async (id: number): Promise<{ message: string }> => {
    const res = await api.delete(`/api/admin/api-keys/${id}`);
    return res.data;
  }
};
