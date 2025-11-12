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
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="border-b border-border/60 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-muted transition-colors hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mb-4 text-5xl">💰</div>
          <h1 className="mb-3 text-4xl font-bold text-foreground">
            Your AI Financial Coach
          </h1>
          <p className="text-xl text-muted">
            Personalized guidance to achieve your financial goals
          </p>
        </div>

        {/* Pricing Card */}
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-2xl border-4 border-border/80 bg-surface shadow-2xl transition-colors">
            {/* Popular Badge */}
            <div className="bg-[var(--button-primary-bg)] py-2 text-center text-sm font-semibold text-[color:var(--button-primary-fg)]">
              MOST POPULAR
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="mb-6 text-center">
                <div className="mb-2 text-sm text-muted">Monthly Subscription</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-6xl font-bold text-foreground">$10</span>
                  <span className="text-2xl text-muted">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Cancel anytime, no commitment</p>
              </div>

              {/* Features */}
              <div className="mb-8 space-y-4">
                <h3 className="mb-4 text-center font-semibold text-foreground">Everything Included:</h3>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">24/7 AI Financial Coach</p>
                    <p className="text-sm text-muted">Powered by Claude Sonnet 4.5 - get instant advice anytime</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">Personalized Goal Tracking</p>
                    <p className="text-sm text-muted">Track progress with visual charts and milestone celebrations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">Region-Specific Advice</p>
                    <p className="text-sm text-muted">Tailored for US, UK, and EU financial systems</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">Daily Financial Tips</p>
                    <p className="text-sm text-muted">Personalized insights based on your goals and habits</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">Credit Score Education</p>
                    <p className="text-sm text-muted">Learn how to build and maintain great credit</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-foreground">First Steps Guidance</p>
                    <p className="text-sm text-muted">Actionable steps tailored to your specific goals</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                className="mb-4 w-full rounded-xl bg-[var(--button-primary-bg)] px-6 py-4 text-lg font-bold text-[color:var(--button-primary-fg)] transition-opacity hover:opacity-90"
              >
                Start Your Journey - $10/month
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Secure payment powered by Whop • Cancel anytime
              </p>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 rounded-full bg-surface px-6 py-3 shadow-md transition-colors">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-muted">Cancel anytime, no questions asked</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm text-muted">Trusted by students achieving their financial goals</p>
            <div className="flex items-center justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="h-5 w-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Based on research with 659 university students</p>
          </div>
        </div>
      </main>
    </div>
  );
}
