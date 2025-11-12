'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal, Message } from '@/lib/types';
import { useWhop, UserStorage } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui';
import { haptics } from '@/lib/mobile';
import { VoiceAgent } from '@/components/ai/VoiceAgent';

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

  // Voice mode
  const [voiceMode, setVoiceMode] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-background transition-colors">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-accent"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors">
      <Navigation />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Feature Description Header */}
        <Card className="mb-6 border border-border/60 bg-surface-muted p-6 shadow-sm animate-fade-in dark:bg-surface/70">
          <div className="flex items-start gap-4">
            <span className="text-5xl">🤖</span>
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold text-foreground">AI Financial Assistant</h1>
              <p className="mb-3 text-muted-foreground">
                Get personalized advice and comprehensive research powered by the latest AI models.
                Choose between Claude and GPT-5, enable deep research, or have voice conversations.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                <span className="rounded-full bg-background/80 px-3 py-1 shadow-sm">✓ 7 AI models</span>
                <span className="rounded-full bg-background/80 px-3 py-1 shadow-sm">✓ Voice conversations</span>
                <span className="rounded-full bg-background/80 px-3 py-1 shadow-sm">✓ Financial calculators</span>
                <span className="rounded-full bg-background/80 px-3 py-1 shadow-sm">✓ Deep research mode</span>
                <span className="rounded-full bg-background/80 px-3 py-1 shadow-sm">✓ Personalized to you</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Model Selection & Controls */}
        <Card className="mb-6 border border-border/60 bg-surface p-5 shadow-sm animate-slide-up">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Model Selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Select AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm transition focus:border-transparent focus:ring-2 focus:ring-accent"
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
              <p className="mt-1 text-xs text-muted-foreground">Using: {AI_MODELS[selectedModel].provider}</p>
            </div>

            {/* Deep Research Toggle */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Research Mode</label>
              <button
                onClick={() => setDeepResearch(!deepResearch)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all ${
                  deepResearch
                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                    : 'border border-border bg-surface-muted text-muted hover:bg-surface'
                }`}
                disabled={voiceMode}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{deepResearch ? '🔍' : '💬'}</span>
                    <span>{deepResearch ? 'Deep Research Active' : 'Chat Mode'}</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    deepResearch ? 'bg-accent/70' : 'bg-muted/40'
                  }`}>
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        deepResearch ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                {deepResearch ? 'Multi-source research with citations' : 'Fast conversational responses'}
              </p>
            </div>

            {/* Voice Mode Toggle */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Interaction Mode</label>
              <button
                onClick={() => setVoiceMode(!voiceMode)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-all ${
                  voiceMode
                    ? 'bg-success-600 text-white hover:bg-success-700'
                    : 'border border-border bg-surface-muted text-muted hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{voiceMode ? '🎤' : '⌨️'}</span>
                    <span>{voiceMode ? 'Voice Mode' : 'Text Mode'}</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    voiceMode ? 'bg-success-400' : 'bg-muted/40'
                  }`}>
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        voiceMode ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                {voiceMode ? 'Real-time voice conversation' : 'Type your questions'}
              </p>
            </div>
          </div>
        </Card>

        {/* Voice Mode or Text Chat */}
        {voiceMode ? (
          <VoiceAgent
            userId={userId || undefined}
            goalType={goal?.type}
            region={goal?.region}
            onClose={() => setVoiceMode(false)}
          />
        ) : (
          /* Chat Container */
          <Card className="flex-1 flex flex-col overflow-hidden border border-border/60 bg-surface shadow-lg">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-surface-muted p-6 dark:bg-surface/60">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12">
                  <div className="mb-6 text-7xl animate-pulse">{AI_MODELS[selectedModel].icon}</div>
                  <h3 className="mb-2 text-2xl font-bold text-foreground">Ask me anything about money!</h3>
                  <p className="mb-2 max-w-md text-center text-muted">
                    I can help with savings strategies, debt payoff plans, investment basics, and comprehensive research.
                  </p>
                  <p className="mb-8 text-sm font-medium text-accent">
                    {AI_MODELS[selectedModel].name} • {deepResearch ? 'Deep Research Mode' : 'Chat Mode'}
                  </p>

                  {/* Suggested Prompts Grid */}
                  <div className="w-full max-w-2xl">
                    <h4 className="mb-3 text-center text-sm font-semibold text-muted">Suggested Prompts</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {suggestedPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => setInputMessage(prompt.text)}
                          className="rounded-lg border border-border bg-surface p-4 text-left text-sm text-muted-foreground transition-all hover:border-accent/60 hover:bg-surface-muted hover:shadow-md"
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-lg flex-shrink-0">{prompt.icon}</span>
                            <span>{prompt.text}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'ml-auto bg-foreground text-background'
                        : 'bg-surface text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {message.role === 'user' ? 'You' : 'AI Coach'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}

              {research && (
                <div className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground">Research Summary</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{research.summary}</p>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-foreground">Key Findings</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {research.keyFindings.map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-foreground">Recommendations</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {research.recommendations.map((recommendation, i) => (
                        <li key={i}>{recommendation}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-foreground">Sources</h4>
                    <ul className="mt-2 space-y-2 text-sm text-accent">
                      {research.sources.map((source, i) => (
                        <li key={i}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.title}
                          </a>
                          <p className="text-xs text-muted-foreground">{source.snippet}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/60 bg-surface p-4">
              <div className="flex space-x-3">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-3 text-sm text-foreground transition focus:border-transparent focus:ring-2 focus:ring-accent"
                  rows={2}
                  placeholder="Ask about savings, investing, debt payoff, or financial research..."
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !inputMessage.trim()}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    sending || !inputMessage.trim()
                      ? 'cursor-not-allowed bg-muted/20 text-muted'
                      : deepResearch
                      ? 'bg-accent text-accent-foreground hover:opacity-90 shadow-md'
                      : 'bg-success-600 text-white hover:bg-success-700 shadow-md'
                  }`}
                >
                  {sending ? 'Sending...' : deepResearch ? 'Research' : 'Send'}
                </button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
