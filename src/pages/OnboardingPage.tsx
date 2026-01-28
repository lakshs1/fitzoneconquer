import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, User, Target, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

type Step = 'name' | 'fitness' | 'goals' | 'routine';

const fitnessLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to regular exercise' },
  { value: 'intermediate', label: 'Intermediate', description: 'Exercise 2-4 times/week' },
  { value: 'advanced', label: 'Advanced', description: 'Exercise 5+ times/week' },
];

const fitnessGoals = [
  { value: 'weight-loss', label: 'Weight Loss', emoji: '🔥' },
  { value: 'stamina', label: 'Build Stamina', emoji: '💪' },
  { value: 'strength', label: 'Gain Strength', emoji: '🏋️' },
  { value: 'general', label: 'General Fitness', emoji: '✨' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAppStore();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<string>('intermediate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const steps: Step[] = ['name', 'fitness', 'goals', 'routine'];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    } else {
      // Complete onboarding
      completeOnboarding({
        name,
        age: age ? parseInt(age) : undefined,
        fitnessLevel: fitnessLevel as any,
        fitnessGoals: selectedGoals,
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 'name': return name.trim().length > 0;
      case 'fitness': return !!fitnessLevel;
      case 'goals': return selectedGoals.length > 0;
      case 'routine': return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {currentIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        {step === 'name' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">What's your name?</h1>
            <p className="text-muted-foreground mb-8">Let's personalize your experience</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Age (optional)</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'fitness' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Your fitness level?</h1>
            <p className="text-muted-foreground mb-8">We'll customize workouts for you</p>
            
            <div className="space-y-3">
              {fitnessLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFitnessLevel(level.value)}
                  className={cn(
                    'stat-card w-full text-left transition-all',
                    fitnessLevel === level.value && 'border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{level.label}</p>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                    {fitnessLevel === level.value && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'goals' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-xp/20 flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-xp" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">What are your goals?</h1>
            <p className="text-muted-foreground mb-8">Select all that apply</p>
            
            <div className="grid grid-cols-2 gap-3">
              {fitnessGoals.map(goal => (
                <button
                  key={goal.value}
                  onClick={() => toggleGoal(goal.value)}
                  className={cn(
                    'stat-card text-center py-6 transition-all',
                    selectedGoals.includes(goal.value) && 'border-xp shadow-[0_0_20px_hsl(var(--xp-gold)/0.3)]'
                  )}
                >
                  <span className="text-3xl block mb-2">{goal.emoji}</span>
                  <span className="font-semibold text-sm">{goal.label}</span>
                  {selectedGoals.includes(goal.value) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-xp flex items-center justify-center">
                      <Check className="w-3 h-3 text-xp-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'routine' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">You're all set!</h1>
            <p className="text-muted-foreground mb-8">
              Your AI coach will learn your routine and optimize recommendations over time.
            </p>
            
            <div className="stat-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <h3 className="font-display font-semibold mb-3">What's next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zone-owned" />
                  <span>Complete your daily goal to create your first zone</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zone-owned" />
                  <span>Explore the map and find zones to capture</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-zone-owned" />
                  <span>Level up and unlock new challenges</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {currentIndex > 0 && (
          <Button variant="outline" size="lg" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button 
          variant="neon" 
          size="lg" 
          className="flex-1"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentIndex === steps.length - 1 ? 'Start Your Journey' : 'Continue'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
