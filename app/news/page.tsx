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
      <div className="min-h-screen bg-background transition-colors">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <p className="text-muted">Please log in to view financial news.</p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 animate-fade-in">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-bold text-foreground">
              Real-Time Financial News
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted">
              Fresh financial news from the web, personalized for your goals.
              Select your timeframe to see what's happening now.
            </p>
          </div>

          {/* Info Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden border border-border/60 bg-surface-muted p-5 text-center shadow-sm dark:bg-surface/70">
              <div className="mb-2 text-3xl">⚡</div>
              <h3 className="mb-1 font-semibold text-foreground">Real-Time</h3>
              <p className="text-sm text-muted-foreground">
                Fresh news from the web, updated every time you visit
              </p>
            </Card>

            <Card className="relative overflow-hidden border border-border/60 bg-surface-muted p-5 text-center shadow-sm dark:bg-surface/70">
              <div className="mb-2 text-3xl">🎯</div>
              <h3 className="mb-1 font-semibold text-foreground">Personalized</h3>
              <p className="text-sm text-muted-foreground">
                Filtered for your specific goal and region
              </p>
            </Card>

            <Card className="relative overflow-hidden border border-border/60 bg-surface-muted p-5 text-center shadow-sm dark:bg-surface/70">
              <div className="mb-2 text-3xl">📅</div>
              <h3 className="mb-1 font-semibold text-foreground">Flexible Timeline</h3>
              <p className="text-sm text-muted-foreground">
                View news from the last hour to last 3 months
              </p>
            </Card>
          </div>
        </div>

        {/* News Feed */}
        <div className="animate-slide-up">
          <NewsImpactFeed userId={userId} limit={20} />
        </div>

        {/* Educational Section */}
        <Card
          className="mt-8 border border-border/60 bg-surface-muted p-6 shadow-sm animate-slide-up dark:bg-surface/70"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">📚</span>
            <div>
              <h3 className="mb-2 font-bold text-foreground">
                Understanding Financial News
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Financial news can be overwhelming. Here's what you need to know:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-500">•</span>
                  <span>
                    <strong>Interest Rate Changes:</strong> When central banks raise rates,
                    savings accounts earn more, but loans cost more. The opposite is true when rates drop.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-500">•</span>
                  <span>
                    <strong>Market Volatility:</strong> Stock market ups and downs are normal.
                    Long-term investors shouldn't panic over short-term changes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-500">•</span>
                  <span>
                    <strong>Policy Changes:</strong> Government policies on taxes, benefits, and
                    regulations can directly impact your savings and spending power.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-orange-500">•</span>
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
        <Card
          className="mt-8 border border-border/80 bg-surface p-6 text-center text-foreground shadow-lg animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <h3 className="mb-2 text-2xl font-bold">Want More Personalized Insights?</h3>
          <p className="mb-4 text-muted-foreground">
            Our AI coach can explain any financial news in the context of your specific situation
          </p>
          <button
            onClick={() => router.push('/coach')}
            className="rounded-lg bg-[var(--button-primary-bg)] px-6 py-3 font-semibold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90"
          >
            Ask AI Coach
          </button>
        </Card>
      </main>
    </div>
  );
}
