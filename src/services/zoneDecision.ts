export interface DecisionZone {
  id: string;
  name?: string;
  type?: 'park' | 'trail' | 'runway' | 'greenway' | 'waterfront' | 'gym' | string;
  center: { lat: number; lng: number };
  isOwned: boolean;
  level: number;
}

export interface ZoneDecisionContext {
  currentLocation: { lat: number; lng: number };
  streak: number;
  level: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface ZoneDecisionResult {
  zoneId: string;
  score: number;
  reason: string;
  model: string;
  distanceKm: number;
  estimatedRouteKm: number;
  estimatedTravelMinutes: number;
  idealPath: string;
}

export async function selectBestZone(
  zones: DecisionZone[],
  context: ZoneDecisionContext
): Promise<ZoneDecisionResult | null> {
  const baseUrl = import.meta.env.VITE_AI_COACH_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${baseUrl}/zone-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones, context }),
    });

    if (!response.ok) return null;
    return (await response.json()) as ZoneDecisionResult;
  } catch (error) {
    console.warn('Zone decision service unavailable', error);
    return null;
  }
}
