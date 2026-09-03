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
    sm: { bee: 38, gap: 'gap-1', dot: 'w-1.5 h-1.5' },
    md: { bee: 52, gap: 'gap-1.5', dot: 'w-2 h-2' },
    lg: { bee: 66, gap: 'gap-2', dot: 'w-2.5 h-2.5' },
    xl: { bee: 84, gap: 'gap-2.5', dot: 'w-3 h-3' }
  };

  const config = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center select-none text-center relative z-10 m-auto ${config.gap} ${className}`}>
      {/* 3D Floating Honey Bee Icon (Clean & Minimal) */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="animate-bee-flutter flex items-center justify-center">
          <img
            src="/assets/hoossh-icon.png"
            alt="Hoossh Loading..."
            style={{ width: `${config.bee}px`, height: `${config.bee}px` }}
            className="object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all"
            loading="eager"
          />
        </div>

        {/* Subtle ground shadow */}
        <div 
          className="rounded-full bg-slate-400/20 dark:bg-black/30 blur-[2px] animate-bee-shadow mt-0.5 pointer-events-none"
          style={{ width: `${config.bee * 0.55}px`, height: '4px' }}
        />
      </div>

      {/* Animated Clean 3 Loading Dots */}
      <div className="flex items-center justify-center gap-1.5">
        <span className={`${config.dot} rounded-full bg-theme-primary/80 animate-bounce [animation-delay:-0.32s]`} />
        <span className={`${config.dot} rounded-full bg-theme-primary/80 animate-bounce [animation-delay:-0.16s]`} />
        <span className={`${config.dot} rounded-full bg-theme-primary/80 animate-bounce`} />
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-theme-bg/85 backdrop-blur-sm transition-all duration-200 animate-fade-in p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex-1 min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 animate-fade-in my-auto">
      {content}
    </div>
  );
};

export default HoosshBeeLoader;

