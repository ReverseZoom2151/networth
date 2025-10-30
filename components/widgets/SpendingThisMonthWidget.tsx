'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface SpendingData {
  spent: number;
  budget: number;
  percentage: number;
  topCategories: Array<{ name: string; amount: number; color: string }>;
}

export default function SpendingThisMonthWidget({ userId, settings }: { userId: string; settings: any }) {
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpending();
  }, [userId]);

  const fetchSpending = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate data for now
      setData({
        spent: 845.30,
        budget: 1200.00,
        percentage: 70.4,
        topCategories: [
          { name: 'Groceries', amount: 320.50, color: 'bg-blue-500' },
          { name: 'Transport', amount: 185.00, color: 'bg-green-500' },
          { name: 'Entertainment', amount: 150.80, color: 'bg-purple-500' },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch spending:', error);
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

  const getStatusColor = () => {
    if (data.percentage < 70) return 'text-green-600';
    if (data.percentage < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (data.percentage < 70) return 'bg-green-500';
    if (data.percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Spending This Month</p>
          <h3 className="text-2xl font-bold">£{data.spent.toFixed(2)}</h3>
          <p className="text-sm text-gray-500">of £{data.budget.toFixed(2)} budget</p>
        </div>
        <span className="text-3xl">📊</span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(data.percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={`font-medium ${getStatusColor()}`}>
            {data.percentage.toFixed(1)}% used
          </span>
          <span className="text-gray-500">
            £{(data.budget - data.spent).toFixed(2)} remaining
          </span>
        </div>
      </div>

      {settings?.showBreakdown && (
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-gray-600 mb-3">Top Categories</p>
          <div className="space-y-2">
            {data.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${category.color}`} />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </div>
                <span className="text-sm font-medium">£{category.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
