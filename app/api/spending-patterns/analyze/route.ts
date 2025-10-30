// API endpoint to analyze spending patterns for a user
import { NextRequest, NextResponse } from 'next/server';
import { runSpendingAnalysis } from '@/lib/services/spending-analyzer';

// POST /api/spending-patterns/analyze - Analyze spending patterns for a user
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Run the spending analysis
    const count = await runSpendingAnalysis(userId);

    return NextResponse.json({
      success: true,
      count,
      message: `Analyzed spending and detected ${count} patterns`,
    });
  } catch (error) {
    console.error('Failed to analyze spending patterns:', error);
    return NextResponse.json(
      { error: 'Failed to analyze spending patterns' },
      { status: 500 }
    );
  }
}
