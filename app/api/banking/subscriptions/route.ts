// POST /api/banking/subscriptions
// Detect recurring subscriptions and bills from transaction history

import { NextRequest, NextResponse } from 'next/server';
import { detectRecurringTransactions } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Detect recurring transactions
    const recurring = await detectRecurringTransactions(userId);

    if (!recurring || recurring.length === 0) {
      return NextResponse.json({
        message: 'No recurring charges detected. Sync more transaction history.',
      });
    }

    // Calculate summary
    const monthlySubscriptions = recurring.filter((s: any) => s.frequency === 'monthly');
    const totalMonthlySubscriptionCost = monthlySubscriptions.reduce(
      (sum: number, s: any) => sum + s.amount,
      0
    );
    const totalAnnualCost = recurring.reduce(
      (sum: number, s: any) => sum + s.estimatedAnnualCost,
      0
    );

    return NextResponse.json({
      subscriptions: recurring.map((s: any) => ({
        merchant: s.merchant,
        amount: Math.round(s.amount * 100) / 100,
        frequency: s.frequency,
        category: s.category,
        timesCharged: s.count,
        lastCharge: s.lastCharge,
        estimatedAnnualCost: Math.round(s.estimatedAnnualCost * 100) / 100,
      })),
      summary: {
        totalSubscriptions: recurring.length,
        monthlySubscriptions: monthlySubscriptions.length,
        totalMonthlySubscriptionCost: Math.round(totalMonthlySubscriptionCost * 100) / 100,
        estimatedAnnualCost: Math.round(totalAnnualCost * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Subscriptions detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect subscriptions' },
      { status: 500 }
    );
  }
}
