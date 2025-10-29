'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal } from '@/lib/types';
import { getGoalEmoji, getGoalTitle, formatCurrency, calculateMonthlySavings, calculateProgress, checkNewMilestone, getMilestoneMessage } from '@/lib/utils';
import { useWhop, UserStorage } from '@/app/providers';
import { getFirstSteps } from '@/lib/firstSteps';
import { Navigation } from '@/components/Navigation';
import { Card, CardBody, Button, LoadingScreen, Input } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { userId, loading: whopLoading, hasAccess } = useWhop();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newSavingsAmount, setNewSavingsAmount] = useState<string>('');
  const [updateNote, setUpdateNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);

  useEffect(() => {
    async function initDashboard() {
      if (whopLoading || !userId) return;

      const onboardingCompleted = await UserStorage.isOnboardingComplete(userId);
      if (!onboardingCompleted) {
        router.push('/onboarding');
        return;
      }

      const storedGoal = await UserStorage.getGoal(userId);
      if (storedGoal) {
        setGoal(storedGoal);
        loadDailyTip(storedGoal);
      }

      setLoading(false);
    }

    initDashboard();
  }, [router, userId, whopLoading]);

  const loadDailyTip = async (userGoal: UserGoal) => {
    try {
      const response = await fetch('/api/daily-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userGoal),
      });

      if (response.ok) {
        const data = await response.json();
        setDailyTip(data.tip);
      }
    } catch (error) {
      console.error('Failed to load daily tip:', error);
      setDailyTip('Start tracking your spending today - saving small amounts consistently leads to big results!');
    }
  };

  const handleUpdateProgress = async () => {
    if (!userId || !goal) return;

    const amount = parseFloat(newSavingsAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSaving(true);

    try {
      const oldAmount = goal.currentSavings || 0;
      const targetAmount = goal.targetAmount || 10000;
      const milestone = checkNewMilestone(oldAmount, amount, targetAmount);

      const updatedGoal: UserGoal = {
        ...goal,
        currentSavings: amount,
      };

      await UserStorage.setGoal(userId, updatedGoal);
      setGoal(updatedGoal);
      setShowUpdateModal(false);
      setNewSavingsAmount('');
      setUpdateNote('');

      if (milestone) {
        setCelebrationMilestone(milestone);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const openUpdateModal = () => {
    setNewSavingsAmount(goal?.currentSavings?.toString() || '0');
    setShowUpdateModal(true);
  };

  if (loading || !goal) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  const region = goal.region || 'US';
  const targetAmount = goal.targetAmount || 10000;
  const currentAmount = goal.currentSavings || 0;
  const progressPercent = calculateProgress(currentAmount, targetAmount);
  const monthlySavings = calculateMonthlySavings(targetAmount, goal.timeframe, currentAmount);

  const quickActions = [
    { name: 'Budget Tracker', icon: '💳', description: 'Track spending across categories', href: '/tools' },
    { name: 'Bill Reminders', icon: '🔔', description: 'Never miss a payment', href: '/tools' },
    { name: 'Debt Payoff', icon: '💸', description: 'Compare payoff strategies', href: '/tools' },
    { name: 'Ask AI Coach', icon: '💬', description: 'Get personalized advice', href: '/coach', premium: true },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Subscribe CTA Banner */}
        {!hasAccess && (
          <div className="relative bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 rounded-2xl p-6 mb-6 text-white overflow-hidden shadow-soft-lg animate-slide-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-medium mb-2">
                  <span>✨</span> Premium Features
                </div>
                <h3 className="text-2xl font-bold mb-1">Unlock Your Full Potential</h3>
                <p className="text-sm text-white/90">
                  Get unlimited AI coaching and advanced features for just $10/month
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push('/subscribe')}
                className="w-full sm:w-auto"
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        )}

        {/* Goal Overview Card */}
        <Card className="relative overflow-hidden mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500" />
          <CardBody className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <p className="text-gray-500 text-sm mb-2 font-medium">Your Goal</p>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center space-x-3 text-gray-900">
                  <span className="text-5xl">{getGoalEmoji(goal.type)}</span>
                  <span>{getGoalTitle(goal.type, goal.customGoal)}</span>
                </h1>
              </div>
              <div className="text-left sm:text-right bg-primary-50 rounded-2xl px-6 py-4">
                <p className="text-primary-700 text-sm mb-1 font-medium">Target Amount</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary-900">
                  {formatCurrency(targetAmount, region)}
                </p>
              </div>
            </div>

          {/* Progress Bar */}
          {currentAmount > 0 && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-lg font-bold text-primary-600">{progressPercent}%</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner-soft">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-success-500 via-primary-500 to-secondary-500 rounded-full transition-all duration-1000 shadow-glow"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-xl p-3 shadow-soft">
                  <p className="text-xs text-gray-500 mb-1">Current</p>
                  <p className="text-base font-bold text-success-600">{formatCurrency(currentAmount, region)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-soft">
                  <p className="text-xs text-gray-500 mb-1">Remaining</p>
                  <p className="text-base font-bold text-gray-700">{formatCurrency(Math.max(0, targetAmount - currentAmount), region)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary-50 rounded-xl p-4">
              <p className="text-secondary-700 text-sm mb-1 font-medium">Timeframe</p>
              <p className="text-2xl font-bold text-secondary-900">{goal.timeframe} years</p>
            </div>
            <div className="bg-success-50 rounded-xl p-4">
              <p className="text-success-700 text-sm mb-1 font-medium">Monthly Target</p>
              <p className="text-2xl font-bold text-success-900">{formatCurrency(monthlySavings, region)}</p>
            </div>
          </div>

          <Button
            onClick={openUpdateModal}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Update Your Progress
          </Button>
          </CardBody>
        </Card>

        {/* Daily Tip */}
        <Card hover className="mb-6 animate-slide-up bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200" style={{animationDelay: '0.2s'}}>
          <CardBody>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-warning-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                💡
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Today's Tip</h3>
                <p className="text-gray-700 leading-relaxed">{dailyTip || 'Loading your personalized tip...'}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={action.name}
                hover
                className="cursor-pointer animate-scale-in"
                style={{animationDelay: `${0.3 + index * 0.1}s`}}
                onClick={() => {
                  if (action.premium && !hasAccess) {
                    router.push('/subscribe');
                  } else {
                    router.push(action.href);
                  }
                }}
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{action.icon}</div>
                    {action.premium && !hasAccess && (
                      <span className="text-xs bg-gradient-to-r from-warning-500 to-warning-600 text-white px-2.5 py-1 rounded-full font-semibold shadow">
                        PRO
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-primary-600 transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* First Steps */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your First Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFirstSteps(goal.type, region).map((step) => {
              const isClickable = step.actionable && (
                step.id === 'check-credit-score' ||
                step.id === 'improve-credit-score' ||
                step.id === 'improve-credit-eu'
              );

              const cardContent = (
                <div className="flex items-start space-x-3">
                  <span className="text-3xl flex-shrink-0">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center flex-wrap gap-2">
                      <span>{step.title}</span>
                      {step.actionable && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Learn More
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              );

              return isClickable ? (
                <button
                  key={step.id}
                  onClick={() => router.push('/credit-score')}
                  className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left w-full"
                >
                  {cardContent}
                </button>
              ) : (
                <div
                  key={step.id}
                  className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Update Progress Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Your Progress</h2>
            <p className="text-gray-600 mb-6">
              How much have you saved toward your goal?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Savings
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">
                  {goal.currency === 'USD' ? '$' : goal.currency === 'GBP' ? '£' : '€'}
                </span>
                <input
                  type="number"
                  value={newSavingsAmount}
                  onChange={(e) => setNewSavingsAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <input
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="e.g., Added bonus from work"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setNewSavingsAmount('');
                  setUpdateNote('');
                }}
                disabled={isSaving}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={isSaving}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Progress'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {celebrationMilestone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute top-4 left-4 text-4xl animate-bounce">✨</div>
              <div className="absolute top-8 right-8 text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</div>
              <div className="absolute bottom-8 left-8 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>💫</div>
              <div className="absolute bottom-4 right-4 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>✨</div>
            </div>

            <div className="relative z-10">
              <div className="text-7xl mb-4 animate-pulse">
                {getMilestoneMessage(celebrationMilestone).emoji}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {getMilestoneMessage(celebrationMilestone).title}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {getMilestoneMessage(celebrationMilestone).message}
              </p>

              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-1">Your Progress</p>
                <p className="text-4xl font-bold text-primary-600">{celebrationMilestone}%</p>
              </div>

              <button
                onClick={() => setCelebrationMilestone(null)}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continue Your Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
