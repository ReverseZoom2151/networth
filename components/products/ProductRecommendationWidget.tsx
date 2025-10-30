'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';

interface ProductRecommendation {
  productId: string;
  productName: string;
  provider: string;
  productType: string;
  interestRate: number | null;
  primaryBenefit: string;
  secondaryBenefit: string;
  relevanceScore: number;
  matchReason: string;
  potentialBenefit: number | null;
}

interface ProductRecommendationWidgetProps {
  userId: string;
  limit?: number;
}

export default function ProductRecommendationWidget({
  userId,
  limit = 2,
}: ProductRecommendationWidgetProps) {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/recommendations?userId=${userId}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch product recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      savings_account: '💰',
      checking_account: '💳',
      credit_card: '💎',
      isa: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      investment_platform: '📈',
    };
    return icons[type] || '🏦';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Recommended for You</h3>
        <p className="text-sm text-gray-600">Products that match your goals</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.productId}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-all cursor-pointer"
            onClick={() => router.push('/products')}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{getProductTypeIcon(rec.productType)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-0.5">{rec.productName}</h4>
                <p className="text-xs text-gray-600">{rec.provider}</p>
                {rec.interestRate && (
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {rec.interestRate}% APY
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="text-xs text-purple-600 font-semibold mb-1">Match</div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(rec.relevanceScore * 100)}%
                </div>
              </div>
            </div>

            {/* Dual Benefits */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded p-3 mb-3">
              <p className="text-xs font-semibold text-purple-900 mb-2">Why this is perfect:</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-sm">✓</span>
                  <p className="text-xs text-gray-900">{rec.primaryBenefit}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-sm">✓</span>
                  <p className="text-xs text-gray-900">{rec.secondaryBenefit}</p>
                </div>
              </div>
            </div>

            {/* Match Reason */}
            <p className="text-xs text-gray-700 mb-3">{rec.matchReason}</p>

            {/* Potential Benefit */}
            {rec.potentialBenefit !== null && rec.potentialBenefit > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded">
                <span className="text-sm">💰</span>
                <p className="text-xs font-semibold text-green-900">
                  Could save ${rec.potentialBenefit.toLocaleString()}/year
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/products')}
        className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
      >
        View All Products
      </button>
    </Card>
  );
}
