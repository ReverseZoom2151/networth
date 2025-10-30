'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  potentialSaving?: number;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isDismissed: boolean;
  createdAt: string;
}

export default function SmartSuggestions({ userId }: { userId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'savings' | 'alerts'>('all');

  useEffect(() => {
    fetchSuggestions();
  }, [userId]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/suggestions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, isDismissed: true }),
      });

      if (response.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      }
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    }
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      two_for_one_deal: '🎁',
      subscription_savings: '💳',
      spending_alert: '⚠️',
      better_deal: '🏪',
      cashback_opportunity: '💰',
      switching_savings: '🔄',
      budget_optimization: '📊',
      seasonal_tip: '🌟',
    };
    return icons[type] || '💡';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High Impact';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (filter === 'savings') {
      return ['two_for_one_deal', 'subscription_savings', 'better_deal', 'cashback_opportunity', 'switching_savings'].includes(s.type);
    }
    if (filter === 'alerts') {
      return ['spending_alert', 'budget_optimization'].includes(s.type);
    }
    return true;
  });

  const totalPotentialSavings = suggestions.reduce(
    (sum, s) => sum + (s.potentialSaving || 0),
    0
  );

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading suggestions...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Smart Suggestions</h2>
        <p className="text-gray-600">Personalized tips to save money and optimize your finances</p>
      </div>

      {/* Summary Card */}
      {totalPotentialSavings > 0 && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
              <h3 className="text-3xl font-bold text-green-600">
                £{totalPotentialSavings.toFixed(2)}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {suggestions.filter((s) => s.potentialSaving).length} money-saving opportunities
              </p>
            </div>
            <span className="text-5xl">💰</span>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({suggestions.length})
        </button>
        <button
          onClick={() => setFilter('savings')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'savings'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Savings Opportunities
        </button>
        <button
          onClick={() => setFilter('alerts')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'alerts'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Spending Alerts
        </button>
      </div>

      {/* Suggestions List */}
      {filteredSuggestions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-2">✨</p>
          <p className="text-gray-500">No suggestions at the moment</p>
          <p className="text-sm text-gray-400 mt-1">
            Keep using the app and we'll provide personalized money-saving tips!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className={`p-5 ${getPriorityColor(suggestion.priority)}`}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <span className="text-3xl flex-shrink-0">{getIcon(suggestion.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                      <span className="inline-block text-xs font-medium px-2 py-1 rounded bg-white mt-1">
                        {getPriorityLabel(suggestion.priority)}
                      </span>
                    </div>
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="text-gray-400 hover:text-gray-600 text-xl"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-gray-700 mb-3">{suggestion.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      {suggestion.potentialSaving && suggestion.potentialSaving > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-green-600">
                            💵 Save up to £{suggestion.potentialSaving.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {suggestion.actionUrl && suggestion.actionLabel && (
                      <a
                        href={suggestion.actionUrl}
                        className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {suggestion.actionLabel}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Our smart engine analyzes your spending to find personalized
          savings opportunities. Check back regularly for new suggestions!
        </p>
      </Card>
    </div>
  );
}
