import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Layers, ZoomIn, ZoomOut, Sparkles, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleMap } from '@/components/map/GoogleMap';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useZones } from '@/hooks/useUserData';
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

interface RealPlace {
  id: string;
  name: string;
  type: 'gym' | 'park' | 'trail';
  location: { lat: number; lng: number };
}

export default function MapView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { zones: dbZones } = useZones();
  const { position } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [zoom, setZoom] = useState(15);
  const [tileLayer, setTileLayer] = useState<'standard' | 'terrain' | 'dark'>('standard');
  const [panResetKey, setPanResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [zoneReason, setZoneReason] = useState<string | null>(null);
  const [isSelectingZone, setIsSelectingZone] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<RealPlace[]>([]);

  useEffect(() => {
    const anchor = position ?? mapCenter;
    if (!anchor) return;

    const controller = new AbortController();
    const query = `[out:json][timeout:20];(node["leisure"="park"](around:3500,${anchor.lat},${anchor.lng});node["leisure"="fitness_centre"](around:3500,${anchor.lat},${anchor.lng});node["amenity"="gym"](around:3500,${anchor.lat},${anchor.lng});way["highway"="path"](around:3500,${anchor.lat},${anchor.lng}););out center 25;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed places lookup');
        const data = await response.json();
        const output: RealPlace[] = (data.elements || [])
          .map((element: any) => {
            const lat = element.lat ?? element.center?.lat;
            const lng = element.lon ?? element.center?.lon;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            const tags = element.tags || {};
            const name = tags.name || tags['name:en'] || 'Unnamed place';
            let type: RealPlace['type'] = 'trail';
            if (tags.leisure === 'park') type = 'park';
            if (tags.amenity === 'gym' || tags.leisure === 'fitness_centre') type = 'gym';
            return {
              id: `${element.type}-${element.id}`,
              name,
              type,
              location: { lat, lng },
            };
          })
          .filter(Boolean)
          .slice(0, 30);
        setNearbyPlaces(output);
      })
      .catch(() => {
        setNearbyPlaces([]);
      });

    return () => controller.abort();
  }, [position, mapCenter]);

  const fallbackVacantZones = useMemo(() => {
    const anchor = position ?? { lat: 40.7128, lng: -74.006 };
    return [
      { id: 'vacant-n', name: 'North Open Block', north: 320, east: 120, size: 120, level: 1 },
      { id: 'vacant-w', name: 'West Open Trail', north: 140, east: -420, size: 140, level: 2 },
      { id: 'vacant-e', name: 'East Open Runway', north: -40, east: 520, size: 110, level: 3 },
    ].map((zone) => {
      const center = offsetPoint(anchor, zone.north, zone.east);
      return {
        id: zone.id,
        name: zone.name,
        center,
        coordinates: squareAround(center, zone.size),
        status: 'vacant' as const,
        ownerName: null,
        level: zone.level,
      };
    });
  }, [position]);

  const zones = useMemo(() => {
    const mappedDb = dbZones.map((zone) => {
      const ownerId = zone.owner_id;
      const status: 'vacant' | 'mine' | 'enemy' = !ownerId
        ? 'vacant'
        : ownerId === user?.id
          ? 'mine'
          : 'enemy';

      return {
        id: zone.id,
        name: zone.name,
        center: zone.center as { lat: number; lng: number },
        coordinates: (zone.coordinates as Array<{ lat: number; lng: number }>) || [],
        status,
        ownerName: zone.owner_name,
        level: zone.level || 1,
      };
    });

    return mappedDb.length ? mappedDb : fallbackVacantZones;
  }, [dbZones, user?.id, fallbackVacantZones]);

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
        type: zone.status === 'vacant' ? 'park' : 'trail',
        center: zone.center,
        isOwned: zone.status === 'mine',
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
    }

    setIsSelectingZone(false);
  };

  const tileBaseUrl =
    tileLayer === 'terrain'
      ? 'https://tile.opentopomap.org'
      : tileLayer === 'dark'
        ? 'https://tile.openstreetmap.org'
        : 'https://tile.openstreetmap.org';

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
                  Owner: <span className={zone.status === 'mine' ? 'text-primary' : 'text-destructive'}>{zone.ownerName ?? 'Vacant'}</span>
                </p>
              </button>
            ))}
          </div>

          {selectedZoneData && (
            <div className="mt-5 rounded-xl border border-primary/40 bg-black/20 p-4">
              <p className="font-display font-bold">{selectedZoneData.name}</p>
              {zoneReason && <p className="mt-2 text-xs text-primary">🤖 {zoneReason}</p>}
              {selectedZoneData.status !== 'mine' ? (
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
