import { ChevronRight, Sparkles, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUserStats } from '@/hooks/useUserData';

export function AICoachCard() {
  const navigate = useNavigate();
  const { stats } = useUserStats();

  // Dynamic tips based on user data
  const getTip = () => {
    if (!stats) {
      return "Welcome! Start your fitness journey today with your first activity.";
    }
    
    if ((stats.streak || 0) >= 3) {
      return `Amazing ${stats.streak}-day streak! Keep the momentum going.`;
    }
    
    if ((stats.total_activities || 0) === 0) {
      return "Ready to start? Your first workout is waiting. Let's go!";
    }
    
    if ((stats.zones_owned || 0) === 0) {
      return "Complete a 20-minute activity to claim your first zone!";
    }
    
    return "Try a zone capture challenge today for bonus XP!";
  };

  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        AI Coach
      </h2>
      <div className="stat-card bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
        <div className="flex items-start gap-3">
          {/* Coach Avatar - Athletic figure instead of bot */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
            <Dumbbell className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-accent mb-1">Coach's Tip</p>
            <p className="text-sm text-foreground/80">{getTip()}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-3 justify-between hover:bg-accent/10"
          onClick={() => navigate('/coach')}
        >
          <span>Chat with your coach</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
