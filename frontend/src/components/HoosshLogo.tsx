import React from 'react';

interface HoosshLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon-only' | 'full' | 'badge' | 'image';
  showText?: boolean;
  showTagline?: boolean;
  animated?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export const HoosshLogo: React.FC<HoosshLogoProps> = ({
  size = 32,
  className = '',
  variant = 'full',
  showTagline = false,
  animated = false
}) => {
  // If variant is icon-only, full, or image, render the official logo asset
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <img
          src="/assets/hoossh-logo.png"
          alt="Hoossh Logo"
          style={{ height: `${size}px`, width: 'auto' }}
          className={`object-contain ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`flex items-center gap-2.5 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-slate-700/80 shadow-xl backdrop-blur-md ${className}`}>
        <img
          src="/assets/hoossh-logo.png"
          alt="Hoossh Logo"
          style={{ height: `${size}px`, width: 'auto' }}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/assets/hoossh-logo.png"
        alt="Hoossh Lead Management Logo"
        style={{ height: `${size}px`, width: 'auto' }}
        className={`object-contain ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
      />
      {showTagline && (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-theme-text-muted">
            Lead Management
          </span>
        </div>
      )}
    </div>
  );
};

export default HoosshLogo;
