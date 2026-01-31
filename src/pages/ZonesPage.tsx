import { Trophy, Shield, Swords, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats, useZones, getDefaultStats } from '@/hooks/useUserData';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function ZonesPage() {
  const { user } = useAuth();
  const { stats: userStats, loading: statsLoading } = useUserStats();
  const { myZones, enemyZones, loading: zonesLoading } = useZones();
  const navigate = useNavigate();
  
  const stats = userStats || getDefaultStats();
  const loading = statsLoading || zonesLoading;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <header>
          <h1 className="text-2xl font-display font-bold text-glow">Territory</h1>
          <p className="text-muted-foreground text-sm mt-1">Conquer the map, own the city</p>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zones_owned || 0}</p>
            <p className="text-xs text-muted-foreground">Owned</p>
          </div>
          <div className="stat-card text-center">
            <Swords className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zones_captured || 0}</p>
            <p className="text-xs text-muted-foreground">Captured</p>
          </div>
          <div className="stat-card text-center">
            <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zones_lost || 0}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </div>
        </div>

        {/* Your Zones */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Your Zones ({myZones.length})
          </h2>
          
          {myZones.length === 0 ? (
            <div className="stat-card text-center py-8">
              <p className="text-muted-foreground">No zones yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete your daily goal to create one!</p>
              <Button variant="neon" className="mt-4" onClick={() => navigate('/activity')}>
                Start Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myZones.map(zone => (
                <div key={zone.id} className="stat-card card-hover">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{zone.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="level-badge text-xs py-0.5 px-2">LVL {zone.level || 1}</span>
                        {zone.defense_challenge_type && (
                          <span className="text-primary">
                            Defense: {zone.defense_target_score} {zone.defense_challenge_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Nearby Enemy Zones */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Swords className="w-5 h-5 text-destructive" />
            Nearby Zones ({enemyZones.length})
          </h2>
          
          {enemyZones.length === 0 ? (
            <div className="stat-card text-center py-8">
              <p className="text-muted-foreground">No zones to capture nearby</p>
              <p className="text-sm text-muted-foreground mt-1">Explore the map to find zones!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enemyZones.map(zone => (
                <div key={zone.id} className="stat-card border-destructive/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                      <Swords className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{zone.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>Owned by</span>
                        <span className="text-destructive font-semibold">{zone.owner_name || 'Unknown'}</span>
                        <span className="level-badge text-xs py-0.5 px-2">LVL {zone.level || 1}</span>
                      </div>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => navigate('/activity', { state: { challengeZoneId: zone.id } })}
                    >
                      Challenge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to capture */}
        <section className="stat-card bg-primary/5 border-primary/20">
          <h3 className="font-display font-semibold mb-2">How to Capture</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enter enemy zone boundaries</li>
            <li>• Stay active for 20+ continuous minutes</li>
            <li>• If defended, complete the playground challenge</li>
            <li>• Earn +500 XP per capture!</li>
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
