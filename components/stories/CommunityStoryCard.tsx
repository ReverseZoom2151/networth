'use client';

import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { CommunityStory } from '@/lib/types';
import { Card } from '@/components/ui';
import { formatCurrencyByRegion } from '@/lib/regions';
import { Region } from '@/lib/types';

interface CommunityStoryCardProps {
  story: CommunityStory;
  reacted?: boolean;
  onToggleReaction?: (storyId: string, reacted: boolean) => void;
}

const GOAL_EMOJI: Record<string, string> = {
  emergency_fund: '🛡️',
  house: '🏠',
  travel: '✈️',
  family: '👨‍👩‍👧',
  investment: '📈',
  debt_free: '💳',
  education: '🎓',
};

const GOAL_COLOR: Record<string, string> = {
  emergency_fund: 'from-blue-50 to-blue-100 border-blue-200',
  house: 'from-purple-50 to-purple-100 border-purple-200',
  travel: 'from-orange-50 to-orange-100 border-orange-200',
  family: 'from-pink-50 to-pink-100 border-pink-200',
  investment: 'from-green-50 to-green-100 border-green-200',
  debt_free: 'from-emerald-50 to-emerald-100 border-emerald-200',
  education: 'from-indigo-50 to-indigo-100 border-indigo-200',
};

function formatGoalType(goalType: string) {
  return goalType
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCurrency(amount: number | null | undefined, region?: string | null) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return null;
  if (!region) return `$${amount.toLocaleString()}`;

  try {
    return formatCurrencyByRegion(amount, region as Region);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export function CommunityStoryCard({ story, reacted = false, onToggleReaction }: CommunityStoryCardProps) {
  const emoji = GOAL_EMOJI[story.goalType] || '🎯';
  const gradient = GOAL_COLOR[story.goalType] || 'from-gray-50 to-gray-100 border-gray-200';
  const formattedSubmittedAt = formatDistanceToNow(new Date(story.submittedAt), { addSuffix: true });
  const formattedTargetAmount = formatCurrency(story.targetAmount, story.region);
  const formattedTimeframe = story.timeframeMonths ? `${story.timeframeMonths} months` : null;

  return (
    <Card className={`p-6 bg-gradient-to-br ${gradient} border-2 hover:shadow-lg transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{story.title}</h3>
            <p className="text-sm text-gray-600">
              {story.authorName} • {formatGoalType(story.goalType)}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-500">{formattedSubmittedAt}</div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{story.summary}</p>

      <div className="space-y-3 mb-4">
        {formattedTargetAmount && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Goal:</span>
            <span className="font-semibold text-foreground">{formattedTargetAmount}</span>
            {formattedTimeframe && (
              <span className="text-xs text-muted-foreground">({formattedTimeframe})</span>
            )}
          </div>
        )}
        {story.tips.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-surface/80 p-3 backdrop-blur">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Tips that helped
            </p>
            <ul className="space-y-1 text-sm text-foreground/90">
              {story.tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 text-muted">•</span>
                  <span>{tip}</span>
                </li>
              ))}
              {story.tips.length > 3 && (
                <li className="text-xs text-muted-foreground">+{story.tips.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-lg border border-border/60 bg-surface/80 p-4 text-sm text-foreground/90 backdrop-blur">
        <p className="mb-2 font-semibold text-foreground">Their story</p>
        <p className="line-clamp-4 whitespace-pre-line text-muted-foreground">{story.story}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => onToggleReaction?.(story.id, reacted)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
            reacted
              ? 'bg-foreground text-background shadow'
              : 'bg-surface-muted text-muted hover:bg-surface hover:text-foreground'
          }`}
        >
          <span>{reacted ? '💖' : '🤍'}</span>
          <span>{story.likes} cheers</span>
        </button>
        <span className="text-xs text-muted-foreground">
          Visibility: <strong className="uppercase text-foreground">{story.visibility}</strong>
        </span>
      </div>
    </Card>
  );
}


