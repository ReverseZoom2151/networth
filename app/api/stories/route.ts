// API route for success stories
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/stories - Get success stories with optional filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const goalType = searchParams.get('goalType');
    const region = searchParams.get('region');
    const featured = searchParams.get('featured');

    // Build where clause
    const where: any = {};

    if (goalType && goalType !== 'all') {
      where.goalType = goalType;
    }

    if (region && region !== 'all') {
      where.region = region;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // Fetch stories
    const stories = await prisma.successStory.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { inspirationScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Failed to fetch success stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}
