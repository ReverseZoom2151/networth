'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserGoal } from '@/lib/types';

interface WhopContextType {
  isWhopApp: boolean;
  userId: string | null;
  userEmail: string | null;
  loading: boolean;
  hasAccess: boolean;
  checkingAccess: boolean;
}

const WhopContext = createContext<WhopContextType>({
  isWhopApp: false,
  userId: null,
  userEmail: null,
  loading: true,
  hasAccess: false,
  checkingAccess: true,
});

// Helper to check if in iframe
function isInWhop(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return false;
  }
}

export function WhopProvider({ children }: { children: ReactNode }) {
  const [contextValue, setContextValue] = useState<WhopContextType>({
    isWhopApp: false,
    userId: null,
    userEmail: null,
    loading: true,
    hasAccess: false,
    checkingAccess: true,
  });

  useEffect(() => {
    async function initWhop() {
      const inWhop = isInWhop();

      if (inWhop) {
        // In Whop mode - get user from parent frame via postMessage
        // For development, use environment variable as fallback
        const devUserId = process.env.NEXT_PUBLIC_WHOP_DEV_USER_ID || 'whop-dev-user';

        console.log('[Whop Auth] Running in iframe mode, using dev user ID:', devUserId);

        setContextValue({
          isWhopApp: true,
          userId: devUserId,
          userEmail: null,
          loading: false,
          hasAccess: false,
          checkingAccess: true,
        });

        // Check membership access
        checkAccess(devUserId);
      } else {
        // Standalone mode (not in Whop)
        initStandaloneMode();
      }
    }

    function initStandaloneMode() {
      const standaloneUserId = 'standalone-user';

      setContextValue({
        isWhopApp: false,
        userId: standaloneUserId,
        userEmail: null,
        loading: false,
        hasAccess: false,
        checkingAccess: true,
      });

      // Check membership access
      checkAccess(standaloneUserId);
    }

    async function checkAccess(userId: string) {
      try {
        const response = await fetch('/api/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error('Access check failed');
        }

        const data = await response.json();

        setContextValue(prev => ({
          ...prev,
          hasAccess: data.hasAccess || false,
          checkingAccess: false,
        }));
      } catch (error) {
        console.error('Error checking access:', error);
        setContextValue(prev => ({
          ...prev,
          hasAccess: false,
          checkingAccess: false,
        }));
      }
    }

    initWhop();
  }, []);

  return (
    <WhopContext.Provider value={contextValue}>
      {children}
    </WhopContext.Provider>
  );
}

export function useWhop() {
  return useContext(WhopContext);
}

// Storage abstraction using Whop metadata API
export class UserStorage {
  /**
   * Set user's goal in Whop metadata
   */
  static async setGoal(userId: string, goal: UserGoal): Promise<void> {
    if (isInWhop() && userId !== 'standalone-user') {
      try {
        // Store in Whop user metadata
        await fetch('/api/whop/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            key: 'goal',
            value: goal,
          }),
        });
      } catch (error) {
        console.error('Error saving to Whop metadata:', error);
        // Fallback to localStorage
        localStorage.setItem(`whop_goal_${userId}`, JSON.stringify(goal));
      }
    } else {
      // Standalone mode: use localStorage
      localStorage.setItem('userGoal', JSON.stringify(goal));
    }
  }

  /**
   * Get user's goal from Whop metadata
   */
  static async getGoal(userId: string): Promise<UserGoal | null> {
    try {
      if (isInWhop() && userId !== 'standalone-user') {
        // Try to fetch from Whop metadata first
        const response = await fetch('/api/whop/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            key: 'goal',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.value) {
            return data.value as UserGoal;
          }
        }

        // Fallback to localStorage if metadata not found
        const stored = localStorage.getItem(`whop_goal_${userId}`);
        return stored ? JSON.parse(stored) : null;
      } else {
        // Standalone mode: use localStorage
        const stored = localStorage.getItem('userGoal');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      return null;
    }
  }

  /**
   * Mark onboarding as complete in Whop metadata
   */
  static async setOnboardingComplete(userId: string): Promise<void> {
    if (isInWhop() && userId !== 'standalone-user') {
      try {
        await fetch('/api/whop/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            key: 'onboarding_complete',
            value: true,
          }),
        });
      } catch (error) {
        console.error('Error saving onboarding status:', error);
        localStorage.setItem(`whop_onboarding_${userId}`, 'true');
      }
    } else {
      localStorage.setItem('onboardingCompleted', 'true');
    }
  }

  /**
   * Check if onboarding is complete
   */
  static async isOnboardingComplete(userId: string): Promise<boolean> {
    try {
      if (isInWhop() && userId !== 'standalone-user') {
        const response = await fetch('/api/whop/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            key: 'onboarding_complete',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.value !== undefined) {
            return data.value === true;
          }
        }

        // Fallback to localStorage
        return localStorage.getItem(`whop_onboarding_${userId}`) === 'true';
      } else {
        return localStorage.getItem('onboardingCompleted') === 'true';
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Clear user data
   */
  static async clear(userId: string): Promise<void> {
    if (isInWhop() && userId !== 'standalone-user') {
      try {
        // Clear Whop metadata
        await fetch('/api/whop/metadata', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error('Error clearing Whop metadata:', error);
      }
      // Also clear localStorage fallback
      localStorage.removeItem(`whop_goal_${userId}`);
      localStorage.removeItem(`whop_onboarding_${userId}`);
    } else {
      localStorage.clear();
    }
  }
}
