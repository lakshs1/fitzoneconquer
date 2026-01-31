import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoals: string[];
  dailyRoutine?: {
    workStart?: string;
    workEnd?: string;
    sleepTime?: string;
    wakeTime?: string;
  };
  menstrualTracking?: boolean;
  avatar?: string;
  createdAt: string;
}

export interface Zone {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
  center: { lat: number; lng: number };
  level: number;
  createdAt: string;
  capturedAt?: string;
  defenseChallenge?: {
    type: 'pushups' | 'pullups' | 'sprint' | 'endurance' | 'plank';
    targetScore: number;
  };
}

export interface Activity {
  id: string;
  userId: string;
  type: 'run' | 'walk' | 'cycle';
  distance: number; // in meters
  duration: number; // in seconds
  calories: number;
  path: { lat: number; lng: number }[];
  startedAt: string;
  endedAt: string;
  zoneCreated?: string;
}

export interface UserStats {
  totalDistance: number;
  totalCalories: number;
  totalActivities: number;
  zonesOwned: number;
  zonesCaptured: number;
  zonesLost: number;
  xp: number;
  level: number;
  streak: number;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  isOnboarded: boolean;
  user: UserProfile | null;
  
  // Game state
  stats: UserStats;
  zones: Zone[];
  activities: Activity[];
  currentActivity: Activity | null;
  isTracking: boolean;
  
  // Actions
  login: (user: UserProfile) => void;
  logout: () => void;
  completeOnboarding: (profile: Partial<UserProfile>) => void;
  startActivity: (type: Activity['type']) => void;
  stopActivity: () => void;
  addXp: (amount: number) => void;
  captureZone: (zoneId: string) => void;
}

const initialStats: UserStats = {
  totalDistance: 0,
  totalCalories: 0,
  totalActivities: 0,
  zonesOwned: 0,
  zonesCaptured: 0,
  zonesLost: 0,
  xp: 0,
  level: 1,
  streak: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isOnboarded: false,
      user: null,
      stats: initialStats,
      zones: [],
      activities: [],
      currentActivity: null,
      isTracking: false,

      login: (user) => set({ isAuthenticated: true, user }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        isOnboarded: false, 
        user: null,
        stats: initialStats,
      }),
      
      completeOnboarding: (profile) => set((state) => ({
        isOnboarded: true,
        user: state.user ? { ...state.user, ...profile } : null,
      })),

      startActivity: (type) => {
        const activity: Activity = {
          id: Date.now().toString(),
          userId: get().user?.id || 'guest',
          type,
          distance: 0,
          duration: 0,
          calories: 0,
          path: [],
          startedAt: new Date().toISOString(),
          endedAt: '',
        };
        set({ currentActivity: activity, isTracking: true });
      },

      stopActivity: () => {
        const { currentActivity, activities, stats } = get();
        if (currentActivity) {
          const completedActivity = {
            ...currentActivity,
            endedAt: new Date().toISOString(),
          };
          set({
            activities: [completedActivity, ...activities],
            currentActivity: null,
            isTracking: false,
            stats: {
              ...stats,
              totalActivities: stats.totalActivities + 1,
              totalDistance: stats.totalDistance + currentActivity.distance,
              totalCalories: stats.totalCalories + currentActivity.calories,
            },
          });
        }
      },

      addXp: (amount) => set((state) => {
        const newXp = state.stats.xp + amount;
        const xpPerLevel = 1000;
        const newLevel = Math.floor(newXp / xpPerLevel) + 1;
        return {
          stats: {
            ...state.stats,
            xp: newXp,
            level: newLevel,
          },
        };
      }),

      captureZone: (zoneId) => set((state) => {
        const zone = state.zones.find(z => z.id === zoneId);
        if (!zone || zone.ownerId === state.user?.id) return state;
        
        return {
          zones: state.zones.map(z => 
            z.id === zoneId 
              ? { ...z, ownerId: state.user?.id || '', ownerName: state.user?.name || 'You', capturedAt: new Date().toISOString() }
              : z
          ),
          stats: {
            ...state.stats,
            zonesCaptured: state.stats.zonesCaptured + 1,
            zonesOwned: state.stats.zonesOwned + 1,
            xp: state.stats.xp + 500,
          },
        };
      }),
    }),
    {
      name: 'fitzone-storage',
    }
  )
);

// Helper to calculate level progress
export const getLevelProgress = (xp: number): number => {
  const xpPerLevel = 1000;
  return (xp % xpPerLevel) / xpPerLevel * 100;
};

// Helper to get XP needed for next level
export const getXpToNextLevel = (xp: number): number => {
  const xpPerLevel = 1000;
  return xpPerLevel - (xp % xpPerLevel);
};
