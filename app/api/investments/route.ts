// API routes for Investment Planning & Portfolio Tracking

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWhopId } from '@/lib/db';
import prisma from '@/lib/prisma';

// GET /api/investments - Get user's investments
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

    const investments = await prisma.investment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ investments });
  } catch (error) {
    console.error('Failed to fetch investments:', error);
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
  }
}

// POST /api/investments - Create or update investment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...investmentData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        name: investmentData.name,
        type: investmentData.type,
        provider: investmentData.provider,
        currentValue: investmentData.currentValue || 0,
        contributions: investmentData.contributions || 0,
        gains: investmentData.gains || 0,
        allocation: investmentData.allocation,
        riskLevel: investmentData.riskLevel,
        goalType: investmentData.goalType,
        targetDate: investmentData.targetDate ? new Date(investmentData.targetDate) : null,
        annualReturn: investmentData.annualReturn,
      },
    });

    return NextResponse.json({ investment });
  } catch (error) {
    console.error('Failed to create investment:', error);
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
  }
}

