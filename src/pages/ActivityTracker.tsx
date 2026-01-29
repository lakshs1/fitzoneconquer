import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Flame, Zap, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { GoogleMap } from '@/components/map/GoogleMap';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ActivityTracker() {
  const {
    isTracking,
    isPaused,
    activityType,
    path,
    distance,
    duration,
    calories,
    loops,
    position,
    geoError,
    startActivity,
    pauseActivity,
    resumeActivity,
    stopActivity,
  } = useActivityTracking();

  const [showMap, setShowMap] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async (type: 'run' | 'walk' | 'cycle') => {
    const result = await startActivity(type);
    if (result.success) {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} started! 🏃`);
    } else {
      toast.error(result.error || 'Failed to start activity');
    }
  };

  const handlePause = () => {
    if (isPaused) {
      resumeActivity();
      toast.info('Activity resumed');
    } else {
      pauseActivity();
      toast.info('Activity paused');
    }
  };

  const handleStop = async () => {
    const result = await stopActivity();
    if (result) {
      toast.success(
        `Great workout! 💪 ${(result.distance / 1000).toFixed(2)}km, ${result.loops} loops, +${result.xpEarned} XP!`
      );
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <header className="p-4 text-center">
          <h1 className="text-2xl font-display font-bold text-glow">Activity Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isTracking ? `${activityType?.toUpperCase()} in progress` : 'Track your workout in real-time'}
          </p>
        </header>

        {/* Map/Stats Toggle */}
        {isTracking && (
          <div className="px-4 mb-4">
            <div className="flex gap-2">
              <Button 
                variant={!showMap ? "neon" : "secondary"} 
                className="flex-1"
                onClick={() => setShowMap(false)}
              >
                Stats
              </Button>
              <Button 
                variant={showMap ? "neon" : "secondary"} 
                className="flex-1"
                onClick={() => setShowMap(true)}
              >
                Map
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {showMap && isTracking ? (
            // Live Map View
            <div className="h-full relative">
              <GoogleMap
                userPosition={position}
                activityPath={path}
                isTracking={isTracking}
              />
              {/* Floating Stats */}
              <div className="absolute top-4 left-4 right-4 glass rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">{formatTime(duration)}</p>
                  <p className="text-xs text-muted-foreground">Time</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{(distance / 1000).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-accent">{loops}</p>
                  <p className="text-xs text-muted-foreground">Loops</p>
                </div>
              </div>
            </div>
          ) : (
            // Stats View
            <div className="p-4 space-y-6">
              {/* Main Stats Display */}
              <div className="relative">
                <div className="relative w-64 h-64 mx-auto">
                  <div className={cn(
                    "w-full h-full rounded-full border-8 border-muted flex items-center justify-center",
                    isTracking && !isPaused && "animate-pulse-neon border-primary/30"
                  )}>
                    <div className="text-center">
                      <p className="text-5xl font-display font-bold text-glow">
                        {formatTime(duration)}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">Duration</p>
                    </div>
                  </div>
                  
                  {isTracking && (
                    <div className={cn(
                      "absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold",
                      isPaused 
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground animate-pulse"
                    )}>
                      {isPaused ? 'PAUSED' : 'TRACKING'}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="stat-card text-center p-3">
                  <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-display font-bold">
                    {(distance / 1000).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
                <div className="stat-card text-center p-3">
                  <Flame className="w-4 h-4 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-display font-bold">
                    {Math.round(calories)}
                  </p>
                  <p className="text-xs text-muted-foreground">cal</p>
                </div>
                <div className="stat-card text-center p-3">
                  <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-display font-bold">
                    +{Math.floor(distance / 100) * 10}
                  </p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div className="stat-card text-center p-3">
                  <Navigation className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-lg font-display font-bold">
                    {loops}
                  </p>
                  <p className="text-xs text-muted-foreground">loops</p>
                </div>
              </div>

              {/* GPS Status */}
              <div className="text-center">
                {geoError ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/20 text-destructive text-sm">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    {geoError}
                  </div>
                ) : position ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    GPS Active • {position.accuracy?.toFixed(0) || '?'}m accuracy
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                    Acquiring GPS...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="p-4 border-t border-border">
          {!isTracking ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">Choose activity type:</p>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="neon" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => handleStart('run')}
                  disabled={!position}
                >
                  <span className="text-2xl">🏃</span>
                  <span>Run</span>
                </Button>
                <Button 
                  variant="gaming" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => handleStart('walk')}
                  disabled={!position}
                >
                  <span className="text-2xl">🚶</span>
                  <span>Walk</span>
                </Button>
                <Button 
                  variant="gaming" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => handleStart('cycle')}
                  disabled={!position}
                >
                  <span className="text-2xl">🚴</span>
                  <span>Cycle</span>
                </Button>
              </div>
              {!position && (
                <p className="text-center text-xs text-muted-foreground">
                  Waiting for GPS signal...
                </p>
              )}
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
        </div>
      </div>
    </AppLayout>
  );
}
