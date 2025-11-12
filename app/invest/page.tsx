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
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="mb-4 text-6xl">📈</div>
          <h1 className="mb-3 text-4xl font-bold text-foreground">Investment Education</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Interested in investing but not sure where to start? You're not alone.
            We'll guide you through the basics step-by-step.
          </p>
        </div>

        {/* Stats from Research */}
        <Card className="mb-8 border border-border/60 bg-surface-muted p-6 text-center shadow-sm animate-slide-up dark:bg-surface/70">
          <p className="mb-4 text-sm text-muted-foreground">
            <strong>Research finding:</strong> 63% of university students are interested in
            investing but feel it's too complicated or risky to start.
          </p>
          <p className="text-sm text-muted-foreground">
            Our goal is to make investing simple, clear, and accessible.
          </p>
        </Card>

        {/* Progress / Getting Started */}
        {!hasProfile ? (
          <Card
            className="mb-8 border border-border/60 bg-surface p-8 text-center shadow-sm animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 text-5xl">🎯</div>
              <h2 className="mb-3 text-2xl font-bold text-foreground">Start Your Investment Journey</h2>
              <p className="mb-6 text-muted">
                Take our 2-minute quiz to discover your risk tolerance and get personalized
                investment recommendations.
              </p>
              <button
                onClick={() => router.push('/invest/quiz')}
                className="rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                Take the Quiz →
              </button>
            </div>
          </Card>
        ) : (
          <Card
            className="mb-8 border border-border/60 bg-surface p-6 shadow-sm animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Your Investment Profile</h3>
                <p className="text-sm capitalize text-muted">
                  Risk Tolerance: {profile.riskTolerance}
                </p>
              </div>
              <button
                onClick={() => router.push('/invest/quiz')}
                className="text-sm font-medium text-accent transition-colors hover:opacity-80"
              >
                Retake Quiz
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Modules Completed</p>
                <p className="text-2xl font-bold text-success-600">
                  {profile.modulesCompleted?.length || 0}/5
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Time Horizon</p>
                <p className="text-2xl font-bold text-blue-500">{profile.timeHorizon}y</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Started Investing</p>
                <p className="text-2xl font-bold text-purple-500">
                  {profile.hasInvested ? 'Yes' : 'Not Yet'}
                </p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-4 text-center">
                <p className="mb-1 text-xs text-muted-foreground">Quiz Score</p>
                <p className="text-2xl font-bold text-orange-500">
                  {profile.quizScore || 0}/10
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Learning Modules */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Learn the Basics</h2>
          <p className="mb-6 text-muted">
            Complete these 5 modules to build your investment knowledge (5 min each)
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  className={`cursor-pointer border border-border/60 p-5 transition-all hover:shadow-md ${
                    isCompleted ? 'bg-success/10' : 'bg-surface'
                  }`}
                  onClick={() => router.push(`/invest/learn?module=${module.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{module.icon}</span>
                    <div className="flex-1">
                      <h3 className="mb-1 font-bold text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.time}</p>
                    </div>
                    {isCompleted ? <span className="text-2xl">✅</span> : <span className="text-muted">→</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Platform Recommendations */}
        <Card
          className="mb-8 border border-border/60 bg-surface p-6 shadow-sm animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">Investment Platforms</h3>
              <p className="text-sm text-muted-foreground">
                {hasProfile ? 'Recommended for your profile' : 'Popular platforms for beginners'}
              </p>
            </div>
            <button
              onClick={() => router.push('/invest/platforms')}
              className="text-sm font-medium text-accent transition-colors hover:opacity-80"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { name: 'Fidelity Go', icon: '🏦', rate: 'Free under $25k' },
              { name: 'Betterment', icon: '🤖', rate: '0.25% fee' },
              { name: 'Vanguard', icon: '📊', rate: '0.04% expense ratio' },
            ].map((platform) => (
              <div key={platform.name} className="rounded-lg border border-border/60 bg-surface-muted p-4 text-center shadow-sm">
                <span className="mb-2 block text-3xl">{platform.icon}</span>
                <h4 className="mb-1 text-sm font-bold text-foreground">{platform.name}</h4>
                <p className="text-xs text-muted-foreground">{platform.rate}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ / Why Invest */}
        <Card
          className="border border-border/60 bg-surface-muted p-6 shadow-sm animate-slide-up dark:bg-surface/70"
          style={{ animationDelay: '0.4s' }}
        >
          <h3 className="mb-4 font-bold text-foreground">Why Should I Invest?</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-bold text-green-500">💰</span>
              <p>
                <strong>Beat Inflation:</strong> Savings accounts earn ~5%, but investing historically
                returns ~10% annually over the long term.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-500">📈</span>
              <p>
                <strong>Compound Growth:</strong> $100/month invested for 30 years at 10% return =
                $228,000 (vs $36,000 saved).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-purple-500">🎯</span>
              <p>
                <strong>Long-term Goals:</strong> Perfect for goals 5+ years away like retirement,
                kids' education, or financial independence.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-500">⏰</span>
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
