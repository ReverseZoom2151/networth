'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card, LoadingScreen } from '@/components/ui';

const MODULES = [
  {
    id: 'module_1',
    number: 1,
    title: 'What is Investing?',
    icon: '📚',
    duration: '5 min',
    content: {
      intro: 'Investing means putting your money to work to grow over time, rather than just letting it sit in a checking account.',
      sections: [
        {
          heading: 'The Basic Concept',
          text: 'When you invest, you buy assets (like stocks, bonds, or funds) that have the potential to increase in value or generate income. Over time, this can help your money grow faster than inflation.',
        },
        {
          heading: 'Why It Matters',
          text: 'A savings account might earn 5% interest, but historically, the stock market returns about 10% annually over the long term. That difference compounds significantly over decades.',
        },
        {
          heading: 'Simple Example',
          text: 'Imagine you invest $100/month starting at age 22. By age 65 (43 years) at 10% annual return, you\'d have approximately $948,000. In a 5% savings account? Only $214,000. The difference is $734,000!',
        },
        {
          heading: 'Key Takeaway',
          text: 'Investing isn\'t just for wealthy people. It\'s a tool that helps anyone build wealth over time by letting their money work for them through compound growth.',
        },
      ],
    },
  },
  {
    id: 'module_2',
    number: 2,
    title: 'Risk & Return',
    icon: '⚖️',
    duration: '5 min',
    content: {
      intro: 'All investments involve some level of risk. Understanding the relationship between risk and potential return is crucial.',
      sections: [
        {
          heading: 'The Risk-Return Tradeoff',
          text: 'Generally, investments with higher potential returns come with higher risk of losing money in the short term. Lower-risk investments typically offer lower returns but more stability.',
        },
        {
          heading: 'Types of Risk',
          text: 'Market risk (overall market goes down), company risk (specific business fails), inflation risk (your money loses purchasing power), and liquidity risk (can\'t access money quickly).',
        },
        {
          heading: 'Risk Examples',
          list: [
            'Low Risk: High-yield savings (5%), US Treasury bonds (4-5%)',
            'Medium Risk: Balanced funds (50% stocks, 50% bonds) - 7-8% historic return',
            'High Risk: Individual stocks, growth funds - 10%+ potential but volatile',
          ],
        },
        {
          heading: 'Managing Risk',
          text: 'Your time horizon matters. If you need money in 2 years, keep it safe. If you won\'t need it for 30 years, you can handle more volatility for higher potential returns. Young investors can typically afford more risk.',
        },
      ],
    },
  },
  {
    id: 'module_3',
    number: 3,
    title: 'Diversification',
    icon: '🎯',
    duration: '5 min',
    content: {
      intro: 'Don\'t put all your eggs in one basket. Diversification is the practice of spreading your investments to reduce risk.',
      sections: [
        {
          heading: 'Why Diversify?',
          text: 'If you invest everything in one company and it fails, you lose everything. But if you own 100 companies and one fails, you only lose 1%. Diversification protects you from single-point failures.',
        },
        {
          heading: 'How to Diversify',
          list: [
            'Across companies: Own stocks in many businesses, not just one',
            'Across sectors: Tech, healthcare, energy, consumer goods, etc.',
            'Across asset types: Stocks, bonds, real estate, commodities',
            'Across geography: US, international developed, emerging markets',
          ],
        },
        {
          heading: 'Easy Diversification',
          text: 'Index funds and ETFs make diversification simple. A single S&P 500 fund owns 500 companies. A total market fund owns thousands. This spreads risk automatically.',
        },
        {
          heading: 'Real Example',
          text: 'In 2008, financial stocks crashed 50%+. But someone with a diversified portfolio (tech, healthcare, utilities, bonds) lost less because other sectors held up better. Diversification cushions falls.',
        },
      ],
    },
  },
  {
    id: 'module_4',
    number: 4,
    title: 'Getting Started',
    icon: '🚀',
    duration: '5 min',
    content: {
      intro: 'Starting to invest is easier than you think. Here\'s a practical roadmap for beginners.',
      sections: [
        {
          heading: 'Step 1: Financial Foundation',
          text: 'Before investing, have a small emergency fund ($500-1000 for students) and pay off high-interest debt (credit cards above 15%). This prevents you from having to sell investments at bad times.',
        },
        {
          heading: 'Step 2: Choose a Platform',
          text: 'For beginners: Robo-advisors (Fidelity Go, Betterment) do everything automatically. For DIY: Brokers like Vanguard or Schwab let you pick your own investments. Most have $0 minimums now.',
        },
        {
          heading: 'Step 3: Start Small',
          list: [
            'Begin with whatever you can afford: $25, $50, $100/month',
            'Set up automatic transfers so you invest consistently',
            'Don\'t wait for the "perfect time" - time in market beats timing the market',
          ],
        },
        {
          heading: 'Step 4: Simple Strategy',
          text: 'For most beginners: Start with a target-date fund or a simple 3-fund portfolio (US stocks, international stocks, bonds). Adjust stock/bond ratio based on your risk tolerance. Rebalance once per year.',
        },
        {
          heading: 'Important Mindset',
          text: 'Investing is a marathon, not a sprint. Your portfolio will go up and down. That\'s normal. Stay consistent, avoid panic selling, and focus on your long-term goals.',
        },
      ],
    },
  },
  {
    id: 'module_5',
    number: 5,
    title: 'Common Mistakes',
    icon: '⚠️',
    duration: '5 min',
    content: {
      intro: 'Learn from others\' mistakes. Here are the most common investing errors and how to avoid them.',
      sections: [
        {
          heading: 'Mistake #1: Panic Selling',
          text: 'When the market drops 20%, beginners often sell in fear. Then they miss the recovery. Historical data shows staying invested beats trying to time the market. Down markets are buying opportunities, not exit signals.',
        },
        {
          heading: 'Mistake #2: Following Hype',
          text: 'Avoid investing based on social media tips, meme stocks, or "hot" cryptocurrencies. These are often at peak prices. By the time everyone\'s talking about it, the big gains already happened. Stick to your plan.',
        },
        {
          heading: 'Mistake #3: Ignoring Fees',
          text: 'A fund charging 1.5% vs 0.05% might seem small, but over 30 years that difference costs you $150,000 on a $500,000 portfolio. Always check expense ratios and trading fees. Low-cost index funds usually win.',
        },
        {
          heading: 'Mistake #4: Not Diversifying',
          text: 'Putting everything in one stock (even your favorite company) is gambling, not investing. Companies can fail unpredictably. Always diversify across many investments to reduce risk.',
        },
        {
          heading: 'Mistake #5: Waiting to Invest',
          text: 'Many people wait until they "have more money" or "understand everything." But time in the market is more valuable than timing the market. Starting with $50/month at 22 beats starting with $200/month at 32.',
        },
        {
          heading: 'The Success Formula',
          list: [
            '✓ Start early, even with small amounts',
            '✓ Invest consistently, regardless of market conditions',
            '✓ Keep costs low with index funds',
            '✓ Diversify broadly across assets',
            '✓ Stay invested for the long term',
            '✓ Ignore short-term noise and emotions',
          ],
        },
      ],
    },
  },
];

export default function InvestLearnPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState<number>(1);

  useEffect(() => {
    if (whopLoading || !userId) return;
    fetchProfile();
  }, [userId, whopLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invest/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch investment profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    try {
      await fetch('/api/invest/module-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, moduleId }),
      });

      // Update local state
      setProfile((prev: any) => ({
        ...prev,
        modulesCompleted: [...(prev?.modulesCompleted || []), moduleId],
      }));

      // Move to next module if not the last one
      if (currentModule < MODULES.length) {
        setCurrentModule(currentModule + 1);
      }
    } catch (error) {
      console.error('Failed to mark module complete:', error);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading modules..." />;
  }

  const module = MODULES.find((m) => m.number === currentModule);
  if (!module) {
    return <div>Module not found</div>;
  }

  const isCompleted = profile?.modulesCompleted?.includes(module.id);
  const completedCount = profile?.modulesCompleted?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/invest')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Investment Hub
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Investment Education</h1>
              <p className="text-sm text-gray-600 mt-1">
                Progress: {completedCount}/{MODULES.length} modules completed
              </p>
            </div>
            <div className="text-5xl">{module.icon}</div>
          </div>
        </div>

        {/* Module Navigation */}
        <Card className="p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {MODULES.map((m) => {
              const completed = profile?.modulesCompleted?.includes(m.id);
              const isCurrent = m.number === currentModule;

              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentModule(m.number)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isCurrent
                      ? 'bg-purple-600 text-white'
                      : completed
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{m.icon}</span>
                  {m.number}. {m.title.split(' ')[0]}
                  {completed && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Module Content */}
        <Card className="p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
              <span className="text-sm text-gray-500">{module.duration}</span>
            </div>
            <p className="text-lg text-gray-700">{module.content.intro}</p>
          </div>

          <div className="space-y-6">
            {module.content.sections.map((section, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{section.heading}</h3>
                {section.text && <p className="text-gray-700 leading-relaxed">{section.text}</p>}
                {section.list && (
                  <ul className="space-y-2 mt-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="text-gray-700 flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentModule(Math.max(1, currentModule - 1))}
                disabled={currentModule === 1}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous Module
              </button>

              {!isCompleted ? (
                <button
                  onClick={() => handleCompleteModule(module.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Mark Complete ✓
                </button>
              ) : (
                <span className="text-green-600 font-semibold">✓ Completed</span>
              )}

              {currentModule < MODULES.length ? (
                <button
                  onClick={() => setCurrentModule(currentModule + 1)}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  Next Module →
                </button>
              ) : (
                <button
                  onClick={() => router.push('/invest/platforms')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                >
                  View Platforms →
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Completion CTA */}
        {completedCount === MODULES.length && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Congratulations! You've completed all modules!
            </h3>
            <p className="text-gray-700 mb-4">
              You now have the foundation to start your investment journey.
            </p>
            <button
              onClick={() => router.push('/invest/platforms')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Explore Investment Platforms →
            </button>
          </Card>
        )}
      </main>
    </div>
  );
}
