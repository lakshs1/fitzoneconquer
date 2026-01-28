import { Bot, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const motivationalTips = [
  "Your consistency is paying off! Keep up the 3-day streak.",
  "Try a zone capture challenge today for bonus XP!",
  "Based on your sleep schedule, morning runs work best for you.",
  "You're 70% closer to your weekly distance goal!",
];

export function AICoachCard() {
  const navigate = useNavigate();
  const randomTip = motivationalTips[Math.floor(Math.random() * motivationalTips.length)];

  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        AI Coach
      </h2>
      <div className="stat-card bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-accent mb-1">Today's Insight</p>
            <p className="text-sm text-foreground/80">{randomTip}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-3 justify-between hover:bg-accent/10"
          onClick={() => navigate('/coach')}
        >
          <span>Ask your coach</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
