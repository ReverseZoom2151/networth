import { NextRequest, NextResponse } from 'next/server';

/**
 * Whop User Metadata API (Placeholder)
 *
 * NOTE: The current Whop SDK (@whop/sdk v0.0.2) does not support user metadata operations.
 * For production, you would need to:
 *
 * Option 1: Use Whop's iframe postMessage API to store data in Whop's storage
 * Option 2: Set up your own database (PostgreSQL, MongoDB, etc.) and store data there
 * Option 3: Wait for Whop SDK to add metadata support
 *
 * Current implementation: Returns empty responses to allow app to fall back to localStorage
 * This means data is stored locally per device (doesn't sync across devices)
 *
 * For MVP purposes, this is acceptable. For production scale, implement Option 1 or 2.
 */

/**
 * GET/SET metadata value
 * Body: { userId: string, key: string, value?: any }
 *
 * Returns empty/null to trigger localStorage fallback in providers.tsx
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, key, value } = body;

    if (!userId || !key) {
      return NextResponse.json(
        { error: 'userId and key are required' },
        { status: 400 }
      );
    }

    // If value is provided, this is a SET operation
    if (value !== undefined) {
      // TODO: Store in database or Whop metadata when available
      console.log(`[Whop Metadata] Would save ${key} for user ${userId}`);
      return NextResponse.json({ success: true });
    }

    // Otherwise, this is a GET operation
    // Return null to trigger localStorage fallback
    console.log(`[Whop Metadata] Would retrieve ${key} for user ${userId}`);
    return NextResponse.json({ value: null });
  } catch (error) {
    console.error('Metadata API error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

/**
 * DELETE all user metadata
 * Body: { userId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // TODO: Clear from database when implemented
    console.log(`[Whop Metadata] Would clear all data for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete metadata API error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
