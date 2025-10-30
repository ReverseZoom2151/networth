'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

interface UserGoal {
  id: string;
  type: string;
  targetAmount: number;
  currentSavings: number;
  timeframe: number;
  region: string;
  createdAt: string;
  targetDate: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getGoalEmoji = (type: string): string => {
  const emojiMap: { [key: string]: string } = {
    house: '🏠',
    car: '🚗',
    vacation: '✈️',
    emergency_fund: '🛡️',
    wedding: '💒',
    education: '📚',
    business: '💼',
    retirement: '🌴',
    debt_payoff: '💳',
    other: '🎯',
  };
  return emojiMap[type] || '🎯';
};

const getGoalColor = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    house: 'from-purple-50 to-purple-100 border-purple-300',
    car: 'from-blue-50 to-blue-100 border-blue-300',
    vacation: 'from-orange-50 to-orange-100 border-orange-300',
    emergency_fund: 'from-green-50 to-green-100 border-green-300',
    wedding: 'from-pink-50 to-pink-100 border-pink-300',
    education: 'from-indigo-50 to-indigo-100 border-indigo-300',
    business: 'from-yellow-50 to-yellow-100 border-yellow-300',
    retirement: 'from-teal-50 to-teal-100 border-teal-300',
    debt_payoff: 'from-red-50 to-red-100 border-red-300',
    other: 'from-gray-50 to-gray-100 border-gray-300',
  };
  return colorMap[type] || 'from-gray-50 to-gray-100 border-gray-300';
};

export default function GoalsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchGoal();
  }, [userId, whopLoading]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/goal?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGoal(data);
      }
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your goals..." />;
  }

  const hasGoal = goal && goal.targetAmount > 0;
  const progressPercentage = hasGoal ? (goal.currentSavings / goal.targetAmount) * 100 : 0;
  const remaining = hasGoal ? goal.targetAmount - goal.currentSavings : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Financial Goals</h1>
          <p className="text-lg text-gray-600">
            Track your progress and stay motivated on your financial journey
          </p>
        </div>

        {!hasGoal ? (
          /* No Goal State */
          <div className="max-w-2xl mx-auto">
            <Card className="p-12 text-center">
              <div className="text-7xl mb-6">🚀</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Setting a clear financial goal is the first step to building wealth. Let's define what
                you're saving for and create a plan to get there.
              </p>
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors mb-6"
              >
                Set Your First Goal →
              </button>
              <div className="text-left max-w-md mx-auto mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Popular goals to get started:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Emergency Fund - 3-6 months of expenses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🏠</span>
                    <span>House Down Payment - 20% down</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>🚗</span>
                    <span>Car Purchase - Buy in cash</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✈️</span>
                    <span>Dream Vacation - Travel fund</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>💳</span>
                    <span>Debt Payoff - Become debt-free</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* Inspiration Section */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">Need inspiration?</p>
              <button
                onClick={() => router.push('/stories')}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Read Success Stories from Others Like You →
              </button>
            </div>
          </div>
        ) : (
          /* Has Goal - Show Goal Card */
          <div className="space-y-6">
            {/* Main Goal Card */}
            <Card
              className={`p-8 bg-gradient-to-br ${getGoalColor(goal.type)} border-2 cursor-pointer hover:shadow-xl transition-all`}
              onClick={() => router.push(`/goals/${goal.id}`)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{getGoalEmoji(goal.type)}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 capitalize">{goal.type.replace('_', ' ')}</h2>
                    <p className="text-gray-600 mt-1">
                      Target: {formatCurrency(goal.targetAmount)} in {goal.timeframe} years
                    </p>
                  </div>
                </div>
                <span className="text-4xl font-bold text-purple-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-500 h-6 rounded-full transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  >
                    {progressPercentage > 10 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round(progressPercentage)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white bg-opacity-60 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Current Savings</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(goal.currentSavings)}</p>
                </div>
                <div className="text-center p-4 bg-white bg-opacity-60 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Target Amount</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(goal.targetAmount)}</p>
                </div>
                <div className="text-center p-4 bg-white bg-opacity-60 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Remaining</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(remaining)}</p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-4 border-t border-white border-opacity-40">
                <span className="text-purple-600 hover:text-purple-700 font-semibold">
                  View Full Details & Analytics →
                </span>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push('/news')}>
                <div className="text-4xl mb-3">📰</div>
                <h3 className="font-bold text-gray-900 mb-2">Financial News</h3>
                <p className="text-sm text-gray-600">
                  See how current events affect your savings
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push('/products')}>
                <div className="text-4xl mb-3">💳</div>
                <h3 className="font-bold text-gray-900 mb-2">Recommended Products</h3>
                <p className="text-sm text-gray-600">
                  Financial tools to help you save faster
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer" onClick={() => router.push('/invest')}>
                <div className="text-4xl mb-3">📈</div>
                <h3 className="font-bold text-gray-900 mb-2">Investment Education</h3>
                <p className="text-sm text-gray-600">
                  Learn to grow your money long-term
                </p>
              </Card>
            </div>

            {/* Motivation Section */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-start gap-4">
                <span className="text-4xl">💪</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Stay Motivated</h3>
                  <p className="text-gray-700 mb-4">
                    You're {Math.round(progressPercentage)}% of the way there! Others with similar goals have
                    succeeded, and so can you.
                  </p>
                  <button
                    onClick={() => router.push('/stories')}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    Read Success Stories →
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
