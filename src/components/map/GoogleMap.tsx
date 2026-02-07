import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
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
  tileBaseUrl?: string; // NOTE: allow switching tile layers (standard/terrain/etc.)
  panResetKey?: number; // NOTE: increment to reset pan offset (recenter)
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
 * OpenStreetMap-based renderer (no Google Maps API)
 * Uses custom Web Mercator projection + raster tiles
 */

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
const TILE_SIZE = 256;
const TILE_BASE_URL =
  import.meta.env.VITE_OSM_TILE_BASE_URL || 'https://tile.openstreetmap.org';

export function GoogleMap({
  center,
  zoom = 15,
  tileBaseUrl,
  panResetKey = 0,
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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // NOTE: track manual pan offset in world pixels so the map can be dragged
  const [isDragging, setIsDragging] = useState(false); // NOTE: used to show grab/grabbing cursor and avoid jitter
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
  } | null>(null); // NOTE: pointer-drag state kept outside render for smooth updates

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (!rect) return;
      setViewport({ width: rect.width, height: rect.height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 }); // NOTE: explicit recenter/reset from parent (ex: "current location" button)
  }, [panResetKey]);

  const dynamicCenter = useMemo(() => {
    if (isTracking && userPosition) return userPosition;
    return center || userPosition || DEFAULT_CENTER;
  }, [center, userPosition, isTracking]);

  const centerWorld = useMemo(
    () => latLngToWorldPoint(dynamicCenter, zoom),
    [dynamicCenter, zoom]
  );

  const effectiveCenterWorld = useMemo(
    () => ({
      x: centerWorld.x + panOffset.x,
      y: centerWorld.y + panOffset.y,
    }),
    [centerWorld, panOffset]
  );

  const topLeftWorld = useMemo(
    () => ({
      x: effectiveCenterWorld.x - viewport.width / 2,
      y: effectiveCenterWorld.y - viewport.height / 2,
    }),
    [effectiveCenterWorld, viewport]
  );

  const tiles = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];

    const start = worldPointToTile(topLeftWorld);
    const end = worldPointToTile({
      x: topLeftWorld.x + viewport.width,
      y: topLeftWorld.y + viewport.height,
    });

    const output: Array<{
      key: string;
      src: string;
      left: number;
      top: number;
    }> = [];

    for (let x = start.x - 1; x <= end.x + 1; x++) {
      for (let y = start.y - 1; y <= end.y + 1; y++) {
        if (y < 0 || y >= 2 ** zoom) continue;

        output.push({
          key: `${x}:${y}:${zoom}`,
          src: tileUrl(x, y, zoom, tileBaseUrl || TILE_BASE_URL), // NOTE: allow parent to switch tile layers
          left: x * TILE_SIZE - topLeftWorld.x,
          top: y * TILE_SIZE - topLeftWorld.y,
        });
      }
    }

    return output;
  }, [topLeftWorld, viewport, zoom, tileBaseUrl]);

  const toScreen = (point: { lat: number; lng: number }) => {
    const world = latLngToWorldPoint(point, zoom);
    return {
      x: world.x - topLeftWorld.x,
      y: world.y - topLeftWorld.y,
    };
  };

  const smoothedPath = useMemo(
    () => smoothGpsPath(activityPath),
    [activityPath]
  );

  const displayedPlaces = useMemo(() => {
    if (!showNearbyPlaces) return [];
    const pivot = userPosition || dynamicCenter;
    return rankNearbyPlaces(pivot, nearbyPlaces, 8);
  }, [showNearbyPlaces, nearbyPlaces, userPosition, dynamicCenter]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return; // NOTE: ignore non-primary buttons for drag
    const target = event.target as Element;
    if (target.closest('button, polygon')) return; // NOTE: don't start drag when clicking a place marker or zone

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: panOffset,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;
    setPanOffset({
      x: dragRef.current.startOffset.x - deltaX,
      y: dragRef.current.startOffset.y - deltaY,
    }); // NOTE: invert pointer delta so drag moves the map naturally
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-card"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab', // NOTE: visual affordance for draggable map
        touchAction: 'none', // NOTE: prevent page scrolling while dragging the map
      }}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.src}
          alt="OpenStreetMap tile"
          className="absolute max-w-none pointer-events-none select-none"
          style={{
            left: tile.left,
            top: tile.top,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
          loading="lazy"
        />
      ))}

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {zones.map((zone) => {
          const polygon = zone.coordinates
            .map((c) => {
              const p = toScreen(c);
              return `${p.x},${p.y}`;
            })
            .join(' ');

          return (
            <polygon
              key={zone.id}
              points={polygon}
              fill={zone.isOwned ? 'rgba(250,204,21,0.3)' : 'rgba(239,68,68,0.3)'}
              stroke={zone.isOwned ? 'rgb(250,204,21)' : 'rgb(239,68,68)'}
              strokeWidth={2}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onZoneClick?.(zone.id)}
            />
          );
        })}

        {smoothedPath.length > 1 && (
          <polyline
            points={smoothedPath
              .map((p) => {
                const s = toScreen(p);
                return `${s.x},${s.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="rgb(250,204,21)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {displayedPlaces.map((place) => {
        const pos = toScreen(place.location);
        const icon =
          place.type === 'gym' ? '💪' : place.type === 'park' ? '🌳' : '🏃';

        return (
          <button
            key={place.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-card/90 border px-2 py-1 text-xs"
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
        © OpenStreetMap contributors (ODbL) • Tile host: {tileBaseUrl || TILE_BASE_URL} • Zoom {zoom}
      </div>
    </div>
  );
}
