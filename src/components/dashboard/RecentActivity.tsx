import { Activity as ActivityIcon, MapPin, Flame, Clock } from 'lucide-react';
import { useActivities } from '@/hooks/useUserData';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const { activities, loading } = useActivities();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'run': return '🏃';
      case 'walk': return '🚶';
      case 'cycle': return '🚴';
      default: return '🏃';
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        <div className="stat-card animate-pulse">
          <div className="h-20 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        <div className="stat-card text-center py-8">
          <p className="text-muted-foreground">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start your first workout to see it here!</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <ActivityIcon className="w-5 h-5 text-primary" />
        Recent Activity
      </h2>
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="stat-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-2xl">
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold capitalize">{activity.activity_type}</p>
                  {activity.xp_earned && activity.xp_earned > 0 && (
                    <span className="text-xs text-primary font-semibold">+{activity.xp_earned} XP</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {((Number(activity.distance) || 0) / 1000).toFixed(2)}km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(activity.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {Math.round(Number(activity.calories) || 0)} cal
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(activity.started_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
