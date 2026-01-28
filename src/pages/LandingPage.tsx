import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, Zap, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: MapPin,
    title: 'Claim Territory',
    description: 'Run, walk, or cycle to create zones on the real-world map',
  },
  {
    icon: Trophy,
    title: 'Compete & Capture',
    description: 'Challenge other players and capture their zones',
  },
  {
    icon: Zap,
    title: 'Level Up',
    description: 'Earn XP, unlock achievements, and become the fitness champion',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleGetStarted = () => {
    // Demo login - in production this would go to auth
    login({
      id: 'demo-user',
      name: 'Champion',
      email: 'demo@fitzone.app',
      fitnessLevel: 'intermediate',
      fitnessGoals: ['stamina', 'weight-loss'],
      createdAt: new Date().toISOString(),
    });
    navigate('/onboarding');
  };

  const handleSkipToDemo = () => {
    login({
      id: 'demo-user',
      name: 'Champion',
      email: 'demo@fitzone.app',
      fitnessLevel: 'intermediate',
      fitnessGoals: ['stamina', 'weight-loss'],
      createdAt: new Date().toISOString(),
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, hsl(var(--accent) / 0.1) 0%, transparent 50%)
              `,
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-glow">FitZone</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
              Turn Your City Into a{' '}
              <span className="text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fitness Battleground
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Claim territory, compete with friends, and level up your fitness through real-world activity.
            </p>

            {/* Feature Slides */}
            <div className="mb-8">
              <div className="stat-card p-6 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    {(() => {
                      const Icon = features[currentSlide].icon;
                      return <Icon className="w-6 h-6 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1">
                      {features[currentSlide].title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {features[currentSlide].description}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center gap-2">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === currentSlide 
                        ? 'w-6 bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              variant="neon" 
              size="xl" 
              className="w-full"
              onClick={handleGetStarted}
            >
              <Play className="w-5 h-5 mr-2" />
              Get Started
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleSkipToDemo}
            >
              Skip to Demo Dashboard
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Connect Supabase for authentication & real data persistence
          </p>
        </div>
      </div>
    </div>
  );
}
