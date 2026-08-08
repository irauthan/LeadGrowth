import { ShieldCheck } from 'lucide-react';
import { NyaarLogo } from './NyaarLogo';

interface FooterProps {
  variant?: 'authenticated' | 'public';
}

export default function Footer({ variant = 'authenticated' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full border-t border-theme-border/60 bg-theme-card/40 backdrop-blur-md text-theme-text-muted transition-colors duration-300 ${
      variant === 'authenticated' ? 'py-4 px-4 sm:px-6 lg:px-8 mb-16 lg:mb-0' : 'py-6 px-6'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Side: Copyright Notice & Developer Branding */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-center sm:text-left">
          <span>© {currentYear}</span>
          <span className="font-extrabold text-theme-primary tracking-wide">
            CountreesAI-Technology
          </span>
          <span className="hidden sm:inline">•</span>
          <span>All Rights Reserved.</span>
        </div>

        {/* Right Side: Product Branding & Version */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-theme-text">
            <NyaarLogo size={18} animated />
            <span>NYAAR Enterprise CRM</span>
          </div>

          <span className="h-3 w-px bg-theme-border hidden sm:block" />

          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20 shadow-xs">
            <ShieldCheck size={10} />
            v2.0.0
          </span>
        </div>

      </div>
    </footer>
  );
}
