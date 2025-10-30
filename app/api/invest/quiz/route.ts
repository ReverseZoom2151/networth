// API route for saving investment quiz results
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/invest/quiz - Save investment quiz results
export async function POST(req: NextRequest) {
  try {
    const { userId, quizScore, quizAnswers, riskTolerance, timeHorizon } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create or update investment profile
    const profile = await prisma.investmentProfile.upsert({
      where: { userId },
      update: {
        quizScore,
        quizAnswers,
        riskTolerance,
        timeHorizon,
        updatedAt: new Date(),
      },
      create: {
        userId,
        quizScore,
        quizAnswers,
        riskTolerance,
        timeHorizon,
        investmentGoals: [], // Empty initially, can be set later
        modulesCompleted: [],
        hasInvested: false,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to save quiz results:', error);
    return NextResponse.json({ error: 'Failed to save quiz results' }, { status: 500 });
  }
}
