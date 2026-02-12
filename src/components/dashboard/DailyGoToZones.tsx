import { useEffect, useMemo, useState } from 'react';
import { MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useActivities } from '@/hooks/useUserData';
import {
  getDailyGoToZones,
  type DailyGoToZoneRecommendation,
  type GoToZoneType,
  type ZoneCandidate,
} from '@/services/dailyGoToZones';

const SAFE_ZONE_LIBRARY: Array<Omit<ZoneCandidate, 'location'>> = [
  { id: 'safe-park', name: 'City Park Loop', type: 'park', safetyScore: 0.93, crowdLevel: 'medium' },
  { id: 'safe-trail', name: 'River Trail Path', type: 'trail', safetyScore: 0.89, crowdLevel: 'low' },
  { id: 'safe-runway', name: 'School Track Runway', type: 'runway', safetyScore: 0.91, crowdLevel: 'low' },
  { id: 'safe-greenway', name: 'Greenway Connector', type: 'greenway', safetyScore: 0.86, crowdLevel: 'medium' },
  { id: 'safe-waterfront', name: 'Waterfront Walk', type: 'waterfront', safetyScore: 0.84, crowdLevel: 'medium' },
];

function toOffset(base: { lat: number; lng: number }, latDelta: number, lngDelta: number) {
  return {
    lat: base.lat + latDelta,
    lng: base.lng + lngDelta,
  };
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning' as const;
  if (hour >= 12 && hour < 17) return 'afternoon' as const;
  if (hour >= 17 && hour < 21) return 'evening' as const;
  return 'night' as const;
}

function formatType(type: GoToZoneType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function DailyGoToZones() {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { activities } = useActivities();
  const [recommendations, setRecommendations] = useState<DailyGoToZoneRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const todaysKm = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities
      .filter((activity) => new Date(activity.started_at) >= today)
      .reduce((sum, activity) => sum + Number(activity.distance || 0), 0) / 1000;
  }, [activities]);

  const remainingKm = Math.max(3 - todaysKm, 0.5);
  const fitnessLevel = remainingKm > 2.4 ? 'beginner' : remainingKm > 1.3 ? 'intermediate' : 'advanced';

  useEffect(() => {
    if (!position) return;

    const offsetCandidates = [
      toOffset(position, 0.004, -0.003),
      toOffset(position, -0.0035, 0.002),
      toOffset(position, 0.002, 0.0038),
      toOffset(position, -0.0045, -0.0025),
      toOffset(position, 0.0015, -0.004),
    ];

    const candidates = SAFE_ZONE_LIBRARY.map((zone, index) => ({
      ...zone,
      location: offsetCandidates[index],
    }));

    const loadRecommendations = async () => {
      setLoading(true);
      const dailyZones = await getDailyGoToZones(candidates, {
        currentLocation: position,
        fitnessLevel,
        remainingKm,
        timeOfDay: getTimeOfDay(),
      });
      setRecommendations(dailyZones);
      setLoading(false);
    };

    void loadRecommendations();
  }, [position, fitnessLevel, remainingKm]);

  if (!position) {
    return (
      <section className="stat-card">
        <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-primary" />
          Daily Go-To Zones
        </h2>
        <p className="text-sm text-muted-foreground">
          Enable location to let AI pick safe parks, trails, and runways for your daily goal.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        Daily Go-To Zones
      </h2>

      <div className="stat-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 space-y-3">
        <p className="text-sm text-muted-foreground">
          AI selected safe zones to help you conquer your last {remainingKm.toFixed(1)} km today.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Analyzing nearby safe areas…</p>}

        {!loading && recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.map((zone) => (
              <div key={zone.id} className="rounded-lg border border-border bg-card/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{zone.name}</p>
                  <span className="text-xs text-primary">{formatType(zone.type)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{zone.reason}</p>
                <p className="text-xs mt-1 text-accent">
                  <ShieldCheck className="inline w-3.5 h-3.5 mr-1" />
                  {zone.mission}
                </p>
              </div>
            ))}
          </div>
        )}

        <Button variant="neon" className="w-full" onClick={() => navigate('/map')}>
          Open Map and Conquer
        </Button>
      </div>
    </section>
  );
}
