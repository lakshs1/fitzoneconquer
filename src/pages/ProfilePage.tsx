import { User, Settings, Trophy, Target, LogOut, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore, getLevelProgress } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, stats, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const achievements = [
    { name: 'First Zone', description: 'Capture your first territory', completed: stats.zonesCaptured > 0 },
    { name: 'Marathon Runner', description: 'Run 42km total', completed: stats.totalDistance >= 42000 },
    { name: 'Zone Lord', description: 'Own 5 zones at once', completed: stats.zonesOwned >= 5 },
    { name: 'Streak Master', description: 'Maintain a 7-day streak', completed: stats.streak >= 7 },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-3xl font-display font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold">{user?.name || 'Champion'}</h1>
              <p className="text-sm text-muted-foreground">{user?.email || 'demo@fitzone.app'}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="level-badge">LVL {stats.level}</div>
                <span className="text-xs text-muted-foreground">
                  {stats.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Level {stats.level}</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-xp rounded-full xp-bar-glow"
                style={{ width: `${getLevelProgress(stats.xp)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <section className="grid grid-cols-2 gap-3">
          <div className="stat-card text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{stats.totalActivities}</p>
            <p className="text-xs text-muted-foreground">Total Workouts</p>
          </div>
          <div className="stat-card text-center">
            <Trophy className="w-6 h-6 text-xp mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{stats.zonesCaptured}</p>
            <p className="text-xs text-muted-foreground">Zones Captured</p>
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-xp" />
            Achievements
          </h2>
          <div className="space-y-2">
            {achievements.map(achievement => (
              <div 
                key={achievement.name}
                className={`stat-card flex items-center gap-3 ${achievement.completed ? 'border-xp/30' : 'opacity-60'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${achievement.completed ? 'bg-xp/20' : 'bg-muted'}`}>
                  <Trophy className={`w-5 h-5 ${achievement.completed ? 'text-xp' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                {achievement.completed && (
                  <span className="text-xs text-xp font-semibold">✓</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Settings Menu */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </h2>
          <div className="space-y-2">
            <button className="stat-card w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span>Edit Profile</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="stat-card w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-muted-foreground" />
                <span>Fitness Goals</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="stat-card w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span>App Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </AppLayout>
  );
}
