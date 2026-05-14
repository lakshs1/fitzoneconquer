import { useMemo, useState } from 'react';
import { Navigation, ZoomIn, ZoomOut, MapPinned, Clock, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleMap } from '@/components/map/GoogleMap';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useZones } from '@/hooks/useUserData';

function formatDuration(seconds?: number | null) {
  if (!seconds) return 'time not recorded';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m ${secs}s`;
}

export default function MapView() {
  const { user } = useAuth();
  const { zones: dbZones } = useZones();
  const { position } = useGeolocation();

  const [zoom, setZoom] = useState(15);
  const [panResetKey, setPanResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  const zones = useMemo(() => {
    return dbZones.map((z) => ({
      id: z.id,
      name: z.name,
      center: z.center as { lat: number; lng: number },
      coordinates: (z.coordinates || []) as Array<{ lat: number; lng: number }>,
      status: z.owner_id === user?.id ? ('mine' as const) : ('enemy' as const),
      ownerName: z.owner_name,
      level: z.level || 1,
      capturedAt: z.captured_at,
      captureDurationSeconds: z.capture_duration_seconds,
      captureDistanceMeters: z.capture_distance_meters,
    }));
  }, [dbZones, user?.id]);

  const activeZone = useMemo(() => {
    return zones.find((zone) => zone.id === activeZoneId) ?? zones[0] ?? null;
  }, [activeZoneId, zones]);

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
            onZoneClick={setActiveZoneId}
          />

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <Button size="icon" onClick={() => setZoom((z) => Math.min(19, z + 1))}>
              <ZoomIn />
            </Button>
            <Button size="icon" onClick={() => setZoom((z) => Math.max(3, z - 1))}>
              <ZoomOut />
            </Button>
          </div>

          <Button
            size="icon"
            className="absolute bottom-3 right-3"
            onClick={() =>
              position &&
              (setMapCenter(position), setPanResetKey((v) => v + 1))
            }
          >
            <Navigation />
          </Button>
        </div>

        <aside className="rounded-2xl border bg-card p-4 shadow-xl">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapPinned className="h-5 w-5 text-primary" />
            Captured Areas
          </h2>

          {zones.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No captured areas yet. Start an activity and the app will mark the area you cover under your name for everyone to see.
            </p>
          )}

          <div className="space-y-2">
            {zones.map((zone) => {
              const isActive = zone.id === activeZone?.id;
              return (
                <button
                  key={zone.id}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background'
                  }`}
                  onClick={() => setActiveZoneId(zone.id)}
                >
                  <div className="font-medium">{zone.ownerName || zone.name}</div>
                  <div className="text-xs text-muted-foreground">{zone.name}</div>
                </button>
              );
            })}
          </div>

          {activeZone && (
            <div className="mt-4 rounded-xl border bg-background p-3 text-sm">
              <div className="font-semibold">{activeZone.ownerName || 'Captured user'}</div>
              <div className="text-muted-foreground">{activeZone.name}</div>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Completed in {formatDuration(activeZone.captureDurationSeconds)}
                </div>
                <div className="flex items-center gap-2">
                  <Footprints className="h-4 w-4 text-primary" />
                  {((activeZone.captureDistanceMeters || 0) / 1000).toFixed(2)} km covered
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
