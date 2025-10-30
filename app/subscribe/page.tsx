'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscribePage() {
  const router = useRouter();
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

  useEffect(() => {
    // Get the checkout URL from environment
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    if (companyId) {
      setCheckoutUrl(`https://whop.com/checkout/${companyId}`);
    }
  }, []);

  const handleSubscribe = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      alert('Checkout URL not configured. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">💰</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Your AI Financial Coach
          </h1>
          <p className="text-xl text-gray-600">
            Personalized guidance to achieve your financial goals
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-black">
            {/* Popular Badge */}
            <div className="bg-black text-white text-center py-2 font-semibold text-sm">
              MOST POPULAR
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-sm text-gray-600 mb-2">Monthly Subscription</div>
                <div className="flex items-center justify-center">
                  <span className="text-6xl font-bold text-gray-900">$10</span>
                  <span className="text-2xl text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Cancel anytime, no commitment</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-gray-900 text-center mb-4">Everything Included:</h3>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">24/7 AI Financial Coach</p>
                    <p className="text-sm text-gray-600">Powered by Claude Sonnet 4.5 - get instant advice anytime</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Personalized Goal Tracking</p>
                    <p className="text-sm text-gray-600">Track progress with visual charts and milestone celebrations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Region-Specific Advice</p>
                    <p className="text-sm text-gray-600">Tailored for US, UK, and EU financial systems</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Daily Financial Tips</p>
                    <p className="text-sm text-gray-600">Personalized insights based on your goals and habits</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Credit Score Education</p>
                    <p className="text-sm text-gray-600">Learn how to build and maintain great credit</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">First Steps Guidance</p>
                    <p className="text-sm text-gray-600">Actionable steps tailored to your specific goals</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg mb-4"
              >
                Start Your Journey - $10/month
              </button>

              <p className="text-xs text-center text-gray-500">
                Secure payment powered by Whop • Cancel anytime
              </p>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-md">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Cancel anytime, no questions asked</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-4">Trusted by students achieving their financial goals</p>
            <div className="flex justify-center items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Based on research with 659 university students</p>
          </div>
        </div>
      </main>
    </div>
  );
}
