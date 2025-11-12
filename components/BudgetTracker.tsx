'use client';

import { useState, useEffect, useMemo } from 'react';
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

const BUDGET_AMOUNT_PRESETS = [
  0,
  50,
  100,
  150,
  200,
  250,
  300,
  400,
  500,
  600,
  750,
  900,
  1000,
  1250,
  1500,
  1750,
  2000,
  2500,
  3000,
];

export function BudgetTracker({ region }: BudgetTrackerProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [daysUntilReset, setDaysUntilReset] = useState(0);
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState<string | null>(null);
  const [selectedAmountOption, setSelectedAmountOption] = useState<string>('0');
  const [customAmountInput, setCustomAmountInput] = useState('');

  useEffect(() => {
    // Load budget data from localStorage
    const saved = localStorage.getItem('budgetCategories');
    if (saved) {
      const parsed: BudgetCategory[] = JSON.parse(saved);
      setCategories(parsed);
      setSelectedCategoryForBudget(
        parsed.length > 0 ? parsed[0].id : DEFAULT_CATEGORIES[0]?.id ?? null,
      );
    } else {
      // Initialize with defaults
      const initial = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        budgeted: 0,
        spent: 0,
      }));
      setCategories(initial);
      setIsSetupMode(true);
      setSelectedCategoryForBudget(initial.length > 0 ? initial[0].id : null);
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

  useEffect(() => {
    if (!selectedCategoryForBudget || categories.length === 0) return;

    const selected = categories.find(cat => cat.id === selectedCategoryForBudget);
    if (!selected) return;

    if (BUDGET_AMOUNT_PRESETS.includes(selected.budgeted)) {
      setSelectedAmountOption(selected.budgeted.toString());
      setCustomAmountInput('');
    } else if (selected.budgeted > 0) {
      setSelectedAmountOption('custom');
      setCustomAmountInput(selected.budgeted.toString());
    } else {
      setSelectedAmountOption('0');
      setCustomAmountInput('');
    }
  }, [selectedCategoryForBudget, categories]);

  useEffect(() => {
    if (!isSetupMode || categories.length === 0) return;

    setSelectedCategoryForBudget(prev => {
      if (prev && categories.some(cat => cat.id === prev)) {
        return prev;
      }
      return categories[0]?.id ?? null;
    });
  }, [isSetupMode, categories]);

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
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-accent';
    return 'bg-muted';
  };

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const resetAllBudgets = () => {
    const resetCategories = categories.map(cat => ({ ...cat, spent: 0 }));
    saveCategories(resetCategories);
  };

  const presetOptions = useMemo(
    () =>
      BUDGET_AMOUNT_PRESETS.map(value => ({
        value: value.toString(),
        label: formatCurrency(value, region),
      })),
    [region],
  );

  const configuredCategories = useMemo(
    () => categories.filter(cat => cat.budgeted > 0),
    [categories],
  );

  const handleBudgetSave = () => {
    if (!selectedCategoryForBudget) return;

    const amount =
      selectedAmountOption === 'custom'
        ? parseFloat(customAmountInput)
        : parseFloat(selectedAmountOption);

    if (Number.isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount for this category.');
      return;
    }

    updateBudget(selectedCategoryForBudget, amount);
  };

  const handleBudgetClear = (categoryId: string) => {
    updateBudget(categoryId, 0);
  };

  if (isSetupMode) {
    const categorySelectValue =
      selectedCategoryForBudget ?? (categories[0]?.id ?? '');

    return (
      <div className="rounded-xl bg-surface p-6 shadow-lg shadow-black/5 space-y-6 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Set Your Monthly Budget</h2>
          <p className="mt-1 text-sm text-muted">
            Use the dropdowns to allocate a monthly amount to each category.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">
                Spending category
              </label>
              <select
                value={categorySelectValue}
                onChange={(e) => setSelectedCategoryForBudget(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-accent disabled:text-muted"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                    {category.budgeted > 0 ? ' • configured' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted">
                Monthly allocation
              </label>
              <select
                value={selectedAmountOption}
                onChange={(e) => setSelectedAmountOption(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
              >
                {presetOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Custom amount…</option>
              </select>
            </div>

            {selectedAmountOption === 'custom' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">
                  Custom amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
                  placeholder="Enter custom monthly budget"
                />
              </div>
            )}

            <button
              onClick={handleBudgetSave}
              className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background transition-colors hover:opacity-90"
            >
              Save allocation
            </button>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 bg-surface-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Configured categories</span>
              <span className="text-sm font-semibold text-foreground">
                {configuredCategories.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total monthly budget</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(totalBudgeted, region)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Add as many categories as you need. You can revisit and fine-tune these amounts any time.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-sm text-foreground transition-colors">
            <thead className="bg-surface-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-muted">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-muted">
                  Monthly budget
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {categories.map(category => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.budgeted > 0 ? 'Configured' : 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(category.budgeted, region)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {category.budgeted > 0 ? (
                      <button
                        onClick={() => handleBudgetClear(category.id)}
                        className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                      >
                        Clear
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCategoryForBudget(category.id);
                          setSelectedAmountOption('0');
                          setCustomAmountInput('');
                        }}
                        className="text-sm font-medium text-muted transition-colors hover:text-foreground"
                      >
                        Configure
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <div>
            <p className="text-sm text-muted">Total monthly budget</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalBudgeted, region)}
            </p>
          </div>
          <button
            onClick={() => setIsSetupMode(false)}
            disabled={totalBudgeted === 0}
            className="rounded-lg bg-foreground px-6 py-2 text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
          >
            Start tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-6 shadow-lg shadow-black/5 transition-colors">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Budget Tracker</h2>
          <p className="mt-1 text-sm text-muted">
            {daysUntilReset} days until reset
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">Remaining This Month</p>
          <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-foreground' : 'text-red-500'}`}>
            {formatCurrency(totalRemaining, region)}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 rounded-lg bg-surface-muted p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Total Spending</span>
          <span className="text-sm text-muted">
            {formatCurrency(totalSpent, region)} / {formatCurrency(totalBudgeted, region)}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-surface">
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
            <div
              key={category.id}
              className="rounded-lg border border-border/60 p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(category.spent, region)} / {formatCurrency(category.budgeted, region)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-lg bg-surface-muted px-3 py-1 text-sm text-muted transition-colors hover:text-foreground"
                >
                  + Add
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-2 w-full rounded-full bg-surface-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(category.spent, category.budgeted)}`}
                    style={{ width: `${getProgressPercentage(category.spent, category.budgeted)}%` }}
                  />
                </div>
              </div>

              {/* Remaining Amount */}
              <div className="flex items-center justify-between text-sm">
                <span className={isOverBudget ? 'font-medium text-red-500' : 'text-muted'}>
                  {isOverBudget ? 'Over by' : 'Remaining'}
                </span>
                <span className={`font-semibold ${isOverBudget ? 'text-red-500' : 'text-foreground'}`}>
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
          className="flex-1 rounded-lg border border-border px-4 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Edit Budget
        </button>
        <button
          onClick={resetAllBudgets}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Reset Spending
        </button>
      </div>

      {/* Add Expense Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-foreground">
              Add Expense - {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Enter amount"
              className="mb-4 w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setExpenseAmount('');
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
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
                className="flex-1 rounded-lg bg-foreground px-4 py-2 text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
