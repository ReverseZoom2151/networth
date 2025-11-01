// GET /POST /api/banking/callback
// Handles OAuth callback from banking provider
// GET for TrueLayer (OAuth), POST for Plaid (token exchange)

import { NextRequest, NextResponse } from 'next/server';
import { getBankingProvider, encryptToken } from '@/lib/banking';
import prisma from '@/lib/prisma';

/**
 * Handle Plaid token exchange (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code: publicToken, state, userId, provider = 'plaid' } = body;

    if (!publicToken || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bankingProvider = getBankingProvider(provider);

    // Exchange public token for access token
    const result = await bankingProvider.exchangeCode(publicToken, state);

    // Get accounts
    const accounts = await bankingProvider.getAccounts(result.accessToken);

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts found' },
        { status: 400 }
      );
    }

    // Store connections in database
    for (const account of accounts) {
      await prisma.bankConnection.create({
        data: {
          userId,
          provider: bankingProvider.name,
          providerAccountId: account.id,
          accountName: account.accountName,
          accountType: account.accountType,
          currency: account.currency,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          isActive: true,
          lastSynced: new Date(),
          accessToken: encryptToken(result.accessToken),
          refreshToken: result.refreshToken ? encryptToken(result.refreshToken) : null,
          tokenExpiresAt: result.expiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      accounts: accounts.length,
      message: 'Bank accounts connected successfully',
    });
  } catch (error) {
    console.error('Banking callback (POST) error:', error);
    return NextResponse.json(
      { error: 'Failed to connect bank account' },
      { status: 500 }
    );
  }
}

/**
 * Handle TrueLayer OAuth callback (GET)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=banking_connection_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_callback`
      );
    }

    // Extract userId from state
    const userId = state.split('_')[1];

    // Determine provider from state
    const provider = state.startsWith('tl_') ? 'truelayer' : 'mock';
    const bankingProvider = getBankingProvider(provider);

    // Exchange code for tokens
    const result = await bankingProvider.exchangeCode(code, state);

    // Get accounts
    const accounts = await bankingProvider.getAccounts(result.accessToken);

    if (accounts.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_accounts_found`
      );
    }

    // Store connection in database
    for (const account of accounts) {
      await prisma.bankConnection.create({
        data: {
          userId,
          provider: bankingProvider.name,
          providerAccountId: account.id,
          accountName: account.accountName,
          accountType: account.accountType,
          currency: account.currency,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          isActive: true,
          lastSynced: new Date(),
          accessToken: encryptToken(result.accessToken),
          refreshToken: encryptToken(result.refreshToken),
          tokenExpiresAt: result.expiresAt,
        },
      });
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=bank_connected&accounts=${accounts.length}`
    );
  } catch (error) {
    console.error('Banking callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=connection_failed`
    );
  }
}
