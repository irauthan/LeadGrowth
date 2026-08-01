import api from './api';
import type { CalendarEvent, CreateCalendarEventRequest } from '../types';

export const calendarService = {
  getEvents: async (start?: string, end?: string): Promise<CalendarEvent[]> => {
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const res = await api.get('/api/calendar', { params });
    return res.data;
  },

  createEvent: async (data: CreateCalendarEventRequest): Promise<CalendarEvent> => {
    const res = await api.post('/api/calendar', data);
    return res.data;
  },

  updateEvent: async (id: number, data: Partial<CreateCalendarEventRequest>): Promise<CalendarEvent> => {
    const res = await api.put(`/api/calendar/${id}`, data);
    return res.data;
  },

  completeEvent: async (id: number): Promise<CalendarEvent> => {
    const res = await api.patch(`/api/calendar/${id}/complete`);
    return res.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/api/calendar/${id}`);
  }
};
