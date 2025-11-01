'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal, Message } from '@/lib/types';
import { useWhop, UserStorage } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { haptics } from '@/lib/mobile';

// All available AI models
const AI_MODELS = {
  // Claude Models (Anthropic)
  'claude-sonnet': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    description: 'Best quality, balanced cost',
    icon: '🎯',
    category: 'claude',
  },
  'claude-haiku': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    description: 'Fastest, most efficient',
    icon: '⚡',
    category: 'claude',
  },
  'claude-opus': {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    description: 'Most capable, premium',
    icon: '👑',
    category: 'claude',
  },
  // OpenAI GPT-5 Models
  'gpt-5': {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Strong narratives',
    icon: '🤖',
    category: 'openai',
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    description: 'Efficient, fast',
    icon: '🔷',
    category: 'openai',
  },
  'gpt-5-pro': {
    id: 'gpt-5-pro-2025-10-06',
    name: 'GPT-5 Pro',
    provider: 'OpenAI',
    description: 'Advanced reasoning',
    icon: '💎',
    category: 'openai',
  },
  'gpt-5-nano': {
    id: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    provider: 'OpenAI',
    description: 'Lightest, simple cases',
    icon: '🌟',
    category: 'openai',
  },
} as const;

type ModelKey = keyof typeof AI_MODELS;

interface ResearchResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export default function AIPage() {
  const router = useRouter();
  const { userId, loading: whopLoading, hasAccess, checkingAccess } = useWhop();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<ModelKey>('claude-sonnet');
  const [deepResearch, setDeepResearch] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);

  useEffect(() => {
    async function initAI() {
      if (whopLoading || !userId) return;

      const onboardingCompleted = await UserStorage.isOnboardingComplete(userId);
      if (!onboardingCompleted) {
        router.push('/onboarding');
        return;
      }

      const storedGoal = await UserStorage.getGoal(userId);
      if (storedGoal) {
        setGoal(storedGoal);
      }

      setLoading(false);
    }

    initAI();
  }, [router, userId, whopLoading]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !goal || sending) return;

    await haptics.light();

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);
    setResearch(null); // Clear previous research

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          model: AI_MODELS[selectedModel].id,
          modelCategory: AI_MODELS[selectedModel].category,
          deepResearch,
          goal,
          history: messages,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // If research results are included, display them
        if (data.research) {
          setResearch(data.research);
        }

        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        await haptics.success();
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      await haptics.error();
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    "How much should I save each month to reach my goal?",
    "What's the best way to start investing as a student?",
    "Should I pay off debt or save for emergencies first?",
    "Research: Best investment strategies for building wealth",
    "Research: Tax-advantaged retirement accounts comparison",
    "Research: Real estate vs stock market investment",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Financial Assistant</h1>
          <p className="text-gray-600">
            Get personalized advice and deep research powered by advanced AI
          </p>
        </div>

        {/* Model Selection & Controls */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Model Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              >
                <optgroup label="Claude (Anthropic)">
                  {Object.entries(AI_MODELS)
                    .filter(([_, model]) => model.category === 'claude')
                    .map(([key, model]) => (
                      <option key={key} value={key}>
                        {model.icon} {model.name} - {model.description}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="GPT-5 (OpenAI)">
                  {Object.entries(AI_MODELS)
                    .filter(([_, model]) => model.category === 'openai')
                    .map(([key, model]) => (
                      <option key={key} value={key}>
                        {model.icon} {model.name} - {model.description}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Deep Research Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Mode
              </label>
              <div className="flex items-center space-x-3 h-10">
                <button
                  onClick={() => setDeepResearch(!deepResearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    deepResearch ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      deepResearch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  {deepResearch ? (
                    <>
                      <span className="font-semibold text-purple-600">🔍 Deep Research Enabled</span>
                      <span className="text-xs block">Multi-source research with citations</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">💬 Chat Mode</span>
                      <span className="text-xs block">Fast conversational responses</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-6">
                  {AI_MODELS[selectedModel].icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ask me anything about money!
                </h3>
                <p className="text-gray-600 mb-2 text-center max-w-md">
                  I can help with savings strategies, debt payoff plans, investment basics, and deep research.
                </p>
                <p className="text-sm text-gray-500 mb-8 text-center">
                  Using: {AI_MODELS[selectedModel].name} ({AI_MODELS[selectedModel].provider})
                </p>
                <div className="space-y-2 w-full max-w-md">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInputMessage(prompt)}
                      className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      {prompt.startsWith('Research:') ? '🔍' : '💰'} {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Research Results */}
                {research && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold text-gray-900 mb-2">📋 Research Summary</h4>
                      <p className="text-sm text-gray-700">{research.summary}</p>
                    </div>

                    {research.keyFindings.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">🔑 Key Findings</h4>
                        <ul className="space-y-2">
                          {research.keyFindings.map((finding, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {research.sources.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">📚 Sources</h4>
                        <div className="space-y-2">
                          {research.sources.slice(0, 3).map((source, idx) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-purple-600 hover:underline"
                            >
                              {source.title} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={deepResearch ? "Ask a research question..." : "Ask me anything about money..."}
                disabled={sending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
