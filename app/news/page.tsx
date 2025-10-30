'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';
import { NewsImpactFeed } from '@/components/news';

export default function NewsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!whopLoading) {
      setLoading(false);
    }
  }, [whopLoading]);

  if (loading) {
    return <LoadingScreen message="Loading news..." />;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Please log in to view financial news.</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Financial News That Matters
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We translate complex financial news into personal impact for your goals.
              No jargon, just what it means for you.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-5 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-1">Personalized</h3>
              <p className="text-sm text-gray-600">
                Only see news that affects your specific goals
              </p>
            </Card>

            <Card className="p-5 text-center bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Clear Impact</h3>
              <p className="text-sm text-gray-600">
                Understand exactly how news affects your finances
              </p>
            </Card>

            <Card className="p-5 text-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Quick Actions</h3>
              <p className="text-sm text-gray-600">
                Take action immediately when opportunities arise
              </p>
            </Card>
          </div>
        </div>

        {/* News Feed */}
        <div className="animate-slide-up">
          <NewsImpactFeed userId={userId} limit={20} />
        </div>

        {/* Educational Section */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">📚</span>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Understanding Financial News
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Financial news can be overwhelming. Here's what you need to know:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>
                    <strong>Interest Rate Changes:</strong> When central banks raise rates,
                    savings accounts earn more, but loans cost more. The opposite is true when rates drop.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Market Volatility:</strong> Stock market ups and downs are normal.
                    Long-term investors shouldn't panic over short-term changes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>
                    <strong>Policy Changes:</strong> Government policies on taxes, benefits, and
                    regulations can directly impact your savings and spending power.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <span>
                    <strong>New Products:</strong> Banks constantly launch new accounts and cards.
                    We'll highlight ones that offer better rates or rewards for your goals.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="mt-8 p-6 text-center bg-black text-white animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-2xl font-bold mb-2">Want More Personalized Insights?</h3>
          <p className="text-gray-300 mb-4">
            Our AI coach can explain any financial news in the context of your specific situation
          </p>
          <button
            onClick={() => router.push('/coach')}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ask AI Coach
          </button>
        </Card>
      </main>
    </div>
  );
}
