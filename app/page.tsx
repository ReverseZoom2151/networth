'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop, UserStorage } from '@/app/providers';
import { LoadingScreen } from '@/components/ui';

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

  return <LoadingScreen message="Welcome to Networth" />;
}
