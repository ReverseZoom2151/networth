'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';
import { AchievementFeed, PeerComparisonWidget, ProgressVsAverage } from '@/components/social';

interface LeaderboardEntry {
  id: string;
  userName: string;
  rank: number;
  currentStreak: number;
  longestStreak: number;
  totalSavings: number;
  goalsCompleted: number;
  isAnonymous: boolean;
  isCurrentUser: boolean;
}

interface SharingSettings {
  shareStreaks: boolean;
  shareSavings: boolean;
  shareDebtPayoff: boolean;
  shareMilestones: boolean;
  anonymousSharing: boolean;
  allowLeaderboard: boolean;
}

export default function CommunityPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sharingSettings, setSharingSettings] = useState<SharingSettings>({
    shareStreaks: true,
    shareSavings: true,
    shareDebtPayoff: true,
    shareMilestones: true,
    anonymousSharing: false,
    allowLeaderboard: true,
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'compare'>('feed');

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchCommunityData();
  }, [userId, whopLoading]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      // Fetch leaderboard
      const leaderboardResponse = await fetch(`/api/leaderboard?userId=${userId}`);
      if (leaderboardResponse.ok) {
        const data = await leaderboardResponse.json();
        setLeaderboard(data);
      }

      // Fetch user's sharing settings
      const settingsResponse = await fetch(`/api/user/sharing-settings?userId=${userId}`);
      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        if (data) {
          setSharingSettings(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/user/sharing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings: sharingSettings }),
      });

      if (response.ok) {
        setShowSettings(false);
        fetchCommunityData();
      }
    } catch (error) {
      console.error('Failed to save sharing settings:', error);
    }
  };

  if (whopLoading || loading) {
    return <LoadingScreen message="Loading community..." />;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Please log in to view the community.</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community</h1>
              <p className="text-gray-600 mt-1">
                Connect with fellow savers and celebrate financial wins together
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <span>⚙️</span>
              <span>Sharing Settings</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'feed'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎉 Achievement Feed
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'leaderboard'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Compare Progress
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'feed' && (
              <div className="animate-slide-up">
                <AchievementFeed userId={userId} limit={20} showShareButton />
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <Card className="p-6 animate-slide-up">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Top Savers</h2>
                    <span className="text-2xl">🏆</span>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No leaderboard data yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start saving and sharing to appear on the leaderboard!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                            entry.isCurrentUser
                              ? 'bg-purple-50 border-2 border-purple-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-12 text-center">
                            {entry.rank <= 3 ? (
                              <span className="text-3xl">
                                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            ) : (
                              <span className="text-xl font-bold text-gray-500">#{entry.rank}</span>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {entry.isAnonymous
                                  ? 'Anonymous Saver'
                                  : entry.isCurrentUser
                                  ? 'You'
                                  : entry.userName}
                              </p>
                              {entry.isCurrentUser && (
                                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>🔥 {entry.currentStreak} day streak</span>
                              <span>💰 ${entry.totalSavings.toLocaleString()}</span>
                              <span>🎯 {entry.goalsCompleted} goals</span>
                            </div>
                          </div>

                          {/* Best Streak Badge */}
                          {entry.longestStreak >= 30 && (
                            <div className="flex-shrink-0 text-center">
                              <div className="text-xs text-gray-600">Best</div>
                              <div className="text-lg font-bold text-orange-600">
                                {entry.longestStreak}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Opt-in message if not on leaderboard */}
                  {!sharingSettings.allowLeaderboard && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Note:</strong> You're currently not visible on the leaderboard.
                        Update your sharing settings to participate!
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'compare' && (
              <div className="space-y-6 animate-slide-up">
                <ProgressVsAverage userId={userId} months={12} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Peer Comparison Widget (always visible) */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <PeerComparisonWidget userId={userId} />
            </div>

            {/* Community Stats */}
            <Card className="p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Community Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Savers</span>
                    <span className="font-bold text-lg">2,847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Saved</span>
                    <span className="font-bold text-lg text-green-600">$14.2M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Goals Reached</span>
                    <span className="font-bold text-lg text-blue-600">1,423</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Longest Streak</span>
                    <span className="font-bold text-lg text-orange-600">365 🔥</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Motivational Quote */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <span className="text-3xl mb-3 block">💪</span>
                <p className="text-sm italic text-gray-700 mb-2">
                  "Small daily improvements are the key to staggering long-term results."
                </p>
                <p className="text-xs text-gray-500">- Community Wisdom</p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Sharing Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Sharing Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Choose what you'd like to share with the community. Your privacy is important!
            </p>

            <div className="space-y-4 mb-6">
              {/* Achievement Types */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Share Achievements</h3>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Streak Milestones</span>
                  <input
                    type="checkbox"
                    checked={sharingSettings.shareStreaks}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, shareStreaks: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Savings Goals</span>
                  <input
                    type="checkbox"
                    checked={sharingSettings.shareSavings}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, shareSavings: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Debt Payoffs</span>
                  <input
                    type="checkbox"
                    checked={sharingSettings.shareDebtPayoff}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, shareDebtPayoff: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Major Milestones</span>
                  <input
                    type="checkbox"
                    checked={sharingSettings.shareMilestones}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, shareMilestones: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                </label>
              </div>

              {/* Privacy Options */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 text-sm">Privacy Options</h3>

                <label className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <span className="text-sm text-gray-700 font-medium">Anonymous Sharing</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Hide your name when sharing achievements
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sharingSettings.anonymousSharing}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, anonymousSharing: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded flex-shrink-0 mt-0.5"
                  />
                </label>

                <label className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <span className="text-sm text-gray-700 font-medium">Show on Leaderboard</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Appear in community rankings
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sharingSettings.allowLeaderboard}
                    onChange={(e) =>
                      setSharingSettings({ ...sharingSettings, allowLeaderboard: e.target.checked })
                    }
                    className="w-5 h-5 text-purple-600 rounded flex-shrink-0 mt-0.5"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
