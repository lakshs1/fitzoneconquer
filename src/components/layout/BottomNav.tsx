import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Activity, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/zones', icon: Trophy, label: 'Zones' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', isActive && 'text-glow')} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
