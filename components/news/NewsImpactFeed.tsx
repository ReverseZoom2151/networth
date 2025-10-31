'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import NewsImpactCard from './NewsImpactCard';

interface NewsImpact {
  id: string;
  title: string;
  summary: string;
  source: string | null;
  category: string;
  region: string | null;
  affectsGoalTypes: string[];
  impactType: 'positive' | 'negative' | 'neutral' | 'action_required';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  fullContent: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  hasQuickAction: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  actionType: string | null;
  publishedAt: string;
  personalizedImpact?: string;
  impactAmount?: number;
  viewed: boolean;
}

interface NewsImpactFeedProps {
  userId: string;
  limit?: number;
  category?: string;
  urgency?: string;
}

export default function NewsImpactFeed({
  userId,
  limit = 10,
  category,
  urgency,
}: NewsImpactFeedProps) {
  const [newsItems, setNewsItems] = useState<NewsImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>(urgency || 'all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1w');

  useEffect(() => {
    if (userId) {
      fetchNews();
    } else {
      setLoading(false);
      setError('Please log in to view personalized news');
    }
  }, [userId, selectedCategory, selectedUrgency, selectedTimeframe, limit]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use real-time news API with timeline filtering
      const params = new URLSearchParams({
        userId,
        timeframe: selectedTimeframe,
      });

      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedUrgency && selectedUrgency !== 'all') {
        params.append('urgency', selectedUrgency);
      }

      const response = await fetch(`/api/news/realtime?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch news');
      }

      const data = await response.json();

      console.log('📰 Frontend received:', {
        articlesCount: data.articles?.length || 0,
        cached: data.cached,
        timeframe: data.timeframe,
        sampleArticle: data.articles?.[0] ? {
          id: data.articles[0].id,
          title: data.articles[0].title?.substring(0, 50),
          category: data.articles[0].category,
        } : 'No articles'
      });

      // Map articles to NewsImpact format with default values for compatibility
      const mappedArticles = (data.articles || []).map((article: any) => ({
        ...article,
        fullContent: article.summary,
        hasQuickAction: false,
        actionLabel: null,
        actionUrl: null,
        actionType: null,
        viewed: false,
      }));

      console.log('📰 Mapped articles:', mappedArticles.length);
      setNewsItems(mappedArticles);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Unable to load news feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (newsId: string) => {
    // Just mark as viewed in local state (no database tracking)
    setNewsItems((prev) =>
      prev.map((item) =>
        item.id === newsId ? { ...item, viewed: true } : item
      )
    );
  };

  const handleAction = async (newsId: string, actionType: string) => {
    // Action tracking removed - no database storage
    console.log(`Action taken: ${actionType} on news ${newsId}`);
  };

  const handleDismiss = async (newsId: string) => {
    // Remove from local state only
    setNewsItems((prev) => prev.filter((item) => item.id !== newsId));
  };

  const categories = [
    { value: 'all', label: 'All News', icon: '📰' },
    { value: 'interest_rates', label: 'Interest Rates', icon: '💰' },
    { value: 'policy', label: 'Policy Changes', icon: '📋' },
    { value: 'markets', label: 'Market News', icon: '📊' },
    { value: 'products', label: 'New Products', icon: '🏦' },
  ];

  const urgencyFilters = [
    { value: 'all', label: 'All' },
    { value: 'urgent', label: 'Urgent Only' },
    { value: 'high', label: 'High Priority' },
  ];

  const timeframeFilters = [
    { value: '1h', label: 'Last Hour', icon: '⚡' },
    { value: '6h', label: 'Last 6 Hours', icon: '🕐' },
    { value: '1d', label: 'Today', icon: '📅' },
    { value: '3d', label: 'Last 3 Days', icon: '📆' },
    { value: '1w', label: 'This Week', icon: '📊' },
    { value: '2w', label: 'Last 2 Weeks', icon: '📈' },
    { value: '1m', label: 'This Month', icon: '🗓️' },
    { value: '3m', label: 'Last 3 Months', icon: '📉' },
  ];

  const unreadCount = newsItems.filter((item) => !item.viewed).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-5xl mb-4 animate-pulse">📰</div>
          <p className="text-gray-600 font-medium">Fetching latest financial news...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const isGoalError = error.includes('financial goal');
    const isLoginError = error.includes('log in');

    return (
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">
            {isGoalError ? '🎯' : isLoginError ? '🔒' : '⚠️'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isGoalError ? 'Set Your Goal First' : isLoginError ? 'Login Required' : 'Oops!'}
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          {isGoalError && (
            <a
              href="/goals"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Set Up Goal →
            </a>
          )}
          {!isGoalError && !isLoginError && (
            <button
              onClick={() => fetchNews()}
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial News</h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time news from the web, personalized for your goals
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  {unreadCount} new
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Timeline Filter */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            {timeframeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.icon} {filter.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            {urgencyFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>

          {/* Article Count */}
          <div className="ml-auto flex items-center text-sm text-gray-600 px-3">
            <strong>{newsItems.length}</strong>
            <span className="ml-1">articles</span>
          </div>
        </div>
      </div>

      {/* News Feed */}
      {newsItems.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">📰</div>
          <p className="text-gray-500 mb-2">No news found for this timeframe</p>
          <p className="text-sm text-gray-400">
            Try selecting a longer timeframe or different filters
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {newsItems.map((newsItem) => (
            <NewsImpactCard
              key={newsItem.id}
              news={newsItem}
              onView={handleView}
              onAction={handleAction}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {newsItems.length >= limit && (
        <div className="text-center">
          <button
            onClick={() => fetchNews()}
            className="px-6 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Load more news
          </button>
        </div>
      )}
    </div>
  );
}
