import { useState } from 'react';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export default function MapView() {
  const { zones, user } = useAppStore();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');

  const myZones = zones.filter(z => z.ownerName === 'You' || z.ownerId === user?.id);
  const enemyZones = zones.filter(z => z.ownerName !== 'You' && z.ownerId !== user?.id);

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-5rem)]">
        {/* Map Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-card to-background">
          {/* Grid pattern to simulate map */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Fake map terrain */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-muted/20 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">
                Connect to Mapbox/Google Maps<br />
                to view live territory
              </p>
            </div>
          </div>

          {/* Zone markers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Your zones */}
            {myZones.map((zone, i) => (
              <div
                key={zone.id}
                className={cn(
                  "absolute w-16 h-16 rounded-full zone-owned zone-marker pointer-events-auto cursor-pointer",
                  "flex items-center justify-center"
                )}
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${25 + i * 20}%`,
                }}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="text-center">
                  <span className="text-xs font-bold text-zone-owned">LVL {zone.level}</span>
                </div>
              </div>
            ))}
            
            {/* Enemy zones */}
            {enemyZones.map((zone, i) => (
              <div
                key={zone.id}
                className={cn(
                  "absolute w-16 h-16 rounded-full zone-enemy zone-marker pointer-events-auto cursor-pointer",
                  "flex items-center justify-center"
                )}
                style={{
                  top: `${40 + i * 12}%`,
                  right: `${20 + i * 15}%`,
                }}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="text-center">
                  <span className="text-xs font-bold text-zone-capture">LVL {zone.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="glass">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="glass">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="glass"
            onClick={() => setMapStyle(s => s === 'dark' ? 'satellite' : 'dark')}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Location Button */}
        <Button 
          variant="neon" 
          size="icon" 
          className="absolute bottom-24 right-4 w-12 h-12 rounded-full"
        >
          <Navigation className="w-5 h-5" />
        </Button>

        {/* Legend */}
        <div className="absolute top-4 left-4 glass rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zone-owned" />
            <span className="text-xs">Your Zones ({myZones.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zone-capture" />
            <span className="text-xs">Enemy Zones ({enemyZones.length})</span>
          </div>
        </div>

        {/* Selected Zone Panel */}
        {selectedZone && (
          <div className="absolute bottom-20 left-4 right-4 glass rounded-xl p-4 animate-slide-up">
            {(() => {
              const zone = zones.find(z => z.id === selectedZone);
              if (!zone) return null;
              const isOwned = zone.ownerName === 'You' || zone.ownerId === user?.id;
              
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Owned by <span className={isOwned ? 'text-zone-owned' : 'text-zone-capture'}>{zone.ownerName}</span>
                      </p>
                    </div>
                    <div className="level-badge">LVL {zone.level}</div>
                  </div>
                  
                  {!isOwned && (
                    <Button variant="danger" className="w-full">
                      Challenge Zone (20 min activity)
                    </Button>
                  )}
                  
                  {isOwned && zone.defenseChallenge && (
                    <div className="text-sm text-muted-foreground">
                      Defense: {zone.defenseChallenge.targetScore} {zone.defenseChallenge.type}
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setSelectedZone(null)}
                  >
                    Close
                  </Button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
