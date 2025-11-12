'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UrgentNews {
  id: string;
  title: string;
  summary: string;
  impactType: 'positive' | 'negative' | 'neutral' | 'action_required';
  actionLabel: string | null;
  actionUrl: string | null;
}

interface NewsImpactBannerProps {
  userId: string;
}

export default function NewsImpactBanner({ userId }: NewsImpactBannerProps) {
  const router = useRouter();
  const [urgentNews, setUrgentNews] = useState<UrgentNews | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchUrgentNews();
  }, [userId]);

  const fetchUrgentNews = async () => {
    try {
      const response = await fetch(`/api/news/impacts?userId=${userId}&urgency=urgent&limit=1`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.length > 0) {
        setUrgentNews(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch urgent news:', err);
    }
  };

  const handleAction = () => {
    if (urgentNews?.actionUrl) {
      router.push(urgentNews.actionUrl);
    } else {
      router.push('/news');
    }
  };

  const handleDismiss = async () => {
    if (!urgentNews) return;

    try {
      await fetch('/api/news/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newsId: urgentNews.id, dismissed: true }),
      });

      setDismissed(true);
    } catch (err) {
      console.error('Failed to dismiss news:', err);
    }
  };

  if (!urgentNews || dismissed) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (urgentNews.impactType) {
      case 'positive':
        return 'bg-gradient-to-r from-green-600 to-emerald-600';
      case 'negative':
        return 'bg-gradient-to-r from-red-600 to-rose-600';
      case 'action_required':
        return 'bg-gradient-to-r from-orange-600 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
    }
  };

  return (
    <div className={`${getBackgroundColor()} text-white shadow-lg animate-slide-down`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-background/30 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-background">
                  Urgent
                </span>
              </div>
              <p className="font-bold text-sm sm:text-base">{urgentNews.title}</p>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5 line-clamp-1">
                {urgentNews.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAction}
              className="rounded-lg bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted whitespace-nowrap"
            >
              {urgentNews.actionLabel || 'Learn More'}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 transition-colors hover:bg-background/20"
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
