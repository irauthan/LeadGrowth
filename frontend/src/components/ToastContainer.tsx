import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, type ToastItem } from '../store/toastStore';
import { CheckCircle2, AlertOctagon, AlertTriangle, Sparkles, X } from 'lucide-react';

const ToastMessage: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3800);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      borderColor: 'border-emerald-500/40 ring-1 ring-emerald-500/20',
      shadowColor: 'shadow-[0_16px_45px_-10px_rgba(16,185,129,0.35)]',
      accentGradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400'
    },
    error: {
      icon: AlertOctagon,
      iconColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      borderColor: 'border-rose-500/40 ring-1 ring-rose-500/20',
      shadowColor: 'shadow-[0_16px_45px_-10px_rgba(244,63,94,0.35)]',
      accentGradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-400'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      borderColor: 'border-amber-500/40 ring-1 ring-amber-500/20',
      shadowColor: 'shadow-[0_16px_45px_-10px_rgba(245,158,11,0.35)]',
      accentGradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400'
    },
    info: {
      icon: Sparkles,
      iconColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      borderColor: 'border-indigo-500/40 ring-1 ring-indigo-500/20',
      shadowColor: 'shadow-[0_16px_45px_-10px_rgba(99,102,241,0.35)]',
      accentGradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
      barColor: 'bg-gradient-to-r from-indigo-500 to-cyan-400'
    }
  }[toast.type];

  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -30, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className={`relative overflow-hidden w-full max-w-md sm:max-w-lg rounded-3xl border ${config.borderColor} ${config.shadowColor} bg-theme-card/95 p-4 sm:p-5 backdrop-blur-2xl transition-all group`}
    >
      {/* Top subtle radiant glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.accentGradient} pointer-events-none`} />

      <div className="relative flex items-center gap-3.5">
        {/* Glowing Icon Badge */}
        <div className={`w-11 h-11 rounded-2xl border ${config.badgeBg} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <IconComponent size={22} className={config.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <h4 className="text-xs sm:text-sm font-extrabold text-theme-text tracking-tight mb-0.5">
              {toast.title}
            </h4>
          )}
          <p className="text-xs sm:text-[13px] text-theme-text/90 leading-snug font-medium break-words">
            {toast.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1.5 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt/80 transition-all active:scale-90"
          title="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Modern bottom auto-dismiss progress line */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || 3800) / 1000, ease: 'linear' }}
        style={{ originX: 0 }}
        className={`absolute bottom-0 left-0 right-0 h-1 ${config.barColor}`}
      />
    </motion.div>
  );
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <aside
      aria-label="Notifications"
      className="fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 max-w-lg w-[calc(100vw-2rem)] pointer-events-none"
    >
      <div className="flex flex-col items-center gap-3 w-full pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <ToastMessage key={item.id} toast={item} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}
