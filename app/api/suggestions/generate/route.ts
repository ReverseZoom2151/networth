// API endpoint to generate suggestions for a user
import { NextRequest, NextResponse } from 'next/server';
import { runSuggestionEngine } from '@/lib/services/suggestion-engine';

// POST /api/suggestions/generate - Generate new suggestions for a user
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Run the suggestion engine
    const count = await runSuggestionEngine(userId);

    return NextResponse.json({
      success: true,
      count,
      message: `Generated ${count} new suggestions`,
    });
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
