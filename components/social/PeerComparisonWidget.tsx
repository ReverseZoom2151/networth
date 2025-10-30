'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface PeerMetric {
  id: string;
  goalType: string;
  region: string;
  timeframe: number;
  averageSavings: number;
  medianSavings: number;
  averageProgress: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  userCount: number;
  averageMonthlyDeposit: number;
  averageTimeToGoal: number | null;
  successRate: number | null;
}

interface UserComparison {
  userSavings: number;
  userProgress: number;
  userPercentile: number;
  peerMetric: PeerMetric;
  performanceTier: 'top_10' | 'top_25' | 'above_average' | 'average' | 'below_average';
  message: string;
}

interface PeerComparisonWidgetProps {
  userId: string;
  goalId?: string;
}

export default function PeerComparisonWidget({ userId, goalId }: PeerComparisonWidgetProps) {
  const [comparison, setComparison] = useState<UserComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, [userId, goalId]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ userId });
      if (goalId) params.append('goalId', goalId);

      const response = await fetch(`/api/peer-metrics?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch peer comparison');

      const data = await response.json();
      setComparison(data);
    } catch (err) {
      console.error('Failed to fetch peer comparison:', err);
      setError('Unable to load peer comparison');
    } finally {
      setLoading(false);
    }
  };

  const getPercentilePosition = (percentile: number) => {
    if (percentile >= 90) return { color: 'text-green-600', label: 'Top 10%', icon: '🏆' };
    if (percentile >= 75) return { color: 'text-blue-600', label: 'Top 25%', icon: '⭐' };
    if (percentile >= 50) return { color: 'text-indigo-600', label: 'Above Average', icon: '📈' };
    if (percentile >= 25) return { color: 'text-gray-600', label: 'Average', icon: '➡️' };
    return { color: 'text-orange-600', label: 'Keep Going!', icon: '💪' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error || !comparison) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{error || 'No peer data available'}</p>
      </Card>
    );
  }

  const { userSavings, userProgress, userPercentile, peerMetric, message } = comparison;
  const position = getPercentilePosition(userPercentile);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Peer Comparison</h3>
            <p className="text-sm text-gray-600">
              Compare your progress with {peerMetric.userCount.toLocaleString()} similar savers
            </p>
          </div>
          <span className="text-4xl">{position.icon}</span>
        </div>

        {/* Percentile Badge */}
        <div className="text-center py-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Your Ranking</p>
          <p className={`text-3xl font-bold ${position.color}`}>{position.label}</p>
          <p className="text-xs text-gray-500 mt-1">
            You're doing better than {Math.round(userPercentile)}% of savers
          </p>
        </div>

        {/* Progress Comparison */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Your Progress</span>
            <span className="font-semibold">{userProgress.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Average Progress</span>
            <span className="font-medium text-gray-600">{peerMetric.averageProgress.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Your Savings</span>
            <span className="font-semibold">{formatCurrency(userSavings)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Average Savings</span>
            <span className="font-medium text-gray-600">{formatCurrency(peerMetric.averageSavings)}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="text-xs text-gray-600 font-medium">Progress Distribution</div>
          <div className="relative h-8 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 to-emerald-300 rounded-full">
            {/* Markers for percentiles */}
            <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gray-400"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400"></div>
            <div className="absolute top-0 left-3/4 w-0.5 h-full bg-gray-400"></div>

            {/* User position marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow-lg"
              style={{ left: `${userPercentile}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-purple-600">
                You
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Personalized Message */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">{message}</p>
        </div>

        {/* Additional Stats */}
        {peerMetric.successRate !== null && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-600">Success Rate</p>
              <p className="text-lg font-bold text-green-600">
                {(peerMetric.successRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-600">Avg. Monthly Deposit</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(peerMetric.averageMonthlyDeposit)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
