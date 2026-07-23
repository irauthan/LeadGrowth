import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Megaphone, 
  UserCheck, 
  CheckSquare,
  Menu
} from 'lucide-react';
import { useLayoutStore } from '../store/layoutStore';

export default function MobileBottomNav() {
  const location = useLocation();
  const { isMobileOpen, toggleMobileOpen, setMobileOpen } = useLayoutStore();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { name: 'Leads', icon: UserCheck, path: '/leads' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Dock"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden px-2 pb-safe pt-2 bg-theme-card/95 border-t border-theme-border/60 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ${
        isMobileOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="mx-auto flex max-w-md items-center justify-around pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`relative flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-bold transition-all duration-200 active:scale-90 ${
                isActive ? 'text-theme-primary' : 'text-theme-text-muted hover:text-theme-text'
              }`}
            >
              <item.icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -bottom-1 h-1 w-5 rounded-full bg-theme-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* Menu Drawer Toggle Item */}
        <button
          onClick={toggleMobileOpen}
          className="relative flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-bold text-theme-text-muted hover:text-theme-text active:scale-90 transition-all"
        >
          <Menu size={20} className="stroke-2" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}

