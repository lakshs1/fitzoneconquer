import { Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function DailyGoal() {
  const navigate = useNavigate();
  const dailyGoal = {
    type: 'Run',
    target: 3,
    unit: 'km',
    completed: 1.8,
    reward: 250,
  };
  
  const progress = (dailyGoal.completed / dailyGoal.target) * 100;
  const isComplete = progress >= 100;

  return (
    <div className="gradient-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold">Daily Goal</p>
            <p className="text-xs text-muted-foreground">
              {dailyGoal.type} {dailyGoal.target} {dailyGoal.unit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-xp">+{dailyGoal.reward} XP</p>
          <p className="text-xs text-muted-foreground">reward</p>
        </div>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm">
          <span className="font-semibold text-primary">{dailyGoal.completed}</span>
          <span className="text-muted-foreground"> / {dailyGoal.target} {dailyGoal.unit}</span>
        </span>
        
        {isComplete ? (
          <Button variant="success" size="sm" className="gap-1">
            <Check className="w-4 h-4" />
            Completed!
          </Button>
        ) : (
          <Button variant="neon" size="sm" onClick={() => navigate('/activity')}>
            Start Now
          </Button>
        )}
      </div>
    </div>
  );
}
