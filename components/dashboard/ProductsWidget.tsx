'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui';

interface ProductRecommendation {
  productId: string;
  productName: string;
  provider: string;
  productType: string;
  interestRate?: number;
  primaryBenefit: string;
  secondaryBenefit: string;
  relevanceScore: number;
  matchReason: string;
  potentialBenefit?: number;
}

interface Props {
  userId?: string | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getProductEmoji = (type: string) => {
  const emojiMap: { [key: string]: string } = {
    savings_account: '💰',
    isa: '🏦',
    checking: '💳',
    credit_card: '💳',
    investment: '📈',
  };
  return emojiMap[type] || '💳';
};

export function ProductsWidget({ userId }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProducts();
  }, [userId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/recommendations?userId=${userId}&limit=2`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.slice(0, 2)); // Show top 2
      }
    } catch (error) {
      console.error('Failed to fetch product recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userId) {
    return null;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <Card hover className="cursor-pointer" onClick={() => router.push('/products')}>
      <CardBody>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💳</span>
            <div>
              <h3 className="font-bold text-gray-900">Recommended Products</h3>
              <p className="text-sm text-gray-600">Personalized for your goal</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-300">
            New
          </span>
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.productId}
              className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 hover:border-purple-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{getProductEmoji(product.productType)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {product.productName}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">{product.provider}</p>
                  {product.interestRate && (
                    <p className="text-xs font-bold text-green-700 mb-2">
                      {product.interestRate}% APY
                    </p>
                  )}
                  <div className="space-y-1 text-xs text-gray-700">
                    <div className="flex items-start gap-1">
                      <span className="text-green-600 font-bold">1.</span>
                      <span className="font-medium">{product.primaryBenefit}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span className="font-medium">{product.secondaryBenefit}</span>
                    </div>
                  </div>
                  {product.potentialBenefit && product.potentialBenefit > 0 && (
                    <p className="text-xs font-semibold text-purple-700 mt-2">
                      💰 Earn {formatCurrency(product.potentialBenefit)} more per year
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-purple-600 font-semibold">
          View All Recommendations →
        </div>
      </CardBody>
    </Card>
  );
}
