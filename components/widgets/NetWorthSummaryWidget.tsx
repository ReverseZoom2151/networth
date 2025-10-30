'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface NetWorthData {
  current: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export default function NetWorthSummaryWidget({ userId, settings }: { userId: string; settings: any }) {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetWorth();
  }, [userId]);

  const fetchNetWorth = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate data for now
      setData({
        current: 15420.50,
        change: 1250.75,
        changePercentage: 8.8,
        trend: 'up',
      });
    } catch (error) {
      console.error('Failed to fetch net worth:', error);
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

  if (!data) return null;

  return (
    <Card className="p-6 h-full bg-gradient-to-br from-green-50 to-blue-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Net Worth</p>
          <h3 className="text-3xl font-bold">£{data.current.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</h3>
        </div>
        <span className="text-3xl">💰</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${data.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {data.trend === 'up' ? '↑' : '↓'} £{Math.abs(data.change).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </span>
        <span className={`text-sm ${data.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          ({data.changePercentage > 0 ? '+' : ''}{data.changePercentage}%)
        </span>
        <span className="text-xs text-gray-500">this month</span>
      </div>

      {settings?.showChart && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-end justify-between h-20">
            {[65, 70, 68, 75, 85, 90, 100].map((height, i) => (
              <div key={i} className="flex-1 mx-0.5">
                <div
                  className="bg-gradient-to-t from-green-400 to-green-200 rounded-t"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Last 6 months trend</p>
        </div>
      )}
    </Card>
  );
}
