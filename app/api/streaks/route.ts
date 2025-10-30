// API routes for streak tracking and management
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/streaks - Get all active streaks for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const streaks = await prisma.streak.findMany({
      where: {
        userId,
      },
      orderBy: {
        currentStreak: 'desc',
      },
    });

    return NextResponse.json(streaks);
  } catch (error) {
    console.error('Failed to fetch streaks:', error);
    return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 });
  }
}

// POST /api/streaks - Create or update a streak
export async function POST(req: NextRequest) {
  try {
    const { userId, type } = await req.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and streak type are required' },
        { status: 400 }
      );
    }

    // Check if streak already exists
    const existingStreak = await prisma.streak.findFirst({
      where: {
        userId,
        type,
      },
    });

    if (existingStreak) {
      return NextResponse.json(
        { error: 'Streak already exists for this type' },
        { status: 400 }
      );
    }

    const streak = await prisma.streak.create({
      data: {
        userId,
        type,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(),
        milestonesReached: {},
      },
    });

    return NextResponse.json(streak);
  } catch (error) {
    console.error('Failed to create streak:', error);
    return NextResponse.json({ error: 'Failed to create streak' }, { status: 500 });
  }
}

// PUT /api/streaks - Update streak progress
export async function PUT(req: NextRequest) {
  try {
    const { streakId, userId, increment = true } = await req.json();

    if (!streakId && !userId) {
      return NextResponse.json(
        { error: 'Streak ID or User ID is required' },
        { status: 400 }
      );
    }

    // If userId provided, update all streaks
    if (userId && !streakId) {
      const streaks = await prisma.streak.findMany({
        where: {
          userId,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedStreaks = [];

      for (const streak of streaks) {
        if (!streak.lastActivity) {
          continue;
        }
        const lastActivity = new Date(streak.lastActivity);
        lastActivity.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0) {
          // Already updated today, skip
          continue;
        } else if (daysDiff === 1) {
          // Consecutive day - increment streak
          const newCount = streak.currentStreak + 1;
          const updated = await prisma.streak.update({
            where: { id: streak.id },
            data: {
              currentStreak: newCount,
              longestStreak: Math.max(newCount, streak.longestStreak),
              lastActivity: new Date(),
            },
          });
          updatedStreaks.push(updated);

          // Create notification for milestone
          if (newCount % 7 === 0 || newCount === 30 || newCount === 100) {
            await prisma.notification.create({
              data: {
                userId,
                type: 'streak_milestone',
                title: `🔥 ${newCount} Day Streak!`,
                message: `Congratulations! You've maintained your ${streak.type} streak for ${newCount} days!`,
                actionUrl: '/dashboard/streaks',
                category: 'achievement',
                isRead: false,
              },
            });
          }
        } else {
          // Streak broken - reset to 1
          const updated = await prisma.streak.update({
            where: { id: streak.id },
            data: {
              currentStreak: 1,
              lastActivity: new Date(),
            },
          });
          updatedStreaks.push(updated);
        }
      }

      return NextResponse.json({ streaks: updatedStreaks });
    }

    // Update specific streak
    const streak = await prisma.streak.findUnique({
      where: { id: streakId },
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    const newCount = increment ? streak.currentStreak + 1 : 1;
    const updated = await prisma.streak.update({
      where: { id: streakId },
      data: {
        currentStreak: newCount,
        longestStreak: Math.max(newCount, streak.longestStreak),
        lastActivity: new Date(),
      },
    });

    // Create notification for milestone
    if (newCount % 7 === 0 || newCount === 30 || newCount === 100) {
      await prisma.notification.create({
        data: {
          userId: streak.userId,
          type: 'streak_milestone',
          title: `🔥 ${newCount} Day Streak!`,
          message: `Congratulations! You've maintained your ${streak.type} streak for ${newCount} days!`,
          actionUrl: '/dashboard/streaks',
          category: 'achievement',
          isRead: false,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update streak:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}

// DELETE /api/streaks - Delete a streak
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const streakId = searchParams.get('id');

    if (!streakId) {
      return NextResponse.json({ error: 'Streak ID is required' }, { status: 400 });
    }

    await prisma.streak.delete({
      where: { id: streakId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete streak:', error);
    return NextResponse.json({ error: 'Failed to delete streak' }, { status: 500 });
  }
}
