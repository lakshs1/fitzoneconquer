import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Clock, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export default function ActivityTracker() {
  const { isTracking, currentActivity, startActivity, stopActivity, addXp } = useAppStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTracking && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        // Simulate distance increase (in real app, this would come from GPS)
        setDistance(prev => prev + Math.random() * 5 + 2); // ~2-7 meters per second
        setCalories(prev => prev + Math.random() * 0.15 + 0.05);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTracking, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = (type: 'run' | 'walk' | 'cycle') => {
    setElapsedTime(0);
    setDistance(0);
    setCalories(0);
    setIsPaused(false);
    startActivity(type);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    stopActivity();
    // Award XP based on distance
    const xpEarned = Math.floor(distance / 100) * 10;
    if (xpEarned > 0) {
      addXp(xpEarned);
    }
    setElapsedTime(0);
    setDistance(0);
    setCalories(0);
    setIsPaused(false);
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-display font-bold text-glow">Activity Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your workout in real-time</p>
        </header>

        {/* Main Stats Display */}
        <div className="relative">
          {/* Large circular progress indicator */}
          <div className="relative w-64 h-64 mx-auto">
            <div className={cn(
              "w-full h-full rounded-full border-8 border-muted flex items-center justify-center",
              isTracking && !isPaused && "animate-pulse-neon border-primary/30"
            )}>
              <div className="text-center">
                <p className="text-5xl font-display font-bold text-glow">
                  {formatTime(elapsedTime)}
                </p>
                <p className="text-muted-foreground text-sm mt-2">Duration</p>
              </div>
            </div>
            
            {/* Status indicator */}
            {isTracking && (
              <div className={cn(
                "absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold",
                isPaused 
                  ? "bg-xp text-xp-foreground"
                  : "bg-zone-owned text-primary-foreground animate-pulse"
              )}>
                {isPaused ? 'PAUSED' : 'TRACKING'}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-display font-bold">
              {(distance / 1000).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">km</p>
          </div>
          <div className="stat-card text-center">
            <Flame className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-xl font-display font-bold">
              {Math.round(calories)}
            </p>
            <p className="text-xs text-muted-foreground">cal</p>
          </div>
          <div className="stat-card text-center">
            <Zap className="w-5 h-5 text-xp mx-auto mb-2" />
            <p className="text-xl font-display font-bold">
              +{Math.floor(distance / 100) * 10}
            </p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
        </div>

        {/* Control Buttons */}
        {!isTracking ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">Choose activity type:</p>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="neon" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => handleStart('run')}
              >
                <span className="text-2xl">🏃</span>
                <span>Run</span>
              </Button>
              <Button 
                variant="gaming" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => handleStart('walk')}
              >
                <span className="text-2xl">🚶</span>
                <span>Walk</span>
              </Button>
              <Button 
                variant="gaming" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => handleStart('cycle')}
              >
                <span className="text-2xl">🚴</span>
                <span>Cycle</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 justify-center">
            <Button 
              variant={isPaused ? "neon" : "gold"}
              size="xl"
              className="w-20 h-20 rounded-full"
              onClick={handlePause}
            >
              {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
            </Button>
            <Button 
              variant="danger"
              size="xl"
              className="w-20 h-20 rounded-full"
              onClick={handleStop}
            >
              <Square className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* GPS Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zone-owned/20 text-zone-owned text-sm">
            <div className="w-2 h-2 rounded-full bg-zone-owned animate-pulse" />
            GPS Active
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
