'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface TaxPlan {
  id: string;
  taxYear: number;
  estimatedIncome: number;
  estimatedTax: number;
  estimatedRefund?: number;
  effectiveRate: number;
  marginalRate: number;
  recommendations: string[];
  status: string;
}

interface TaxPlanningWidgetProps {
  userId: string;
}

export function TaxPlanningWidget({ userId }: TaxPlanningWidgetProps) {
  const [taxPlans, setTaxPlans] = useState<TaxPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadTaxPlans();
  }, [userId]);

  const loadTaxPlans = async () => {
    try {
      const response = await fetch(`/api/tax-planning?userId=${userId}&taxYear=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setTaxPlans(data.taxPlans || []);
      }
    } catch (error) {
      console.error('Failed to load tax plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = taxPlans.find(p => p.taxYear === currentYear);

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
              <h3 className="text-lg font-semibold text-gray-900">📊 Tax Planning</h3>
              <p className="text-sm text-gray-600 mt-1">
                Estimate taxes and maximize savings
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {/* Open tax planning wizard */}}
            >
              Plan
            </Button>
          </div>

          {!currentPlan ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tax plan for {currentYear}</p>
              <Button
                variant="primary"
                onClick={() => {/* Open tax planning wizard */}}
              >
                Create Tax Plan
              </Button>
            </div>
          ) : (
            <>
              {/* Tax Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Estimated Tax</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${currentPlan.estimatedTax.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Effective Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(currentPlan.effectiveRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                {currentPlan.estimatedRefund && currentPlan.estimatedRefund > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Estimated Refund</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${currentPlan.estimatedRefund.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {currentPlan.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Tax-Saving Tips</h4>
                  <ul className="space-y-1">
                    {currentPlan.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  Status: <span className="font-medium capitalize">{currentPlan.status}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

