import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDailyGoToZones } from './dailyGoToZones';

describe('getDailyGoToZones', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fallback recommendations sorted by score when API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const recommendations = await getDailyGoToZones(
      [
        {
          id: 'park-1',
          name: 'Safe Park',
          type: 'park',
          location: { lat: 40.713, lng: -74.005 },
          safetyScore: 0.95,
          crowdLevel: 'low',
        },
        {
          id: 'runway-1',
          name: 'Track Field',
          type: 'runway',
          location: { lat: 40.716, lng: -74.01 },
          safetyScore: 0.82,
          crowdLevel: 'medium',
        },
      ],
      {
        currentLocation: { lat: 40.7128, lng: -74.006 },
        timeOfDay: 'morning',
        fitnessLevel: 'beginner',
        remainingKm: 2,
      }
    );

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].name).toBe('Safe Park');
    expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
    expect(recommendations[0].reason.toLowerCase()).toContain('safe');
  });

  it('uses AI recommendations when API returns zones', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          zones: [
            {
              id: 'ai-zone-1',
              name: 'AI Park',
              type: 'park',
              reason: 'Chosen by AI',
              mission: 'Run 2 km',
              distanceMeters: 900,
              score: 0.99,
            },
          ],
        }),
      })
    );

    const recommendations = await getDailyGoToZones(
      [
        {
          id: 'park-1',
          name: 'Safe Park',
          type: 'park',
          location: { lat: 40.713, lng: -74.005 },
        },
      ],
      {
        currentLocation: { lat: 40.7128, lng: -74.006 },
        timeOfDay: 'morning',
        fitnessLevel: 'intermediate',
        remainingKm: 2,
      }
    );

    expect(recommendations).toEqual([
      {
        id: 'ai-zone-1',
        name: 'AI Park',
        type: 'park',
        reason: 'Chosen by AI',
        mission: 'Run 2 km',
        distanceMeters: 900,
        score: 0.99,
      },
    ]);
  });
});
