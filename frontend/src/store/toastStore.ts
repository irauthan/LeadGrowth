import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clearAll: () => set({ toasts: [] })
}));

// Convenient imperative API callable from anywhere in components or services
export const toast = {
  success: (message: string, title?: string, duration = 3800) => {
    return useToastStore.getState().addToast({ type: 'success', message, title, duration });
  },
  error: (message: string, title?: string, duration = 4500) => {
    return useToastStore.getState().addToast({ type: 'error', message, title: title || 'Error', duration });
  },
  warning: (message: string, title?: string, duration = 4000) => {
    return useToastStore.getState().addToast({ type: 'warning', message, title: title || 'Attention', duration });
  },
  info: (message: string, title?: string, duration = 3500) => {
    return useToastStore.getState().addToast({ type: 'info', message, title, duration });
  }
};
