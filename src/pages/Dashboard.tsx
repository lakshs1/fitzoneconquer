import { useAppStore, getLevelProgress, getXpToNextLevel } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Flame, Zap, MapPin, Target, TrendingUp, Award } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { XPProgress } from '@/components/dashboard/XPProgress';
import { DailyGoal } from '@/components/dashboard/DailyGoal';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AICoachCard } from '@/components/dashboard/AICoachCard';

export default function Dashboard() {
  const { user, stats } = useAppStore();

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-display font-bold text-glow">
              {user?.name || 'Champion'}
            </h1>
          </div>
          <div className="level-badge animate-pulse-neon">
            LVL {stats.level}
          </div>
        </header>

        {/* XP Progress */}
        <XPProgress 
          xp={stats.xp} 
          level={stats.level}
          progress={getLevelProgress(stats.xp)}
          xpToNext={getXpToNextLevel(stats.xp)}
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
              value={stats.totalCalories.toLocaleString()}
              trend="+120 today"
              color="destructive"
            />
            <StatsCard
              icon={MapPin}
              label="Distance"
              value={`${(stats.totalDistance / 1000).toFixed(1)}km`}
              trend="+2.1km today"
              color="primary"
            />
            <StatsCard
              icon={Target}
              label="Zones Owned"
              value={stats.zonesOwned.toString()}
              trend={`${stats.zonesCaptured} captured`}
              color="success"
            />
            <StatsCard
              icon={Award}
              label="Streak"
              value={`${stats.streak} days`}
              trend="Keep it up!"
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
