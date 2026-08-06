import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export interface TimeFilterState {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | string;
  startDate?: string;
  endDate?: string;
}

interface Props {
  value: TimeFilterState;
  onChange: (filter: TimeFilterState) => void;
  className?: string;
}

export default function TimeFilterDropdown({ value, onChange, className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(value.period === 'custom');
  const [customStart, setCustomStart] = useState(value.startDate || '');
  const [customEnd, setCustomEnd] = useState(value.endDate || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'yearly', label: 'This Year' },
    { key: 'custom', label: 'Custom Date Range' },
  ];

  const currentOptionLabel = options.find((o) => o.key === value.period)?.label || 'This Month';

  const handleSelect = (key: string) => {
    if (key === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      onChange({ period: key });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      alert('Please select both Start Date and End Date.');
      return;
    }
    onChange({
      period: 'custom',
      startDate: customStart,
      endDate: customEnd,
    });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-2xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-extrabold text-theme-text shadow-sm hover:border-theme-primary transition-all cursor-pointer"
      >
        <Calendar size={14} className="text-theme-primary" />
        <span>{currentOptionLabel}</span>
        <ChevronDown size={14} className="text-theme-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-3xl border border-theme-border bg-theme-card p-3 shadow-2xl z-50 space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-theme-text-muted px-2 pt-1">
            Select Time Period
          </div>

          <div className="space-y-1">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelect(opt.key)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  value.period === opt.key
                    ? 'bg-theme-primary/10 text-theme-primary border border-theme-primary/20'
                    : 'text-theme-text hover:bg-theme-bg-alt'
                }`}
              >
                <span>{opt.label}</span>
                {value.period === opt.key && <Check size={14} />}
              </button>
            ))}
          </div>

          {showCustomRange && (
            <div className="pt-3 border-t border-theme-border/40 space-y-2.5 px-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs text-theme-text font-bold outline-none focus:border-theme-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-theme-text-muted uppercase">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs text-theme-text font-bold outline-none focus:border-theme-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full rounded-xl bg-theme-primary hover:bg-theme-primary-hover py-2 text-xs font-bold text-white shadow-md transition-all mt-1"
              >
                Apply Custom Range
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
