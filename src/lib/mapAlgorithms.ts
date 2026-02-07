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

const TILE_SIZE = 256;

/**
 * MAP ALGORITHMS
 * ==============
 * OpenStreetMap-compatible math utilities
 */

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

  return `${baseUrl}/${zoom}/${wrappedX}/${y}.png`;
}
