'use client';

import { useRouter } from 'next/navigation';

interface SubscriptionGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Subscription Gate Component
 *
 * Shows a paywall UI when user doesn't have access
 * Displays children when user has active subscription
 */
export function SubscriptionGate({
  children,
  title = 'Unlock Your AI Financial Coach',
  description = 'Get personalized financial advice, track your progress, and achieve your goals.',
}: SubscriptionGateProps) {
  const router = useRouter();

  const handleSubscribe = () => {
    // Redirect to subscribe page
    router.push('/subscribe');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Features List */}
        <div className="text-left mb-6 space-y-3">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">24/7 AI Financial Coach powered by Claude</span>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Personalized goal tracking & progress visualization</span>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Milestone celebrations & achievement tracking</span>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Region-specific advice (US, UK, EU)</span>
          </div>
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Daily personalized financial tips</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">Just</div>
          <div className="text-4xl font-bold text-primary-600">$10<span className="text-lg">/month</span></div>
          <div className="text-sm text-gray-600 mt-1">Cancel anytime</div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubscribe}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors mb-3"
        >
          Subscribe Now
        </button>

        <p className="text-xs text-gray-500">
          Secure payment powered by Whop
        </p>
      </div>
    </div>
  );
}

/**
 * Simple locked feature component for inline use
 */
export function LockedFeature({ featureName = 'This feature' }: { featureName?: string }) {
  const router = useRouter();

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{featureName} is Premium</h3>
      <p className="text-sm text-gray-600 mb-4">Subscribe to unlock this feature and more</p>
      <button
        onClick={() => router.push('/subscribe')}
        className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
      >
        Subscribe for $10/month
      </button>
    </div>
  );
}
