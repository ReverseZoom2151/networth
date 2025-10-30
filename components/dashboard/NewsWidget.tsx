'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  impactType: string;
  urgency: string;
  personalizedImpact?: string;
  impactAmount?: number;
}

interface Props {
  userId?: string | null;
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'medium':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-300';
  }
};

const getCategoryEmoji = (category: string) => {
  const emojiMap: { [key: string]: string } = {
    interest_rates: '📊',
    inflation: '📈',
    housing: '🏠',
    general: '📰',
  };
  return emojiMap[category] || '📰';
};

export function NewsWidget({ userId }: Props) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, [userId]);

  const fetchNews = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('limit', '3');

      const response = await fetch(`/api/news/impacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data.slice(0, 3)); // Show top 3
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card hover>
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📰</span>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Financial News</h3>
              <p className="text-sm text-gray-600">Loading latest updates...</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <Card hover className="cursor-pointer" onClick={() => router.push('/news')}>
      <CardBody>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📰</span>
            <div>
              <h3 className="font-bold text-gray-900">Financial News</h3>
              <p className="text-sm text-gray-600">What's affecting your savings</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getUrgencyColor(news[0]?.urgency || 'normal')}`}>
            {news[0]?.urgency === 'high' ? '🔴 Urgent' : 'New'}
          </span>
        </div>

        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">{getCategoryEmoji(item.category)}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.summary}</p>
                  {item.personalizedImpact && (
                    <p className="text-xs font-medium text-purple-700 mt-1">
                      💡 {item.personalizedImpact.substring(0, 60)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-purple-600 font-semibold">
          View All News →
        </div>
      </CardBody>
    </Card>
  );
}
