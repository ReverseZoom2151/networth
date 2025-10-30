'use client';

import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  provider: string;
  productType: string;
  region: string;
  interestRate: number | null;
  apr: number | null;
  fees: any;
  description: string;
  keyFeatures: string[];
  primaryBenefit: string;
  secondaryBenefit: string;
  minDeposit: number | null;
  minIncome: number | null;
  minCreditScore: number | null;
  eligibilityNotes: string | null;
  applicationUrl: string | null;
  suitableForGoals: string[];
  riskLevel: string | null;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
  onCompare?: (productId: string) => void;
  isComparing?: boolean;
  showFullDetails?: boolean;
}

export default function ProductCard({
  product,
  onCompare,
  isComparing = false,
  showFullDetails = false,
}: ProductCardProps) {
  const [expanded, setExpanded] = useState(showFullDetails);

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      savings_account: 'Savings Account',
      checking_account: 'Checking Account',
      credit_card: 'Credit Card',
      isa: 'ISA',
      investment_platform: 'Investment Platform',
    };
    return labels[type] || type;
  };

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      savings_account: '💰',
      checking_account: '💳',
      credit_card: '💎',
      isa: '🏴󐁧󐁢󐁥󐁮󐁧󐁿',
      investment_platform: '📈',
    };
    return icons[type] || '🏦';
  };

  const formatRate = () => {
    if (product.interestRate) {
      return `${product.interestRate}% APY`;
    }
    if (product.apr) {
      return `${product.apr}% APR`;
    }
    return null;
  };

  const handleTrackClick = async () => {
    try {
      await fetch('/api/products/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }

    if (product.applicationUrl) {
      window.open(product.applicationUrl, '_blank');
    }
  };

  const rate = formatRate();

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all ${
        isComparing
          ? 'border-purple-500 shadow-lg'
          : product.featured
          ? 'border-green-200 shadow-md'
          : 'border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
    >
      {product.featured && !isComparing && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-t-xl text-sm font-semibold flex items-center gap-2">
          <span>⭐</span>
          <span>Featured Product</span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-4xl">{getProductTypeIcon(product.productType)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.provider}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {getProductTypeLabel(product.productType)}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {product.region}
                </span>
              </div>
            </div>
          </div>

          {rate && (
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold text-green-600">{rate.split(' ')[0]}</p>
              <p className="text-xs text-gray-500">{rate.split(' ')[1]}</p>
            </div>
          )}
        </div>

        {/* Dual Benefits (Research Finding: "Two-for-One Deals") */}
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <p className="text-xs font-semibold text-purple-900 mb-2">🎯 DUAL BENEFITS</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold flex-shrink-0">1.</span>
              <p className="text-sm font-semibold text-gray-900">{product.primaryBenefit}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
              <p className="text-sm font-semibold text-gray-900">{product.secondaryBenefit}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4">{product.description}</p>

        {/* Key Features */}
        {expanded && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900">Key Features:</p>
            <ul className="space-y-1.5">
              {product.keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Eligibility */}
        {expanded && product.eligibilityNotes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-1">Eligibility:</p>
            <p className="text-sm text-gray-600">{product.eligibilityNotes}</p>
            {product.minDeposit !== null && product.minDeposit > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Minimum deposit: ${product.minDeposit.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Goal Suitability */}
        {product.suitableForGoals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Perfect for:</p>
            <div className="flex flex-wrap gap-2">
              {product.suitableForGoals.map((goal) => (
                <span
                  key={goal}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full capitalize"
                >
                  {goal === 'house' && '🏠 House'}
                  {goal === 'travel' && '✈️ Travel'}
                  {goal === 'wedding' && '💍 Wedding'}
                  {goal === 'family' && '👨‍👩‍👧‍👦 Family'}
                  {goal === 'investment' && '📈 Investment'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {product.applicationUrl && (
            <button
              onClick={handleTrackClick}
              className="flex-1 bg-black hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Apply Now →
            </button>
          )}

          {!showFullDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {expanded ? 'Show Less' : 'Learn More'}
            </button>
          )}

          {onCompare && (
            <button
              onClick={() => onCompare(product.id)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                isComparing
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isComparing ? 'Remove from comparison' : 'Add to comparison'}
            >
              {isComparing ? '✓' : '⚖️'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
