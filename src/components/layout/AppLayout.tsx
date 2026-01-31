import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  wide?: boolean;
}

export function AppLayout({ children, showNav = true, wide = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={cn(
        "flex-1 pb-20",
        wide ? "app-container-wide" : "app-container"
      )}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
