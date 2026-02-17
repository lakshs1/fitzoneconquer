import { Coordinates } from '@/hooks/useGeolocation';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface RankedPlace {
  id: string;
  name: string;
  type: 'gym' | 'park' | 'trail';
  location: LatLng;
  rating?: number;
  score: number;
  distanceMeters: number;
}

export interface ZoneDraft {
  kind: 'polygon' | 'route';
  coordinates: LatLng[];
  center: LatLng;
  closedLoop: boolean;
  suggestedRadiusMeters: number;
}

const TILE_SIZE = 256;

export function latLngToWorldPoint(
  point: LatLng,
  zoom: number
): ProjectedPoint {
  const scale = TILE_SIZE * 2 ** zoom;
  const clampedLat = Math.max(
    -85.05112878,
    Math.min(85.05112878, point.lat)
  );
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);

  return {
    x: ((point.lng + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLat) / (1 - sinLat)) /
          (4 * Math.PI)) *
      scale,
  };
}

export function worldPointToTile(point: ProjectedPoint) {
  return {
    x: Math.floor(point.x / TILE_SIZE),
    y: Math.floor(point.y / TILE_SIZE),
  };
}

export function haversineDistanceMeters(
  a: LatLng,
  b: LatLng
): number {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function offsetPoint(origin: LatLng, northMeters: number, eastMeters: number): LatLng {
  const lat = origin.lat + northMeters / 111_320;
  const lng =
    origin.lng +
    eastMeters / (111_320 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)));
  return { lat, lng };
}

export function circlePolygon(center: LatLng, radiusMeters: number, points = 24): LatLng[] {
  const safeRadius = Math.max(8, radiusMeters);
  return Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * Math.PI * 2;
    const north = Math.cos(angle) * safeRadius;
    const east = Math.sin(angle) * safeRadius;
    return offsetPoint(center, north, east);
  });
}

function centerOfPoints(points: LatLng[]): LatLng {
  const total = points.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  };
}

export function deriveZoneFromPath(path: Coordinates[]): ZoneDraft | null {
  if (path.length < 2) return null;

  const totalDistance = path.slice(1).reduce((sum, point, index) => {
    return sum + haversineDistanceMeters(path[index], point);
  }, 0);

  if (totalDistance < 40) return null;

  const start = path[0];
  const end = path[path.length - 1];
  const loopGap = haversineDistanceMeters(start, end);
  const formsClosedShape = path.length >= 4 && loopGap <= Math.max(35, totalDistance * 0.12);

  if (formsClosedShape) {
    return {
      kind: 'polygon',
      coordinates: path.map((point) => ({ lat: point.lat, lng: point.lng })),
      center: centerOfPoints(path),
      closedLoop: true,
      suggestedRadiusMeters: Math.max(8, totalDistance / 8),
    };
  }

  const radius = Math.max(12, totalDistance / 8);
  return {
    kind: 'route',
    coordinates: circlePolygon(start, radius, 24),
    center: { lat: start.lat, lng: start.lng },
    closedLoop: false,
    suggestedRadiusMeters: radius,
  };
}

export function smoothGpsPath(
  path: Coordinates[],
  alpha = 0.35
): Coordinates[] {
  if (path.length <= 2) return path;

  const smoothed: Coordinates[] = [path[0]];

  for (let i = 1; i < path.length; i++) {
    const prev = smoothed[smoothed.length - 1];
    const cur = path[i];

    smoothed.push({
      lat: prev.lat + alpha * (cur.lat - prev.lat),
      lng: prev.lng + alpha * (cur.lng - prev.lng),
      accuracy: cur.accuracy,
      timestamp: cur.timestamp,
    });
  }

  return smoothed;
}

export function rankNearbyPlaces(
  user: LatLng,
  places: Array<{
    id: string;
    name: string;
    type: 'gym' | 'park' | 'trail';
    location: LatLng;
    rating?: number;
  }>,
  limit = 10
): RankedPlace[] {
  const typeWeight: Record<'gym' | 'park' | 'trail', number> = {
    gym: 0.75,
    park: 1,
    trail: 0.95,
  };

  return places
    .map((place) => {
      const distanceMeters = haversineDistanceMeters(
        user,
        place.location
      );

      const distanceScore = 1 / (1 + distanceMeters / 1000);
      const ratingScore = (place.rating ?? 4) / 5;

      const score =
        distanceScore * 0.6 +
        ratingScore * 0.25 +
        typeWeight[place.type] * 0.15;

      return {
        ...place,
        score,
        distanceMeters,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function tileUrl(
  x: number,
  y: number,
  zoom: number,
  baseUrl = 'https://tile.openstreetmap.org'
): string {
  const tileCount = 2 ** zoom;
  const wrappedX = ((x % tileCount) + tileCount) % tileCount;

  if (baseUrl.includes('{x}') || baseUrl.includes('{y}') || baseUrl.includes('{z}')) {
    return baseUrl
      .replace('{x}', String(wrappedX))
      .replace('{y}', String(y))
      .replace('{z}', String(zoom));
  }

  return `${baseUrl}/${zoom}/${wrappedX}/${y}.png`;
}
