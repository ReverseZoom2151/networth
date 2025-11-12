'use client';

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';
import { useWhop } from '@/app/providers';
import { CommunityStory, StoryLeaderboard } from '@/lib/types';
import { CommunityStoryCard } from '@/components/stories/CommunityStoryCard';

type FormState = {
  authorName: string;
  goalType: string;
  title: string;
  summary: string;
  story: string;
  tips: string;
  region: string;
  targetAmount: string;
  timeframeMonths: string;
  visibility: 'public' | 'friends' | 'private';
};

const GOAL_OPTIONS = [
  { value: 'house', label: 'House / Apartment' },
  { value: 'travel', label: 'Travel' },
  { value: 'family', label: 'Family' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'investment', label: 'Investing' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'debt_free', label: 'Debt Free' },
];

const REGION_FILTERS = [
  { value: 'all', label: 'All Regions' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'EU', label: 'European Union' },
];

export default function StoriesPage() {
  const { userId, loading: authLoading } = useWhop();
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [leaderboard, setLeaderboard] = useState<StoryLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [reactionSet, setReactionSet] = useState<Set<string>>(new Set());

  const [formState, setFormState] = useState<FormState>({
    authorName: '',
    goalType: 'house',
    title: '',
    summary: '',
    story: '',
    tips: '',
    region: 'US',
    targetAmount: '',
    timeframeMonths: '',
    visibility: 'public',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('community_story_reactions');
    if (stored) {
      try {
        setReactionSet(new Set(JSON.parse(stored)));
      } catch {
        setReactionSet(new Set());
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('community_story_reactions', JSON.stringify(Array.from(reactionSet)));
  }, [reactionSet]);

  useEffect(() => {
    if (authLoading) return;
    fetchStories();
  }, [authLoading, goalFilter, regionFilter]);

  useEffect(() => {
    if (authLoading) return;
    fetchLeaderboard();
  }, [authLoading]);

  useEffect(() => {
    const source = new EventSource('/api/community/stories/events');

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'story_created') {
          fetchStories(false);
          fetchLeaderboard();
        } else if (data.type === 'story_reaction') {
          setStories((prev) =>
            prev.map((story) =>
              story.id === data.storyId && typeof data.payload?.likes === 'number'
                ? { ...story, likes: data.payload.likes }
                : story,
            ),
          );
        }
      } catch (error) {
        console.error('Failed to process community story event:', error);
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const params = new URLSearchParams();
      if (goalFilter !== 'all') params.append('goalType', goalFilter);
      if (regionFilter !== 'all') params.append('region', regionFilter);

      const response = await fetch(`/api/community/stories?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load stories');
      }

      const data = await response.json();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Error loading community stories:', error);
      setErrorMessage('We couldn’t load the community feed. Please try again shortly.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/community/stories/leaderboard?timeframeDays=30&limit=5', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error loading story leaderboard:', error);
    }
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      setErrorMessage('Sign in to share your journey with the community.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const tips = formState.tips
      .split('\n')
      .map((tip) => tip.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/community/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          authorName: formState.authorName || 'Anonymous',
          goalType: formState.goalType,
          title: formState.title,
          summary: formState.summary,
          story: formState.story,
          tips,
          region: formState.region,
          targetAmount: formState.targetAmount ? Number(formState.targetAmount) : undefined,
          timeframeMonths: formState.timeframeMonths ? Number(formState.timeframeMonths) : undefined,
          visibility: formState.visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || 'We couldn’t share your story right now.';
        throw new Error(message);
      }

      setSuccessMessage(
        process.env.NEXT_PUBLIC_STORY_AUTO_APPROVE !== 'false'
          ? 'Thank you! Your story is now inspiring the community.'
          : 'Thanks for sharing! Your story is pending review and will appear once approved.',
      );

      setFormState((prev) => ({
        ...prev,
        title: '',
        summary: '',
        story: '',
        tips: '',
        targetAmount: '',
        timeframeMonths: '',
      }));

      fetchStories(false);
      fetchLeaderboard();
    } catch (error: any) {
      console.error('Failed to submit story:', error);
      setErrorMessage(error?.message || 'We hit a snag saving your story.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReaction = async (storyId: string, alreadyReacted: boolean) => {
    if (!userId) {
      setErrorMessage('Sign in to cheer on other members!');
      return;
    }

    setReactionSet((prev) => {
      const next = new Set(prev);
      if (alreadyReacted) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });

    setStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? { ...story, likes: Math.max(0, story.likes + (alreadyReacted ? -1 : 1)) }
          : story,
      ),
    );

    try {
      const response = await fetch(`/api/community/stories/${storyId}/reaction`, {
        method: alreadyReacted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reaction: 'like' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update cheer right now');
      }

      setStories((prev) =>
        prev.map((story) => (story.id === storyId ? { ...story, likes: data.likes } : story)),
      );
    } catch (error) {
      console.error('Error updating reaction:', error);
      setStories((prev) =>
        prev.map((story) =>
          story.id === storyId
            ? { ...story, likes: Math.max(0, story.likes + (alreadyReacted ? 1 : -1)) }
            : story,
        ),
      );
      setReactionSet((prev) => {
        const next = new Set(prev);
        if (alreadyReacted) {
          next.add(storyId);
        } else {
          next.delete(storyId);
        }
        return next;
      });
    }
  };

  if (authLoading || (loading && stories.length === 0)) {
    return <LoadingScreen message="Loading the community feed..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <header className="text-center space-y-4">
          <span className="text-6xl">🌟</span>
          <h1 className="text-4xl font-bold text-gray-900">Community Success Stories</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your journey, celebrate milestones, and learn from other students and young
            professionals on similar paths.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2 space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Your Progress</h2>
              <p className="text-sm text-gray-600">
                Your experience can spark momentum for someone else. What worked? What would you do
                differently?
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitStory}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Display name</label>
                  <input
                    type="text"
                    value={formState.authorName}
                    onChange={(event) => handleFormChange('authorName', event.target.value)}
                    placeholder="Alex in Manchester"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Goal type</label>
                  <select
                    value={formState.goalType}
                    onChange={(event) => handleFormChange('goalType', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    required
                  >
                    {GOAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Story title</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => handleFormChange('title', event.target.value)}
                  placeholder="Paid off £6,200 in credit card debt"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Quick summary</label>
                <textarea
                  value={formState.summary}
                  onChange={(event) => handleFormChange('summary', event.target.value)}
                  placeholder="In one or two sentences, what did you accomplish?"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Full story</label>
                <textarea
                  value={formState.story}
                  onChange={(event) => handleFormChange('story', event.target.value)}
                  placeholder="Share the steps you took, roadblocks you hit, and the tips you would pass along."
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Goal amount</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.targetAmount}
                    onChange={(event) => handleFormChange('targetAmount', event.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Timeframe (months)</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.timeframeMonths}
                    onChange={(event) => handleFormChange('timeframeMonths', event.target.value)}
                    placeholder="e.g. 12"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Region</label>
                  <select
                    value={formState.region}
                    onChange={(event) => handleFormChange('region', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  >
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="EU">European Union</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Visibility</label>
                  <select
                    value={formState.visibility}
                    onChange={(event) =>
                      handleFormChange('visibility', event.target.value as FormState['visibility'])
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  >
                    <option value="public">Public – visible to everyone</option>
                    <option value="friends">Community – visible to Networth members</option>
                    <option value="private">Private – just for you</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Tips that helped</label>
                <textarea
                  value={formState.tips}
                  onChange={(event) => handleFormChange('tips', event.target.value)}
                  placeholder="Share up to three tips (one per line)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  We anonymise stories where needed and may highlight them in the dashboard or AI
                  coach.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? 'Sharing…' : 'Share my story'}
                </button>
              </div>
            </form>
          </Card>

          <Card className="space-y-4 p-6">
            <h3 className="text-xl font-bold text-gray-900">Community Highlights</h3>
            <p className="text-sm text-gray-600">
              The most cheered stories and trends from the past 30 days.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Top stories
                </h4>
                <ul className="mt-2 space-y-2">
                  {leaderboard?.topStories?.length ? (
                    leaderboard.topStories.map((story) => (
                      <li key={story.id} className="flex items-center justify-between text-sm">
                        <span>
                          <span className="font-semibold text-gray-900">{story.title}</span>
                          <span className="text-gray-500"> • {story.authorName}</span>
                        </span>
                        <span className="text-xs text-gray-500">{story.likes} cheers</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">Stories will appear here soon.</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Goal trends
                </h4>
                <ul className="mt-2 space-y-2">
                  {leaderboard?.goalTypeTrends?.length ? (
                    leaderboard.goalTypeTrends.map((trend) => (
                      <li key={trend.goalType} className="flex items-center justify-between text-sm">
                        <span>{trend.goalType.replace(/[_-]/g, ' ')}</span>
                        <span className="text-gray-500">{trend.stories} stories</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">Share your journey to start a trend.</li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Most generous contributors
                </h4>
                <ul className="mt-2 space-y-2">
                  {leaderboard?.recentContributors?.length ? (
                    leaderboard.recentContributors.map((contributor, index) => (
                      <li
                        key={`${contributor.authorName}-${index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{contributor.authorName}</span>
                        <span className="text-gray-500">{contributor.stories} stories</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">
                      Be the first to share your story this month!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </section>

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Goal filter</label>
              <select
                value={goalFilter}
                onChange={(event) => setGoalFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                <option value="all">All goals</option>
                {GOAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Region</label>
              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                {REGION_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="ml-auto text-sm text-gray-500">
              Showing <strong>{stories.length}</strong> {stories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <div className="text-5xl mb-3">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h3>
              <p className="text-sm text-gray-600">
                Be the first to share your journey for this goal or region.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {stories.map((story) => (
                <CommunityStoryCard
                  key={story.id}
                  story={story}
                  reacted={reactionSet.has(story.id)}
                  onToggleReaction={handleToggleReaction}
                />
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

