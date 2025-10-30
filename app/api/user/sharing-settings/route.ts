// API route for user sharing settings
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/user/sharing-settings - Get user's sharing preferences
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const settings = await prisma.userAchievementShare.findUnique({
      where: { userId },
    });

    // Return default settings if not found
    if (!settings) {
      return NextResponse.json({
        userId,
        shareStreaks: true,
        shareSavings: true,
        shareDebtPayoff: true,
        shareMilestones: true,
        anonymousSharing: false,
        allowLeaderboard: true,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch sharing settings:', error);
    return NextResponse.json({ error: 'Failed to fetch sharing settings' }, { status: 500 });
  }
}

// POST /api/user/sharing-settings - Update user's sharing preferences
export async function POST(req: NextRequest) {
  try {
    const { userId, settings } = await req.json();

    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'User ID and settings are required' },
        { status: 400 }
      );
    }

    // Upsert sharing settings
    const updated = await prisma.userAchievementShare.upsert({
      where: { userId },
      update: {
        shareStreaks: settings.shareStreaks,
        shareSavings: settings.shareSavings,
        shareDebtPayoff: settings.shareDebtPayoff,
        shareMilestones: settings.shareMilestones,
        anonymousSharing: settings.anonymousSharing,
        allowLeaderboard: settings.allowLeaderboard,
      },
      create: {
        userId,
        shareStreaks: settings.shareStreaks,
        shareSavings: settings.shareSavings,
        shareDebtPayoff: settings.shareDebtPayoff,
        shareMilestones: settings.shareMilestones,
        anonymousSharing: settings.anonymousSharing,
        allowLeaderboard: settings.allowLeaderboard,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update sharing settings:', error);
    return NextResponse.json({ error: 'Failed to update sharing settings' }, { status: 500 });
  }
}
