'use client';

import { useState, useEffect } from 'react';
import {
  calculateFutureValue,
  calculateMonthlyPayment,
  calculateTimeToGoal,
  DEFAULT_RATES,
  generateSavingsProjection,
} from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';
import { Region } from '@/lib/types';

interface SavingsCalculatorProps {
  targetAmount: number;
  currentAmount: number;
  timeframe: number;
  region: Region;
}

export function SavingsCalculator({
  targetAmount,
  currentAmount,
  timeframe,
  region,
}: SavingsCalculatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [futureValue, setFutureValue] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  // Use high-yield savings rate for calculations
  const interestRate = DEFAULT_RATES.highYieldSavings;

  useEffect(() => {
    // Calculate monthly payment needed
    const payment = calculateMonthlyPayment(targetAmount, currentAmount, interestRate, timeframe);
    setMonthlyContribution(payment);

    // Calculate future value with this contribution
    const fv = calculateFutureValue(currentAmount, payment, interestRate, timeframe);
    setFutureValue(fv);

    // Calculate total contributions and interest
    const contributions = currentAmount + payment * timeframe * 12;
    setTotalContributions(contributions);
    setTotalInterest(fv - contributions);
  }, [targetAmount, currentAmount, timeframe]);

  return (
    <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Smart Savings Plan</h3>
          <p className="text-sm text-gray-600">
            With {(interestRate * 100).toFixed(1)}% annual interest (high-yield savings)
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-900 hover:text-gray-900 font-medium"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Main recommendation */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Save each month:</p>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(monthlyContribution, region)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Based on {(interestRate * 100).toFixed(1)}% APY compound interest
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3">
          {/* Breakdown */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Starting amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(currentAmount, region)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly contributions:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(monthlyContribution, region)} × {timeframe * 12} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total you'll contribute:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totalContributions, region)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Interest earned:</span>
                <span className="font-bold text-gray-700">
                  +{formatCurrency(Math.max(0, totalInterest), region)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="text-gray-900 font-semibold">Final amount:</span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatCurrency(futureValue, region)}
                </span>
              </div>
            </div>
          </div>

          {/* Key insights */}
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">Why this works:</p>
                <p className="text-gray-800">
                  By earning {(interestRate * 100).toFixed(1)}% interest, you'll save{' '}
                  <strong>{formatCurrency(Math.max(0, totalInterest), region)}</strong> compared to a
                  regular savings account. That's compound interest working for you!
                </p>
              </div>
            </div>
          </div>

          {/* Alternative scenarios */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">What if I save more?</h4>
            <div className="space-y-2 text-sm">
              {[1.25, 1.5, 2].map((multiplier) => {
                const altContribution = monthlyContribution * multiplier;
                const altMonths = calculateTimeToGoal(
                  targetAmount,
                  currentAmount,
                  altContribution,
                  interestRate
                );

                if (!altMonths) return null;

                const altYears = Math.floor(altMonths / 12);
                const altMonthsRemainder = altMonths % 12;

                return (
                  <div key={multiplier} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">
                      If you save <strong>{formatCurrency(altContribution, region)}/month</strong>
                    </span>
                    <span className="font-medium text-gray-900">
                      {altYears}y {altMonthsRemainder}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
