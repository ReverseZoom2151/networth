// POST /api/banking/spending-insights
// Analyze user spending patterns from connected bank accounts

import { NextRequest, NextResponse } from 'next/server';
import { getUserTransactions } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, days = 30 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get spending data using our DB function
    const spendingData = await getUserTransactions(userId, days);

    if (!spendingData) {
      return NextResponse.json(
        { error: 'No spending data available. Connect a bank account first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      period: `Last ${days} days`,
      summary: {
        totalSpent: Math.round(spendingData.totalSpent * 100) / 100,
        totalIncome: Math.round(spendingData.totalIncome * 100) / 100,
        netCashFlow: Math.round(spendingData.netCashFlow * 100) / 100,
        transactionCount: spendingData.transactionCount,
        averageDailySpending: Math.round((spendingData.totalSpent / days) * 100) / 100,
        projectedMonthlySpending: Math.round(((spendingData.totalSpent / days) * 30) * 100) / 100,
      },
      categoryBreakdown: spendingData.categoryBreakdown,
      recentTransactions: spendingData.recentTransactions,
    });
  } catch (error) {
    console.error('Spending insights error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze spending' },
      { status: 500 }
    );
  }
}
