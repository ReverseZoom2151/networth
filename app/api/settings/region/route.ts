// Region/Location Settings API
// Handles GET and POST requests for user region preferences
// Automatically updates currency when region changes

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/settings/region - Get user's region preference
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user with goal (region is stored in UserGoal)
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return current region from goal or default to US
    return NextResponse.json({
      region: user.goal?.region || 'US',
      currency: user.goal?.currency || 'USD',
    });
  } catch (error) {
    console.error('Failed to fetch region:', error);
    return NextResponse.json(
      { error: 'Failed to fetch region settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/region - Update user's region preference
export async function POST(req: NextRequest) {
  try {
    const { userId, region, regionName, currency } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!region) {
      return NextResponse.json({ error: 'Region is required' }, { status: 400 });
    }

    // Fetch user with goal
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create goal with new region and currency
    if (user.goal) {
      await prisma.userGoal.update({
        where: { id: user.goal.id },
        data: {
          region,
          currency: currency || user.goal.currency, // Update currency if provided
        },
      });
    } else {
      // If no goal exists yet, create one with region and currency
      await prisma.userGoal.create({
        data: {
          userId: user.id,
          type: 'other',
          region,
          currency: currency || 'USD',
          targetAmount: 0,
          currentSavings: 0,
          timeframe: 12,
          onboardingComplete: false,
        },
      });
    }

    console.log(`[Region] User ${userId} updated region to ${region} (${regionName}) with currency ${currency}`);

    return NextResponse.json({
      success: true,
      region,
      regionName,
      currency,
    });
  } catch (error) {
    console.error('Failed to update region:', error);
    return NextResponse.json(
      { error: 'Failed to update region settings' },
      { status: 500 }
    );
  }
}
