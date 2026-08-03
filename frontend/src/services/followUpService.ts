import api from './api';

export interface FollowUp {
  id: number;
  leadId: number;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  leadStage?: string;
  leadPriority?: string;
  assignedToId?: number;
  assignedToName?: string;
  scheduledAt: string;
  status: 'UPCOMING' | 'SCHEDULED' | 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'DEMO' | 'VISIT' | string;
  notes?: string;
  remarks?: string;
  outcome?: string;
  isOverdue?: boolean;
  nextFollowupDate?: string;
  createdByName?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateFollowUpPayload {
  leadId: number;
  scheduledAt: string;
  type?: string;
  notes?: string;
  remarks?: string;
  outcome?: string;
  autoScheduleIfConflict?: boolean;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  isWithinWorkingHours: boolean;
  scheduledAt: string;
  message?: string;
  suggestedSlot?: string;
}

export const followUpService = {
  getFollowups: async (): Promise<FollowUp[]> => {
    const response = await api.get('/followups');
    return response.data;
  },

  getTodayFollowups: async (): Promise<FollowUp[]> => {
    const response = await api.get('/followups/today');
    return response.data;
  },

  checkConflict: async (userId: number, scheduledAt: string, excludeId?: number): Promise<ConflictCheckResult> => {
    const response = await api.get('/followups/check-conflict', {
      params: { userId, scheduledAt, excludeId }
    });
    return response.data;
  },

  createFollowup: async (payload: CreateFollowUpPayload): Promise<FollowUp> => {
    const response = await api.post('/followups', payload);
    return response.data;
  },

  autoSchedule: async (leadId: number, type: string = 'CALL', notes?: string): Promise<FollowUp> => {
    const response = await api.post('/followups/auto-schedule', { leadId, type, notes });
    return response.data;
  },

  bulkAutoSchedule: async (leadIds: number[]): Promise<FollowUp[]> => {
    const response = await api.post('/followups/bulk-auto-schedule', { leadIds });
    return response.data;
  },

  reschedule: async (id: number, scheduledAt: string, autoScheduleIfConflict: boolean = false): Promise<FollowUp> => {
    const response = await api.post(`/followups/${id}/reschedule`, { scheduledAt, autoScheduleIfConflict });
    return response.data;
  },

  cancel: async (id: number, reason?: string): Promise<FollowUp> => {
    const response = await api.post(`/followups/${id}/cancel`, { reason });
    return response.data;
  },

  reassign: async (id: number, newUserId: number, scheduledAt?: string): Promise<FollowUp> => {
    const response = await api.post(`/followups/${id}/reassign`, { newUserId, scheduledAt });
    return response.data;
  },

  complete: async (id: number, notes?: string): Promise<FollowUp> => {
    const response = await api.post(`/followups/${id}/complete`, { notes });
    return response.data;
  }
};
