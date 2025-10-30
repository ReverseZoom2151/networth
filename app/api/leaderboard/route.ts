// API route for leaderboard
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/leaderboard - Get top savers leaderboard
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || 'streak'; // 'streak', 'savings', 'goals'

    // Get users who allow leaderboard visibility
    const sharingSettings = await prisma.userAchievementShare.findMany({
      where: {
        allowLeaderboard: true,
      },
    });

    const allowedUserIds = sharingSettings.map(s => s.userId);

    if (allowedUserIds.length === 0) {
      // Return mock data if no users opted in
      return NextResponse.json([
        {
          id: '1',
          userName: 'Top Saver',
          rank: 1,
          currentStreak: 145,
          longestStreak: 180,
          totalSavings: 25000,
          goalsCompleted: 3,
          isAnonymous: true,
          isCurrentUser: false,
        },
        {
          id: '2',
          userName: 'Consistent Saver',
          rank: 2,
          currentStreak: 98,
          longestStreak: 120,
          totalSavings: 18500,
          goalsCompleted: 2,
          isAnonymous: true,
          isCurrentUser: false,
        },
        {
          id: '3',
          userName: 'Goal Crusher',
          rank: 3,
          currentStreak: 67,
          longestStreak: 89,
          totalSavings: 15000,
          goalsCompleted: 2,
          isAnonymous: true,
          isCurrentUser: false,
        },
      ]);
    }

    // Build leaderboard based on category
    let leaderboardData = [];

    if (category === 'streak') {
      // Get users with highest current streaks
      const streaks = await prisma.streak.findMany({
        where: {
          userId: {
            in: allowedUserIds,
          },
        },
        orderBy: {
          currentStreak: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Group by user and take their best streak
      const userStreaks = new Map();
      for (const streak of streaks) {
        if (!userStreaks.has(streak.userId) || userStreaks.get(streak.userId).currentStreak < streak.currentStreak) {
          userStreaks.set(streak.userId, streak);
        }
      }

      leaderboardData = Array.from(userStreaks.values())
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, limit);
    } else if (category === 'savings') {
      // Get users with highest savings
      const goals = await prisma.userGoal.findMany({
        where: {
          userId: {
            in: allowedUserIds,
          },
        },
        orderBy: {
          currentSavings: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      leaderboardData = goals;
    }

    // Get user goals for total savings
    const userGoals = await prisma.userGoal.findMany({
      where: {
        userId: {
          in: allowedUserIds,
        },
      },
    });

    const goalsMap = new Map(userGoals.map(g => [g.userId, g]));

    // Get achievements count for goals completed
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: {
          in: allowedUserIds,
        },
        type: 'savings_goal',
      },
    });

    const goalsCompletedMap = new Map();
    for (const achievement of achievements) {
      goalsCompletedMap.set(
        achievement.userId,
        (goalsCompletedMap.get(achievement.userId) || 0) + 1
      );
    }

    // Get all streaks for longest streak calculation
    const allStreaks = await prisma.streak.findMany({
      where: {
        userId: {
          in: allowedUserIds,
        },
      },
    });

    const longestStreakMap = new Map();
    for (const streak of allStreaks) {
      const current = longestStreakMap.get(streak.userId) || 0;
      if (streak.longestStreak > current) {
        longestStreakMap.set(streak.userId, streak.longestStreak);
      }
    }

    // Get sharing settings map for anonymity
    const settingsMap = new Map(sharingSettings.map(s => [s.userId, s]));

    // Format leaderboard entries
    const formattedEntries = leaderboardData.map((entry, index) => {
      const entryUserId = 'userId' in entry ? entry.userId : entry.id;
      const user = 'user' in entry ? entry.user : null;
      const settings = settingsMap.get(entryUserId);
      const isAnonymous = settings?.anonymousSharing || false;
      const isCurrentUser = entryUserId === userId;
      const goal = goalsMap.get(entryUserId);

      let currentStreak = 0;
      if ('currentStreak' in entry) {
        currentStreak = entry.currentStreak;
      } else {
        // Get max current streak for this user
        const userStreaks = allStreaks.filter(s => s.userId === entryUserId);
        currentStreak = Math.max(...userStreaks.map(s => s.currentStreak), 0);
      }

      return {
        id: entryUserId,
        userName: isAnonymous ? undefined : (user?.email?.split('@')[0] || 'User'),
        rank: index + 1,
        currentStreak,
        longestStreak: longestStreakMap.get(entryUserId) || 0,
        totalSavings: goal?.currentSavings || 0,
        goalsCompleted: goalsCompletedMap.get(entryUserId) || 0,
        isAnonymous,
        isCurrentUser,
      };
    });

    // If current user is not in top entries, add them at the end
    if (userId && !formattedEntries.some(e => e.isCurrentUser)) {
      const userGoal = goalsMap.get(userId);
      const userStreaks = allStreaks.filter(s => s.userId === userId);
      const maxCurrentStreak = Math.max(...userStreaks.map(s => s.currentStreak), 0);
      const settings = settingsMap.get(userId);

      // Find user's actual rank
      let userRank = formattedEntries.length + 1;
      if (category === 'streak') {
        const allUserStreaks = allStreaks
          .reduce((acc, s) => {
            if (!acc.has(s.userId) || acc.get(s.userId) < s.currentStreak) {
              acc.set(s.userId, s.currentStreak);
            }
            return acc;
          }, new Map());
        const sortedStreaks = Array.from(allUserStreaks.values()).sort((a, b) => b - a);
        userRank = sortedStreaks.indexOf(maxCurrentStreak) + 1;
      }

      formattedEntries.push({
        id: userId,
        userName: 'You',
        rank: userRank,
        currentStreak: maxCurrentStreak,
        longestStreak: longestStreakMap.get(userId) || 0,
        totalSavings: userGoal?.currentSavings || 0,
        goalsCompleted: goalsCompletedMap.get(userId) || 0,
        isAnonymous: false,
        isCurrentUser: true,
      });
    }

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
