// API route for fetching news impacts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/news/impacts - Get personalized news for user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const whopId = searchParams.get('userId'); // This is actually the whopId
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!whopId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, find the user by whopId to get the internal user ID
    const user = await prisma.user.findUnique({
      where: { whopId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.goal) {
      return NextResponse.json({ error: 'User goal not found' }, { status: 404 });
    }

    const userGoal = user.goal;

    // Build where clause for news filtering
    const where: any = {
      active: true,
      OR: [
        { affectsGoalTypes: { has: userGoal.type } },
        { affectsGoalTypes: { isEmpty: true } }, // General news for all
      ],
    };

    // Filter by region - show news for user's region OR news with no specific region (global news)
    if (userGoal.region) {
      where.AND = [
        {
          OR: [
            { region: userGoal.region },
            { region: null }, // Global news
          ],
        },
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      where.category = category;
    }

    // Add urgency filter
    if (urgency && urgency !== 'all') {
      where.urgency = urgency;
    }

    // Fetch news items
    const newsItems = await prisma.newsImpact.findMany({
      where,
      orderBy: [
        { urgency: 'desc' }, // Urgent first
        { publishedAt: 'desc' },
      ],
      take: limit,
    });

    // Get user's interaction with these news items
    const newsIds = newsItems.map(n => n.id);
    const userNewsImpacts = await prisma.userNewsImpact.findMany({
      where: {
        userId: user.id,
        newsImpactId: { in: newsIds },
      },
    });

    const userNewsMap = new Map(
      userNewsImpacts.map(uni => [uni.newsImpactId, uni])
    );

    // Format response with personalized data
    const formattedNews = newsItems.map(news => {
      const userNews = userNewsMap.get(news.id);

      return {
        id: news.id,
        title: news.title,
        summary: news.summary,
        source: news.source,
        category: news.category,
        region: news.region,
        affectsGoalTypes: news.affectsGoalTypes,
        impactType: news.impactType,
        urgency: news.urgency,
        fullContent: news.fullContent,
        sourceUrl: news.sourceUrl,
        imageUrl: news.imageUrl,
        hasQuickAction: news.hasQuickAction,
        actionLabel: news.actionLabel,
        actionUrl: news.actionUrl,
        actionType: news.actionType,
        publishedAt: news.publishedAt.toISOString(),
        personalizedImpact: userNews?.personalizedImpact,
        impactAmount: userNews?.impactAmount,
        viewed: userNews?.viewed || false,
      };
    });

    return NextResponse.json(formattedNews);
  } catch (error) {
    console.error('Failed to fetch news impacts:', error);
    return NextResponse.json({ error: 'Failed to fetch news impacts' }, { status: 500 });
  }
}
