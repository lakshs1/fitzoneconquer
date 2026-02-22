import { useEffect, useMemo, useState } from 'react';
import { Navigation, Layers, ZoomIn, ZoomOut, MapPinned, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleMap } from '@/components/map/GoogleMap';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useZones } from '@/hooks/useUserData';
import { rankNearbyPlaces, rankZonesByNearbyPlaces } from '@/lib/mapAlgorithms';

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
  type: 'park' | 'ground' | 'trail';
  location: { lat: number; lng: number };
}

export default function MapView() {
  const { user } = useAuth();
  const { zones: dbZones } = useZones();
  const { position } = useGeolocation();

  const [showNearbyPlaces, setShowNearbyPlaces] = useState(true);
  const [zoom, setZoom] = useState(15);
  const [panResetKey, setPanResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>();
  const [places, setPlaces] = useState<RealPlace[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  const anchorPoint = useMemo(() => position ?? mapCenter ?? { lat: 40.7128, lng: -74.006 }, [position, mapCenter]);



  useEffect(() => {
    const anchor = anchorPoint;
    const controller = new AbortController();
    const query = `[out:json][timeout:25];
      (
        way["leisure"="park"](around:5000,${anchor.lat},${anchor.lng});
        relation["leisure"="park"](around:5000,${anchor.lat},${anchor.lng});
        node["leisure"="park"](around:5000,${anchor.lat},${anchor.lng});
        way["leisure"="pitch"](around:5000,${anchor.lat},${anchor.lng});
        relation["leisure"="pitch"](around:5000,${anchor.lat},${anchor.lng});
        node["leisure"="pitch"](around:5000,${anchor.lat},${anchor.lng});
        way["landuse"="recreation_ground"](around:5000,${anchor.lat},${anchor.lng});
        relation["landuse"="recreation_ground"](around:5000,${anchor.lat},${anchor.lng});
        node["landuse"="recreation_ground"](around:5000,${anchor.lat},${anchor.lng});
      );
      out center 50;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Places fetch failed');
        const data = await res.json();

        const output: RealPlace[] = (data.elements || [])
          .map((el: any) => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            if (!lat || !lng) return null;

            const tags = el.tags || {};
            const isPark = tags.leisure === 'park';
            const isGround = tags.leisure === 'pitch' || tags.landuse === 'recreation_ground';
            if (!isPark && !isGround) return null;

            return {
              id: `${el.type}-${el.id}`,
              name: tags.name || tags['name:en'] || (isPark ? 'Public Park' : 'Public Ground'),
              type: isPark ? 'park' : 'ground',
              location: { lat, lng },
            };
          })
          .filter(Boolean)
          .slice(0, 60);

        setPlaces(output);
      })
      .catch(() => setPlaces([]));

    return () => controller.abort();
  }, [anchorPoint]);

  const fallbackVacantZones = useMemo(() => {
    const anchor = position ?? { lat: 40.7128, lng: -74.006 };
    return [
      { id: 'vacant-n', name: 'North Open Block', north: 320, east: 120, size: 120, level: 1 },
      { id: 'vacant-w', name: 'West Open Trail', north: 140, east: -420, size: 140, level: 2 },
      { id: 'vacant-e', name: 'East Open Runway', north: -40, east: 520, size: 110, level: 3 },
    ].map((z) => {
      const center = offsetPoint(anchor, z.north, z.east);
      return {
        id: z.id,
        name: z.name,
        center,
        coordinates: squareAround(center, z.size),
        status: 'vacant' as const,
        ownerName: null,
        level: z.level,
      };
    });
  }, [position]);

  const zones = useMemo(() => {
    const mapped = dbZones.map((z) => ({
      id: z.id,
      name: z.name,
      center: z.center as { lat: number; lng: number },
      coordinates: z.coordinates || [],
      status: !z.owner_id ? 'vacant' : z.owner_id === user?.id ? 'mine' : 'enemy',
      ownerName: z.owner_name,
      level: z.level || 1,
    }));
    return mapped.length ? mapped : fallbackVacantZones;
  }, [dbZones, user?.id, fallbackVacantZones]);

  const recommendedPlaces = useMemo(() => {
<<<<<<< codex/new-task-xibbvb
    return rankNearbyPlaces(anchorPoint, places, 8);
  }, [anchorPoint, places]);

  const recommendedZones = useMemo(() => {
    if (!recommendedPlaces.length) return [];
    return rankZonesByNearbyPlaces(
      anchorPoint,
=======
    if (!position) return [];
    return rankNearbyPlaces(position, places, 8);
  }, [position, places]);

  const recommendedZones = useMemo(() => {
    if (!position || !recommendedPlaces.length) return [];
    return rankZonesByNearbyPlaces(
      position,
>>>>>>> main
      zones.map((zone) => ({ id: zone.id, name: zone.name, center: zone.center })),
      recommendedPlaces,
      3
    );
<<<<<<< codex/new-task-xibbvb
  }, [anchorPoint, zones, recommendedPlaces]);
=======
  }, [position, zones, recommendedPlaces]);
>>>>>>> main

  const activeZone =
    recommendedZones.find((zone) => zone.zoneId === activeZoneId) ?? recommendedZones[0] ?? null;

  const directionsUrl = useMemo(() => {
<<<<<<< codex/new-task-xibbvb
    if (!activeZone) return null;
    const destination = recommendedPlaces.find((place) => place.id === activeZone.nearestPlaceId);
    if (!destination) return null;

    return `https://www.google.com/maps/dir/?api=1&origin=${anchorPoint.lat},${anchorPoint.lng}&destination=${destination.location.lat},${destination.location.lng}&travelmode=walking`;
  }, [anchorPoint, activeZone, recommendedPlaces]);
=======
    if (!position || !activeZone) return null;
    const destination = recommendedPlaces.find((place) => place.id === activeZone.nearestPlaceId);
    if (!destination) return null;

    return `https://www.google.com/maps/dir/?api=1&origin=${position.lat},${position.lng}&destination=${destination.location.lat},${destination.location.lng}&travelmode=walking`;
  }, [position, activeZone, recommendedPlaces]);
>>>>>>> main

  return (
    <AppLayout wide>
      <div className="flex h-[calc(100vh-5rem)] flex-col gap-3 p-2 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[60vh] overflow-hidden rounded-2xl border bg-card shadow-xl">
          <GoogleMap
            center={mapCenter}
            zoom={zoom}
            tileBaseUrl="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
            panResetKey={panResetKey}
            userPosition={position}
            zones={zones}
            nearbyPlaces={recommendedPlaces}
            showNearbyPlaces={showNearbyPlaces}
<<<<<<< codex/new-task-xibbvb
            onZoneClick={setActiveZoneId}
=======
>>>>>>> main
          />

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <Button size="icon" onClick={() => setZoom((z) => Math.min(19, z + 1))}><ZoomIn /></Button>
            <Button size="icon" onClick={() => setZoom((z) => Math.max(3, z - 1))}><ZoomOut /></Button>
            <Button size="icon" onClick={() => setShowNearbyPlaces((v) => !v)}><Layers /></Button>
          </div>

          <Button
            size="icon"
            className="absolute bottom-3 right-3"
            onClick={() => position && (setMapCenter(position), setPanResetKey((v) => v + 1))}
          >
            <Navigation />
          </Button>
        </div>

        <aside className="rounded-2xl border bg-card p-4 shadow-xl">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapPinned className="h-5 w-5 text-primary" />
            Zone Recommendations
          </h2>

          {recommendedZones.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Detecting nearby public parks/grounds to recommend the best zone.
            </p>
          )}

          <div className="space-y-2">
            {recommendedZones.map((zone) => {
              const isActive = zone.zoneId === activeZone?.zoneId;
              return (
                <button
                  key={zone.zoneId}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    isActive ? 'border-primary bg-primary/10' : 'border-border bg-background'
                  }`}
                  onClick={() => setActiveZoneId(zone.zoneId)}
                >
                  <div className="font-medium">{zone.zoneName}</div>
                  <div className="text-xs text-muted-foreground">
                    Near {zone.nearestPlaceName} ({zone.nearestPlaceType})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Zone → place: {(zone.zoneToPlaceMeters / 1000).toFixed(2)} km • You → place: {(zone.userToPlaceMeters / 1000).toFixed(2)} km
                  </div>
                </button>
              );
            })}
          </div>

          {activeZone && directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <Route className="h-4 w-4" />
              Get directions to recommended zone place
            </a>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
