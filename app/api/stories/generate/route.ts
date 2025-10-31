// API endpoint to generate new success stories
// POST /api/stories/generate

import { NextRequest, NextResponse } from 'next/server';
import { generateStoriesForGoalType } from '@/scripts/generate-success-stories';

export const maxDuration = 300; // 5 minutes for long-running generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalType, count = 3 } = body;

    // Validate goal type
    const validGoalTypes = ['house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car'];

    if (goalType && !validGoalTypes.includes(goalType)) {
      return NextResponse.json(
        { error: 'Invalid goal type' },
        { status: 400 }
      );
    }

    console.log(`Generating stories for: ${goalType || 'all types'}`);

    // Generate stories
    let totalGenerated = 0;

    if (goalType) {
      // Generate for specific goal type
      const generated = await generateStoriesForGoalType(goalType);
      totalGenerated = generated;
    } else {
      // Generate for all goal types
      for (const type of validGoalTypes) {
        try {
          const generated = await generateStoriesForGoalType(type);
          totalGenerated += generated;
        } catch (error) {
          console.error(`Error generating for ${type}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated: totalGenerated,
      message: `Successfully generated ${totalGenerated} new stories`,
    });
  } catch (error) {
    console.error('Error generating stories:', error);
    return NextResponse.json(
      { error: 'Failed to generate stories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const goalType = searchParams.get('goalType');

  return NextResponse.json({
    message: 'Story generation endpoint',
    usage: 'POST with { goalType?: string, count?: number }',
    validGoalTypes: ['house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car'],
    example: {
      goalType: goalType || 'house',
      count: 3,
    },
  });
}
