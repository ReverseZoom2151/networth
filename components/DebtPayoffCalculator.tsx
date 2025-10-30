'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateDebtPayoffMultiple } from '@/lib/calculations';
import { Region } from '@/lib/types';

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: 'student-loan' | 'credit-card' | 'personal-loan' | 'car-loan' | 'other';
  icon: string;
}

interface DebtPayoffCalculatorProps {
  region: Region;
}

const DEBT_TYPES = [
  { value: 'credit-card', label: 'Credit Card', icon: '💳', defaultRate: 20 },
  { value: 'student-loan', label: 'Student Loan', icon: '🎓', defaultRate: 5.5 },
  { value: 'personal-loan', label: 'Personal Loan', icon: '💰', defaultRate: 10 },
  { value: 'car-loan', label: 'Car Loan', icon: '🚗', defaultRate: 6 },
  { value: 'other', label: 'Other', icon: '📋', defaultRate: 8 },
];

export function DebtPayoffCalculator({ region }: DebtPayoffCalculatorProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [extraPayment, setExtraPayment] = useState('100');
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [newDebt, setNewDebt] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minimumPayment: '',
    type: 'credit-card' as Debt['type'],
  });

  useEffect(() => {
    const saved = localStorage.getItem('debts');
    if (saved) {
      setDebts(JSON.parse(saved));
    }
  }, []);

  const saveDebts = (updatedDebts: Debt[]) => {
    setDebts(updatedDebts);
    localStorage.setItem('debts', JSON.stringify(updatedDebts));
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance || !newDebt.interestRate || !newDebt.minimumPayment) return;

    const typeInfo = DEBT_TYPES.find(t => t.value === newDebt.type);
    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebt.name,
      balance: parseFloat(newDebt.balance),
      interestRate: parseFloat(newDebt.interestRate) / 100,
      minimumPayment: parseFloat(newDebt.minimumPayment),
      type: newDebt.type,
      icon: typeInfo?.icon || '📋',
    };

    saveDebts([...debts, debt]);
    setIsAddingDebt(false);
    setNewDebt({ name: '', balance: '', interestRate: '', minimumPayment: '', type: 'credit-card' });
  };

  const deleteDebt = (id: string) => {
    saveDebts(debts.filter(debt => debt.id !== id));
  };

  // Calculate payoff scenarios
  const calculateScenarios = () => {
    if (debts.length === 0) return null;

    const extra = parseFloat(extraPayment) || 0;
    const totalMinimum = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const monthlyPayment = totalMinimum + extra;

    // Snowball method (smallest balance first)
    const snowballDebts = [...debts].sort((a, b) => a.balance - b.balance);
    const snowballResult = calculateDebtPayoffMultiple(snowballDebts, monthlyPayment);

    // Avalanche method (highest interest first)
    const avalancheDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const avalancheResult = calculateDebtPayoffMultiple(avalancheDebts, monthlyPayment);

    return { snowballResult, avalancheResult, monthlyPayment };
  };

  const scenarios = calculateScenarios();
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const weightedInterestRate = debts.length > 0
    ? debts.reduce((sum, d) => sum + (d.interestRate * d.balance), 0) / totalDebt
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Debt Payoff Strategy</h2>
          <p className="text-sm text-gray-600 mt-1">
            Compare Snowball vs Avalanche methods
          </p>
        </div>
        <button
          onClick={() => setIsAddingDebt(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          + Add Debt
        </button>
      </div>

      {debts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-6xl mb-4 block">💳</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No debts tracked</h3>
          <p className="text-gray-600 mb-4">Add your debts to see your payoff strategy</p>
          <button
            onClick={() => setIsAddingDebt(true)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Add Your First Debt
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium">Total Debt</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebt, region)}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium">Minimum Payments</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMinimumPayments, region)}/mo</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium">Avg Interest Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(weightedInterestRate * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Debts List */}
          <div className="space-y-3 mb-6">
            {debts.map(debt => (
              <div key={debt.id} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{debt.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{debt.name}</h3>
                      <p className="text-sm text-gray-500">
                        {(debt.interestRate * 100).toFixed(1)}% APR • Min: {formatCurrency(debt.minimumPayment, region)}/mo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(debt.balance, region)}
                    </span>
                    <button
                      onClick={() => deleteDebt(debt.id)}
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Extra Payment Input */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Extra Monthly Payment (on top of minimums)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                step="10"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-lg font-semibold"
              />
              <div className="text-sm text-green-700">
                <p className="font-medium">Total Monthly Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalMinimumPayments + (parseFloat(extraPayment) || 0), region)}
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Comparison */}
          {scenarios && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStrategy('avalanche')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    strategy === 'avalanche'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ❄️ Avalanche Method
                </button>
                <button
                  onClick={() => setStrategy('snowball')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    strategy === 'snowball'
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⛄ Snowball Method
                </button>
              </div>

              {/* Method Explanation */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {strategy === 'avalanche' ? '❄️ Avalanche Method' : '⛄ Snowball Method'}
                </h3>
                <p className="text-sm text-gray-800">
                  {strategy === 'avalanche'
                    ? 'Pay off debts with the highest interest rate first. Saves the most money in interest charges.'
                    : 'Pay off debts with the smallest balance first. Provides quick wins and motivation.'}
                </p>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Avalanche Results */}
                <div className={`rounded-lg p-6 ${strategy === 'avalanche' ? 'bg-gray-200 ring-2 ring-black' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">❄️</span>
                    <h3 className="font-bold text-gray-900">Avalanche Method</h3>
                    {scenarios.avalancheResult.months < scenarios.snowballResult.months && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white rounded-full">
                        SAVES MOST
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Debt-Free In</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {scenarios.avalancheResult.months} months
                      </p>
                      <p className="text-xs text-gray-500">
                        ({Math.floor(scenarios.avalancheResult.months / 12)} years {scenarios.avalancheResult.months % 12} months)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Interest Paid</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(scenarios.avalancheResult.totalInterest, region)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount Paid</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(scenarios.avalancheResult.totalPaid, region)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Snowball Results */}
                <div className={`rounded-lg p-6 ${strategy === 'snowball' ? 'bg-gray-200 ring-2 ring-black' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">⛄</span>
                    <h3 className="font-bold text-gray-900">Snowball Method</h3>
                    {scenarios.snowballResult.months < scenarios.avalancheResult.months && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white rounded-full">
                        FASTEST
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Debt-Free In</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {scenarios.snowballResult.months} months
                      </p>
                      <p className="text-xs text-gray-500">
                        ({Math.floor(scenarios.snowballResult.months / 12)} years {scenarios.snowballResult.months % 12} months)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Interest Paid</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(scenarios.snowballResult.totalInterest, region)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount Paid</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(scenarios.snowballResult.totalPaid, region)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Insight */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💡 Comparison</h3>
                <p className="text-sm text-gray-800">
                  {scenarios.avalancheResult.totalInterest < scenarios.snowballResult.totalInterest ? (
                    <>
                      The Avalanche method will save you{' '}
                      <span className="font-bold">
                        {formatCurrency(scenarios.snowballResult.totalInterest - scenarios.avalancheResult.totalInterest, region)}
                      </span>{' '}
                      in interest compared to Snowball.
                    </>
                  ) : (
                    <>
                      Both methods cost about the same in interest. Choose Snowball for quicker psychological wins!
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* Add Debt Modal */}
      {isAddingDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Debt</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
                <input
                  type="text"
                  value={newDebt.name}
                  onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  placeholder="e.g., Chase Credit Card, Student Loan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newDebt.type}
                  onChange={(e) => {
                    const type = e.target.value as Debt['type'];
                    const typeInfo = DEBT_TYPES.find(t => t.value === type);
                    setNewDebt({
                      ...newDebt,
                      type,
                      interestRate: newDebt.interestRate || typeInfo?.defaultRate.toString() || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {DEBT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDebt.balance}
                  onChange={(e) => setNewDebt({ ...newDebt, balance: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newDebt.interestRate}
                  onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Monthly Payment</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDebt.minimumPayment}
                  onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingDebt(false);
                  setNewDebt({ name: '', balance: '', interestRate: '', minimumPayment: '', type: 'credit-card' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addDebt}
                disabled={!newDebt.name || !newDebt.balance || !newDebt.interestRate || !newDebt.minimumPayment}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Debt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
