import { NextRequest, NextResponse } from 'next/server';
import { checkUserHasAccess } from '@/lib/whop';

/**
 * API endpoint to check if a user has an active subscription
 * POST /api/check-access
 * Body: { userId: string }
 * Returns: { hasAccess: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has active subscription
    const hasAccess = await checkUserHasAccess(userId);

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Failed to check access', hasAccess: false },
      { status: 500 }
    );
  }
}
