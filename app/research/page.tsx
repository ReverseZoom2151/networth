'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { useWhop } from '@/app/providers';

export default function DeepResearchPage() {
  const router = useRouter();
  const { userId, hasAccess, loading: whopLoading } = useWhop();
  const [topic, setTopic] = useState('');
  const [researching, setResearching] = useState(false);
  const [research, setResearch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async () => {
    if (!topic.trim()) {
      setError('Please enter a research topic');
      return;
    }

    setResearching(true);
    setError(null);
    setResearch(null);

    try {
      const response = await fetch('/api/research/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topic,
          includeUserContext: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Research failed');
        return;
      }

      setResearch(data.research);
    } catch (err) {
      console.error('Research error:', err);
      setError('Failed to perform research. Please try again.');
    } finally {
      setResearching(false);
    }
  };

  const suggestedTopics = [
    'Best investment strategies for building wealth',
    'How to save for a house down payment',
    'Understanding stock market fundamentals',
    'Tax-advantaged retirement accounts comparison',
    'Emergency fund best practices',
    'Real estate vs stock market investment',
  ];

  if (whopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Deep Research</h1>
              {!hasAccess && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  Premium Feature
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Description */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">🔍</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                AI-Powered Financial Research
              </h2>
              <p className="text-gray-700 mb-3">
                Get comprehensive, multi-source research on any financial topic. Our AI analyzes
                trusted sources like Bloomberg, Financial Times, Investopedia, and more to give you
                personalized insights tailored to your goals.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                  ✓ 10+ trusted sources
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                  ✓ Personalized to your goal
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700">
                  ✓ Real-time data
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Research Input */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to research?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., 'Best strategies for saving for a house down payment in 2 years'"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
            rows={3}
            disabled={researching}
          />

          <button
            onClick={handleResearch}
            disabled={researching || !topic.trim()}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {researching ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Researching...
              </>
            ) : (
              <>
                <span className="mr-2">🔍</span>
                Start Deep Research
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              {error.includes('not available') && (
                <button
                  onClick={() => router.push('/subscribe')}
                  className="mt-2 text-sm text-red-700 font-semibold hover:underline"
                >
                  Upgrade to Premium →
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Suggested Topics */}
        {!research && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Suggested Research Topics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedTopics.map((suggestedTopic, i) => (
                <button
                  key={i}
                  onClick={() => setTopic(suggestedTopic)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  💡 {suggestedTopic}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Research Results */}
        {research && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Research Summary</h3>
              <p className="text-gray-700 leading-relaxed">{research.summary}</p>
            </Card>

            {/* Key Findings */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔑 Key Findings</h3>
              <ul className="space-y-3">
                {research.keyFindings.map((finding: string, i: number) => (
                  <li key={i} className="flex items-start space-x-3">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <span className="text-gray-700 flex-1">{finding}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Recommendations</h3>
              <ul className="space-y-3">
                {research.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start space-x-3">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    <span className="text-gray-700 flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Sources */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📚 Sources</h3>
              <div className="space-y-3">
                {research.sources.map((source: any, i: number) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{source.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{source.snippet}</p>
                    <span className="text-xs text-purple-600 hover:underline">
                      Read more →
                    </span>
                  </a>
                ))}
              </div>
            </Card>

            {/* New Research Button */}
            <button
              onClick={() => {
                setResearch(null);
                setTopic('');
              }}
              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Start New Research
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
