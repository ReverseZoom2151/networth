// API route for tracking user actions on news items
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/news/action - Track user action on news
export async function POST(req: NextRequest) {
  try {
    const { userId, newsId, actionType } = await req.json();

    if (!userId || !newsId || !actionType) {
      return NextResponse.json(
        { error: 'User ID, News ID, and Action Type are required' },
        { status: 400 }
      );
    }

    // Update or create user news impact record
    const updated = await prisma.userNewsImpact.upsert({
      where: {
        userId_newsImpactId: {
          userId,
          newsImpactId: newsId,
        },
      },
      update: {
        actionTaken: true,
        viewed: true,
        viewedAt: new Date(),
      },
      create: {
        userId,
        newsImpactId: newsId,
        personalizedImpact: '', // Will be calculated separately
        actionTaken: true,
        viewed: true,
        viewedAt: new Date(),
      },
    });

    // TODO: Implement specific action handlers based on actionType
    // e.g., 'switch_account', 'apply_product', 'adjust_goal'

    return NextResponse.json({ success: true, action: actionType });
  } catch (error) {
    console.error('Failed to track news action:', error);
    return NextResponse.json({ error: 'Failed to track news action' }, { status: 500 });
  }
}
