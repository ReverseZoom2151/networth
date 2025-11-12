'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface SpendingData {
  period: string;
  summary: {
    totalSpent: number;
    totalIncome: number;
    netCashFlow: number;
    transactionCount: number;
    averageDailySpending: number;
    projectedMonthlySpending: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: number;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    date: Date;
    description: string;
    amount: number;
    category: string;
  }>;
}

interface SpendingInsightsWidgetProps {
  userId: string;
}

export function SpendingInsightsWidget({ userId }: SpendingInsightsWidgetProps) {
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const scrollToConnect = () => {
    const target = document.getElementById('connect-bank-widget');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    loadSpendingData();
  }, [userId, days]);

  const loadSpendingData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/banking/spending-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days }),
      });

      if (response.ok) {
        const data = await response.json();
        setSpendingData(data);
      }
    } catch (error) {
      console.error('Failed to load spending insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!spendingData) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="text-3xl">🔌</div>
          <div className="max-w-sm space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Spending insights are ready <br /> when your bank is</h3>
            <p className="text-sm text-muted-foreground">
              Connect an account to unlock category breakdowns, cash-flow tracking, and personalized nudges.
            </p>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground text-left">
            <li>✓ Automatic transaction categorization</li>
            <li>✓ Spot recurring charges and subscriptions</li>
            <li>✓ Track net cash flow across your accounts</li>
          </ul>
          <Button variant="primary" size="sm" onClick={scrollToConnect}>
            Jump to Connect Accounts
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">📊 Spending Insights</h3>
              <p className="text-sm text-gray-600 mt-1">
                Last {days} days • {spendingData.summary.transactionCount} transactions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setDays(7)}
                variant={days === 7 ? 'primary' : 'secondary'}
                size="sm"
              >
                7d
              </Button>
              <Button
                onClick={() => setDays(30)}
                variant={days === 30 ? 'primary' : 'secondary'}
                size="sm"
              >
                30d
              </Button>
              <Button
                onClick={() => setDays(90)}
                variant={days === 90 ? 'primary' : 'secondary'}
                size="sm"
              >
                90d
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {formatCurrency(spendingData.summary.totalSpent)}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {formatCurrency(spendingData.summary.averageDailySpending)}/day
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {formatCurrency(spendingData.summary.totalIncome)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {spendingData.summary.totalIncome > 0 ? 'Deposits' : 'No income'}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                spendingData.summary.netCashFlow >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  spendingData.summary.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                Net Cash Flow
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  spendingData.summary.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}
              >
                {formatCurrency(spendingData.summary.netCashFlow)}
              </p>
              <p
                className={`text-xs mt-1 ${
                  spendingData.summary.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}
              >
                {spendingData.summary.netCashFlow >= 0 ? '✓ Positive' : '⚠️ Negative'}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Spending by Category</h4>
            <div className="space-y-3">
              {spendingData.categoryBreakdown.slice(0, 5).map((category, index) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)}`}></div>
                      <span className="text-sm text-gray-700">{category.category}</span>
                      <span className="text-xs text-gray-500">
                        ({category.transactionCount} txns)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(category.total)}
                      </span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColor(index)}`}
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">💡 Insights</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • Projected monthly spending:{' '}
                <span className="font-semibold">
                  {formatCurrency(spendingData.summary.projectedMonthlySpending)}
                </span>
              </li>
              {spendingData.categoryBreakdown[0] && (
                <li>
                  • Top spending category:{' '}
                  <span className="font-semibold">{spendingData.categoryBreakdown[0].category}</span>{' '}
                  ({spendingData.categoryBreakdown[0].percentage}%)
                </li>
              )}
              {spendingData.summary.netCashFlow < 0 && (
                <li className="text-orange-700 font-medium">
                  ⚠️ You're spending more than you earn. Consider reviewing your budget.
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
