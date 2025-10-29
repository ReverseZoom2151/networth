'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Region } from '@/lib/types';

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number; // Day of month (1-31)
  category: 'rent' | 'utilities' | 'subscription' | 'loan' | 'insurance' | 'other';
  recurring: boolean;
  isPaid: boolean;
  icon: string;
}

interface BillRemindersProps {
  region: Region;
}

const BILL_CATEGORIES = [
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'subscription', label: 'Subscription', icon: '📱' },
  { value: 'loan', label: 'Loan Payment', icon: '🏦' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '💳' },
];

export function BillReminders({ region }: BillRemindersProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: 'other' as Bill['category'],
    recurring: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('bills');
    if (saved) {
      setBills(JSON.parse(saved));
    }
  }, []);

  const saveBills = (updatedBills: Bill[]) => {
    setBills(updatedBills);
    localStorage.setItem('bills', JSON.stringify(updatedBills));
  };

  const addBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;

    const categoryInfo = BILL_CATEGORIES.find(c => c.value === newBill.category);
    const bill: Bill = {
      id: Date.now().toString(),
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      dueDate: parseInt(newBill.dueDate),
      category: newBill.category,
      recurring: newBill.recurring,
      isPaid: false,
      icon: categoryInfo?.icon || '💳',
    };

    saveBills([...bills, bill]);
    setIsAddingBill(false);
    setNewBill({ name: '', amount: '', dueDate: '', category: 'other', recurring: true });
  };

  const togglePaid = (id: string) => {
    const updated = bills.map(bill =>
      bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
    );
    saveBills(updated);
  };

  const deleteBill = (id: string) => {
    saveBills(bills.filter(bill => bill.id !== id));
  };

  const getDaysUntilDue = (dueDate: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueMonth = currentMonth;
    let dueYear = currentYear;

    // If due date has passed this month, it's due next month
    if (dueDate < currentDay) {
      dueMonth = currentMonth + 1;
      if (dueMonth > 11) {
        dueMonth = 0;
        dueYear = currentYear + 1;
      }
    }

    const dueDateTime = new Date(dueYear, dueMonth, dueDate);
    const diffTime = dueDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getStatusColor = (daysUntil: number, isPaid: boolean) => {
    if (isPaid) return 'text-green-600';
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (daysUntil: number, isPaid: boolean) => {
    if (isPaid) return { text: 'Paid', color: 'bg-green-100 text-green-800' };
    if (daysUntil < 0) return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
    if (daysUntil === 0) return { text: 'Due Today', color: 'bg-orange-100 text-orange-800' };
    if (daysUntil <= 3) return { text: `${daysUntil} days`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `${daysUntil} days`, color: 'bg-gray-100 text-gray-800' };
  };

  const sortedBills = [...bills].sort((a, b) => {
    // Unpaid bills first, then by days until due
    if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
    const aDays = getDaysUntilDue(a.dueDate);
    const bDays = getDaysUntilDue(b.dueDate);
    return aDays - bDays;
  });

  const upcomingBills = sortedBills.filter(bill => !bill.isPaid && getDaysUntilDue(bill.dueDate) >= 0);
  const overdueBills = sortedBills.filter(bill => !bill.isPaid && getDaysUntilDue(bill.dueDate) < 0);
  const totalUpcoming = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bill Reminders</h2>
          <p className="text-sm text-gray-600 mt-1">
            Never miss a payment
          </p>
        </div>
        <button
          onClick={() => setIsAddingBill(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + Add Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium">Total Bills</p>
          <p className="text-2xl font-bold text-blue-900">{bills.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <p className="text-sm text-orange-700 font-medium">Upcoming</p>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalUpcoming, region)}</p>
        </div>
        {totalOverdue > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(totalOverdue, region)}</p>
          </div>
        )}
      </div>

      {/* Bills List */}
      {sortedBills.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-6xl mb-4 block">📅</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills added yet</h3>
          <p className="text-gray-600 mb-4">Start tracking your recurring payments</p>
          <button
            onClick={() => setIsAddingBill(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Your First Bill
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBills.map(bill => {
            const daysUntil = getDaysUntilDue(bill.dueDate);
            const badge = getStatusBadge(daysUntil, bill.isPaid);

            return (
              <div
                key={bill.id}
                className={`border rounded-lg p-4 transition-all ${
                  bill.isPaid ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={bill.isPaid}
                      onChange={() => togglePaid(bill.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-2xl">{bill.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${bill.isPaid ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {bill.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Due on the {bill.dueDate}{bill.dueDate === 1 ? 'st' : bill.dueDate === 2 ? 'nd' : bill.dueDate === 3 ? 'rd' : 'th'} of each month
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${getStatusColor(daysUntil, bill.isPaid)}`}>
                      {formatCurrency(bill.amount, region)}
                    </span>
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Bill</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Name</label>
                <input
                  type="text"
                  value={newBill.name}
                  onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                  placeholder="e.g., Rent, Netflix, Phone Bill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Day of Month)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  placeholder="1-31"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newBill.category}
                  onChange={(e) => setNewBill({ ...newBill, category: e.target.value as Bill['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {BILL_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newBill.recurring}
                  onChange={(e) => setNewBill({ ...newBill, recurring: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="recurring" className="ml-2 text-sm text-gray-700">
                  Recurring monthly
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingBill(false);
                  setNewBill({ name: '', amount: '', dueDate: '', category: 'other', recurring: true });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBill}
                disabled={!newBill.name || !newBill.amount || !newBill.dueDate}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
