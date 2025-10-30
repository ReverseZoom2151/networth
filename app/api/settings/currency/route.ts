// Currency Settings API
// Handles GET and POST requests for user currency preferences

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings/currency - Get user's currency preference
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user with goal (currency is stored in UserGoal)
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return current currency from goal or default to USD
    return NextResponse.json({
      currency: user.goal?.currency || 'USD',
      region: user.goal?.region || 'US',
    });
  } catch (error) {
    console.error('Failed to fetch currency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/currency - Update user's currency preference
export async function POST(req: NextRequest) {
  try {
    const { userId, currency } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ error: 'Currency is required' }, { status: 400 });
    }

    // Fetch user with goal
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create goal with new currency
    if (user.goal) {
      await prisma.userGoal.update({
        where: { id: user.goal.id },
        data: { currency },
      });
    } else {
      // If no goal exists yet, create one with currency
      await prisma.userGoal.create({
        data: {
          userId: user.id,
          type: 'other',
          currency,
          region: 'US',
          targetAmount: 0,
          currentSavings: 0,
          timeframe: 12,
          onboardingComplete: false,
        },
      });
    }

    console.log(`[Currency] User ${userId} updated currency to ${currency}`);

    return NextResponse.json({
      success: true,
      currency,
    });
  } catch (error) {
    console.error('Failed to update currency:', error);
    return NextResponse.json(
      { error: 'Failed to update currency settings' },
      { status: 500 }
    );
  }
}
