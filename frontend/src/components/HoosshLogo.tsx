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
  alt = 'Hoossh Lead Growth'
}) => {
  // Variant: icon-only (renders official Hoossh bee icon)
  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src="/assets/hoossh-icon.png"
          alt={alt}
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className={`object-contain select-none ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
          loading="eager"
        />
      </div>
    );
  }

  // Variant: with-text (renders official bee icon + bold brand name)
  if (variant === 'with-text') {
    return (
      <div className={`inline-flex items-center gap-2.5 flex-shrink-0 ${className}`}>
        <img
          src="/assets/hoossh-icon.png"
          alt="Hoossh Icon"
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className={`object-contain select-none ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
          loading="eager"
        />
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-theme-text leading-tight">
            Hoossh <span className="text-theme-primary font-black">Lead Growth</span>
          </span>
          {showTagline && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-theme-text-muted">
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variant: badge
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-slate-700/80 shadow-xl backdrop-blur-md ${className}`}>
        <img
          src="/assets/hoossh-logo.png"
          alt={alt}
          style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
          className="object-contain select-none"
          loading="eager"
        />
      </div>
    );
  }

  // Variant: full (default official wordmark logo)
  return (
    <div className={`inline-flex items-center gap-2 flex-shrink-0 ${className}`}>
      <img
        src="/assets/hoossh-logo.png"
        alt={alt}
        style={{ height: `${size}px`, width: 'auto', maxHeight: `${size}px` }}
        className={`object-contain select-none ${animated ? 'transition-transform duration-300 hover:scale-105' : ''}`}
        loading="eager"
      />
      {showTagline && (
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-theme-text-muted">
            {tagline}
          </span>
        </div>
      )}
    </div>
  );
};

export default HoosshLogo;
