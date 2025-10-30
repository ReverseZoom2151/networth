'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

interface Achievement {
  id: string;
  userId: string;
  userName?: string; // Optional for anonymous sharing
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  value: number | null;
  isShared: boolean;
  sharedAt: string;
  earnedAt: string;
  milestone?: string;
  isAnonymous: boolean;
}

interface AchievementFeedProps {
  userId?: string; // Optional: if provided, can highlight user's own achievements
  limit?: number;
  showShareButton?: boolean;
}

export default function AchievementFeed({
  userId,
  limit = 10,
  showShareButton = false
}: AchievementFeedProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, [limit]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: limit.toString() });
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/achievements/feed?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch achievements');

      const data = await response.json();
      setAchievements(data);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
      setError('Unable to load achievement feed');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (achievementId: string) => {
    try {
      const response = await fetch('/api/achievements/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId, userId }),
      });

      if (response.ok) {
        // Refresh feed
        fetchAchievements();
      }
    } catch (err) {
      console.error('Failed to share achievement:', err);
    }
  };

  const getAchievementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      streak_milestone: 'Streak Milestone',
      savings_goal: 'Savings Goal',
      debt_paid: 'Debt Payoff',
      first_investment: 'First Investment',
      budget_master: 'Budget Master',
    };
    return labels[type] || type;
  };

  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
          <p className="text-sm text-gray-600">Celebrate success with the community</p>
        </div>
        <span className="text-2xl">🎉</span>
      </div>

      {achievements.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-500">No achievements shared yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Be the first to share your financial wins!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`p-4 transition-all hover:shadow-md ${
                achievement.userId === userId ? 'ring-2 ring-purple-200 bg-purple-50' : ''
              }`}
              style={{ borderLeftWidth: '4px', borderLeftColor: achievement.color }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  {achievement.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">
                          {achievement.isAnonymous ? 'Someone' : achievement.userName || 'A saver'}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {getAchievementTypeLabel(achievement.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{achievement.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
                    </div>

                    {/* Share button for user's own unshared achievements */}
                    {showShareButton &&
                     achievement.userId === userId &&
                     !achievement.isShared && (
                      <button
                        onClick={() => handleShare(achievement.id)}
                        className="text-xs px-3 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors whitespace-nowrap"
                      >
                        Share
                      </button>
                    )}
                  </div>

                  {/* Value display (if applicable) */}
                  {achievement.value !== null && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-sm font-medium">
                      {achievement.type === 'streak_milestone' && (
                        <>
                          <span className="text-orange-600">{achievement.value}</span>
                          <span className="text-gray-600">day streak</span>
                        </>
                      )}
                      {(achievement.type === 'savings_goal' || achievement.type === 'debt_paid') && (
                        <>
                          <span className="text-green-600">
                            ${achievement.value.toLocaleString()}
                          </span>
                          <span className="text-gray-600">milestone</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatRelativeTime(achievement.sharedAt || achievement.earnedAt)}</span>
                    {achievement.milestone && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 font-medium">{achievement.milestone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Reactions placeholder (future feature) */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                <button className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1">
                  <span>👏</span>
                  <span>Celebrate</span>
                </button>
                <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <span>💪</span>
                  <span>Inspire</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load more button */}
      {achievements.length >= limit && (
        <button
          onClick={fetchAchievements}
          className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Load more achievements
        </button>
      )}
    </div>
  );
}
