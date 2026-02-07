import { useState, useCallback, useRef, useEffect } from 'react';
import { useGeolocation, Coordinates } from './useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityState {
  isTracking: boolean;
  isPaused: boolean;
  activityType: 'run' | 'walk' | 'cycle' | null;
  path: Coordinates[];
  distance: number; // in meters
  duration: number; // in seconds
  calories: number;
  loops: number;
  startTime: Date | null;
  currentSpeed: number; // in m/s
}

/**
 * REAL-TIME GPS TRACKING & DISTANCE CALCULATION LOGIC
 * ====================================================
 * 
 * 1. HAVERSINE FORMULA (calculateDistance):
 *    - Calculates great-circle distance between two points on Earth
 *    - Accounts for Earth's spherical shape (radius ~6371km)
 *    - Formula: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
 *    - Result: 2 × R × atan2(√a, √(1-a))
 *    
 * 2. LOOP DETECTION (detectLoop):
 *    - A "loop" occurs when user returns within 30m of starting point
 *    - After traveling at least 100m total distance
 *    - Prevents false positives from GPS jitter at start
 *    
 * 3. PATH RECORDING:
 *    - Only records points when moved > 5m (reduces GPS noise)
 *    - Stores full coordinate path for zone polygon creation
 *    - Each point includes timestamp for pace calculation
 *    
 * 4. CALORIE CALCULATION:
 *    - Uses MET (Metabolic Equivalent of Task) values
 *    - Run: ~10 METs, Walk: ~3.5 METs, Cycle: ~7 METs
 *    - Formula: calories = MET × weight(kg) × duration(hours)
 *    - Approximated as: duration × (speed factor) × 0.05
 */

// Haversine formula for calculating distance between two GPS coordinates
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// MET values for different activities (Metabolic Equivalent of Task)
const MET_VALUES = {
  run: 10,    // Running at ~6 mph
  walk: 3.5,  // Walking at ~3 mph
  cycle: 7,   // Cycling at ~12 mph
};

// Calorie calculation based on activity type, duration, and average weight
function calculateCalories(
  activityType: 'run' | 'walk' | 'cycle',
  durationSeconds: number,
  _distanceMeters: number
): number {
  const met = MET_VALUES[activityType];
  const hours = durationSeconds / 3600;
  const averageWeightKg = 70; // Default assumption
  
  // Calories = MET × weight(kg) × duration(hours)
  return met * averageWeightKg * hours;
}

export function useActivityTracking() {
  const { user, stats, updateStats } = useAuth();
  const { position, error: geoError, getCurrentPosition } = useGeolocation();
  
  const [state, setState] = useState<ActivityState>({
    isTracking: false,
    isPaused: false,
    activityType: null,
    path: [],
    distance: 0,
    duration: 0,
    calories: 0,
    loops: 0,
    startTime: null,
    currentSpeed: 0,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<Coordinates | null>(null);
  const loopCheckDistanceRef = useRef<number>(0);
  const startPositionRef = useRef<Coordinates | null>(null);

  // Update position and calculate metrics
  useEffect(() => {
    if (!state.isTracking || state.isPaused || !position) return;
    
    const lastPos = lastPositionRef.current;
    
    if (lastPos) {
      // Calculate distance from last position
      const segmentDistance = calculateDistance(lastPos, position);
      
      // Only add if moved more than 5 meters (filters GPS noise)
      if (segmentDistance > 5) {
        setState((prev) => {
          const newDistance = prev.distance + segmentDistance;
          const newPath = [...prev.path, position];
          
          // Update calories based on new distance
          const newCalories = calculateCalories(
            prev.activityType!,
            prev.duration,
            newDistance
          );
          
          // Check for loop completion
          let newLoops = prev.loops;
          loopCheckDistanceRef.current += segmentDistance;
          
          // Loop detection: back within 30m of start after traveling 100m+
          if (
            startPositionRef.current &&
            loopCheckDistanceRef.current > 100 &&
            calculateDistance(position, startPositionRef.current) < 30
          ) {
            newLoops += 1;
            loopCheckDistanceRef.current = 0; // Reset for next loop
          }
          
          return {
            ...prev,
            path: newPath,
            distance: newDistance,
            calories: newCalories,
            loops: newLoops,
            currentSpeed: position.speed ?? segmentDistance, // m/s
          };
        });
        
        lastPositionRef.current = position;
      }
    } else {
      // First position
      lastPositionRef.current = position;
      startPositionRef.current = position;
      setState((prev) => ({
        ...prev,
        path: [position],
      }));
    }
  }, [position, state.isTracking, state.isPaused]);

  // Duration timer
  useEffect(() => {
    if (state.isTracking && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
          calories: calculateCalories(
            prev.activityType!,
            prev.duration + 1,
            prev.distance
          ),
        }));
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isTracking, state.isPaused]);

  const startActivity = useCallback(async (type: 'run' | 'walk' | 'cycle') => {
    try {
      const currentPos = await getCurrentPosition().catch((error) => {
        if (position) {
          return position; // NOTE: fall back to watchPosition data if getCurrentPosition fails
        }
        throw error;
      });
      
      setState({
        isTracking: true,
        isPaused: false,
        activityType: type,
        path: [currentPos],
        distance: 0,
        duration: 0,
        calories: 0,
        loops: 0,
        startTime: new Date(),
        currentSpeed: 0,
      });
      
      lastPositionRef.current = currentPos;
      startPositionRef.current = currentPos;
      loopCheckDistanceRef.current = 0;
      
      return { success: true, startPosition: currentPos };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const geoError = error as GeolocationPositionError;
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission denied. Enable GPS access.'
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? 'Location unavailable. Check GPS signal.'
              : geoError.code === geoError.TIMEOUT
                ? 'Location request timed out. Try moving to an open area.'
                : 'Failed to get GPS position.';
        return { success: false, error: message }; // NOTE: surface real geolocation error for clearer UX
      }
      return { success: false, error: 'Failed to get GPS position.' };
    }
  }, [getCurrentPosition, position]);

  const pauseActivity = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeActivity = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const stopActivity = useCallback(async () => {
    if (!user || !state.activityType) return null;
    
    const endTime = new Date();
    const xpEarned = Math.floor(state.distance / 100) * 10 + (state.loops * 50);
    
    // Save activity to Supabase - cast path to JSON compatible format
    const pathData = state.path.map(p => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp,
      accuracy: p.accuracy,
    }));
    
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: state.activityType,
        distance: state.distance,
        duration: state.duration,
        calories: state.calories,
        path: pathData,
        start_coordinates: startPositionRef.current ? {
          lat: startPositionRef.current.lat,
          lng: startPositionRef.current.lng,
        } : null,
        end_coordinates: lastPositionRef.current ? {
          lat: lastPositionRef.current.lat,
          lng: lastPositionRef.current.lng,
        } : null,
        loops_completed: state.loops,
        xp_earned: xpEarned,
        started_at: state.startTime?.toISOString(),
        ended_at: endTime.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to save activity:', error);
    }
    
    // Update user stats
    if (stats) {
      await updateStats({
        total_distance: (stats.total_distance || 0) + state.distance,
        total_calories: (stats.total_calories || 0) + state.calories,
        total_activities: (stats.total_activities || 0) + 1,
        xp: (stats.xp || 0) + xpEarned,
        level: Math.floor(((stats.xp || 0) + xpEarned) / 1000) + 1,
        last_activity_date: new Date().toISOString().split('T')[0],
      });
    }
    
    const result = {
      activity,
      distance: state.distance,
      duration: state.duration,
      calories: state.calories,
      loops: state.loops,
      xpEarned,
      path: state.path,
    };
    
    // Reset state
    setState({
      isTracking: false,
      isPaused: false,
      activityType: null,
      path: [],
      distance: 0,
      duration: 0,
      calories: 0,
      loops: 0,
      startTime: null,
      currentSpeed: 0,
    });
    
    lastPositionRef.current = null;
    startPositionRef.current = null;
    loopCheckDistanceRef.current = 0;
    
    return result;
  }, [user, state, stats, updateStats]);

  return {
    ...state,
    position,
    geoError,
    startActivity,
    pauseActivity,
    resumeActivity,
    stopActivity,
  };
}
