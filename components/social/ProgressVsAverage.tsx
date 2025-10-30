'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface ProgressDataPoint {
  month: number;
  userBalance: number;
  averageBalance: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
}

interface ProgressVsAverageProps {
  userId: string;
  goalId?: string;
  months?: number; // Number of months to display
}

export default function ProgressVsAverage({
  userId,
  goalId,
  months = 12
}: ProgressVsAverageProps) {
  const [data, setData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'bars'>('chart');

  useEffect(() => {
    fetchProgressData();
  }, [userId, goalId, months]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ userId, months: months.toString() });
      if (goalId) params.append('goalId', goalId);

      const response = await fetch(`/api/peer-metrics/progress?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch progress data');

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
      setError('Unable to load progress comparison');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const getMaxValue = () => {
    if (data.length === 0) return 0;
    return Math.max(...data.flatMap(d => [d.userBalance, d.percentile90]));
  };

  const calculateHeightPercentage = (value: number) => {
    const max = getMaxValue();
    return max > 0 ? (value / max) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">{error || 'No progress data available'}</p>
      </Card>
    );
  }

  const latestData = data[data.length - 1];
  const isAboveAverage = latestData.userBalance > latestData.averageBalance;
  const percentageDiff = ((latestData.userBalance - latestData.averageBalance) / latestData.averageBalance) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Progress vs. Peers</h3>
            <p className="text-sm text-gray-600">Track your savings against similar goals</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'chart'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === 'bars'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bars
            </button>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className={`p-4 rounded-lg ${
          isAboveAverage ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {isAboveAverage ? (
                  <>You're saving <strong>{Math.abs(percentageDiff).toFixed(0)}% more</strong> than average</>
                ) : (
                  <>You're <strong>{Math.abs(percentageDiff).toFixed(0)}%</strong> behind average</>
                )}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Your balance: {formatCurrency(latestData.userBalance)} |
                Average: {formatCurrency(latestData.averageBalance)}
              </p>
            </div>
            <span className="text-3xl">{isAboveAverage ? '🚀' : '💪'}</span>
          </div>
        </div>

        {/* Chart View */}
        {viewMode === 'chart' && (
          <div className="relative h-64 bg-gradient-to-t from-gray-50 to-white rounded-lg p-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>{formatCurrency(getMaxValue())}</span>
              <span>{formatCurrency(getMaxValue() * 0.75)}</span>
              <span>{formatCurrency(getMaxValue() * 0.5)}</span>
              <span>{formatCurrency(getMaxValue() * 0.25)}</span>
              <span>$0</span>
            </div>

            {/* Grid lines */}
            <div className="absolute left-12 right-0 top-0 bottom-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-gray-200"></div>
              ))}
            </div>

            {/* Chart area */}
            <div className="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-around">
              {data.map((point, index) => {
                const userHeight = calculateHeightPercentage(point.userBalance);
                const avgHeight = calculateHeightPercentage(point.averageBalance);
                const p90Height = calculateHeightPercentage(point.percentile90);

                return (
                  <div key={index} className="flex-1 relative h-full flex items-end justify-center px-0.5">
                    {/* Percentile 90 area (light background) */}
                    <div
                      className="absolute bottom-0 w-full bg-gray-100 rounded-t opacity-30"
                      style={{ height: `${p90Height}%` }}
                    ></div>

                    {/* Average line */}
                    <div
                      className="absolute bottom-0 w-full border-t-2 border-dashed border-blue-400"
                      style={{ bottom: `${avgHeight}%` }}
                    ></div>

                    {/* User progress bar */}
                    <div
                      className={`w-3 rounded-t transition-all ${
                        point.userBalance > point.averageBalance
                          ? 'bg-green-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ height: `${userHeight}%`, minHeight: '2px' }}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="absolute left-12 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-gray-500">
              {data.map((point, index) => (
                <span key={index} className="flex-1 text-center">
                  {index === 0 || index === data.length - 1 ? `M${point.month}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bars View */}
        {viewMode === 'bars' && (
          <div className="space-y-6">
            {data.slice(-6).map((point, index) => {
              const userPercentage = calculateHeightPercentage(point.userBalance);
              const avgPercentage = calculateHeightPercentage(point.averageBalance);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Month {point.month}</span>
                    <span className="font-medium">
                      You: {formatCurrency(point.userBalance)} | Avg: {formatCurrency(point.averageBalance)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* User bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">You</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${userPercentage}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium text-white">
                          {formatCurrency(point.userBalance)}
                        </span>
                      </div>
                    </div>
                    {/* Average bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-12">Avg</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${avgPercentage}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium text-white">
                          {formatCurrency(point.averageBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600">Your Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-dashed border-blue-400 rounded"></div>
            <span className="text-gray-600">Peer Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span className="text-gray-600">Top 10% Range</span>
          </div>
        </div>

        {/* Insight */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            {isAboveAverage ? (
              <>
                <strong className="text-green-600">Great work!</strong> You're outpacing the average saver
                in your cohort. Keep up the momentum to reach your goal faster.
              </>
            ) : (
              <>
                <strong className="text-blue-600">Stay focused!</strong> Small consistent increases
                can help you catch up to the average. Consider increasing your monthly deposit by 10%.
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
