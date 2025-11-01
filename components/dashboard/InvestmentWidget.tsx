'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '@/components/ui';

interface Investment {
  id: string;
  name: string;
  type: string;
  provider?: string;
  currentValue: number;
  contributions: number;
  gains: number;
  annualReturn?: number;
}

interface InvestmentWidgetProps {
  userId: string;
}

export function InvestmentWidget({ userId }: InvestmentWidgetProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, [userId]);

  const loadInvestments = async () => {
    try {
      const response = await fetch(`/api/investments?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInvestments(data.investments || []);
      }
    } catch (error) {
      console.error('Failed to load investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGains = investments.reduce((sum, inv) => sum + inv.gains, 0);
  const totalContributions = investments.reduce((sum, inv) => sum + inv.contributions, 0);

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
              <h3 className="text-lg font-semibold text-gray-900">📈 Investments</h3>
              <p className="text-sm text-gray-600 mt-1">
                Track your portfolio and retirement accounts
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {/* Open add investment modal */}}
            >
              + Add
            </Button>
          </div>

          {investments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No investments tracked yet</p>
              <Button
                variant="primary"
                onClick={() => {/* Open add investment modal */}}
              >
                Add Your First Investment
              </Button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Total Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Gains</p>
                  <p className={`text-lg font-semibold ${totalGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${totalGains >= 0 ? '+' : ''}{totalGains.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Contributions</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${totalContributions.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Investment List */}
              <div className="space-y-3">
                {investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {investment.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {investment.type}
                          </span>
                        </div>
                        {investment.provider && (
                          <p className="text-xs text-gray-600 mt-1">
                            {investment.provider}
                          </p>
                        )}
                        <div className="mt-2">
                          <p className="text-lg font-semibold text-gray-900">
                            ${investment.currentValue.toLocaleString()}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`text-xs ${investment.gains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {investment.gains >= 0 ? '+' : ''}${investment.gains.toLocaleString()} gains
                            </span>
                            {investment.annualReturn && (
                              <span className="text-xs text-gray-600">
                                {investment.annualReturn.toFixed(1)}% annual return
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

