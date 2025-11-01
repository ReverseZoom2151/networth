'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface FinancialHealth {
  id: string;
  overallScore: number;
  savingsScore: number;
  debtScore: number;
  spendingScore: number;
  investmentScore: number;
  creditScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  calculatedAt: string;
}

interface FinancialHealthWidgetProps {
  userId: string;
}

export function FinancialHealthWidget({ userId }: FinancialHealthWidgetProps) {
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialHealth();
  }, [userId]);

  const loadFinancialHealth = async () => {
    try {
      const response = await fetch(`/api/financial-health?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data.financialHealth);
      }
    } catch (error) {
      console.error('Failed to load financial health:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financial-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        const data = await response.json();
        setHealth(data.financialHealth);
      }
    } catch (error) {
      console.error('Failed to calculate financial health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Calculate your financial health score</p>
            <Button variant="primary" onClick={recalculate}>
              Calculate Score
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🏥 Financial Health</h3>
              <p className="text-sm text-gray-600 mt-1">
                Overall financial wellness score
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={recalculate}>
              Recalculate
            </Button>
          </div>

          {/* Overall Score */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-2">Overall Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(health.overallScore)}`}>
              {health.overallScore}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              {getScoreLabel(health.overallScore)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last calculated: {new Date(health.calculatedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Component Scores */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Savings', score: health.savingsScore, icon: '💰' },
              { label: 'Debt', score: health.debtScore, icon: '💳' },
              { label: 'Spending', score: health.spendingScore, icon: '💸' },
              { label: 'Investments', score: health.investmentScore, icon: '📈' },
            ].map(({ label, score, icon }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">{icon} {label}</p>
                    <p className={`text-lg font-semibold ${getScoreColor(score)}`}>
                      {score}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {health.recommendations.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {health.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

