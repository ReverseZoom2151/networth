'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop, UserStorage } from '@/app/providers';

export default function HomePage() {
  const router = useRouter();
  const { userId, loading } = useWhop();

  useEffect(() => {
    async function checkOnboarding() {
      if (loading || !userId) return;

      // Check if user has completed onboarding
      const onboardingCompleted = await UserStorage.isOnboardingComplete(userId);

      if (onboardingCompleted) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }

    checkOnboarding();
  }, [router, userId, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <img src="/logo.png" alt="Networth" className="w-20 h-20 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-900 font-medium">Loading Networth...</p>
      </div>
    </div>
  );
}
