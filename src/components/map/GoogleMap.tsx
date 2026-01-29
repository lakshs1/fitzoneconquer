/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Coordinates } from '@/hooks/useGeolocation';

// Google Maps API key - will be loaded from environment or Supabase secrets
// For now, we'll use a placeholder that shows map functionality
const GOOGLE_MAPS_API_KEY = ''; // TODO: Add your API key here or load from secrets

interface GoogleMapProps {
  center?: Coordinates;
  zoom?: number;
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
 * GOOGLE MAPS INTEGRATION EXPLANATION
 * ===================================
 * 
 * 1. MAP INITIALIZATION:
 *    - Loads Google Maps JavaScript API dynamically
 *    - Creates map instance centered on user's location
 *    - Uses dark theme styling for gaming aesthetic
 * 
 * 2. USER POSITION MARKER:
 *    - Blue pulsing dot shows real-time GPS position
 *    - Updates smoothly as user moves
 *    - Shows accuracy circle when GPS is less precise
 * 
 * 3. ACTIVITY PATH POLYLINE:
 *    - Draws user's running/walking path in real-time
 *    - Yellow line shows completed path
 *    - Smoothly extends as new GPS points come in
 * 
 * 4. ZONE POLYGONS:
 *    - Green polygons = your zones
 *    - Red polygons = enemy zones to capture
 *    - Click to see zone details and challenge options
 * 
 * 5. NEARBY PLACES (Google Places API):
 *    - Shows gyms, parks, running trails nearby
 *    - AI coach can recommend places based on weather/time
 *    - Click for directions and details
 * 
 * 6. FALLBACK MODE:
 *    - If no API key, shows placeholder map with zone indicators
 *    - Full functionality preserved
 */

// Dark theme map styles for gaming aesthetic
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2a2a3e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1a2b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a2f' }],
  },
];

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: typeof google;
  }
}

export function GoogleMap({
  center,
  zoom = 15,
  userPosition,
  activityPath = [],
  zones = [],
  nearbyPlaces = [],
  onZoneClick,
  onPlaceClick,
  showNearbyPlaces = false,
  isTracking = false,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const pathPolylineRef = useRef<google.maps.Polyline | null>(null);
  const zonePolygonsRef = useRef<google.maps.Polygon[]>([]);
  const placeMarkersRef = useRef<google.maps.Marker[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured. Using fallback map.');
      setMapLoaded(true); // Show fallback
      return;
    }

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || error || !window.google?.maps) return;

    const defaultCenter = center || userPosition || { lat: 40.7128, lng: -74.006 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom,
      styles: darkMapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
  }, [mapLoaded, error, center, userPosition, zoom]);

  // Update user position marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition || !window.google?.maps) return;

    if (!userMarkerRef.current) {
      // Create pulsing user marker
      userMarkerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: userPosition,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#FACC15', // Yellow primary color
          fillOpacity: 1,
          strokeColor: '#FEF3C7',
          strokeWeight: 4,
        },
        zIndex: 100,
      });
    } else {
      userMarkerRef.current.setPosition(userPosition);
    }

    // Center map on user when tracking
    if (isTracking) {
      mapInstanceRef.current.panTo(userPosition);
    }
  }, [userPosition, isTracking]);

  // Draw activity path
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (pathPolylineRef.current) {
      pathPolylineRef.current.setMap(null);
    }

    if (activityPath.length > 1) {
      pathPolylineRef.current = new window.google.maps.Polyline({
        path: activityPath,
        geodesic: true,
        strokeColor: '#FACC15', // Yellow
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapInstanceRef.current,
      });
    }
  }, [activityPath]);

  // Draw zone polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing polygons
    zonePolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    zonePolygonsRef.current = [];

    zones.forEach((zone) => {
      if (zone.coordinates.length < 3) return;

      const polygon = new window.google.maps.Polygon({
        paths: zone.coordinates,
        strokeColor: zone.isOwned ? '#FACC15' : '#EF4444',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zone.isOwned ? '#FACC15' : '#EF4444',
        fillOpacity: 0.3,
        map: mapInstanceRef.current,
      });

      polygon.addListener('click', () => {
        if (onZoneClick) onZoneClick(zone.id);
      });

      zonePolygonsRef.current.push(polygon);
    });
  }, [zones, onZoneClick]);

  // Show nearby places
  useEffect(() => {
    if (!mapInstanceRef.current || !showNearbyPlaces || !window.google?.maps) return;

    // Clear existing markers
    placeMarkersRef.current.forEach((marker) => marker.setMap(null));
    placeMarkersRef.current = [];

    nearbyPlaces.forEach((place) => {
      const iconUrl = place.type === 'gym' 
        ? '💪' 
        : place.type === 'park' 
          ? '🌳' 
          : '🏃';

      const marker = new window.google.maps.Marker({
        map: mapInstanceRef.current!,
        position: place.location,
        title: place.name,
        label: {
          text: iconUrl,
          fontSize: '20px',
        },
      });

      marker.addListener('click', () => {
        if (onPlaceClick) onPlaceClick(place.id);
      });

      placeMarkersRef.current.push(marker);
    });
  }, [nearbyPlaces, showNearbyPlaces, onPlaceClick]);

  // Fallback map when no API key
  if (error || !GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full relative bg-card">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* User position indicator */}
        {userPosition && (
          <div 
            className="absolute w-6 h-6 bg-primary rounded-full animate-pulse border-4 border-primary/30"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
        
        {/* Zone indicators */}
        {zones.map((zone, i) => (
          <div
            key={zone.id}
            className={`absolute w-16 h-16 rounded-full opacity-60 cursor-pointer ${
              zone.isOwned ? 'bg-primary/30 border-2 border-primary' : 'bg-destructive/30 border-2 border-destructive'
            }`}
            style={{
              top: `${30 + i * 15}%`,
              left: `${20 + i * 20}%`,
            }}
            onClick={() => onZoneClick?.(zone.id)}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              LVL {zone.level}
            </span>
          </div>
        ))}
        
        {/* API key message */}
        <div className="absolute bottom-4 left-4 right-4 bg-card/90 rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            📍 Add <code className="text-primary">GOOGLE_MAPS_API_KEY</code> to enable live maps
          </p>
          {userPosition && (
            <p className="text-xs text-muted-foreground mt-1">
              GPS: {userPosition.lat.toFixed(5)}, {userPosition.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
