// API route for marking news as viewed or dismissed
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/news/view - Mark news as viewed or dismissed
export async function POST(req: NextRequest) {
  try {
    const { userId, newsId, dismissed = false } = await req.json();

    if (!userId || !newsId) {
      return NextResponse.json(
        { error: 'User ID and News ID are required' },
        { status: 400 }
      );
    }

    // Use upsert to avoid race conditions when marking multiple articles as viewed quickly
    const result = await prisma.userNewsImpact.upsert({
      where: {
        userId_newsImpactId: {
          userId,
          newsImpactId: newsId,
        },
      },
      update: {
        viewed: true,
        dismissed,
        viewedAt: new Date(),
      },
      create: {
        userId,
        newsImpactId: newsId,
        personalizedImpact: '', // Will be calculated separately
        viewed: true,
        dismissed,
        viewedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to mark news as viewed:', error);
    return NextResponse.json({ error: 'Failed to mark news as viewed' }, { status: 500 });
  }
}
