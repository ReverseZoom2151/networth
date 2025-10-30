'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

interface Platform {
  id: string;
  name: string;
  type: string;
  icon: string;
  minInvestment: number;
  fee: string;
  feeDetails: string;
  riskProfiles: string[];
  region: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  rating: number;
  link: string;
  score?: number;
}

export default function InvestPlatformsPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<string>('moderate');
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (whopLoading) return;
    fetchPlatforms();
  }, [userId, whopLoading]);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('region', 'US'); // Could be dynamic based on user profile

      const response = await fetch(`/api/invest/platforms?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms || []);
        setRiskTolerance(data.riskTolerance || 'moderate');
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformClick = async (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleVisitPlatform = (platform: Platform) => {
    // Track click
    if (userId) {
      fetch('/api/products/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: platform.id, userId }),
      }).catch(console.error);
    }

    // Open in new tab
    window.open(platform.link, '_blank');
  };

  if (loading) {
    return <LoadingScreen message="Loading platforms..." />;
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'conservative':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'moderate':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'aggressive':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/invest')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Investment Hub
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Investment Platforms</h1>
            <p className="text-lg text-gray-600">
              Personalized recommendations based on your{' '}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getRiskBadgeColor(riskTolerance)}`}
              >
                {riskTolerance}
              </span>{' '}
              risk profile
            </p>
          </div>
        </div>

        {!userId && (
          <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Get Personalized Recommendations</p>
                <p className="text-sm text-gray-700 mb-3">
                  Take our 2-minute quiz to get platform recommendations matched to your risk tolerance
                  and goals.
                </p>
                <button
                  onClick={() => router.push('/invest/quiz')}
                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Take the Quiz →
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {platforms.map((platform) => (
            <Card
              key={platform.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handlePlatformClick(platform)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{platform.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{platform.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-bold text-gray-900">{platform.rating}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Minimum</p>
                    <p className="font-bold text-gray-900">
                      {platform.minInvestment === 0 ? 'None' : `$${platform.minInvestment}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Fee</p>
                    <p className="font-bold text-gray-900">{platform.fee}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                <strong>Best for:</strong> {platform.bestFor}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisitPlatform(platform);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Visit {platform.name} →
              </button>
            </Card>
          ))}
        </div>

        {/* Modal for Platform Details */}
        {selectedPlatform && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPlatform(null)}
          >
            <Card
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{selectedPlatform.icon}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedPlatform.name}</h2>
                    <p className="text-gray-600 capitalize">{selectedPlatform.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Minimum Investment</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedPlatform.minInvestment === 0
                        ? '$0 (No minimum)'
                        : `$${selectedPlatform.minInvestment}`}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Fees</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPlatform.fee}</p>
                    <p className="text-xs text-gray-600 mt-1">{selectedPlatform.feeDetails}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedPlatform.rating}
                      </span>
                      <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Region</p>
                    <p className="text-xl font-bold text-gray-900">{selectedPlatform.region}</p>
                  </div>
                </div>

                {/* Best For */}
                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <p className="font-semibold text-purple-900 mb-2">✨ Perfect for:</p>
                  <p className="text-gray-800">{selectedPlatform.bestFor}</p>
                </div>

                {/* Pros */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">Pros</h3>
                  <ul className="space-y-2">
                    {selectedPlatform.pros.map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">✓</span>
                        <span className="text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">Cons</h3>
                  <ul className="space-y-2">
                    {selectedPlatform.cons.map((con, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold text-lg">!</span>
                        <span className="text-gray-700">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleVisitPlatform(selectedPlatform)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
                  >
                    Visit {selectedPlatform.name} →
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    This will open in a new tab. Always do your own research before investing.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Disclaimer */}
        <Card className="p-6 bg-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Disclaimer:</strong> These platforms are provided for educational purposes. We do
            not receive compensation from any platform listed. Always do your own research, read the
            terms and conditions, and consider consulting a financial advisor before making investment
            decisions. Past performance does not guarantee future results. All investments carry risk.
          </p>
        </Card>
      </main>
    </div>
  );
}
