import { NextRequest, NextResponse } from 'next/server';
import { generateDailyTip } from '@/lib/ai';
import { UserGoal } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const goal: UserGoal = await request.json();

    if (!goal || !goal.type) {
      return NextResponse.json(
        { error: 'Valid goal is required' },
        { status: 400 }
      );
    }

    // Generate daily tip
    const tip = await generateDailyTip(goal);

    return NextResponse.json({ tip });
  } catch (error) {
    console.error('Daily tip API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tip' },
      { status: 500 }
    );
  }
}
