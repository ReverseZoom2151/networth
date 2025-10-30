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
}

export default function ActiveStreaksWidget({ userId, settings }: { userId: string; settings: any }) {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreaks();
  }, [userId]);

  const fetchStreaks = async () => {
    try {
      const response = await fetch(`/api/streaks?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const maxDisplay = settings?.maxDisplay || 3;
        setStreaks(data.slice(0, maxDisplay));
      }
    } catch (error) {
      console.error('Failed to fetch streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Active Streaks</p>
          <h3 className="text-xl font-bold">{streaks.length} Active</h3>
        </div>
        <span className="text-3xl">🔥</span>
      </div>

      {streaks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No active streaks</p>
          <p className="text-xs text-gray-400 mt-1">Start building healthy habits!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {streaks.map((streak) => (
            <div key={streak.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{streak.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{streak.description}</p>
                <p className="text-xs text-gray-500">
                  {streak.currentCount} {streak.currentCount === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{streak.currentCount}</p>
                {streak.currentCount < streak.bestCount && (
                  <p className="text-xs text-gray-400">Best: {streak.bestCount}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => (window.location.href = '/dashboard/streaks')}
        className="w-full mt-4 text-sm text-center text-blue-600 hover:text-blue-700 font-medium"
      >
        View all streaks →
      </button>
    </Card>
  );
}
