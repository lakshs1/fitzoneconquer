import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Layers, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleMap } from '@/components/map/GoogleMap';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { selectBestZone } from '@/services/zoneDecision';

function offsetPoint(origin: { lat: number; lng: number }, northMeters: number, eastMeters: number) {
  const lat = origin.lat + northMeters / 111_320;
  const lng =
    origin.lng +
    eastMeters / (111_320 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)));
  return { lat, lng };
}

function squareAround(center: { lat: number; lng: number }, halfSizeMeters: number) {
  return [
    offsetPoint(center, halfSizeMeters, -halfSizeMeters),
    offsetPoint(center, halfSizeMeters, halfSizeMeters),
    offsetPoint(center, -halfSizeMeters, halfSizeMeters),
    offsetPoint(center, -halfSizeMeters, -halfSizeMeters),
  ];
}

export default function MapView() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { position } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [zoom, setZoom] = useState(15); // NOTE: allow user-controlled zoom in/out
  const [tileLayer, setTileLayer] = useState<'standard' | 'terrain' | 'hot'>('standard'); // NOTE: selectable map layers
  const [panResetKey, setPanResetKey] = useState(0); // NOTE: increment to force map recenter after drag
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined); // NOTE: explicit recenter target
  const [zoneReason, setZoneReason] = useState<string | null>(null);
  const [isSelectingZone, setIsSelectingZone] = useState(false);

  const zones = useMemo(() => {
    const anchor = position ?? { lat: 40.7128, lng: -74.006 };
    const templates = [
      { id: 'zone-n', name: 'North Park Loop', type: 'park' as const, north: 320, east: 120, size: 120, isOwned: false, level: 1 },
      { id: 'zone-w', name: 'West Tempo Trail', type: 'trail' as const, north: 140, east: -420, size: 140, isOwned: false, level: 2 },
      { id: 'zone-s', name: 'South Recovery Greenway', type: 'greenway' as const, north: -360, east: 80, size: 130, isOwned: true, level: 2 },
      { id: 'zone-e', name: 'East Sprint Runway', type: 'runway' as const, north: -40, east: 520, size: 110, isOwned: false, level: 3 },
    ];

    return templates.map((zone) => {
      const center = offsetPoint(anchor, zone.north, zone.east);
      return {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        coordinates: squareAround(center, zone.size),
        center,
        isOwned: zone.isOwned,
        ownerName: zone.isOwned ? profile?.name || 'You' : 'Rival',
        level: zone.level,
      };
    });
  }, [position, profile?.name]);

  const nearbyPlaces = useMemo(() => {
    const anchor = position ?? { lat: 40.7128, lng: -74.006 };
    return [
      { id: 'place-gym', name: 'Nearby Power Gym', type: 'gym' as const, location: offsetPoint(anchor, 180, -90) },
      { id: 'place-park', name: 'Local City Park', type: 'park' as const, location: offsetPoint(anchor, -280, 260) },
      { id: 'place-trail', name: 'Riverside Trail', type: 'trail' as const, location: offsetPoint(anchor, 410, 310) },
    ];
  }, [position]);

  const selectedZoneData = zones.find((z) => z.id === selectedZone);

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning' as const;
    if (hour >= 12 && hour < 17) return 'afternoon' as const;
    if (hour >= 17 && hour < 21) return 'evening' as const;
    return 'night' as const;
  }, []);

  const handleChallengeZone = () => {
    // Navigate to activity tracker to start a zone capture
    navigate('/activity', { state: { challengeZoneId: selectedZone } });
  };


  const handleAiZonePick = async () => {
    const currentLocation = position ?? mapCenter ?? zones[0]?.center;
    if (!currentLocation || zones.length === 0) return;
    setIsSelectingZone(true);
    const result = await selectBestZone(
      zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        type: zone.type,
        center: zone.center,
        isOwned: zone.isOwned,
        level: zone.level,
      })),
      {
        currentLocation,
        streak: 0,
        level: 1,
        timeOfDay,
      }
    );

    if (result) {
      setSelectedZone(result.zoneId);
      setZoneReason(
        `${result.reason} Route ~${result.estimatedRouteKm.toFixed(2)} km (${result.estimatedTravelMinutes} min). ${result.idealPath}.`
      );
      const pickedZone = zones.find((zone) => zone.id === result.zoneId);
      if (pickedZone) {
        setMapCenter(pickedZone.center);
        setPanResetKey((v) => v + 1);
      }
    } else {
      setZoneReason('No suitable nearby zone found. Move the map to your area and try AI Zone again.');
    }
    setIsSelectingZone(false);
  };

  const tileBaseUrl =
    tileLayer === 'terrain'
      ? 'https://a.tile.opentopomap.org' // NOTE: terrain-style tiles (no API key)
      : tileLayer === 'hot'
        ? 'https://a.tile.openstreetmap.fr/hot' // NOTE: high-contrast HOT layer for accessibility
        : 'https://tile.openstreetmap.org';

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-5rem)]">
        {/* Google Map Component */}
        <GoogleMap
          center={mapCenter}
          zoom={zoom}
          tileBaseUrl={tileBaseUrl}
          panResetKey={panResetKey}
          userPosition={position}
          zones={zones}
          nearbyPlaces={nearbyPlaces}
          showNearbyPlaces={showNearbyPlaces}
          onZoneClick={setSelectedZone}
          onPlaceClick={(id) => console.log('Place clicked:', id)}
        />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="glass"
            onClick={() => setZoom((z) => Math.min(19, z + 1))} // NOTE: clamp zoom in
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="glass"
            onClick={() => setZoom((z) => Math.max(3, z - 1))} // NOTE: clamp zoom out
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            className="glass px-3"
            onClick={handleAiZonePick}
            disabled={isSelectingZone || zones.length === 0}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {isSelectingZone ? 'Selecting...' : 'AI Zone'}
          </Button>
          <Button 
            variant={showNearbyPlaces ? "neon" : "secondary"}
            size="icon" 
            className="glass"
            onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Location Button */}
        <Button 
          variant="neon" 
          size="icon" 
          className="absolute bottom-24 right-4 w-12 h-12 rounded-full"
          onClick={() => {
            if (!position) return;
            setMapCenter({ lat: position.lat, lng: position.lng }); // NOTE: recenter map to current GPS position
            setPanResetKey((v) => v + 1); // NOTE: reset drag offset so recenter is exact
          }}
        >
          <Navigation className="w-5 h-5" />
        </Button>

        {/* Layer Selector */}
        <div className="absolute top-4 right-16 glass rounded-lg p-2 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Layer</p>
          <div className="flex flex-col gap-2">
            <Button
              variant={tileLayer === 'standard' ? 'neon' : 'secondary'}
              size="sm"
              onClick={() => setTileLayer('standard')} // NOTE: standard OSM tiles
            >
              Standard
            </Button>
            <Button
              variant={tileLayer === 'terrain' ? 'neon' : 'secondary'}
              size="sm"
              onClick={() => setTileLayer('terrain')} // NOTE: terrain/topographic tiles
            >
              Terrain
            </Button>
            <Button
              variant={tileLayer === 'hot' ? 'neon' : 'secondary'}
              size="sm"
              onClick={() => setTileLayer('hot')} // NOTE: HOT style for contrast
            >
              Places
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 glass rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs">Your Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs">Enemy Zones</span>
          </div>
          {showNearbyPlaces && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">💪</span>
                <span className="text-xs">Gyms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🌳</span>
                <span className="text-xs">Parks</span>
              </div>
            </>
          )}
        </div>

        {/* Selected Zone Panel */}
        {selectedZoneData && (
          <div className="absolute bottom-20 left-4 right-4 glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-display font-bold">{selectedZoneData.name}</p>
                <p className="text-sm text-muted-foreground">
                  Owned by{' '}
                  <span className={selectedZoneData.isOwned ? 'text-primary' : 'text-destructive'}>
                    {selectedZoneData.ownerName}
                  </span>
                </p>
              </div>
              <div className="level-badge bg-primary text-primary-foreground px-2 py-1 rounded">
                LVL {selectedZoneData.level}
              </div>
            </div>
            
            {zoneReason && <p className="text-xs text-primary mb-2">🤖 {zoneReason}</p>}

            {!selectedZoneData.isOwned && (
              <Button variant="danger" className="w-full" onClick={handleChallengeZone}>
                ⚔️ Challenge Zone (20 min activity)
              </Button>
            )}
            
            {selectedZoneData.isOwned && (
              <div className="text-sm text-muted-foreground text-center">
                🛡️ This zone is under your control
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
