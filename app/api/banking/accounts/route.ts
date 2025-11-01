// GET /api/banking/accounts
// Fetch connected bank accounts for a user

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch all bank connections for the user
    const connections = await prisma.bankConnection.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to response format
    const accounts = connections.map((conn) => ({
      id: conn.id,
      accountName: conn.accountName,
      accountType: conn.accountType,
      currency: conn.currency,
      currentBalance: conn.currentBalance,
      availableBalance: conn.availableBalance,
      provider: conn.provider,
      lastSynced: conn.lastSynced?.toISOString() || null,
      isActive: conn.isActive,
    }));

    return NextResponse.json({
      accounts,
      total: accounts.length,
    });
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}

// DELETE /api/banking/accounts?accountId=xxx
// Disconnect a bank account
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Mark account as inactive
    await prisma.bankConnection.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Account disconnected',
    });
  } catch (error) {
    console.error('Failed to disconnect account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
