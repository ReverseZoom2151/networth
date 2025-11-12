'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal } from '@/lib/types';
import { getGoalEmoji, getGoalTitle, formatCurrency, calculateMonthlySavings, calculateProgress, checkNewMilestone, getMilestoneMessage } from '@/lib/utils';
import { useWhop, UserStorage } from '@/app/providers';
import { getFirstSteps } from '@/lib/firstSteps';
import { Navigation } from '@/components/Navigation';
import { Card, CardBody, LoadingScreen } from '@/components/ui';
import { NewsWidget } from '@/components/dashboard/NewsWidget';
import { InterventionsWidget } from '@/components/dashboard/InterventionsWidget';
import { ProductsWidget } from '@/components/dashboard/ProductsWidget';
import { BankingWidget } from '@/components/dashboard/BankingWidget';
import { SpendingInsightsWidget } from '@/components/dashboard/SpendingInsightsWidget';
import { SubscriptionsWidget } from '@/components/dashboard/SubscriptionsWidget';

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
  ];

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 animate-fade-in sm:px-6 lg:px-8">
        {/* Subscribe CTA Banner */}
        {!hasAccess && (
          <div className="relative mb-6 rounded-2xl border border-border/80 bg-surface p-6 text-foreground shadow-soft-lg animate-slide-up">
            <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <span>✨</span> Premium Features
                </div>
                <h3 className="mb-1 text-2xl font-bold">Unlock Your Full Potential</h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited AI coaching and advanced features for just $10/month
                </p>
              </div>
              <button
                onClick={() => router.push('/subscribe')}
                className="w-full rounded-xl bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90 sm:w-auto"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        )}

        {/* Goal Overview Card */}
        <div
          className="mb-6 rounded-2xl border border-border/80 bg-surface p-8 text-foreground shadow-soft-lg animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="mb-2 text-sm text-muted-foreground">Your Goal</p>
              <h1 className="flex items-center space-x-3 text-3xl font-bold sm:text-4xl">
                <span className="text-5xl drop-shadow">{getGoalEmoji(goal.type)}</span>
                <span>{getGoalTitle(goal.type, goal.customGoal)}</span>
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <p className="mb-1 text-sm text-muted-foreground">Target</p>
              <p className="text-3xl font-bold sm:text-4xl">
                {formatCurrency(targetAmount, region)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {currentAmount > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span className="text-lg font-bold">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-1000"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Current: {formatCurrency(currentAmount, region)}</span>
                <span>Remaining: {formatCurrency(Math.max(0, targetAmount - currentAmount), region)}</span>
              </div>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Timeframe</p>
              <p className="text-xl font-bold">{goal.timeframe} years</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Monthly Target</p>
              <p className="text-xl font-bold">{formatCurrency(monthlySavings, region)}</p>
            </div>
          </div>

          <button
            onClick={openUpdateModal}
            className="w-full rounded-xl bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90"
          >
            Update Your Progress
          </button>
        </div>

        {/* Daily Tip */}
        <Card hover className="mb-6 bg-surface animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardBody>
            <div className="flex items-start space-x-4">
              <span className="text-3xl flex-shrink-0">💡</span>
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 font-bold text-foreground">Today's Tip</h3>
                <p className="text-muted-foreground">{dailyTip || 'Loading your personalized tip...'}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Banking & Spending Section */}
        <div className="mb-8 space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold text-foreground">💰 Banking & Spending</h2>

          {/* Banking Widget - Full Width */}
          <BankingWidget userId={userId || ''} />

          {/* Spending Insights & Subscriptions - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpendingInsightsWidget userId={userId || ''} />
            <SubscriptionsWidget userId={userId || ''} />
          </div>
        </div>

        {/* Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <NewsWidget userId={userId} />
          <InterventionsWidget userId={userId} />
          <ProductsWidget userId={userId} />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-6">
          <h2 className="mb-3 text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {quickActions.map((action) => (
              <button
                key={action.name}
                onClick={() => router.push(action.href)}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-surface px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm font-semibold leading-tight text-foreground">{action.name}</span>
                </div>
                <span className="text-[11px] leading-snug text-muted-foreground line-clamp-1">{action.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* First Steps */}
        <div className="mb-6 space-y-3 animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <h2 className="text-xl font-bold text-foreground">Your First Steps</h2>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            {getFirstSteps(goal.type, region).map((step) => {
              const isClickable = step.actionable && (
                step.id === 'check-credit-score' ||
                step.id === 'improve-credit-score' ||
                step.id === 'improve-credit-eu'
              );

              const cardContent = (
                <div className="flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-tight text-foreground">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs leading-snug text-muted-foreground line-clamp-2">{step.description}</p>
                </div>
              );

              return isClickable ? (
                <button
                  key={step.id}
                  onClick={() => router.push('/credit-score')}
                  className="h-full w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
                >
                  {cardContent}
                </button>
              ) : (
                <div
                  key={step.id}
                  className="h-full rounded-lg border border-border/60 bg-surface px-3 py-2 shadow-sm"
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
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-foreground mb-2">Update Your Progress</h2>
            <p className="text-muted mb-6">
              How much have you saved toward your goal?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-2">
                Current Savings
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium text-lg">
                  {goal.currency === 'USD' ? '$' : goal.currency === 'GBP' ? '£' : '€'}
                </span>
                <input
                  type="number"
                  value={newSavingsAmount}
                  onChange={(e) => setNewSavingsAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-3 text-lg text-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-muted mb-2">
                Note (Optional)
              </label>
              <input
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="e.g., Added bonus from work"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
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
                className="flex-1 rounded-lg bg-surface-muted px-6 py-3 font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center rounded-lg bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface p-8 text-center shadow-xl">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute top-4 left-4 text-4xl animate-bounce">✨</div>
              <div className="absolute top-8 right-8 text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</div>
              <div className="absolute bottom-8 left-8 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>💫</div>
              <div className="absolute bottom-4 right-4 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>✨</div>
            </div>

            <div className="relative z-10">
              <div className="mb-4 text-7xl animate-pulse">
                {getMilestoneMessage(celebrationMilestone).emoji}
              </div>
              <h2 className="mb-3 text-3xl font-bold text-foreground">
                {getMilestoneMessage(celebrationMilestone).title}
              </h2>
              <p className="mb-6 text-lg text-muted">
                {getMilestoneMessage(celebrationMilestone).message}
              </p>

              <div className="mb-6 rounded-xl bg-surface-muted p-4">
                <p className="mb-1 text-sm font-semibold text-muted">Your Progress</p>
                <p className="text-4xl font-bold text-foreground">{celebrationMilestone}%</p>
              </div>

              <button
                onClick={() => setCelebrationMilestone(null)}
                className="w-full rounded-lg bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90"
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
