'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface Subscription {
  merchant: string;
  amount: number;
  frequency: string;
  category: string;
  timesCharged: number;
  lastCharge: Date;
  estimatedAnnualCost: number;
}

interface SubscriptionsData {
  subscriptions: Subscription[];
  summary: {
    totalSubscriptions: number;
    monthlySubscriptions: number;
    totalMonthlySubscriptionCost: number;
    estimatedAnnualCost: number;
  };
}

interface SubscriptionsWidgetProps {
  userId: string;
}

export function SubscriptionsWidget({ userId }: SubscriptionsWidgetProps) {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, [userId]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/banking/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (!result.message) {
          setData(result);
        }
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return '📅';
      case 'weekly':
        return '📆';
      case 'quarterly':
        return '🗓️';
      case 'yearly':
        return '📊';
      default:
        return '🔄';
    }
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

  if (!data || data.subscriptions.length === 0) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="text-center py-8">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-gray-600 mb-2">No recurring charges detected yet</p>
            <p className="text-sm text-gray-500">
              Sync more transaction history to detect subscriptions
            </p>
          </div>
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
              <h3 className="text-lg font-semibold text-gray-900">
                💳 Subscriptions & Recurring Charges
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {data.summary.totalSubscriptions} active subscriptions detected
              </p>
            </div>
            <Button onClick={loadSubscriptions} variant="ghost" size="sm">
              🔄 Refresh
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Monthly Total</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {formatCurrency(data.summary.totalMonthlySubscriptionCost)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {data.summary.monthlySubscriptions} monthly subscriptions
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-600 font-medium">Estimated Annual Cost</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {formatCurrency(data.summary.estimatedAnnualCost)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                All frequencies included
              </p>
            </div>
          </div>

          {/* Subscription List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Active Subscriptions</h4>
            <div className="space-y-3">
              {data.subscriptions
                .sort((a, b) => b.estimatedAnnualCost - a.estimatedAnnualCost)
                .map((sub, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getFrequencyIcon(sub.frequency)}</span>
                          <span className="font-medium text-gray-900">{sub.merchant}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className="flex items-center">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                            {sub.category}
                          </span>
                          <span>•</span>
                          <span>{sub.frequency}</span>
                          <span>•</span>
                          <span>Last charge: {formatDate(sub.lastCharge)}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(sub.amount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(sub.estimatedAnnualCost)}/year
                        </p>
                      </div>
                    </div>

                    {/* Charged count */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Charged {sub.timesCharged} times in last 90 days
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Savings Tip */}
          {data.summary.estimatedAnnualCost > 1000 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-2">💡 Savings Opportunity</p>
              <p className="text-xs text-yellow-800">
                You're spending{' '}
                <span className="font-semibold">
                  {formatCurrency(data.summary.estimatedAnnualCost)}
                </span>{' '}
                per year on subscriptions. Review your subscriptions and cancel ones you don't
                use. Even canceling 2-3 services could save you hundreds of dollars annually.
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
