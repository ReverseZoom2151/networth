// API route for sharing achievements
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/achievements/share - Share an achievement to the community
export async function POST(req: NextRequest) {
  try {
    const { achievementId, userId } = await req.json();

    if (!achievementId || !userId) {
      return NextResponse.json(
        { error: 'Achievement ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get the achievement
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (achievement.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (achievement.isShared) {
      return NextResponse.json({ error: 'Achievement already shared' }, { status: 400 });
    }

    // Update achievement to mark as shared
    const updated = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        isShared: true,
        sharedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to share achievement:', error);
    return NextResponse.json({ error: 'Failed to share achievement' }, { status: 500 });
  }
}
