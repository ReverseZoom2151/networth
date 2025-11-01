// API routes for Credit Score Monitoring

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWhopId } from '@/lib/db';
import prisma from '@/lib/prisma';

// GET /api/credit-score - Get user's credit scores
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creditScores = await prisma.creditScore.findMany({
      where: { userId: user.id },
      orderBy: { reportDate: 'desc' },
      take: 12, // Last 12 months
    });

    return NextResponse.json({ creditScores });
  } catch (error) {
    console.error('Failed to fetch credit scores:', error);
    return NextResponse.json({ error: 'Failed to fetch credit scores' }, { status: 500 });
  }
}

// POST /api/credit-score - Create or update credit score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, score, provider, reportType, factors, details, recommendations } = body;

    if (!userId || !score) {
      return NextResponse.json({ error: 'userId and score are required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get previous score for comparison
    const previousScore = await prisma.creditScore.findFirst({
      where: { userId: user.id },
      orderBy: { reportDate: 'desc' },
    });

    const change = previousScore ? score - previousScore.score : null;
    const trend = change ? (change > 0 ? 'up' : change < 0 ? 'down' : 'stable') : null;

    const creditScore = await prisma.creditScore.create({
      data: {
        userId: user.id,
        score,
        provider: provider || 'fico',
        reportType: reportType || 'fico',
        factors: factors || {},
        details: details || {},
        previousScore: previousScore?.score,
        change,
        trend,
        recommendations: recommendations || [],
        improvementAreas: {},
      },
    });

    return NextResponse.json({ creditScore });
  } catch (error) {
    console.error('Failed to create credit score:', error);
    return NextResponse.json({ error: 'Failed to create credit score' }, { status: 500 });
  }
}

