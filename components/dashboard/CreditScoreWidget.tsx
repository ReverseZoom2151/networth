'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface CreditScore {
  id: string;
  score: number;
  provider: string;
  change?: number;
  trend?: string;
  reportDate: string;
  recommendations: string[];
}

interface CreditScoreWidgetProps {
  userId: string;
}

export function CreditScoreWidget({ userId }: CreditScoreWidgetProps) {
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreditScores();
  }, [userId]);

  const loadCreditScores = async () => {
    try {
      const response = await fetch(`/api/credit-score?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCreditScores(data.creditScores || []);
      }
    } catch (error) {
      console.error('Failed to load credit scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestScore = creditScores[0];

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Poor';
    return 'Very Poor';
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

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">💳 Credit Score</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monitor your credit health
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* Connect credit monitoring service */}}
            >
              Update
            </Button>
          </div>

          {!latestScore ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No credit score data yet</p>
              <Button
                variant="primary"
                onClick={() => {/* Connect credit monitoring */}}
              >
                Connect Credit Monitoring
              </Button>
            </div>
          ) : (
            <>
              {/* Current Score */}
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Credit Score</p>
                    <p className={`text-5xl font-bold ${getScoreColor(latestScore.score)}`}>
                      {latestScore.score}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getScoreLabel(latestScore.score)}
                    </p>
                  </div>
                  {latestScore.change && (
                    <div className="text-left">
                      <p className="text-xs text-gray-600 mb-1">Change</p>
                      <p className={`text-2xl font-semibold ${latestScore.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {latestScore.change >= 0 ? '+' : ''}{latestScore.change}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {latestScore.trend === 'up' ? '📈' : latestScore.trend === 'down' ? '📉' : '➡️'}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Last updated: {new Date(latestScore.reportDate).toLocaleDateString()}
                </p>
              </div>

              {/* Recommendations */}
              {latestScore.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Improvement Tips</h4>
                  <ul className="space-y-1">
                    {latestScore.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Score History */}
              {creditScores.length > 1 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Score History</h4>
                  <div className="space-y-2">
                    {creditScores.slice(1, 4).map((score) => (
                      <div key={score.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {new Date(score.reportDate).toLocaleDateString()}
                        </span>
                        <span className={`font-medium ${getScoreColor(score.score)}`}>
                          {score.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

