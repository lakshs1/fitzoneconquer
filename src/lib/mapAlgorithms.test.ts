import { describe, expect, it } from 'vitest';
import { deriveZoneFromPath, haversineDistanceMeters, latLngToWorldPoint, rankNearbyPlaces, rankZonesByNearbyPlaces, smoothGpsPath } from './mapAlgorithms';

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
      { lat: 40.7128, lng: -74.006, timestamp: 1 },
      { lat: 40.7129, lng: -74.0059, timestamp: 2 },
      { lat: 40.714, lng: -74.004, timestamp: 3 },
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

  it('builds polygon zone when path closes into a loop', () => {
    const zone = deriveZoneFromPath([
      { lat: 40.7128, lng: -74.006, timestamp: 1 },
      { lat: 40.7134, lng: -74.0054, timestamp: 2 },
      { lat: 40.7129, lng: -74.0049, timestamp: 3 },
      { lat: 40.7127, lng: -74.0058, timestamp: 4 },
    ]);

    expect(zone?.closedLoop).toBe(true);
    expect(zone?.kind).toBe('polygon');
  });

  it('builds start-centered route zone when no loop is formed', () => {
    const zone = deriveZoneFromPath([
      { lat: 40.7128, lng: -74.006, timestamp: 1 },
      { lat: 40.7132, lng: -74.0057, timestamp: 2 },
      { lat: 40.7136, lng: -74.0054, timestamp: 3 },
    ]);

    expect(zone?.closedLoop).toBe(false);
    expect(zone?.kind).toBe('route');
    expect(zone?.coordinates.length).toBeGreaterThan(8);
  });


  it('recommends zones that are close to detected parks/grounds', () => {
    const recommendations = rankZonesByNearbyPlaces(
      { lat: 40.7128, lng: -74.006 },
      [
        { id: 'zone-near-park', name: 'Riverside Zone', center: { lat: 40.7131, lng: -74.0061 } },
        { id: 'zone-far', name: 'Uptown Zone', center: { lat: 40.7300, lng: -74.0200 } },
      ],
      [
        { id: 'place-1', name: 'Hudson Park', type: 'park', location: { lat: 40.7130, lng: -74.0060 } },
        { id: 'place-2', name: 'Community Ground', type: 'ground', location: { lat: 40.7140, lng: -74.0050 } },
      ],
      2
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].zoneId).toBe('zone-near-park');
    expect(recommendations[0].nearestPlaceName).toBe('Hudson Park');
    expect(recommendations[0].zoneToPlaceMeters).toBeLessThan(80);
  });

});
