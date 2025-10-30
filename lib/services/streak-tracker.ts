// Streak Tracking Service
// Automatically tracks and updates various user behavior streaks

import prisma from '@/lib/prisma';

export type StreakType =
  | 'daily_login'
  | 'budget_adherence'
  | 'savings_goal'
  | 'transaction_logging'
  | 'net_worth_check'
  | 'spending_review';

interface StreakConfig {
  type: StreakType;
  description: string;
  icon: string;
  targetCount?: number;
}

const STREAK_CONFIGS: Record<StreakType, StreakConfig> = {
  daily_login: {
    type: 'daily_login',
    description: 'Daily login streak',
    icon: '🔥',
    targetCount: 30,
  },
  budget_adherence: {
    type: 'budget_adherence',
    description: 'Days stayed within budget',
    icon: '💰',
    targetCount: 30,
  },
  savings_goal: {
    type: 'savings_goal',
    description: 'Days contributing to savings',
    icon: '🎯',
    targetCount: 30,
  },
  transaction_logging: {
    type: 'transaction_logging',
    description: 'Days logging transactions',
    icon: '📝',
    targetCount: 30,
  },
  net_worth_check: {
    type: 'net_worth_check',
    description: 'Days checking net worth',
    icon: '📊',
    targetCount: 30,
  },
  spending_review: {
    type: 'spending_review',
    description: 'Days reviewing spending',
    icon: '🔍',
    targetCount: 30,
  },
};

/**
 * Initialize default streaks for a new user
 */
export async function initializeUserStreaks(userId: string): Promise<void> {
  const streakTypes: StreakType[] = ['daily_login', 'budget_adherence', 'savings_goal'];

  for (const type of streakTypes) {
    const config = STREAK_CONFIGS[type];

    // Check if streak already exists
    const existing = await prisma.streak.findFirst({
      where: {
        userId,
        type,
      },
    });

    if (!existing) {
      await prisma.streak.create({
        data: {
          userId,
          type,
          currentStreak: 0,
          longestStreak: 0,
          lastActivity: new Date(),
          milestonesReached: {},
        },
      });
    }
  }
}

/**
 * Track daily login streak
 */
export async function trackLoginStreak(userId: string): Promise<void> {
  await updateStreak(userId, 'daily_login');
}

/**
 * Track budget adherence - call when user stays within daily budget
 */
export async function trackBudgetAdherence(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if user stayed within budget today
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: today,
        lt: tomorrow,
      },
      type: 'debit',
    },
  });

  const totalSpent = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Get user's daily budget (simplified - you can make this more sophisticated)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }, // Add dailyBudget field if it exists
  });

  // For now, assume £50 daily budget
  const dailyBudget = 50;

  if (totalSpent <= dailyBudget) {
    await updateStreak(userId, 'budget_adherence');
  }
}

/**
 * Track savings goal progress - call when user adds to savings
 */
export async function trackSavingsGoal(userId: string): Promise<void> {
  await updateStreak(userId, 'savings_goal');
}

/**
 * Track transaction logging - call when user manually logs a transaction
 */
export async function trackTransactionLogging(userId: string): Promise<void> {
  await updateStreak(userId, 'transaction_logging');
}

/**
 * Track net worth check - call when user views net worth dashboard
 */
export async function trackNetWorthCheck(userId: string): Promise<void> {
  await updateStreak(userId, 'net_worth_check');
}

/**
 * Track spending review - call when user reviews spending patterns
 */
export async function trackSpendingReview(userId: string): Promise<void> {
  await updateStreak(userId, 'spending_review');
}

/**
 * Core function to update a streak
 */
async function updateStreak(userId: string, type: StreakType): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find or create streak
  let streak = await prisma.streak.findFirst({
    where: {
      userId,
      type,
    },
  });

  if (!streak) {
    // Create new streak
    const config = STREAK_CONFIGS[type];
    streak = await prisma.streak.create({
      data: {
        userId,
        type,
        currentStreak: 1,
        longestStreak: 1,
        lastActivity: new Date(),
        milestonesReached: {},
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'streak_started',
        title: `🔥 New Streak Started!`,
        message: `You've started a ${config.description}. Keep it up!`,
        actionUrl: '/dashboard/streaks',
        category: 'achievement',
        isRead: false,
      },
    });

    return;
  }

  if (!streak.lastActivity) {
    // Initialize if missing
    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        lastActivity: new Date(),
        currentStreak: 1,
      },
    });
    return;
  }

  const lastActivity = new Date(streak.lastActivity);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Already updated today
    return;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    const newCount = streak.currentStreak + 1;
    const milestones = streak.milestonesReached as Record<string, boolean> || {};
    
    // Check if we've reached a milestone
    const milestonesToCheck = [7, 30, 100];
    for (const milestone of milestonesToCheck) {
      if (newCount === milestone && !milestones[milestone.toString()]) {
        milestones[milestone.toString()] = true;
      }
    }
    
    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newCount,
        longestStreak: Math.max(newCount, streak.longestStreak),
        lastActivity: new Date(),
        milestonesReached: milestones,
      },
    });

    // Create milestone notifications
    const config = STREAK_CONFIGS[type];
    if (newCount === 7) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_milestone',
          title: `🔥 7 Day Streak! 🎉`,
          message: `Amazing! You've maintained your ${config.description} for a full week!`,
          actionUrl: '/dashboard/streaks',
          category: 'achievement',
          isRead: false,
        },
      });
    } else if (newCount === 30) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_milestone',
          title: `🔥 30 Day Streak! 🏆`,
          message: `Incredible! A full month of ${config.description}. You're on fire!`,
          actionUrl: '/dashboard/streaks',
          category: 'achievement',
          isRead: false,
        },
      });
    } else if (newCount === 100) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_milestone',
          title: `🔥 100 Day Streak! 👑`,
          message: `Legendary! 100 days of ${config.description}. You're unstoppable!`,
          actionUrl: '/dashboard/streaks',
          category: 'achievement',
          isRead: false,
        },
      });
    } else if (newCount % 10 === 0) {
      // Every 10 days
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_milestone',
          title: `🔥 ${newCount} Day Streak!`,
          message: `Keep going! You're doing great with your ${config.description}.`,
          actionUrl: '/dashboard/streaks',
          category: 'achievement',
          isRead: false,
        },
      });
    }
  } else {
    // Streak broken - reset to 1
    const wasBestStreak = streak.currentStreak === streak.longestStreak && streak.currentStreak > 7;

    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        lastActivity: new Date(),
      },
    });

    // Notify user about broken streak (if it was significant)
    if (wasBestStreak) {
      const config = STREAK_CONFIGS[type];
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_broken',
          title: `🔥 Streak Reset`,
          message: `Your ${config.description} has been reset, but you're starting fresh today! Your best was ${streak.longestStreak} days.`,
          actionUrl: '/dashboard/streaks',
          category: 'info',
          isRead: false,
        },
      });
    }
  }
}

/**
 * Get all active streaks with progress
 */
export async function getUserStreaks(userId: string) {
  const streaks = await prisma.streak.findMany({
    where: {
      userId,
    },
    orderBy: {
      currentStreak: 'desc',
    },
  });

  return streaks.map((streak) => {
    const config = STREAK_CONFIGS[streak.type as StreakType];
    const targetCount = config?.targetCount || 30;
    return {
      ...streak,
      progressPercentage: (streak.currentStreak / targetCount) * 100,
      isOnTrack: streak.lastActivity ? isStreakOnTrack(streak.lastActivity) : false,
      daysUntilBreak: streak.lastActivity ? getDaysUntilBreak(streak.lastActivity) : 0,
    };
  });
}

/**
 * Check if streak is still on track (activity within last 24 hours)
 */
function isStreakOnTrack(lastActivityDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff <= 1;
}

/**
 * Get days until streak breaks (0 means it will break tomorrow)
 */
function getDaysUntilBreak(lastActivityDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(1 - daysDiff, 0);
}
