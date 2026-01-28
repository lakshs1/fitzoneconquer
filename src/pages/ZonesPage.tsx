import { Trophy, Shield, Swords, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ZonesPage() {
  const { zones, user, stats, captureZone } = useAppStore();
  const navigate = useNavigate();

  const myZones = zones.filter(z => z.ownerName === 'You' || z.ownerId === user?.id);
  const enemyZones = zones.filter(z => z.ownerName !== 'You' && z.ownerId !== user?.id);

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
            <Trophy className="w-5 h-5 text-xp mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zonesOwned}</p>
            <p className="text-xs text-muted-foreground">Owned</p>
          </div>
          <div className="stat-card text-center">
            <Swords className="w-5 h-5 text-zone-capture mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zonesCaptured}</p>
            <p className="text-xs text-muted-foreground">Captured</p>
          </div>
          <div className="stat-card text-center">
            <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl font-display font-bold">{stats.zonesLost}</p>
            <p className="text-xs text-muted-foreground">Lost</p>
          </div>
        </div>

        {/* Your Zones */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-zone-owned" />
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
                    <div className="w-12 h-12 rounded-xl bg-zone-owned/20 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-zone-owned" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{zone.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="level-badge text-xs py-0.5 px-2">LVL {zone.level}</span>
                        {zone.defenseChallenge && (
                          <span className="text-primary">
                            Defense: {zone.defenseChallenge.targetScore} {zone.defenseChallenge.type}
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
            <Swords className="w-5 h-5 text-zone-capture" />
            Nearby Zones ({enemyZones.length})
          </h2>
          
          {enemyZones.length === 0 ? (
            <div className="stat-card text-center py-8">
              <p className="text-muted-foreground">No zones to capture nearby</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enemyZones.map(zone => (
                <div key={zone.id} className="stat-card border-zone-capture/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zone-capture/20 flex items-center justify-center shrink-0">
                      <Swords className="w-6 h-6 text-zone-capture" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{zone.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>Owned by</span>
                        <span className="text-zone-capture font-semibold">{zone.ownerName}</span>
                        <span className="level-badge text-xs py-0.5 px-2">LVL {zone.level}</span>
                      </div>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => captureZone(zone.id)}
                    >
                      Capture
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
