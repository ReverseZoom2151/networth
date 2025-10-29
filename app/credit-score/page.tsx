'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWhop, UserStorage } from '@/app/providers';
import { Region } from '@/lib/types';
import { Navigation } from '@/components/Navigation';

export default function CreditScorePage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [region, setRegion] = useState<Region>('US');
  const [loading, setLoading] = useState(true);
  const [dynamicTips, setDynamicTips] = useState<string[]>([]);

  useEffect(() => {
    async function loadUserRegion() {
      if (whopLoading || !userId) return;

      const goal = await UserStorage.getGoal(userId);
      if (goal?.region) {
        setRegion(goal.region);
      }
      setLoading(false);
    }

    loadUserRegion();
  }, [userId, whopLoading]);

  // Fetch dynamic tips from database
  useEffect(() => {
    async function fetchTips() {
      try {
        const response = await fetch(`/api/content/tips?region=${region}&limit=5`);
        const data = await response.json();

        if (data.tips && data.tips.length > 0 && data.source === 'database') {
          setDynamicTips(data.tips.map((tip: any) => tip.tipText));
          console.log('[CreditScore] Loaded tips from database:', data.tips.length);
        } else {
          console.log('[CreditScore] Using fallback tips');
        }
      } catch (error) {
        console.error('[CreditScore] Error fetching tips:', error);
      }
    }

    if (region) {
      fetchTips();
    }
  }, [region]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const getRegionContent = () => {
    switch (region) {
      case 'UK':
        return {
          title: 'Understanding Your Credit Score',
          subtitle: 'Essential knowledge for UK residents',
          scoreRange: '0-999',
          providers: ['Experian', 'Equifax', 'TransUnion'],
          freeServices: ['ClearScore', 'Credit Karma UK', 'Experian (free account)'],
          factors: [
            { icon: '💳', title: 'Payment History', desc: 'Pay bills on time, every time', weight: '35%' },
            { icon: '💰', title: 'Credit Utilization', desc: 'Keep balances below 30% of limit', weight: '30%' },
            { icon: '📅', title: 'Credit History Length', desc: 'Older accounts help your score', weight: '15%' },
            { icon: '🆕', title: 'New Credit', desc: 'Too many applications hurt your score', weight: '10%' },
            { icon: '🔀', title: 'Credit Mix', desc: 'Different types of credit help', weight: '10%' },
          ],
          tips: [
            'Register on the electoral roll - it proves your identity',
            'Keep old credit accounts open to maintain history',
            'Check your credit report for errors (1 in 4 have mistakes!)',
            'Avoid payday loans - they harm your credit score',
            'Use a credit builder card if starting from scratch',
          ],
          impact: 'Your credit score affects mortgage rates, credit card approvals, phone contracts, and even rental applications.',
        };
      case 'EU':
        return {
          title: 'Understanding Your Credit Score',
          subtitle: 'Essential knowledge for EU residents',
          scoreRange: 'Varies by country (typically 300-850 or 0-1000)',
          providers: ['SCHUFA (Germany)', 'Creditsafe', 'National credit bureaus'],
          freeServices: ['National credit bureau websites', 'Bank statements'],
          factors: [
            { icon: '💳', title: 'Payment History', desc: 'Pay bills and loans on time', weight: '35%' },
            { icon: '💰', title: 'Outstanding Debt', desc: 'Lower debt improves your score', weight: '30%' },
            { icon: '📅', title: 'Credit History', desc: 'Established history helps', weight: '15%' },
            { icon: '🆕', title: 'New Credit', desc: 'Multiple applications can hurt', weight: '10%' },
            { icon: '🔀', title: 'Account Types', desc: 'Mix of credit types helps', weight: '10%' },
          ],
          tips: [
            'In Germany, SCHUFA score is crucial for rentals and contracts',
            'Always pay utility bills on time - they affect your score',
            'Avoid overdrafts and negative bank balances',
            'Check your credit report annually for free',
            'Build credit slowly with a low-limit credit card',
          ],
          impact: 'Your credit score affects loan approvals, rental applications, phone contracts, and interest rates across the EU.',
        };
      default: // US
        return {
          title: 'Credit Score 101',
          subtitle: 'Everything you need to know',
          scoreRange: '300-850',
          providers: ['Experian', 'Equifax', 'TransUnion'],
          freeServices: ['AnnualCreditReport.com (official)', 'Credit Karma', 'Credit Sesame'],
          factors: [
            { icon: '💳', title: 'Payment History', desc: 'Most important factor - pay on time!', weight: '35%' },
            { icon: '💰', title: 'Credit Utilization', desc: 'Keep balances under 30% of limits', weight: '30%' },
            { icon: '📅', title: 'Credit History Length', desc: 'Longer history is better', weight: '15%' },
            { icon: '🆕', title: 'New Credit', desc: 'Too many new accounts hurt', weight: '10%' },
            { icon: '🔀', title: 'Credit Mix', desc: 'Cards, loans, mortgage variety helps', weight: '10%' },
          ],
          tips: [
            'Check your credit report free at AnnualCreditReport.com',
            'Never close your oldest credit card - it helps your history',
            'Set up autopay to never miss a payment',
            'Dispute any errors on your credit report immediately',
            'Becoming an authorized user on a good account can help',
          ],
          impact: 'Your credit score affects mortgage rates, car loans, credit card approvals, insurance premiums, and even job applications.',
        };
    }
  };

  const content = getRegionContent();

  // Use dynamic tips if available, otherwise use fallback tips
  const tipsToDisplay = dynamicTips.length > 0 ? dynamicTips : content.tips;

  const getScoreRating = (score: number) => {
    if (region === 'UK') {
      if (score >= 961) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
      if (score >= 881) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
      if (score >= 721) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score >= 561) return { label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { label: 'Very Poor', color: 'text-red-600', bg: 'bg-red-50' };
    } else {
      // US scale
      if (score >= 800) return { label: 'Exceptional', color: 'text-green-600', bg: 'bg-green-50' };
      if (score >= 740) return { label: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50' };
      if (score >= 670) return { label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score >= 580) return { label: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
          <p className="text-lg text-white/90">{content.subtitle}</p>
        </div>

        {/* Research Insight */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Did You Know?</h3>
              <p className="text-gray-700">
                Research shows that <strong>79% of university students don't understand credit scores</strong>.
                You're not alone - but understanding this can save you thousands in the future!
              </p>
            </div>
          </div>
        </div>

        {/* What is a Credit Score */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is a Credit Score?</h2>
          <p className="text-gray-700 mb-4">
            Your credit score is a number that represents how reliable you are at borrowing and repaying money.
            Think of it as your financial reputation score - lenders use it to decide whether to lend to you and at what interest rate.
          </p>
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="font-semibold text-primary-900 mb-1">Score Range: {content.scoreRange}</p>
            <p className="text-sm text-primary-700">Higher is better - more trustworthy borrower</p>
          </div>
        </div>

        {/* Score Ranges */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Score Ranges Explained</h2>
          <div className="space-y-3">
            {region === 'UK' ? (
              <>
                {[
                  { range: '961-999', label: 'Excellent', desc: 'Best rates and approvals' },
                  { range: '881-960', label: 'Good', desc: 'Great rates available' },
                  { range: '721-880', label: 'Fair', desc: 'Average rates' },
                  { range: '561-720', label: 'Poor', desc: 'Limited options, higher rates' },
                  { range: '0-560', label: 'Very Poor', desc: 'Difficulty getting credit' },
                ].map((item) => {
                  const rating = getScoreRating(parseInt(item.range.split('-')[0]));
                  return (
                    <div key={item.range} className={`${rating.bg} rounded-lg p-4 border border-gray-200`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${rating.color}`}>{item.range}</p>
                          <p className="text-sm text-gray-600">{item.label} - {item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {[
                  { range: '800-850', label: 'Exceptional', desc: 'Best rates everywhere' },
                  { range: '740-799', label: 'Very Good', desc: 'Above average rates' },
                  { range: '670-739', label: 'Good', desc: 'Near average rates' },
                  { range: '580-669', label: 'Fair', desc: 'Below average rates' },
                  { range: '300-579', label: 'Poor', desc: 'Difficulty getting approved' },
                ].map((item) => {
                  const rating = getScoreRating(parseInt(item.range.split('-')[0]));
                  return (
                    <div key={item.range} className={`${rating.bg} rounded-lg p-4 border border-gray-200`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${rating.color}`}>{item.range}</p>
                          <p className="text-sm text-gray-600">{item.label} - {item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* What Affects Your Score */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Affects Your Score?</h2>
          <div className="space-y-4">
            {content.factors.map((factor) => (
              <div key={factor.title} className="flex items-start space-x-4">
                <span className="text-3xl flex-shrink-0">{factor.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{factor.title}</h3>
                    <span className="text-sm font-bold text-primary-600">{factor.weight}</span>
                  </div>
                  <p className="text-sm text-gray-600">{factor.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Check Your Score */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Check Your Score (For Free!)</h2>
          <p className="text-gray-700 mb-4">
            You have the right to check your credit score for free. Here are trusted services:
          </p>
          <div className="space-y-2">
            {content.freeServices.map((service) => (
              <div key={service} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-900">{service}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Tips to Improve Your Score</h2>
          <div className="space-y-3">
            {tipsToDisplay.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why It Matters */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Why Your Credit Score Matters</h2>
          <p className="text-gray-700">{content.impact}</p>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">Real Impact Example:</p>
            <p className="text-sm text-gray-600">
              {region === 'UK'
                ? 'On a £200,000 mortgage, the difference between "Fair" and "Excellent" credit can cost you £30,000+ in extra interest over 25 years.'
                : region === 'EU'
                ? 'On a €200,000 mortgage, good credit can save you €20,000+ in interest over 20 years.'
                : 'On a $300,000 mortgage, the difference between "Fair" and "Excellent" credit can cost you $100,000+ in extra interest over 30 years.'}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-500 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Start Building Your Credit Today</h3>
          <p className="mb-4">
            Understanding your credit score is the first step. Check it for free and start improving it now!
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Your Financial Journey
          </button>
        </div>
      </main>
    </div>
  );
}
