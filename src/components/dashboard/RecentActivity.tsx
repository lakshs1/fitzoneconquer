import { useAppStore } from '@/store/appStore';
import { Activity, Clock, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const { activities } = useAppStore();
  const recentActivities = activities.slice(0, 3);

  if (recentActivities.length === 0) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        <div className="stat-card text-center py-8">
          <p className="text-muted-foreground">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start your first workout!</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Recent Activity
      </h2>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="stat-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold capitalize">{activity.type}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.startedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-primary">
                {(activity.distance / 1000).toFixed(1)} km
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{Math.round(activity.duration / 60)} min</span>
                <Flame className="w-3 h-3 text-destructive" />
                <span>{activity.calories}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
