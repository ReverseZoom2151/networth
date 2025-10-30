'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface GuiltyPleasure {
  id: string;
  name: string;
  category: string;
  icon: string;
  monthlyBudget: number;
  spent: number;
  merchants: string[];
  isActive: boolean;
}

export default function GuiltyPleasures({ userId }: { userId: string }) {
  const [pleasures, setPleasures] = useState<GuiltyPleasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPleasure, setNewPleasure] = useState({
    name: '',
    monthlyBudget: '',
    icon: '☕',
    category: 'Food & Dining',
  });

  useEffect(() => {
    fetchPleasures();
  }, []);

  const fetchPleasures = async () => {
    try {
      const response = await fetch(`/api/guilty-pleasures?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPleasures(data);
      }
    } catch (error) {
      console.error('Failed to fetch guilty pleasures:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPleasure = async () => {
    if (!newPleasure.name || !newPleasure.monthlyBudget) return;

    try {
      const response = await fetch('/api/guilty-pleasures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...newPleasure,
          monthlyBudget: parseFloat(newPleasure.monthlyBudget),
        }),
      });

      if (response.ok) {
        setNewPleasure({ name: '', monthlyBudget: '', icon: '☕', category: 'Food & Dining' });
        setShowAddForm(false);
        fetchPleasures();
      }
    } catch (error) {
      console.error('Failed to add guilty pleasure:', error);
    }
  };

  const deletePleasure = async (id: string) => {
    try {
      const response = await fetch(`/api/guilty-pleasures?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPleasures();
      }
    } catch (error) {
      console.error('Failed to delete guilty pleasure:', error);
    }
  };

  const getPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading your guilty pleasures...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Guilty Pleasures</h2>
          <p className="text-gray-600">Set aside guilt-free spending allowances</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          {showAddForm ? 'Cancel' : 'Add Pleasure'}
        </button>
      </div>

      {showAddForm && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={newPleasure.name}
              onChange={(e) => setNewPleasure({ ...newPleasure, name: e.target.value })}
              placeholder="e.g., Barista Coffee"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Monthly Budget (£)</label>
            <input
              type="number"
              value={newPleasure.monthlyBudget}
              onChange={(e) => setNewPleasure({ ...newPleasure, monthlyBudget: e.target.value })}
              placeholder="50"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Icon</label>
              <select
                value={newPleasure.icon}
                onChange={(e) => setNewPleasure({ ...newPleasure, icon: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="☕">☕ Coffee</option>
                <option value="🍔">🍔 Fast Food</option>
                <option value="🍕">🍕 Pizza</option>
                <option value="🍰">🍰 Desserts</option>
                <option value="🍺">🍺 Drinks</option>
                <option value="🎮">🎮 Gaming</option>
                <option value="🎬">🎬 Entertainment</option>
                <option value="🛍️">🛍️ Shopping</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newPleasure.category}
                onChange={(e) => setNewPleasure({ ...newPleasure, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button
            onClick={addPleasure}
            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Add Guilty Pleasure
          </button>
        </Card>
      )}

      {pleasures.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No guilty pleasures set up yet</p>
          <p className="text-sm text-gray-400">
            Add guilt-free spending allowances for things you love
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pleasures.map((pleasure) => {
            const percentage = getPercentage(pleasure.spent, pleasure.monthlyBudget);
            const remaining = Math.max(pleasure.monthlyBudget - pleasure.spent, 0);

            return (
              <Card key={pleasure.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pleasure.icon}</span>
                    <div>
                      <h3 className="font-semibold">{pleasure.name}</h3>
                      <p className="text-sm text-gray-500">{pleasure.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePleasure(pleasure.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent this month</span>
                    <span className="font-medium">£{pleasure.spent.toFixed(2)}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className={remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                      £{remaining.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Budget: £{pleasure.monthlyBudget.toFixed(2)}/month
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Guilty pleasures help you enjoy small treats without guilt.
          Set realistic budgets for things you love, and we'll track them automatically!
        </p>
      </Card>
    </div>
  );
}
