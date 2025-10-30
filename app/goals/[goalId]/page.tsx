'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';
import { PeerComparisonWidget, ProgressVsAverage } from '@/components/social';
import { formatCurrency, calculateProgress, calculateMonthlySavings, getGoalEmoji, getGoalTitle } from '@/lib/utils';

interface Goal {
  id: string;
  userId: string;
  type: string;
  customGoal: string | null;
  targetAmount: number;
  currentSavings: number;
  timeframe: number;
  region: string;
  currency: string;
  monthlyBudget: number | null;
  spendingCategories: string[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  percentage: number;
  amount: number;
  reached: boolean;
  projectedDate: string | null;
  actualDate: string | null;
}

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { userId, loading: whopLoading } = useWhop();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMonthly, setCalcMonthly] = useState('');
  const [calcTimeframe, setCalcTimeframe] = useState('');

  const goalId = params?.goalId as string;

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchGoalData();
  }, [userId, whopLoading, goalId]);

  const fetchGoalData = async () => {
    try {
      setLoading(true);

      // For now, fetch user's goal since we only support one goal per user
      const response = await fetch(`/api/goals?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch goal');

      const data = await response.json();
      setGoal(data);

      // Calculate milestones
      const progress = calculateProgress(data.currentSavings, data.targetAmount);
      const monthlyNeeded = calculateMonthlySavings(
        data.targetAmount,
        data.timeframe,
        data.currentSavings
      );

      const milestonePercentages = [25, 50, 75, 100];
      const calculated = milestonePercentages.map((pct) => {
        const amount = (data.targetAmount * pct) / 100;
        const reached = data.currentSavings >= amount;

        let projectedDate = null;
        if (!reached && monthlyNeeded > 0) {
          const remaining = amount - data.currentSavings;
          const monthsNeeded = Math.ceil(remaining / monthlyNeeded);
          const future = new Date();
          future.setMonth(future.getMonth() + monthsNeeded);
          projectedDate = future.toISOString();
        }

        return {
          percentage: pct,
          amount,
          reached,
          projectedDate,
          actualDate: null, // TODO: Get from progress history
        };
      });

      setMilestones(calculated);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!goal) return;

    const monthly = parseFloat(calcMonthly) || goal.monthlyBudget || 0;
    const years = parseFloat(calcTimeframe) || goal.timeframe;

    const remaining = goal.targetAmount - goal.currentSavings;
    const monthsNeeded = years * 12;
    const requiredMonthly = remaining / monthsNeeded;

    alert(`To save $${remaining.toLocaleString()} in ${years} years, you need to save $${requiredMonthly.toFixed(2)} per month.`);
  };

  if (loading || !goal) {
    return <LoadingScreen message="Loading goal details..." />;
  }

  const progress = calculateProgress(goal.currentSavings, goal.targetAmount);
  const monthlyNeeded = calculateMonthlySavings(
    goal.targetAmount,
    goal.timeframe,
    goal.currentSavings
  );
  const remaining = goal.targetAmount - goal.currentSavings;
  const monthsRemaining = goal.timeframe * 12;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{getGoalEmoji(goal.type)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGoalTitle(goal.type, goal.customGoal)}
                </h1>
                <p className="text-gray-600 mt-1">
                  Target: {formatCurrency(goal.targetAmount, goal.region as any)} in {goal.timeframe} years
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
            >
              Update Progress
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card className="p-6 animate-slide-up">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Overview</h2>

              <div className="space-y-6">
                {/* Main Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      {progress > 10 && (
                        <span className="text-xs font-bold text-white">{progress}%</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Saved</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(goal.currentSavings, goal.region as any)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Remaining</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(remaining, goal.region as any)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Monthly Need</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(monthlyNeeded, goal.region as any)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Months Left</p>
                    <p className="text-lg font-bold text-purple-600">{monthsRemaining}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Milestones Timeline */}
            <Card className="p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Milestones</h2>

              <div className="space-y-4">
                {milestones.map((milestone, index) => {
                  const isNext = !milestone.reached && (index === 0 || milestones[index - 1].reached);

                  return (
                    <div
                      key={milestone.percentage}
                      className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                        milestone.reached
                          ? 'bg-green-50 border border-green-200'
                          : isNext
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          milestone.reached
                            ? 'bg-green-500'
                            : isNext
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        {milestone.reached ? '✅' : isNext ? '🎯' : '⭕'}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900">
                            {milestone.percentage}% Milestone
                          </h3>
                          {milestone.reached && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                          {isNext && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              Next Goal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {formatCurrency(milestone.amount, goal.region as any)}
                        </p>
                        {milestone.projectedDate && !milestone.reached && (
                          <p className="text-xs text-gray-600">
                            Projected: {new Date(milestone.projectedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* What-If Calculator */}
            <Card className="p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">What-If Calculator</h2>
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showCalculator ? 'Hide' : 'Show'} Calculator
                </button>
              </div>

              {showCalculator && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Adjust your monthly savings or timeframe to see how it affects your goal
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Savings
                      </label>
                      <input
                        type="number"
                        value={calcMonthly}
                        onChange={(e) => setCalcMonthly(e.target.value)}
                        placeholder={monthlyNeeded.toFixed(2)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeframe (years)
                      </label>
                      <input
                        type="number"
                        value={calcTimeframe}
                        onChange={(e) => setCalcTimeframe(e.target.value)}
                        placeholder={goal.timeframe.toString()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCalculate}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Calculate
                  </button>
                </div>
              )}
            </Card>

            {/* Progress vs Average */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <ProgressVsAverage userId={userId!} goalId={goalId} months={12} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Peer Comparison */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <PeerComparisonWidget userId={userId!} goalId={goalId} />
            </div>

            {/* Quick Tips */}
            <Card className="p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold text-gray-900 mb-3">💡 Tips to Accelerate</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Automate your savings on payday</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Round up purchases to nearest $5</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Save windfalls (tax refunds, bonuses)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">•</span>
                  <span>Review and cut one subscription</span>
                </li>
              </ul>
            </Card>

            {/* CTA Card */}
            <Card className="p-6 bg-black text-white animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-300 mb-4">
                Get personalized advice from our AI coach
              </p>
              <button
                onClick={() => router.push('/coach')}
                className="w-full bg-white text-black font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Ask AI Coach
              </button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
