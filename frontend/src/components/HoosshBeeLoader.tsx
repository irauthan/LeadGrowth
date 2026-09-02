import React from 'react';

interface HoosshBeeLoaderProps {
  /** If true, covers full viewport with backdrop blur. Default: false */
  fullscreen?: boolean;
  /** Size of the Honey Bee icon */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom extra classes */
  className?: string;
  // Kept for backward compatibility with existing prop calls without errors
  text?: string;
  subtext?: string;
  showBrand?: boolean;
}

export const HoosshBeeLoader: React.FC<HoosshBeeLoaderProps> = ({
  fullscreen = false,
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: { bee: 56, hex: 90 },
    md: { bee: 84, hex: 130 },
    lg: { bee: 110, hex: 160 },
    xl: { bee: 140, hex: 200 }
  };

  const config = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center select-none text-center relative z-10 ${className}`}>
      
      {/* Honey Bee + Hexagon Pulse Aura Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Golden Honey & Cyan Ambient Glow Ripple */}
        <div 
          className="absolute rounded-full bg-gradient-to-tr from-amber-500/35 via-orange-500/25 to-cyan-400/25 blur-2xl animate-honey-glow pointer-events-none"
          style={{ width: `${config.hex * 1.6}px`, height: `${config.hex * 1.6}px` }}
        />

        {/* Outer Hexagon Orbit Ring (Dashed Gold/Amber) */}
        <svg
          className="absolute animate-hex-rotate pointer-events-none opacity-50 text-amber-500"
          width={config.hex}
          height={config.hex}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 6"
        >
          <polygon points="50,4 92,26 92,74 50,96 8,74 8,26" />
        </svg>

        {/* Inner Counter-Rotating Hexagon Ring (Teal / Cyan) */}
        <svg
          className="absolute animate-hex-counter-rotate pointer-events-none opacity-40 text-cyan-400"
          width={config.hex * 0.78}
          height={config.hex * 0.78}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        >
          <polygon points="50,6 88,27 88,73 50,94 12,73 12,27" />
        </svg>

        {/* The 3D Floating Honey Bee Icon */}
        <div className="relative z-10 animate-bee-flutter flex flex-col items-center justify-center">
          <img
            src="/assets/hoossh-icon.png"
            alt="Hoossh 3D Bee"
            style={{ width: `${config.bee}px`, height: `${config.bee}px` }}
            className="object-contain filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] transition-all"
            loading="eager"
          />
        </div>

        {/* Dynamic Bee Flight Shadow */}
        <div 
          className="absolute -bottom-3 rounded-full bg-amber-900/30 dark:bg-black/40 blur-sm animate-bee-shadow pointer-events-none"
          style={{ width: `${config.bee * 0.65}px`, height: '8px' }}
        />

        {/* Sparkling Stars & Pollen Dots */}
        <span className="absolute -top-2 -right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 animate-ping opacity-80" />
        <span className="absolute top-1/2 -left-4 w-2 h-2 rounded-full bg-cyan-300 animate-pulse opacity-90" />
        <span className="absolute -bottom-1 -left-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping opacity-75" style={{ animationDelay: '500ms' }} />
      </div>

    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-theme-bg/90 backdrop-blur-md transition-all duration-300 animate-fade-in p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[75vh] flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      {content}
    </div>
  );
};

export default HoosshBeeLoader;
