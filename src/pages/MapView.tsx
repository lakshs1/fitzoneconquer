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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>();
  const [zoneReason, setZoneReason] = useState<string | null>(null);
  const [isSelectingZone, setIsSelectingZone] = useState(false);

  // 🔥 FIX: use `places`, not undefined variable
  const [places, setPlaces] = useState<RealPlace[]>([]);

  useEffect(() => {
    const anchor = position ?? mapCenter;
    if (!anchor) return;

    const controller = new AbortController();
    const query = `[out:json][timeout:20];
      (
        node["leisure"="park"](around:3500,${anchor.lat},${anchor.lng});
        node["leisure"="fitness_centre"](around:3500,${anchor.lat},${anchor.lng});
        node["amenity"="gym"](around:3500,${anchor.lat},${anchor.lng});
        way["highway"="path"](around:3500,${anchor.lat},${anchor.lng});
      );
      out center 25;`;

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
            let type: RealPlace['type'] = 'trail';
            if (tags.leisure === 'park') type = 'park';
            if (tags.amenity === 'gym' || tags.leisure === 'fitness_centre') type = 'gym';

            return {
              id: `${el.type}-${el.id}`,
              name: tags.name || tags['name:en'] || 'Unnamed place',
              type,
              location: { lat, lng },
            };
          })
          .filter(Boolean)
          .slice(0, 30);

        setPlaces(output);
      })
      .catch(() => setPlaces([]));

    return () => controller.abort();
  }, [position, mapCenter]);

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

  const tileBaseUrl =
    tileLayer === 'terrain'
      ? 'https://a.tile.opentopomap.org'
      : tileLayer === 'dark'
        ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}';

  return (
    <AppLayout wide>
      <div className="flex h-[calc(100vh-5rem)] flex-col gap-3 p-2 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[60vh] overflow-hidden rounded-2xl border bg-card shadow-xl">
          <GoogleMap
            center={mapCenter}
            zoom={zoom}
            tileBaseUrl={tileBaseUrl}
            panResetKey={panResetKey}
            userPosition={position}
            zones={zones}
            nearbyPlaces={places}  
            showNearbyPlaces={showNearbyPlaces}
            onZoneClick={setSelectedZone}
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
      </div>
    </AppLayout>
  );
}
