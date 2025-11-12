import { NextRequest, NextResponse } from 'next/server';
import { getStoryLeaderboard } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframeParam = searchParams.get('timeframeDays');
  const limitParam = searchParams.get('limit');

  const timeframeDays = timeframeParam ? parseInt(timeframeParam, 10) : undefined;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  try {
    const leaderboard = await getStoryLeaderboard({
      timeframeDays: Number.isFinite(timeframeDays) ? timeframeDays : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('[Story Leaderboard] Failed to generate leaderboard:', error);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}


