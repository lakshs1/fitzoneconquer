import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Layers, ZoomIn, ZoomOut, Sparkles, MapPinned } from 'lucide-react';
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
  const [zoom, setZoom] = useState(15);
  const [tileLayer, setTileLayer] = useState<'standard' | 'terrain' | 'dark'>('standard');
  const [panResetKey, setPanResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
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
      ? 'https://a.tile.opentopomap.org'
      : tileLayer === 'dark'
        ? 'https://a.basemaps.cartocdn.com/dark_all'
        : 'https://a.basemaps.cartocdn.com/light_all';

  return (
    <AppLayout wide>
      <div className="grid h-[calc(100vh-5rem)] gap-4 p-2 md:p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-black/40">
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
          />

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button variant="secondary" size="icon" className="glass" onClick={() => setZoom((z) => Math.min(19, z + 1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" className="glass" onClick={() => setZoom((z) => Math.max(3, z - 1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant={showNearbyPlaces ? 'neon' : 'secondary'} size="icon" className="glass" onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}>
              <Layers className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="neon"
            size="icon"
            className="absolute bottom-4 right-4 h-12 w-12 rounded-full"
            onClick={() => {
              if (!position) return;
              setMapCenter({ lat: position.lat, lng: position.lng });
              setPanResetKey((v) => v + 1);
            }}
          >
            <Navigation className="w-5 h-5" />
          </Button>
        </div>

        <aside className="glass rounded-2xl border border-primary/20 p-4 md:p-5 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Map Console</h2>
            <MapPinned className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Map style</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant={tileLayer === 'standard' ? 'neon' : 'secondary'} size="sm" onClick={() => setTileLayer('standard')}>Light</Button>
              <Button variant={tileLayer === 'terrain' ? 'neon' : 'secondary'} size="sm" onClick={() => setTileLayer('terrain')}>Terrain</Button>
              <Button variant={tileLayer === 'dark' ? 'neon' : 'secondary'} size="sm" onClick={() => setTileLayer('dark')}>Dark</Button>
            </div>
          </div>

          <Button variant="secondary" className="mt-4 w-full" onClick={handleAiZonePick} disabled={isSelectingZone || zones.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isSelectingZone ? 'Selecting best zone...' : 'AI Zone Pick'}
          </Button>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Zones</p>
            {zones.map((zone) => (
              <button
                key={zone.id}
                className={`w-full rounded-lg border p-3 text-left transition ${selectedZone === zone.id ? 'border-primary bg-primary/10' : 'border-border bg-card/40 hover:border-primary/40'}`}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{zone.name}</p>
                  <span className="text-xs text-muted-foreground">LVL {zone.level}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Owner: <span className={zone.isOwned ? 'text-primary' : 'text-destructive'}>{zone.ownerName}</span>
                </p>
              </button>
            ))}
          </div>

          {selectedZoneData && (
            <div className="mt-5 rounded-xl border border-primary/40 bg-black/20 p-4">
              <p className="font-display font-bold">{selectedZoneData.name}</p>
              {zoneReason && <p className="mt-2 text-xs text-primary">🤖 {zoneReason}</p>}
              {!selectedZoneData.isOwned ? (
                <Button variant="danger" className="mt-3 w-full" onClick={handleChallengeZone}>
                  ⚔️ Challenge Zone
                </Button>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">🛡️ This zone is under your control.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
