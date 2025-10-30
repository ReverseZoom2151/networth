// POST /api/banking/sync
// Syncs transactions from connected bank accounts

import { NextRequest, NextResponse } from 'next/server';
import { getBankingProvider, decryptToken } from '@/lib/banking';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, days = 30 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all active bank connections for user
    const connections = await prisma.bankConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (connections.length === 0) {
      return NextResponse.json({ error: 'No bank connections found' }, { status: 404 });
    }

    let totalTransactions = 0;

    for (const connection of connections) {
      try {
        // Get provider
        const bankingProvider = getBankingProvider(connection.provider as any);

        // Decrypt access token
        const accessToken = decryptToken(connection.accessToken!);

        // Calculate date range
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);

        // Fetch transactions
        const transactions = await bankingProvider.getTransactions(
          accessToken,
          connection.providerAccountId,
          from,
          to
        );

        // Store transactions in database
        for (const tx of transactions) {
          await prisma.transaction.upsert({
            where: {
              providerTransactionId: tx.id,
            },
            update: {
              amount: tx.amount,
              description: tx.description,
              merchantName: tx.merchantName,
              category: tx.category,
              type: tx.type,
              transactionDate: tx.transactionDate,
              postedDate: tx.postedDate,
            },
            create: {
              userId,
              bankConnectionId: connection.id,
              providerTransactionId: tx.id,
              amount: tx.amount,
              currency: tx.currency,
              description: tx.description,
              merchantName: tx.merchantName,
              category: tx.category,
              type: tx.type,
              transactionDate: tx.transactionDate,
              postedDate: tx.postedDate,
            },
          });
        }

        // Update last synced
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: { lastSynced: new Date() },
        });

        totalTransactions += transactions.length;
      } catch (error) {
        console.error(`Failed to sync ${connection.accountName}:`, error);
        // Continue with other accounts
      }
    }

    return NextResponse.json({
      success: true,
      accounts: connections.length,
      transactions: totalTransactions,
    });
  } catch (error) {
    console.error('Banking sync error:', error);
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 });
  }
}
