import React from 'react';

interface HoosshBeeLoaderProps {
  /** If true, covers full viewport with backdrop blur. Default: false */
  fullscreen?: boolean;
  /** Primary loading title */
  text?: string;
  /** Secondary helper text */
  subtext?: string;
  /** Size of the Honey Bee icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show Hoossh brand wordmark */
  showBrand?: boolean;
  /** Custom extra classes */
  className?: string;
}

export const HoosshBeeLoader: React.FC<HoosshBeeLoaderProps> = ({
  fullscreen = false,
  text = 'Loading Workspace...',
  subtext = 'Syncing real-time pipeline & lead intelligence',
  size = 'md',
  showBrand = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { bee: 40, hex: 70, bar: 'w-32' },
    md: { bee: 64, hex: 100, bar: 'w-44' },
    lg: { bee: 88, hex: 130, bar: 'w-56' },
    xl: { bee: 110, hex: 160, bar: 'w-64' }
  };

  const config = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center select-none text-center ${className}`}>
      
      {/* Honey Bee + Hexagon Pulse Aura Container */}
      <div className="relative flex items-center justify-center mb-5">
        
        {/* Golden Honey Ambient Glow Ripple */}
        <div 
          className="absolute rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-indigo-500/20 blur-xl animate-honey-glow pointer-events-none"
          style={{ width: `${config.hex * 1.5}px`, height: `${config.hex * 1.5}px` }}
        />

        {/* Outer Hexagon Orbit Ring (Subtle SVG) */}
        <svg
          className="absolute animate-hex-rotate pointer-events-none opacity-40 text-amber-500/40"
          width={config.hex}
          height={config.hex}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        >
          <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" />
        </svg>

        {/* Inner Hexagon Ring */}
        <svg
          className="absolute pointer-events-none opacity-60 text-amber-400/50"
          width={config.hex * 0.8}
          height={config.hex * 0.8}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <polygon points="50,6 88,27 88,73 50,94 12,73 12,27" />
        </svg>

        {/* The Floating Honey Bee Icon */}
        <div className="relative z-10 animate-bee-flutter flex items-center justify-center drop-shadow-[0_8px_16px_rgba(245,158,11,0.25)]">
          <img
            src="/assets/hoossh-icon.png"
            alt="Hoossh Honey Bee"
            style={{ width: `${config.bee}px`, height: `${config.bee}px` }}
            className="object-contain"
            loading="eager"
          />
        </div>

        {/* Small Sparkling Dots around the Bee */}
        <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
        <span className="absolute -bottom-2 -left-1 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse opacity-90" />
      </div>

      {/* Brand & Loading Text */}
      <div className="flex flex-col items-center gap-1.5 z-10">
        {showBrand && (
          <div className="flex items-center gap-1 text-sm sm:text-base font-extrabold tracking-tight text-theme-text">
            <span>Hoossh</span>
            <span className="text-amber-500 font-black">Lead Growth</span>
          </div>
        )}

        <div className="text-xs sm:text-sm font-bold text-theme-text flex items-center gap-2">
          <span>{text}</span>
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>

        {subtext && (
          <p className="text-[11px] text-theme-text-muted font-medium max-w-xs text-center">
            {subtext}
          </p>
        )}
      </div>

      {/* Honey Shimmer Progress Bar */}
      <div className={`mt-4 h-1.5 ${config.bar} rounded-full bg-theme-border/60 overflow-hidden relative shadow-inner`}>
        <div className="absolute inset-0 animate-shimmer-bar rounded-full" />
      </div>

    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-bg/85 backdrop-blur-md transition-all duration-300 animate-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center animate-fade-in">
      {content}
    </div>
  );
};

export default HoosshBeeLoader;
