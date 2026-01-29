import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleMap } from '@/components/map/GoogleMap';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

export default function MapView() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { position } = useGeolocation();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);

  // TODO: Fetch zones from Supabase
  const zones = [
    {
      id: '1',
      coordinates: [
        { lat: 40.7128, lng: -74.006 },
        { lat: 40.7138, lng: -74.005 },
        { lat: 40.7133, lng: -74.004 },
        { lat: 40.7123, lng: -74.005 },
      ],
      center: { lat: 40.7128, lng: -74.006 },
      isOwned: true,
      ownerName: profile?.name || 'You',
      level: 2,
    },
    {
      id: '2',
      coordinates: [
        { lat: 40.7150, lng: -74.008 },
        { lat: 40.7160, lng: -74.007 },
        { lat: 40.7155, lng: -74.006 },
        { lat: 40.7145, lng: -74.007 },
      ],
      center: { lat: 40.7150, lng: -74.008 },
      isOwned: false,
      ownerName: 'FitRunner42',
      level: 3,
    },
  ];

  // TODO: Fetch from Google Places API
  const nearbyPlaces = [
    { id: 'gym1', name: 'FitLife Gym', type: 'gym' as const, location: { lat: 40.714, lng: -74.005 } },
    { id: 'park1', name: 'Central Park', type: 'park' as const, location: { lat: 40.716, lng: -74.009 } },
  ];

  const selectedZoneData = zones.find((z) => z.id === selectedZone);

  const handleChallengeZone = () => {
    // Navigate to activity tracker to start a zone capture
    navigate('/activity', { state: { challengeZoneId: selectedZone } });
  };

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-5rem)]">
        {/* Google Map Component */}
        <GoogleMap
          userPosition={position}
          zones={zones}
          nearbyPlaces={nearbyPlaces}
          showNearbyPlaces={showNearbyPlaces}
          onZoneClick={setSelectedZone}
          onPlaceClick={(id) => console.log('Place clicked:', id)}
        />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="glass">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="icon" className="glass">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant={showNearbyPlaces ? "neon" : "secondary"}
            size="icon" 
            className="glass"
            onClick={() => setShowNearbyPlaces(!showNearbyPlaces)}
          >
            <Layers className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Location Button */}
        <Button 
          variant="neon" 
          size="icon" 
          className="absolute bottom-24 right-4 w-12 h-12 rounded-full"
        >
          <Navigation className="w-5 h-5" />
        </Button>

        {/* Legend */}
        <div className="absolute top-4 left-4 glass rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs">Your Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs">Enemy Zones</span>
          </div>
          {showNearbyPlaces && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">💪</span>
                <span className="text-xs">Gyms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🌳</span>
                <span className="text-xs">Parks</span>
              </div>
            </>
          )}
        </div>

        {/* Selected Zone Panel */}
        {selectedZoneData && (
          <div className="absolute bottom-20 left-4 right-4 glass rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-display font-bold">Zone #{selectedZoneData.id}</p>
                <p className="text-sm text-muted-foreground">
                  Owned by{' '}
                  <span className={selectedZoneData.isOwned ? 'text-primary' : 'text-destructive'}>
                    {selectedZoneData.ownerName}
                  </span>
                </p>
              </div>
              <div className="level-badge bg-primary text-primary-foreground px-2 py-1 rounded">
                LVL {selectedZoneData.level}
              </div>
            </div>
            
            {!selectedZoneData.isOwned && (
              <Button variant="danger" className="w-full" onClick={handleChallengeZone}>
                ⚔️ Challenge Zone (20 min activity)
              </Button>
            )}
            
            {selectedZoneData.isOwned && (
              <div className="text-sm text-muted-foreground text-center">
                🛡️ This zone is under your control
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => setSelectedZone(null)}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
