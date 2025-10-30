'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

export default function InvestPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchProfile();
  }, [userId, whopLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invest/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch investment profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  const hasProfile = profile && profile.riskTolerance;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Investment Education
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interested in investing but not sure where to start? You're not alone.
            We'll guide you through the basics step-by-step.
          </p>
        </div>

        {/* Stats from Research */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 animate-slide-up">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-4">
              <strong>Research finding:</strong> 63% of university students are interested in
              investing but feel it's too complicated or risky to start.
            </p>
            <p className="text-sm text-gray-700">
              Our goal is to make investing simple, clear, and accessible.
            </p>
          </div>
        </Card>

        {/* Progress / Getting Started */}
        {!hasProfile ? (
          <Card className="p-8 mb-8 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Start Your Investment Journey
              </h2>
              <p className="text-gray-600 mb-6">
                Take our 2-minute quiz to discover your risk tolerance and get personalized
                investment recommendations.
              </p>
              <button
                onClick={() => router.push('/invest/quiz')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg"
              >
                Take the Quiz →
              </button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Investment Profile</h3>
                <p className="text-sm text-gray-600 capitalize">
                  Risk Tolerance: {profile.riskTolerance}
                </p>
              </div>
              <button
                onClick={() => router.push('/invest/quiz')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Retake Quiz
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Modules Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {profile.modulesCompleted?.length || 0}/5
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Time Horizon</p>
                <p className="text-2xl font-bold text-blue-600">{profile.timeHorizon}y</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Started Investing</p>
                <p className="text-2xl font-bold text-purple-600">
                  {profile.hasInvested ? 'Yes' : 'Not Yet'}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Quiz Score</p>
                <p className="text-2xl font-bold text-orange-600">
                  {profile.quizScore || 0}/10
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Learning Modules */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Learn the Basics</h2>
          <p className="text-gray-600 mb-6">
            Complete these 5 modules to build your investment knowledge (5 min each)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 1, title: 'What is Investing?', icon: '📚', time: '5 min' },
              { id: 2, title: 'Risk & Return', icon: '⚖️', time: '5 min' },
              { id: 3, title: 'Diversification', icon: '🎯', time: '5 min' },
              { id: 4, title: 'Getting Started', icon: '🚀', time: '5 min' },
              { id: 5, title: 'Common Mistakes', icon: '⚠️', time: '5 min' },
            ].map((module) => {
              const isCompleted = profile?.modulesCompleted?.includes(`module_${module.id}`);

              return (
                <Card
                  key={module.id}
                  className={`p-5 cursor-pointer transition-all ${
                    isCompleted ? 'bg-green-50 border-green-200' : 'hover:shadow-md'
                  }`}
                  onClick={() => router.push(`/invest/learn?module=${module.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{module.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.time}</p>
                    </div>
                    {isCompleted ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-gray-400">→</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Platform Recommendations */}
        <Card className="p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Investment Platforms</h3>
              <p className="text-sm text-gray-600">
                {hasProfile ? 'Recommended for your profile' : 'Popular platforms for beginners'}
              </p>
            </div>
            <button
              onClick={() => router.push('/invest/platforms')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Fidelity Go', icon: '🏦', rate: 'Free under $25k' },
              { name: 'Betterment', icon: '🤖', rate: '0.25% fee' },
              { name: 'Vanguard', icon: '📊', rate: '0.04% expense ratio' },
            ].map((platform) => (
              <div key={platform.name} className="p-4 bg-gray-50 rounded-lg text-center">
                <span className="text-3xl mb-2 block">{platform.icon}</span>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{platform.name}</h4>
                <p className="text-xs text-gray-600">{platform.rate}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ / Why Invest */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-bold text-gray-900 mb-4">Why Should I Invest?</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">💰</span>
              <p>
                <strong>Beat Inflation:</strong> Savings accounts earn ~5%, but investing historically
                returns ~10% annually over the long term.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">📈</span>
              <p>
                <strong>Compound Growth:</strong> $100/month invested for 30 years at 10% return =
                $228,000 (vs $36,000 saved).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">🎯</span>
              <p>
                <strong>Long-term Goals:</strong> Perfect for goals 5+ years away like retirement,
                kids' education, or financial independence.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-600 font-bold">⏰</span>
              <p>
                <strong>Time is Your Friend:</strong> Starting young gives you decades for your
                money to grow and weather market ups and downs.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
