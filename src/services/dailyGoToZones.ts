import { haversineDistanceMeters } from '@/lib/mapAlgorithms';

export type GoToZoneType = 'park' | 'trail' | 'runway' | 'greenway' | 'waterfront';

export interface ZoneCandidate {
  id: string;
  name: string;
  type: GoToZoneType;
  location: { lat: number; lng: number };
  safetyScore?: number;
  crowdLevel?: 'low' | 'medium' | 'high';
}

export interface DailyZoneContext {
  currentLocation: { lat: number; lng: number };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  remainingKm: number;
}

export interface DailyGoToZoneRecommendation {
  id: string;
  name: string;
  type: GoToZoneType;
  reason: string;
  mission: string;
  distanceMeters: number;
  score: number;
}

interface DailyZoneApiResponse {
  zones: DailyGoToZoneRecommendation[];
}

function fallbackRecommendations(
  candidates: ZoneCandidate[],
  context: DailyZoneContext
): DailyGoToZoneRecommendation[] {
  const safeCandidates = candidates.filter((candidate) => (candidate.safetyScore ?? 0.7) >= 0.6);

  const typeWeights: Record<GoToZoneType, number> = {
    park: 1,
    trail: 0.95,
    runway: 0.9,
    greenway: 0.93,
    waterfront: 0.89,
  };

  const crowdPenalty: Record<'low' | 'medium' | 'high', number> = {
    low: 1,
    medium: 0.88,
    high: 0.72,
  };

  return safeCandidates
    .map((candidate) => {
      const distanceMeters = haversineDistanceMeters(context.currentLocation, candidate.location);
      const distanceKm = distanceMeters / 1000;
      const targetDistanceKm = Math.max(context.remainingKm, 1.2);
      const distanceFit = 1 / (1 + Math.abs(distanceKm - targetDistanceKm));

      const score =
        distanceFit * 0.45 +
        (candidate.safetyScore ?? 0.75) * 0.3 +
        typeWeights[candidate.type] * 0.15 +
        crowdPenalty[candidate.crowdLevel ?? 'medium'] * 0.1;

      return {
        id: candidate.id,
        name: candidate.name,
        type: candidate.type,
        distanceMeters,
        score,
        reason: buildReason(candidate, context),
        mission: buildMission(candidate, context),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildReason(candidate: ZoneCandidate, context: DailyZoneContext): string {
  const timeLabel = {
    morning: 'cool and calm in the morning',
    afternoon: 'open and active during the day',
    evening: 'well suited for sunset sessions',
    night: 'best used for short, visible sessions at night',
  }[context.timeOfDay];

  const safety = (candidate.safetyScore ?? 0.75) >= 0.8 ? 'high-safety' : 'safe';

  return `${candidate.name} is a ${safety} ${candidate.type} area that is ${timeLabel}.`;
}

function buildMission(candidate: ZoneCandidate, context: DailyZoneContext): string {
  const remainingKm = Math.max(context.remainingKm, 1);

  if (context.fitnessLevel === 'beginner') {
    return `Conquer ${candidate.name} with a ${Math.min(2, remainingKm).toFixed(1)} km steady walk.`;
  }

  if (context.fitnessLevel === 'advanced') {
    return `Attack ${candidate.name} with ${remainingKm.toFixed(1)} km plus 4 sprint intervals.`;
  }

  return `Capture ${candidate.name} with a ${remainingKm.toFixed(1)} km run/walk combo.`;
}

export async function getDailyGoToZones(
  candidates: ZoneCandidate[],
  context: DailyZoneContext
): Promise<DailyGoToZoneRecommendation[]> {
  const baseUrl = import.meta.env.VITE_AI_COACH_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${baseUrl}/daily-go-to-zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates, context }),
    });

    if (response.ok) {
      const data = (await response.json()) as DailyZoneApiResponse;
      if (Array.isArray(data.zones) && data.zones.length > 0) {
        return data.zones.slice(0, 3);
      }
    }
  } catch (error) {
    console.warn('Daily go-to zone AI unavailable, using local ranking.', error);
  }

  return fallbackRecommendations(candidates, context);
}
