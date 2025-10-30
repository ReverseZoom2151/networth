'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserGoal, Message } from '@/lib/types';
import { useWhop, UserStorage } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { LockedFeature } from '@/components/SubscriptionGate';

export default function CoachPage() {
  const router = useRouter();
  const { userId, loading: whopLoading, hasAccess, checkingAccess } = useWhop();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function initCoach() {
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

    initCoach();
  }, [router, userId, whopLoading]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !goal || sending) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          goal: goal,
          history: messages,
          userId: userId, // RAG: Pass userId to fetch financial context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  // Check access
  if (!hasAccess && !checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LockedFeature featureName="AI Financial Coach" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Financial Coach</h1>
          <p className="text-gray-600">
            Get personalized financial advice powered by advanced AI
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-6">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ask me anything about money!</h3>
                <p className="text-gray-600 mb-8 text-center max-w-md">
                  I can help with savings strategies, debt payoff plans, investment basics, and more.
                </p>
                <div className="space-y-2 w-full max-w-md">
                  <button
                    onClick={() => setInputMessage("How much should I save each month to reach my goal?")}
                    className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    💰 How much should I save each month to reach my goal?
                  </button>
                  <button
                    onClick={() => setInputMessage("What's the best way to start investing as a student?")}
                    className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    📈 What's the best way to start investing as a student?
                  </button>
                  <button
                    onClick={() => setInputMessage("Should I pay off debt or save for emergencies first?")}
                    className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    💸 Should I pay off debt or save for emergencies first?
                  </button>
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
                placeholder="Ask me anything about money..."
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
