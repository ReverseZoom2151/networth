'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal, Message } from '@/lib/types';
import { useWhop, UserStorage } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui';
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
    { text: "How much should I save each month to reach my goal?", icon: "💰", category: "chat" },
    { text: "What's the best way to start investing as a student?", icon: "📈", category: "chat" },
    { text: "Should I pay off debt or save for emergencies first?", icon: "💸", category: "chat" },
    { text: "Best investment strategies for building wealth", icon: "💡", category: "research" },
    { text: "Tax-advantaged retirement accounts comparison", icon: "💡", category: "research" },
    { text: "Real estate vs stock market investment", icon: "💡", category: "research" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Description Header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
          <div className="flex items-start space-x-4">
            <span className="text-5xl">🤖</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Financial Assistant</h1>
              <p className="text-gray-700 mb-3">
                Get personalized advice and comprehensive research powered by the latest AI models.
                Choose between Claude and GPT-5, enable deep research for multi-source insights.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  ✓ 7 AI models
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  ✓ Financial calculators
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  ✓ Deep research mode
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  ✓ Personalized to you
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Model Selection & Controls */}
        <Card className="p-5 mb-6 border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white shadow-sm"
              >
                <optgroup label="🧠 Claude (Anthropic)">
                  {Object.entries(AI_MODELS)
                    .filter(([_, model]) => model.category === 'claude')
                    .map(([key, model]) => (
                      <option key={key} value={key}>
                        {model.icon} {model.name} - {model.description}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="🤖 GPT-5 (OpenAI)">
                  {Object.entries(AI_MODELS)
                    .filter(([_, model]) => model.category === 'openai')
                    .map(([key, model]) => (
                      <option key={key} value={key}>
                        {model.icon} {model.name} - {model.description}
                      </option>
                    ))}
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Using: {AI_MODELS[selectedModel].provider}
              </p>
            </div>

            {/* Deep Research Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Research Mode
              </label>
              <button
                onClick={() => setDeepResearch(!deepResearch)}
                className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm ${
                  deepResearch
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{deepResearch ? '🔍' : '💬'}</span>
                    <span>{deepResearch ? 'Deep Research Active' : 'Chat Mode'}</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    deepResearch ? 'bg-purple-400' : 'bg-gray-400'
                  }`}>
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        deepResearch ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
              <p className="text-xs text-gray-500 mt-1">
                {deepResearch ? 'Multi-source research with citations' : 'Fast conversational responses'}
              </p>
            </div>
          </div>
        </Card>

        {/* Chat Container */}
        <Card className="flex-1 overflow-hidden flex flex-col border-gray-200 shadow-lg">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="text-7xl mb-6 animate-pulse">
                  {AI_MODELS[selectedModel].icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ask me anything about money!
                </h3>
                <p className="text-gray-600 mb-2 text-center max-w-md">
                  I can help with savings strategies, debt payoff plans, investment basics, and comprehensive research.
                </p>
                <p className="text-sm text-purple-600 font-medium mb-8">
                  {AI_MODELS[selectedModel].name} • {deepResearch ? 'Deep Research Mode' : 'Chat Mode'}
                </p>

                {/* Suggested Prompts Grid */}
                <div className="w-full max-w-2xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">
                    Suggested Prompts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setInputMessage(prompt.text)}
                        className="text-left p-4 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 transition-all border border-gray-200 hover:border-purple-300 hover:shadow-md"
                      >
                        <div className="flex items-start space-x-2">
                          <span className="text-lg flex-shrink-0">{prompt.icon}</span>
                          <span className="flex-1">{prompt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
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
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Research Results */}
                {research && (
                  <div className="space-y-4 pt-4">
                    <Card className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                        <span className="text-xl mr-2">📋</span>
                        Research Summary
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{research.summary}</p>
                    </Card>

                    {research.keyFindings.length > 0 && (
                      <Card className="p-5 border-blue-200">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">🔑</span>
                          Key Findings
                        </h4>
                        <ul className="space-y-2">
                          {research.keyFindings.map((finding, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="text-purple-600 font-bold mr-2 mt-0.5">•</span>
                              <span className="flex-1">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {research.sources.length > 0 && (
                      <Card className="p-5 border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                          <span className="text-xl mr-2">📚</span>
                          Sources ({research.sources.length})
                        </h4>
                        <div className="space-y-2">
                          {research.sources.slice(0, 3).map((source, idx) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-purple-600 hover:text-purple-700 hover:underline"
                            >
                              {idx + 1}. {source.title} →
                            </a>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={deepResearch ? "Ask a research question..." : "Ask me anything about money..."}
                disabled={sending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 text-sm shadow-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
