'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal } from '@/lib/types';
import { useWhop, UserStorage } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { BudgetTracker } from '@/components/BudgetTracker';
import { BillReminders } from '@/components/BillReminders';
import { NetWorthDashboard } from '@/components/NetWorthDashboard';
import { DebtPayoffCalculator } from '@/components/DebtPayoffCalculator';
import { GoalTemplates } from '@/components/GoalTemplates';
import { SavingsCalculator } from '@/components/SavingsCalculator';

export default function ToolsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initTools() {
      if (whopLoading || !userId) return;

      const onboardingCompleted = await UserStorage.isOnboardingComplete(userId);
      if (!onboardingCompleted) {
        router.push('/onboarding');
        return;
      }

      const storedGoal = await UserStorage.getGoal(userId);
      if (storedGoal) {
        setGoal(storedGoal);
      }

      setLoading(false);
    }

    initTools();
  }, [router, userId, whopLoading]);

  if (loading || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  const region = goal.region || 'US';
  const targetAmount = goal.targetAmount || 10000;
  const currentAmount = goal.currentSavings || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Tools</h1>
          <p className="text-gray-600">
            Powerful calculators and trackers to help you manage your money
          </p>
        </div>

        {/* Tools Grid */}
        <div className="space-y-6">
          {/* Savings Calculator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💰</span>
              <h2 className="text-xl font-bold text-gray-900">Savings Calculator</h2>
            </div>
            <SavingsCalculator
              targetAmount={targetAmount}
              currentAmount={currentAmount}
              timeframe={goal.timeframe}
              region={region}
            />
          </div>

          {/* Net Worth Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">📈</span>
              <h2 className="text-xl font-bold text-gray-900">Net Worth Tracker</h2>
            </div>
            <NetWorthDashboard region={region} />
          </div>

          {/* Budget Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💳</span>
              <h2 className="text-xl font-bold text-gray-900">Budget Tracker</h2>
            </div>
            <BudgetTracker region={region} />
          </div>

          {/* Bill Reminders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🔔</span>
              <h2 className="text-xl font-bold text-gray-900">Bill Reminders</h2>
            </div>
            <BillReminders region={region} />
          </div>

          {/* Debt Payoff Calculator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💸</span>
              <h2 className="text-xl font-bold text-gray-900">Debt Payoff Calculator</h2>
            </div>
            <DebtPayoffCalculator region={region} />
          </div>

          {/* Goal Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold text-gray-900">Goal Templates</h2>
            </div>
            <GoalTemplates region={region} />
          </div>
        </div>
      </main>
    </div>
  );
}
