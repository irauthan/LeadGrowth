import React from 'react';

interface HoosshLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon-only' | 'full' | 'with-text' | 'badge' | 'image';
  showTagline?: boolean;
  tagline?: string;
  animated?: boolean;
  alt?: string;
}

export const HoosshLogo: React.FC<HoosshLogoProps> = ({
  size = 36,
  className = '',
  variant = 'full',
  showTagline = false,
  tagline = 'Lead Growth CRM',
  animated = false,
  alt = 'Hoossh'
}) => {
  // Variant: icon-only (renders only the 3D flying Bee icon)
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src="/assets/hoossh-icon.png"
          alt={alt}
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className={`object-contain select-none drop-shadow-sm ${animated ? 'transition-all duration-300 hover:scale-105' : ''}`}
          loading="eager"
        />
      </div>
    );
  }

  // Variant: badge (dark floating card badge)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 rounded-2xl bg-slate-900/80 px-3.5 py-2 border border-slate-700/60 shadow-xl backdrop-blur-md ${className}`}>
        <img
          src="/assets/hoossh-logo.png"
          alt={alt}
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className="object-contain select-none drop-shadow-md"
          loading="eager"
        />
      </div>
    );
  }

  // Variant: full & with-text (renders the authentic 3D "hoossh" wordmark with the bee perched on top)
  if (showTagline) {
    return (
      <div className={`inline-flex flex-col items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src="/assets/hoossh-logo.png"
          alt={alt}
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className={`object-contain select-none drop-shadow-sm ${animated ? 'transition-all duration-300 hover:scale-105' : ''}`}
          loading="eager"
        />
        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mt-0.5 select-none text-center">
          {tagline}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      <img
        src="/assets/hoossh-logo.png"
        alt={alt}
        style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
        className={`object-contain select-none drop-shadow-sm ${animated ? 'transition-all duration-300 hover:scale-105' : ''}`}
        loading="eager"
      />
    </div>
  );
};

export default HoosshLogo;
