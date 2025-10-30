// API route for checking and triggering interventions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/interventions/check - Check if user needs interventions
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's financial data
    const userGoal = await prisma.userGoal.findUnique({
      where: { userId },
    });

    if (!userGoal) {
      return NextResponse.json({ error: 'User goal not found' }, { status: 404 });
    }

    // Get user's budgets for the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { year: now.getFullYear(), month: { gte: now.getMonth() - 2 } },
          { year: now.getFullYear() - 1, month: { gte: 10 } },
        ],
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3,
    });

    // Get all active intervention triggers
    const triggers = await prisma.interventionTrigger.findMany({
      where: { active: true },
      orderBy: { priority: 'desc' },
    });

    const triggeredInterventions = [];

    // Evaluate each trigger
    for (const trigger of triggers) {
      let shouldTrigger = false;
      let contextData: any = {};
      let calculatedImpact: number | null = null;

      switch (trigger.triggerType) {
        case 'overspending': {
          // Check if user is overspending in any category
          if (budgets.length > 0 && userGoal.monthlyBudget) {
            const latestBudget = budgets[0];
            const categories = latestBudget.categories as any;

            for (const [category, data] of Object.entries(categories)) {
              const catData = data as any;
              if (catData.budgeted && catData.spent) {
                const overspendPct = (catData.spent - catData.budgeted) / catData.budgeted;

                if (overspendPct > (trigger.threshold || 0.2)) {
                  shouldTrigger = true;
                  contextData = {
                    category,
                    budgeted: catData.budgeted,
                    spent: catData.spent,
                    overspendAmount: catData.spent - catData.budgeted,
                    overspendPct: overspendPct * 100,
                  };
                  calculatedImpact = catData.spent - catData.budgeted;
                  break;
                }
              }
            }
          }
          break;
        }

        case 'missed_savings': {
          // Check if user hasn't made progress in last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);

          const recentProgress = await prisma.progressHistory.findFirst({
            where: {
              userId,
              createdAt: { gte: thirtyDaysAgo },
            },
          });

          if (!recentProgress) {
            shouldTrigger = true;
            contextData = {
              daysSinceLastDeposit: 30,
              targetMonthly: (userGoal.targetAmount - userGoal.currentSavings) / (userGoal.timeframe * 12),
            };
          }
          break;
        }

        case 'debt_increase': {
          // Check if user's debt has increased
          const debts = await prisma.debt.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
          });

          if (debts.length > 0) {
            const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
            // TODO: Track historical debt to detect increases
            // For now, trigger if total debt > $5000
            if (totalDebt > 5000) {
              shouldTrigger = true;
              contextData = {
                totalDebt,
                highestRate: Math.max(...debts.map(d => d.interestRate)),
              };
              calculatedImpact = totalDebt * 0.24 / 12; // Estimate monthly interest
            }
          }
          break;
        }

        case 'unusual_spend': {
          // Check for unusually large transactions
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);

          const transactions = await prisma.transaction.findMany({
            where: {
              userId,
              transactionDate: { gte: thirtyDaysAgo },
              type: 'debit',
            },
            orderBy: { amount: 'desc' },
            take: 10,
          });

          if (transactions.length > 0) {
            const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
            const largest = transactions[0];

            if (largest.amount > avgAmount * 3) {
              shouldTrigger = true;
              contextData = {
                amount: largest.amount,
                description: largest.description,
                averageAmount: avgAmount,
              };
            }
          }
          break;
        }
      }

      // Create intervention history if triggered
      if (shouldTrigger) {
        // Check if we already triggered this recently (don't spam)
        const recentSimilar = await prisma.interventionHistory.findFirst({
          where: {
            userId,
            triggerId: trigger.id,
            triggeredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
        });

        if (!recentSimilar) {
          const created = await prisma.interventionHistory.create({
            data: {
              userId,
              triggerId: trigger.id,
              contextData,
              calculatedImpact,
              triggeredAt: new Date(),
            },
          });

          triggeredInterventions.push({
            ...created,
            trigger,
          });
        }
      }
    }

    return NextResponse.json({
      triggered: triggeredInterventions.length,
      interventions: triggeredInterventions,
    });
  } catch (error) {
    console.error('Failed to check interventions:', error);
    return NextResponse.json({ error: 'Failed to check interventions' }, { status: 500 });
  }
}
