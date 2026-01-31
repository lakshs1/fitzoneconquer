import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type UserStats = Tables<'user_stats'>;
export type Activity = Tables<'activities'>;
export type Zone = Tables<'zones'>;

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setStats(payload.new as UserStats);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateStats = async (updates: Partial<UserStats>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('user_stats')
      .update(updates)
      .eq('user_id', user.id);

    if (error) return { error: error.message };
    return { error: null };
  };

  return { stats, loading, error, updateStats };
}

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setActivities(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { activities, loading, error };
}

export function useZones() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const { data, error } = await supabase
          .from('zones')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setZones(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchZones();

    // Subscribe to realtime updates for zones
    const channel = supabase
      .channel('zones_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zones',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setZones((prev) => [payload.new as Zone, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setZones((prev) =>
              prev.map((z) => (z.id === (payload.new as Zone).id ? (payload.new as Zone) : z))
            );
          } else if (payload.eventType === 'DELETE') {
            setZones((prev) => prev.filter((z) => z.id !== (payload.old as Zone).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const myZones = zones.filter((z) => z.owner_id === user?.id);
  const enemyZones = zones.filter((z) => z.owner_id && z.owner_id !== user?.id);

  return { zones, myZones, enemyZones, loading, error };
}

// Helper to format stats for display
export function getDefaultStats(): UserStats {
  return {
    id: '',
    user_id: '',
    xp: 0,
    level: 1,
    streak: 0,
    total_distance: 0,
    total_calories: 0,
    total_activities: 0,
    zones_owned: 0,
    zones_captured: 0,
    zones_lost: 0,
    last_activity_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getLevelProgress(xp: number): number {
  const xpPerLevel = 1000;
  return ((xp % xpPerLevel) / xpPerLevel) * 100;
}

export function getXpToNextLevel(xp: number): number {
  const xpPerLevel = 1000;
  return xpPerLevel - (xp % xpPerLevel);
}
