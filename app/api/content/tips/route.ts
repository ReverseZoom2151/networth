import { NextRequest, NextResponse } from 'next/server';
import { getCreditTips } from '@/lib/db';

/**
 * Credit Tips API
 *
 * GET: Retrieve credit tips for a region
 *
 * Query params:
 * - region: US, UK, EU, or ALL
 * - limit: Number of tips to return (default: 5)
 *
 * Returns tips from database, or empty array if database unavailable
 * (app will fall back to hardcoded tips)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const tips = await getCreditTips(region, limit);

    return NextResponse.json({
      tips,
      source: tips.length > 0 ? 'database' : 'fallback',
      count: tips.length
    });
  } catch (error) {
    console.error('Error getting credit tips:', error);
    return NextResponse.json(
      { tips: [], source: 'error' },
      { status: 200 } // Still return 200 so app can use fallback
    );
  }
}
