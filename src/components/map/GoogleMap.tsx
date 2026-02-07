import { useEffect, useMemo, useRef, useState } from 'react';
import { Coordinates } from '@/hooks/useGeolocation';
import {
  latLngToWorldPoint,
  rankNearbyPlaces,
  smoothGpsPath,
  tileUrl,
  worldPointToTile,
} from '@/lib/mapAlgorithms';

interface GoogleMapProps {
  center?: Coordinates;
  zoom?: number;
  userPosition?: Coordinates | null;
  activityPath?: Coordinates[];
  zones?: Array<{
    id: string;
    coordinates: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    isOwned: boolean;
    ownerName: string;
    level: number;
  }>;
  nearbyPlaces?: Array<{
    id: string;
    name: string;
    type: 'gym' | 'park' | 'trail';
    location: { lat: number; lng: number };
    rating?: number;
  }>;
  onZoneClick?: (zoneId: string) => void;
  onPlaceClick?: (placeId: string) => void;
  showNearbyPlaces?: boolean;
  isTracking?: boolean;
}

/**
 * OPEN MAP IMPLEMENTATION NOTES
 * =============================
 * - Although this component keeps the historical name `GoogleMap` to avoid broad refactors,
 *   it now uses OpenStreetMap raster tiles (Open Database License / ODbL).
 * - Rendering pipeline:
 *   1) Choose center point (user position while tracking, otherwise requested center).
 *   2) Project lat/lng to world pixels using custom Web Mercator math.
 *   3) Compute visible tile range from viewport size and center world coordinates.
 *   4) Draw OSM tiles with absolute positioning.
 *   5) Draw overlays (GPS marker, smoothed activity path, zones, ranked places).
 *
 * Custom algorithm hooks used here:
 * - `smoothGpsPath` removes jitter from GPS route data.
 * - `rankNearbyPlaces` powers "find places" scoring with distance+rating+type weights.
 */

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
const TILE_SIZE = 256;

export function GoogleMap({
  center,
  zoom = 15,
  userPosition,
  activityPath = [],
  zones = [],
  nearbyPlaces = [],
  onZoneClick,
  onPlaceClick,
  showNearbyPlaces = false,
  isTracking = false,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setViewport({ width: rect.width, height: rect.height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const dynamicCenter = useMemo(() => {
    if (isTracking && userPosition) return userPosition;
    return center || userPosition || DEFAULT_CENTER;
  }, [center, userPosition, isTracking]);

  const centerWorld = useMemo(() => latLngToWorldPoint(dynamicCenter, zoom), [dynamicCenter, zoom]);
  const topLeftWorld = useMemo(
    () => ({ x: centerWorld.x - viewport.width / 2, y: centerWorld.y - viewport.height / 2 }),
    [centerWorld, viewport.width, viewport.height]
  );

  const tiles = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const start = worldPointToTile(topLeftWorld);
    const end = worldPointToTile({
      x: topLeftWorld.x + viewport.width,
      y: topLeftWorld.y + viewport.height,
    });

    const output: Array<{ key: string; src: string; left: number; top: number }> = [];

    for (let x = start.x - 1; x <= end.x + 1; x += 1) {
      for (let y = start.y - 1; y <= end.y + 1; y += 1) {
        if (y < 0 || y >= 2 ** zoom) continue;
        output.push({
          key: `${x}:${y}:${zoom}`,
          src: tileUrl(x, y, zoom),
          left: x * TILE_SIZE - topLeftWorld.x,
          top: y * TILE_SIZE - topLeftWorld.y,
        });
      }
    }

    return output;
  }, [topLeftWorld, viewport.width, viewport.height, zoom]);

  const toScreen = (point: { lat: number; lng: number }) => {
    const world = latLngToWorldPoint(point, zoom);
    return {
      x: world.x - topLeftWorld.x,
      y: world.y - topLeftWorld.y,
    };
  };

  const smoothedPath = useMemo(() => smoothGpsPath(activityPath), [activityPath]);

  const displayedPlaces = useMemo(() => {
    if (!showNearbyPlaces) return [];
    const pivot = userPosition || dynamicCenter;
    return rankNearbyPlaces(pivot, nearbyPlaces, 8);
  }, [showNearbyPlaces, nearbyPlaces, userPosition, dynamicCenter]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-card">
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt="OpenStreetMap tile"
          className="absolute max-w-none select-none pointer-events-none"
          style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
          loading="lazy"
        />
      ))}

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {zones.map((zone) => {
          const points = zone.coordinates.map((coord) => toScreen(coord));
          const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
          return (
            <polygon
              key={zone.id}
              points={polygon}
              fill={zone.isOwned ? 'rgba(250, 204, 21, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
              stroke={zone.isOwned ? 'rgb(250, 204, 21)' : 'rgb(239, 68, 68)'}
              strokeWidth={2}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onZoneClick?.(zone.id)}
            />
          );
        })}

        {smoothedPath.length > 1 && (
          <polyline
            points={smoothedPath.map((p) => {
              const pos = toScreen(p);
              return `${pos.x},${pos.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(250, 204, 21)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {displayedPlaces.map((place) => {
        const pos = toScreen(place.location);
        const icon = place.type === 'gym' ? '💪' : place.type === 'park' ? '🌳' : '🏃';
        return (
          <button
            key={place.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full bg-card/90 border border-primary/40 text-xs"
            style={{ left: pos.x, top: pos.y }}
            onClick={() => onPlaceClick?.(place.id)}
            title={`${place.name} • ${(place.distanceMeters / 1000).toFixed(2)}km`}
          >
            {icon}
          </button>
        );
      })}

      {userPosition && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary border-4 border-primary/30 animate-pulse"
          style={{
            left: toScreen(userPosition).x,
            top: toScreen(userPosition).y,
          }}
        />
      )}

      <div className="absolute bottom-3 left-3 right-3 rounded bg-card/90 p-2 text-xs text-muted-foreground">
        © OpenStreetMap contributors (ODbL) • Zoom {zoom} • GPS {userPosition ? 'active' : 'waiting'}
      </div>
    </div>
  );
}
