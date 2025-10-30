'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface Streak {
  id: string;
  type: string;
  description: string;
  icon: string;
  currentCount: number;
  bestCount: number;
  targetCount: number;
  lastActivityDate: string;
  isActive: boolean;
}

interface StreakWithProgress extends Streak {
  progressPercentage: number;
  isOnTrack: boolean;
  daysUntilBreak: number;
}

export default function Streaks({ userId }: { userId: string }) {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreaks();
  }, []);

  const fetchStreaks = async () => {
    try {
      const response = await fetch(`/api/streaks?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStreaks(data);
      }
    } catch (error) {
      console.error('Failed to fetch streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const isOnTrack = (lastActivityDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = new Date(lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDiff <= 1;
  };

  const getStreakStatus = (streak: Streak) => {
    const onTrack = isOnTrack(streak.lastActivityDate);
    if (!onTrack) {
      return { color: 'text-red-500', label: 'At Risk', bgColor: 'bg-red-50' };
    }
    if (streak.currentCount >= streak.targetCount) {
      return { color: 'text-green-600', label: 'Goal Reached!', bgColor: 'bg-green-50' };
    }
    if (streak.currentCount >= streak.targetCount * 0.8) {
      return { color: 'text-blue-600', label: 'Almost There!', bgColor: 'bg-blue-50' };
    }
    return { color: 'text-gray-600', label: 'In Progress', bgColor: 'bg-gray-50' };
  };

  const getMilestoneMessage = (count: number) => {
    if (count >= 100) return '👑 Legendary!';
    if (count >= 30) return '🏆 Champion!';
    if (count >= 21) return '💪 Power User!';
    if (count >= 7) return '🎉 One Week!';
    if (count >= 3) return '🔥 Hot Streak!';
    return '✨ Getting Started';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading your streaks...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Your Streaks</h2>
        <p className="text-gray-600">Build healthy financial habits through consistency</p>
      </div>

      {streaks.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🔥</div>
          <p className="text-gray-500 mb-2">No active streaks yet</p>
          <p className="text-sm text-gray-400">
            Start building healthy financial habits and watch your streaks grow!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Active Streaks</p>
                <p className="text-3xl font-bold">{streaks.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Streak</p>
                <p className="text-3xl font-bold">
                  {Math.max(...streaks.map((s) => s.bestCount))}
                  <span className="text-lg ml-1">days</span>
                </p>
              </div>
              <div className="text-6xl">🔥</div>
            </div>
          </Card>

          {/* Individual Streak Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {streaks.map((streak) => {
              const percentage = getProgressPercentage(streak.currentCount, streak.targetCount);
              const status = getStreakStatus(streak);
              const milestone = getMilestoneMessage(streak.currentCount);

              return (
                <Card key={streak.id} className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{streak.icon}</span>
                        <div>
                          <h3 className="font-semibold">{streak.description}</h3>
                          <p className="text-xs text-gray-500 capitalize">
                            {streak.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Current Streak */}
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Current Streak</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold">{streak.currentCount}</span>
                        <span className="text-xl text-gray-500">days</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{milestone}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress to goal</span>
                        <span className="font-medium">{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>{streak.targetCount} days</span>
                      </div>
                    </div>

                    {/* Best Streak */}
                    {streak.bestCount > streak.currentCount && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">🏆 Personal Best</span>
                          <span className="font-medium">{streak.bestCount} days</span>
                        </div>
                      </div>
                    )}

                    {/* Warning if at risk */}
                    {!isOnTrack(streak.lastActivityDate) && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-red-600">
                          ⚠️ Act today to keep your streak alive!
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips Card */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Consistency is key! Check in daily to maintain your streaks
          and build lasting financial habits. Reach milestone days (7, 30, 100) for special
          rewards!
        </p>
      </Card>
    </div>
  );
}
