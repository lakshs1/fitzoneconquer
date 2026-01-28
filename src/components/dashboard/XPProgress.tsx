import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPProgressProps {
  xp: number;
  level: number;
  progress: number;
  xpToNext: number;
}

export function XPProgress({ xp, level, progress, xpToNext }: XPProgressProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-xp/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-xp" />
          </div>
          <div>
            <p className="text-sm font-semibold">Experience Points</p>
            <p className="text-xs text-muted-foreground">{xpToNext} XP to Level {level + 1}</p>
          </div>
        </div>
        <span className="text-xl font-display font-bold text-glow-gold">{xp.toLocaleString()} XP</span>
      </div>
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-xp rounded-full xp-bar-glow transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Level {level}</span>
        <span>{Math.round(progress)}%</span>
        <span>Level {level + 1}</span>
      </div>
    </div>
  );
}
