import { useState, useEffect, useCallback, useRef } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

interface GeolocationState {
  position: Coordinates | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Custom hook for real-time GPS tracking with the Geolocation API
 * 
 * GPS TRACKING LOGIC EXPLANATION:
 * ================================
 * 1. Uses navigator.geolocation.watchPosition for continuous tracking
 * 2. High accuracy mode requests GPS hardware (not just wifi/cell triangulation)
 * 3. Returns lat/lng coordinates, speed, heading, and accuracy metrics
 * 4. Error handling for permission denied, position unavailable, timeout
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });
  
  const watchIdRef = useRef<number | null>(null);
  
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: position.timestamp,
      },
      error: null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unknown error occurred';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable GPS access.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Check GPS signal.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Move to an open area.';
        break;
    }
    
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const getCurrentPosition = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, [startWatching, stopWatching]);

  return {
    ...state,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}
