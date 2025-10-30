'use client';

import { Card } from '@/components/ui';

interface SuccessStory {
  id: string;
  name: string;
  age?: number;
  occupation?: string;
  region: string;
  goalType: string;
  goalTitle: string;
  startingPoint: string;
  achievement: string;
  amountSaved?: number;
  timeframe: number;
  monthlyContribution?: number;
  story: string;
  challenges: string[];
  strategies: string[];
  keyTakeaway: string;
  featured: boolean;
  inspirationScore: number;
}

interface Props {
  story: SuccessStory;
  onClick?: () => void;
  compact?: boolean;
}

const formatCurrency = (amount: number, region: string): string => {
  const symbol = region === 'UK' ? '£' : '$';
  return `${symbol}${amount.toLocaleString()}`;
};

const getGoalEmoji = (goalType: string): string => {
  const emojiMap: { [key: string]: string } = {
    emergency_fund: '🛡️',
    house: '🏠',
    debt_free: '💳',
    travel: '✈️',
    car: '🚗',
  };
  return emojiMap[goalType] || '🎯';
};

const getGoalColor = (goalType: string): string => {
  const colorMap: { [key: string]: string } = {
    emergency_fund: 'from-blue-50 to-blue-100 border-blue-200',
    house: 'from-purple-50 to-purple-100 border-purple-200',
    debt_free: 'from-green-50 to-green-100 border-green-200',
    travel: 'from-orange-50 to-orange-100 border-orange-200',
    car: 'from-indigo-50 to-indigo-100 border-indigo-200',
  };
  return colorMap[goalType] || 'from-gray-50 to-gray-100 border-gray-200';
};

export function SuccessStoryCard({ story, onClick, compact = false }: Props) {
  const emoji = getGoalEmoji(story.goalType);
  const gradientColor = getGoalColor(story.goalType);

  if (compact) {
    return (
      <Card
        className={`p-5 cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br ${gradientColor} border-2`}
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">{emoji}</span>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{story.goalTitle}</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>{story.name}</strong>, {story.age} • {story.occupation}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{story.achievement}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              {story.amountSaved && (
                <span className="font-semibold">
                  {formatCurrency(story.amountSaved, story.region)} saved
                </span>
              )}
              <span>{story.timeframe} months</span>
              {story.featured && <span className="text-purple-600 font-bold">⭐ Featured</span>}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-6 cursor-pointer hover:shadow-xl transition-all bg-gradient-to-br ${gradientColor} border-2`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{emoji}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{story.goalTitle}</h3>
            <p className="text-sm text-gray-600">
              {story.name}, {story.age} • {story.occupation}
            </p>
          </div>
        </div>
        {story.featured && (
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {story.amountSaved && (
          <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Amount Saved</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(story.amountSaved, story.region)}
            </p>
          </div>
        )}
        <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Timeframe</p>
          <p className="text-lg font-bold text-gray-900">{story.timeframe} months</p>
        </div>
        {story.monthlyContribution && (
          <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Per Month</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(story.monthlyContribution, story.region)}
            </p>
          </div>
        )}
      </div>

      {/* Achievement */}
      <div className="mb-4 p-4 bg-white bg-opacity-60 rounded-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">🎯 Achievement</p>
        <p className="text-sm text-gray-700">{story.achievement}</p>
      </div>

      {/* Story Preview */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{story.story}</p>
      </div>

      {/* Key Takeaway */}
      <div className="p-4 bg-white bg-opacity-80 rounded-lg border-l-4 border-purple-600">
        <p className="text-xs font-semibold text-purple-900 mb-1">💡 Key Takeaway</p>
        <p className="text-sm text-gray-800 font-medium">{story.keyTakeaway}</p>
      </div>

      {/* Read More Link */}
      <div className="mt-4 text-center">
        <span className="text-sm text-purple-600 hover:text-purple-700 font-semibold">
          Read Full Story →
        </span>
      </div>
    </Card>
  );
}
