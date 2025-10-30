'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';

interface SpendingPattern {
  id: string;
  type: string;
  description: string;
  category?: string;
  amount?: number;
  frequency?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  isAcknowledged: boolean;
  detectedAt: string;
}

export default function SpendingPatterns({ userId }: { userId: string }) {
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchPatterns();
  }, [userId]);

  const fetchPatterns = async () => {
    try {
      const response = await fetch(`/api/spending-patterns?userId=${userId}&isActive=true`);
      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
      }
    } catch (error) {
      console.error('Failed to fetch spending patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/spending-patterns/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await fetchPatterns();
      }
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const acknowledgePattern = async (patternId: string) => {
    try {
      const response = await fetch('/api/spending-patterns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, isAcknowledged: true }),
      });

      if (response.ok) {
        setPatterns((prev) =>
          prev.map((p) => (p.id === patternId ? { ...p, isAcknowledged: true } : p))
        );
      }
    } catch (error) {
      console.error('Failed to acknowledge pattern:', error);
    }
  };

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      unusual_spending: '⚡',
      category_spike: '📈',
      recurring_expense: '🔄',
      budget_exceeded: '🚨',
      trend_increase: '📊',
      trend_decrease: '✅',
      weekend_spending: '🎉',
      late_night_spending: '🌙',
    };
    return icons[type] || '💡';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-red-600 bg-red-50';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const unacknowledgedCount = patterns.filter((p) => !p.isAcknowledged).length;

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading spending patterns...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Spending Patterns</h2>
          <p className="text-gray-600">Insights from your transaction history</p>
        </div>
        <button
          onClick={analyzePatterns}
          disabled={analyzing}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {analyzing ? 'Analyzing...' : '🔍 Analyze Now'}
        </button>
      </div>

      {/* Summary Card */}
      {unacknowledgedCount > 0 && (
        <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold">
                {unacknowledgedCount} new {unacknowledgedCount === 1 ? 'pattern' : 'patterns'}{' '}
                detected
              </p>
              <p className="text-sm text-gray-600">
                Review these patterns to better understand your spending habits
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Patterns List */}
      {patterns.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-gray-500 mb-2">No patterns detected yet</p>
          <p className="text-sm text-gray-400 mb-4">
            We need more transaction data to analyze your spending patterns
          </p>
          <button
            onClick={analyzePatterns}
            disabled={analyzing}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Analyze My Spending
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {patterns.map((pattern) => (
            <Card key={pattern.id} className={`p-5 ${getSeverityColor(pattern.severity)}`}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <span className="text-3xl flex-shrink-0">{getIcon(pattern.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{getTypeLabel(pattern.type)}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-white">
                          {getSeverityLabel(pattern.severity)}
                        </span>
                      </div>
                      {pattern.category && (
                        <p className="text-xs text-gray-500">{pattern.category}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{pattern.description}</p>

                  {/* Metadata details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    {pattern.amount && (
                      <div>
                        <span className="font-medium">Amount:</span> £
                        {pattern.amount.toFixed(2)}
                      </div>
                    )}
                    {pattern.frequency && (
                      <div>
                        <span className="font-medium">Frequency:</span> {pattern.frequency}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Detected:</span>{' '}
                      {new Date(pattern.detectedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action button */}
                  {!pattern.isAcknowledged && (
                    <button
                      onClick={() => acknowledgePattern(pattern.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ✓ Acknowledge
                    </button>
                  )}
                  {pattern.isAcknowledged && (
                    <p className="text-sm text-gray-500">✓ Acknowledged</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Card */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Tip:</strong> Our analyzer checks your spending for unusual patterns,
          category spikes, recurring expenses, and trends. Run analysis regularly to stay on top
          of your finances!
        </p>
      </Card>
    </div>
  );
}
