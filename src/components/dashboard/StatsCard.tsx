import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  color?: 'primary' | 'destructive' | 'success' | 'gold';
}

const colorMap = {
  primary: {
    icon: 'text-primary',
    glow: 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
    bg: 'bg-primary/10',
  },
  destructive: {
    icon: 'text-destructive',
    glow: 'shadow-[0_0_15px_hsl(var(--destructive)/0.3)]',
    bg: 'bg-destructive/10',
  },
  success: {
    icon: 'text-zone-owned',
    glow: 'shadow-[0_0_15px_hsl(var(--zone-owned)/0.3)]',
    bg: 'bg-zone-owned/10',
  },
  gold: {
    icon: 'text-xp',
    glow: 'shadow-[0_0_15px_hsl(var(--xp-gold)/0.3)]',
    bg: 'bg-xp/10',
  },
};

export function StatsCard({ icon: Icon, label, value, trend, color = 'primary' }: StatsCardProps) {
  const colors = colorMap[color];
  
  return (
    <div className={cn('stat-card card-hover', colors.glow)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.icon)} />
      </div>
      <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-display font-bold mt-1">{value}</p>
      {trend && (
        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
      )}
    </div>
  );
}
