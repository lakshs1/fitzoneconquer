import { useAuth } from '@/contexts/AuthContext';
import { useUserStats, getLevelProgress, getXpToNextLevel, getDefaultStats } from '@/hooks/useUserData';
import { Flame, MapPin, Target, TrendingUp, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { XPProgress } from '@/components/dashboard/XPProgress';
import { DailyGoal } from '@/components/dashboard/DailyGoal';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AICoachCard } from '@/components/dashboard/AICoachCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats: userStats, loading } = useUserStats();
  
  const stats = userStats || getDefaultStats();

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-display font-bold text-glow">
              {profile?.name || 'Champion'}
            </h1>
          </div>
          <div className="level-badge animate-pulse-neon">
            LVL {stats.level || 1}
          </div>
        </header>

        {/* XP Progress */}
        <XPProgress 
          xp={stats.xp || 0} 
          level={stats.level || 1}
          progress={getLevelProgress(stats.xp || 0)}
          xpToNext={getXpToNextLevel(stats.xp || 0)}
        />

        {/* Daily Goal */}
        <DailyGoal />

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Grid */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatsCard
              icon={Flame}
              label="Calories"
              value={Math.round(Number(stats.total_calories) || 0).toLocaleString()}
              trend={stats.total_activities ? `${stats.total_activities} workouts` : 'Start your first workout!'}
              color="destructive"
            />
            <StatsCard
              icon={MapPin}
              label="Distance"
              value={`${((Number(stats.total_distance) || 0) / 1000).toFixed(1)}km`}
              trend={stats.total_distance ? 'Total distance' : 'Get moving!'}
              color="primary"
            />
            <StatsCard
              icon={Target}
              label="Zones Owned"
              value={(stats.zones_owned || 0).toString()}
              trend={stats.zones_captured ? `${stats.zones_captured} captured` : 'Claim your first zone!'}
              color="success"
            />
            <StatsCard
              icon={Award}
              label="Streak"
              value={`${stats.streak || 0} days`}
              trend={stats.streak ? 'Keep it up!' : 'Start your streak!'}
              color="gold"
            />
          </div>
        </section>

        {/* AI Coach */}
        <AICoachCard />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </AppLayout>
  );
}
