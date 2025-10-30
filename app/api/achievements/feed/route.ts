// API route for achievement feed
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/achievements/feed - Get shared achievements from the community
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get shared achievements
    const achievements = await prisma.achievement.findMany({
      where: {
        isShared: true,
      },
      orderBy: {
        sharedAt: 'desc',
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

    // Get sharing settings for each user to determine anonymity
    const achievementIds = achievements.map(a => a.userId);
    const sharingSettings = await prisma.userAchievementShare.findMany({
      where: {
        userId: {
          in: achievementIds,
        },
      },
    });

    const settingsMap = new Map(sharingSettings.map(s => [s.userId, s]));

    // Format achievements with user info and anonymity
    const formattedAchievements = achievements.map(achievement => {
      const settings = settingsMap.get(achievement.userId);
      const isAnonymous = settings?.anonymousSharing || false;
      const isCurrentUser = achievement.userId === userId;

      return {
        id: achievement.id,
        userId: achievement.userId,
        userName: isAnonymous ? undefined : (achievement.user.email?.split('@')[0] || 'User'),
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        color: achievement.color,
        value: achievement.value,
        isShared: achievement.isShared,
        sharedAt: achievement.sharedAt?.toISOString() || '',
        earnedAt: achievement.earnedAt.toISOString(),
        milestone: achievement.milestone,
        isAnonymous,
        isCurrentUser,
      };
    });

    return NextResponse.json(formattedAchievements);
  } catch (error) {
    console.error('Failed to fetch achievement feed:', error);
    return NextResponse.json({ error: 'Failed to fetch achievement feed' }, { status: 500 });
  }
}
