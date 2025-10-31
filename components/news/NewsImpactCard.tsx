'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { ShareButton } from '@/components/ShareButton';

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

interface NewsImpactCardProps {
  news: NewsImpact;
  onView?: (newsId: string) => void;
  onAction?: (newsId: string, actionType: string) => void;
  onDismiss?: (newsId: string) => void;
  showFullContent?: boolean;
}

export default function NewsImpactCard({
  news,
  onView,
  onAction,
  onDismiss,
  showFullContent = false,
}: NewsImpactCardProps) {
  const [expanded, setExpanded] = useState(showFullContent);
  const [isActing, setIsActing] = useState(false);

  const getImpactColor = (impactType: string) => {
    switch (impactType) {
      case 'positive':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '📈' };
      case 'negative':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '📉' };
      case 'action_required':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '⚠️' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'ℹ️' };
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return { label: 'Urgent', color: 'bg-red-600 text-white' };
      case 'high':
        return { label: 'High Priority', color: 'bg-orange-600 text-white' };
      case 'normal':
        return { label: 'New', color: 'bg-blue-600 text-white' };
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      interest_rates: '💰',
      policy: '📋',
      markets: '📊',
      products: '🏦',
    };
    return icons[category] || '📰';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExpand = () => {
    if (!expanded && !news.viewed && onView) {
      onView(news.id);
    }
    setExpanded(!expanded);
  };

  const handleAction = async () => {
    if (!news.actionType || !onAction) return;

    setIsActing(true);
    await onAction(news.id, news.actionType);
    setIsActing(false);
  };

  const impactStyle = getImpactColor(news.impactType);
  const urgencyStyle = getUrgencyLabel(news.urgency);

  return (
    <Card
      className={`overflow-hidden transition-all ${
        !news.viewed ? 'ring-2 ring-purple-200' : ''
      } ${impactStyle.border} border-l-4`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">{getCategoryIcon(news.category)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {urgencyStyle && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyStyle.color}`}>
                    {urgencyStyle.label}
                  </span>
                )}
                {!news.viewed && (
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                )}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{news.title}</h3>
              {news.source && (
                <p className="text-xs text-gray-500 mt-1">Source: {news.source}</p>
              )}
            </div>
          </div>

          {/* Impact Badge */}
          <div className={`flex-shrink-0 px-3 py-1 rounded-full ${impactStyle.bg} ${impactStyle.text} text-xs font-medium flex items-center gap-1`}>
            <span>{impactStyle.icon}</span>
            <span className="capitalize">{news.impactType.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Summary */}
        <p className="text-gray-700 text-sm mb-3">{news.summary}</p>

        {/* Personalized Impact */}
        {news.personalizedImpact && (
          <div className={`p-4 rounded-lg ${impactStyle.bg} mb-3`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{impactStyle.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900 mb-1">
                  How this affects you:
                </p>
                <p className="text-sm text-gray-700">{news.personalizedImpact}</p>
                {news.impactAmount !== undefined && news.impactAmount !== null && (
                  <p className="text-sm font-bold mt-2 text-gray-900">
                    Impact: {news.impactAmount > 0 ? '+' : ''}
                    {formatCurrency(news.impactAmount)}
                    {news.impactType === 'negative' && news.impactAmount > 0 ? ' more per year' : ' per year'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Content (Expandable) */}
        {expanded && news.fullContent && (
          <div className="mb-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-line">{news.fullContent}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Action Button */}
          {news.hasQuickAction && news.actionLabel && (
            <button
              onClick={handleAction}
              disabled={isActing}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                news.impactType === 'action_required'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              } disabled:opacity-50`}
            >
              {isActing ? 'Processing...' : news.actionLabel}
            </button>
          )}

          {/* Learn More */}
          {news.sourceUrl && (
            <a
              href={news.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Read Full Article →
            </a>
          )}

          {/* Expand/Collapse */}
          {news.fullContent && !showFullContent && (
            <button
              onClick={handleExpand}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              {expanded ? 'Show Less' : 'Read More'}
            </button>
          )}

          {/* Share */}
          <ShareButton
            title={news.title}
            text={news.summary}
            url={news.sourceUrl || undefined}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          />

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={() => onDismiss(news.id)}
              className="ml-auto px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>

        {/* Goal Tags */}
        {news.affectsGoalTypes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Relevant for:</p>
            <div className="flex flex-wrap gap-2">
              {news.affectsGoalTypes.map((goalType) => (
                <span
                  key={goalType}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize"
                >
                  {goalType === 'house' && '🏠 House'}
                  {goalType === 'travel' && '✈️ Travel'}
                  {goalType === 'wedding' && '💍 Wedding'}
                  {goalType === 'family' && '👨‍👩‍👧‍👦 Family'}
                  {goalType === 'investment' && '📈 Investment'}
                  {!['house', 'travel', 'wedding', 'family', 'investment'].includes(goalType) && goalType}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
