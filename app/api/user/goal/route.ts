import { NextRequest, NextResponse } from 'next/server';
import { saveUserGoal, getUserGoal } from '@/lib/db';

/**
 * User Goal API
 *
 * GET: Retrieve user's financial goal
 * POST: Save user's financial goal
 *
 * Uses database when available, falls back to client-side localStorage
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whopId = searchParams.get('whopId');

    if (!whopId) {
      return NextResponse.json(
        { error: 'whopId is required' },
        { status: 400 }
      );
    }

    const goal = await getUserGoal(whopId);

    if (!goal) {
      // Not in database - client will use localStorage
      return NextResponse.json({ goal: null, source: 'localStorage' });
    }

    return NextResponse.json({ goal, source: 'database' });
  } catch (error) {
    console.error('Error getting user goal:', error);
    return NextResponse.json(
      { error: 'Failed to get goal' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { whopId, goal } = body;

    if (!whopId || !goal) {
      return NextResponse.json(
        { error: 'whopId and goal are required' },
        { status: 400 }
      );
    }

    // Try to save to database
    const savedGoal = await saveUserGoal(whopId, goal);

    if (!savedGoal) {
      // Database not available - client will use localStorage
      return NextResponse.json({
        success: true,
        source: 'localStorage',
        message: 'Database not available, using local storage'
      });
    }

    return NextResponse.json({
      success: true,
      goal: savedGoal,
      source: 'database'
    });
  } catch (error) {
    console.error('Error saving user goal:', error);
    return NextResponse.json(
      { error: 'Failed to save goal' },
      { status: 500 }
    );
  }
}
