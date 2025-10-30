'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Region } from '@/lib/types';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  budgeted: number;
  spent: number;
  color: string;
}

interface BudgetTrackerProps {
  region: Region;
}

const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'budgeted' | 'spent'>[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: 'bg-orange-500' },
  { id: 'rent', name: 'Rent & Utilities', icon: '🏠', color: 'bg-blue-500' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: 'bg-gray-500' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎮', color: 'bg-purple-500' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'education', name: 'Education', icon: '📚', color: 'bg-indigo-500' },
  { id: 'health', name: 'Health & Fitness', icon: '💪', color: 'bg-gray-900' },
  { id: 'other', name: 'Other', icon: '💰', color: 'bg-gray-500' },
];

export function BudgetTracker({ region }: BudgetTrackerProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [daysUntilReset, setDaysUntilReset] = useState(0);

  useEffect(() => {
    // Load budget data from localStorage
    const saved = localStorage.getItem('budgetCategories');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      // Initialize with defaults
      const initial = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        budgeted: 0,
        spent: 0,
      }));
      setCategories(initial);
      setIsSetupMode(true);
    }

    // Calculate days until end of month
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDaysUntilReset(Math.ceil((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, []);

  const saveCategories = (newCategories: BudgetCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem('budgetCategories', JSON.stringify(newCategories));
  };

  const updateBudget = (id: string, amount: number) => {
    const updated = categories.map(cat =>
      cat.id === id ? { ...cat, budgeted: amount } : cat
    );
    saveCategories(updated);
  };

  const addExpense = (categoryId: string, amount: number) => {
    const updated = categories.map(cat =>
      cat.id === categoryId ? { ...cat, spent: cat.spent + amount } : cat
    );
    saveCategories(updated);
    setSelectedCategory(null);
    setExpenseAmount('');
  };

  const getProgressPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.min((spent / budgeted) * 100, 100);
  };

  const getProgressColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return 'bg-gray-900';
    if (percentage >= 80) return 'bg-gray-600';
    return 'bg-gray-500';
  };

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const resetAllBudgets = () => {
    const resetCategories = categories.map(cat => ({ ...cat, spent: 0 }));
    saveCategories(resetCategories);
  };

  if (isSetupMode) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Set Your Monthly Budget</h2>
            <p className="text-sm text-gray-600 mt-1">
              Allocate amounts to each spending category
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-4">
              <span className="text-2xl">{category.icon}</span>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">
                  {category.name}
                </label>
              </div>
              <input
                type="number"
                min="0"
                step="10"
                value={category.budgeted || ''}
                onChange={(e) => updateBudget(category.id, parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600">Total Monthly Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalBudgeted, region)}
            </p>
          </div>
          <button
            onClick={() => setIsSetupMode(false)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Start Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            {daysUntilReset} days until reset
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Remaining This Month</p>
          <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-gray-700' : 'text-gray-900'}`}>
            {formatCurrency(totalRemaining, region)}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Total Spending</span>
          <span className="text-sm text-gray-600">
            {formatCurrency(totalSpent, region)} / {formatCurrency(totalBudgeted, region)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressColor(totalSpent, totalBudgeted)}`}
            style={{ width: `${getProgressPercentage(totalSpent, totalBudgeted)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {categories.filter(cat => cat.budgeted > 0).map(category => {
          const remaining = category.budgeted - category.spent;
          const isOverBudget = remaining < 0;

          return (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(category.spent, region)} / {formatCurrency(category.budgeted, region)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  + Add
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(category.spent, category.budgeted)}`}
                    style={{ width: `${getProgressPercentage(category.spent, category.budgeted)}%` }}
                  />
                </div>
              </div>

              {/* Remaining Amount */}
              <div className="flex justify-between items-center text-sm">
                <span className={isOverBudget ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                  {isOverBudget ? 'Over by' : 'Remaining'}
                </span>
                <span className={`font-semibold ${isOverBudget ? 'text-gray-900' : 'text-gray-700'}`}>
                  {formatCurrency(Math.abs(remaining), region)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setIsSetupMode(true)}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit Budget
        </button>
        <button
          onClick={resetAllBudgets}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset Spending
        </button>
      </div>

      {/* Add Expense Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Add Expense - {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpenseAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amount = parseFloat(expenseAmount);
                  if (amount > 0) {
                    addExpense(selectedCategory, amount);
                  }
                }}
                disabled={!expenseAmount || parseFloat(expenseAmount) <= 0}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
