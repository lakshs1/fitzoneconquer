import { describe, expect, it } from 'vitest';
import { haversineDistanceMeters, latLngToWorldPoint, rankNearbyPlaces, smoothGpsPath } from './mapAlgorithms';

describe('mapAlgorithms', () => {
  it('projects coordinates to finite world points', () => {
    const p = latLngToWorldPoint({ lat: 40.7128, lng: -74.006 }, 15);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  });

  it('calculates non-zero haversine distance', () => {
    const meters = haversineDistanceMeters({ lat: 40.7128, lng: -74.006 }, { lat: 40.7138, lng: -74.005 });
    expect(meters).toBeGreaterThan(100);
    expect(meters).toBeLessThan(200);
  });

  it('smooths jittery gps points', () => {
    const path = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 40.7129, lng: -74.0059 },
      { lat: 40.714, lng: -74.004 },
    ];
    const smoothed = smoothGpsPath(path, 0.3);
    expect(smoothed).toHaveLength(path.length);
    expect(smoothed[2].lat).toBeLessThan(path[2].lat);
  });

  it('ranks closer places higher when ratings are similar', () => {
    const ranked = rankNearbyPlaces(
      { lat: 40.7128, lng: -74.006 },
      [
        { id: 'far', name: 'Far Park', type: 'park', location: { lat: 40.7328, lng: -74.026 }, rating: 4.5 },
        { id: 'near', name: 'Near Park', type: 'park', location: { lat: 40.713, lng: -74.0062 }, rating: 4.4 },
      ],
      2
    );

    expect(ranked[0].id).toBe('near');
    expect(ranked[0].distanceMeters).toBeLessThan(ranked[1].distanceMeters);
  });
});
