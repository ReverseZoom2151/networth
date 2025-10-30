// POST /api/banking/connect
// Initiates bank account connection via Open Banking

import { NextRequest, NextResponse } from 'next/server';
import { getBankingProvider } from '@/lib/banking';

export async function POST(req: NextRequest) {
  try {
    const { userId, provider = 'mock' } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get banking provider
    const bankingProvider = getBankingProvider(provider);

    // Get auth URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/banking/callback`;
    const { authUrl, state } = await bankingProvider.getAuthUrl(userId, redirectUri);

    // Store state in session/database for verification (in production)
    // For now, include it in the response

    return NextResponse.json({
      authUrl,
      state,
      provider: bankingProvider.name,
    });
  } catch (error) {
    console.error('Banking connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate bank connection' },
      { status: 500 }
    );
  }
}
