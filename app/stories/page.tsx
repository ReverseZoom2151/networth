'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { LoadingScreen, Card } from '@/components/ui';
import { SuccessStoryCard } from '@/components/stories/SuccessStoryCard';

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

export default function StoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [filterGoalType, setFilterGoalType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  useEffect(() => {
    fetchStories();
  }, [filterGoalType, filterRegion]);

  const fetchStories = async () => {
    try {
      setLoading(true);

      // Use real-time generation API
      const goalType = filterGoalType === 'all' ? 'all' : filterGoalType;
      const response = await fetch(`/api/stories/realtime?goalType=${goalType}`);

      if (response.ok) {
        const data = await response.json();
        let fetchedStories = (data.stories || []).map((story: any, index: number) => ({
          ...story,
          id: `story-${goalType}-${index}-${Date.now()}`, // Generate unique ID
          region: story.region || 'US', // Default region
          inspirationScore: 0, // Default score
        }));

        // Apply region filter on client side if needed
        if (filterRegion !== 'all') {
          fetchedStories = fetchedStories.filter(
            (story: SuccessStory) => story.region === filterRegion
          );
        }

        setStories(fetchedStories);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, region: string): string => {
    const symbol = region === 'UK' ? '£' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <LoadingScreen message="Generating real success stories from the web... This may take 10-15 seconds." />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⭐</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Success Stories</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real stories from students and young adults who achieved their financial goals. Let
            their journeys inspire yours.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Filter by Goal:</span>
              <select
                value={filterGoalType}
                onChange={(e) => setFilterGoalType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Goals</option>
                <option value="emergency_fund">Emergency Fund</option>
                <option value="house">House/Apartment</option>
                <option value="debt_free">Debt Free</option>
                <option value="travel">Travel</option>
                <option value="car">Car</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Region:</span>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Regions</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              <strong>{stories.length}</strong> {stories.length === 1 ? 'story' : 'stories'} found
            </div>
          </div>
        </Card>

        {/* Featured Stories */}
        {stories.some((s) => s.featured) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stories
                .filter((s) => s.featured)
                .map((story) => (
                  <SuccessStoryCard
                    key={story.id}
                    story={story}
                    onClick={() => setSelectedStory(story)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* All Stories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {stories.some((s) => s.featured) ? 'More Stories' : 'All Stories'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories
              .filter((s) => !s.featured || stories.filter((st) => st.featured).length === stories.length)
              .map((story) => (
                <SuccessStoryCard
                  key={story.id}
                  story={story}
                  onClick={() => setSelectedStory(story)}
                  compact
                />
              ))}
          </div>
        </div>

        {/* Empty State */}
        {stories.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters to see more success stories.
            </p>
            <button
              onClick={() => {
                setFilterGoalType('all');
                setFilterRegion('all');
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Clear Filters
            </button>
          </Card>
        )}

        {/* Modal for Full Story */}
        {selectedStory && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setSelectedStory(null)}
          >
            <div
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between z-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedStory.goalTitle}</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedStory.name}, {selectedStory.age} • {selectedStory.occupation}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {selectedStory.amountSaved && (
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Amount Saved</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(selectedStory.amountSaved, selectedStory.region)}
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Timeframe</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedStory.timeframe} months</p>
                  </div>
                  {selectedStory.monthlyContribution && (
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-1">Monthly Savings</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(selectedStory.monthlyContribution, selectedStory.region)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Starting Point */}
                <div className="p-5 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📍 Where They Started</p>
                  <p className="text-gray-800">{selectedStory.startingPoint}</p>
                </div>

                {/* Achievement */}
                <div className="p-5 bg-green-50 rounded-lg border-l-4 border-green-600">
                  <p className="text-sm font-semibold text-green-800 mb-2">🎯 What They Achieved</p>
                  <p className="text-gray-800">{selectedStory.achievement}</p>
                </div>

                {/* Full Story */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Their Story</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedStory.story}</p>
                </div>

                {/* Challenges */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Challenges They Faced</h3>
                  <ul className="space-y-2">
                    {selectedStory.challenges.map((challenge, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                        <span className="text-orange-600 font-bold text-lg flex-shrink-0">!</span>
                        <span className="text-gray-800">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Strategies */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Strategies That Worked</h3>
                  <ul className="space-y-2">
                    {selectedStory.strategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 font-bold text-lg flex-shrink-0">✓</span>
                        <span className="text-gray-800">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Takeaway */}
                <div className="p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border-2 border-purple-300">
                  <p className="text-sm font-semibold text-purple-900 mb-3">💡 Key Takeaway</p>
                  <p className="text-lg text-gray-900 font-medium leading-relaxed">
                    {selectedStory.keyTakeaway}
                  </p>
                </div>

                {/* CTA */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-700 mb-4">Inspired by this story? Start your own journey today.</p>
                  <button
                    onClick={() => {
                      setSelectedStory(null);
                      router.push('/goals');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    Set My Goal →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
