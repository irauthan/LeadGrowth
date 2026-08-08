import React from 'react';

interface NyaarLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon-only' | 'full' | 'badge';
  showText?: boolean;
  animated?: boolean;
}

export const NyaarLogo: React.FC<NyaarLogoProps> = ({
  size = 28,
  className = '',
  variant = 'icon-only',
  showText = false,
  animated = false,
}) => {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 ${animated ? 'hover:scale-105' : ''}`}
    >
      <defs>
        {/* Main Gradient Stream */}
        <linearGradient id="nyaar-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan 500 */}
          <stop offset="50%" stopColor="#3B82F6" /> {/* Blue 500 */}
          <stop offset="100%" stopColor="#6366F1" /> {/* Indigo 500 */}
        </linearGradient>

        <linearGradient id="nyaar-grad-accent" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" /> {/* Sky 400 */}
          <stop offset="100%" stopColor="#818CF8" /> {/* Indigo 400 */}
        </linearGradient>

        {/* Dynamic Glow Filter */}
        <filter id="nyaar-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagonal Shield Background Container */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="url(#nyaar-grad-primary)"
        fillOpacity="0.12"
        stroke="url(#nyaar-grad-primary)"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />

      {/* Geometric NYAAR 'N' Stems with Growth Slash */}
      {/* Left Vertical Pillar */}
      <path
        d="M 12 28 V 12 C 12 12 14.5 12 16 13.5 V 28 Z"
        fill="url(#nyaar-grad-primary)"
        filter="url(#nyaar-glow)"
      />

      {/* Dynamic Diagonal Growth Ribbon */}
      <path
        d="M 14 12 L 26 28 H 28.5 L 16.5 12 Z"
        fill="url(#nyaar-grad-accent)"
      />

      {/* Right Vertical Pillar */}
      <path
        d="M 24 12 V 28 C 25.5 28 28 28 28 26.5 V 12 Z"
        fill="url(#nyaar-grad-primary)"
        filter="url(#nyaar-glow)"
      />

      {/* Apex Growth Accent Indicator */}
      <circle cx="28" cy="12" r="2.5" fill="#38BDF8" className="animate-pulse" />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-2.5 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-slate-700/80 shadow-xl backdrop-blur-md ${className}`}>
        {icon}
        <span className="text-base font-black tracking-tight text-white">
          NYAAR
        </span>
      </div>
    );
  }

  if (variant === 'full' || showText) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {icon}
        <span className="bg-gradient-to-r from-cyan-400 via-brand-400 to-indigo-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
          NYAAR
        </span>
      </div>
    );
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{icon}</div>;
};

export default NyaarLogo;
