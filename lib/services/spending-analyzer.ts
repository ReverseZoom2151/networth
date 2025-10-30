// Spending Pattern Analyzer
// Detects and analyzes spending patterns to provide insights and alerts

import prisma from '@/lib/prisma';

export type PatternType =
  | 'unusual_spending'
  | 'category_spike'
  | 'recurring_expense'
  | 'budget_exceeded'
  | 'trend_increase'
  | 'trend_decrease'
  | 'weekend_spending'
  | 'late_night_spending';

export type PatternSeverity = 'low' | 'medium' | 'high' | 'critical';

interface PatternData {
  type: PatternType;
  description: string;
  category?: string;
  amount?: number;
  frequency?: string;
  severity: PatternSeverity;
  metadata: Record<string, any>;
}

/**
 * Analyze spending patterns for a user
 */
export async function analyzeSpendingPatterns(userId: string): Promise<PatternData[]> {
  const patterns: PatternData[] = [];

  // Get transactions from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: ninetyDaysAgo },
      type: 'debit',
    },
    orderBy: { transactionDate: 'desc' },
  });

  if (transactions.length === 0) {
    return patterns;
  }

  // Run all analyzers
  patterns.push(...detectUnusualSpending(transactions));
  patterns.push(...detectCategorySpikes(transactions));
  patterns.push(...detectRecurringExpenses(transactions));
  patterns.push(...detectBudgetExceeded(transactions));
  patterns.push(...detectSpendingTrends(transactions));
  patterns.push(...detectWeekendSpending(transactions));
  patterns.push(...detectLateNightSpending(transactions));

  return patterns;
}

/**
 * Save patterns to database
 */
export async function saveSpendingPatterns(userId: string, patterns: PatternData[]): Promise<void> {
  for (const pattern of patterns) {
    // Check if similar pattern already exists
    const existing = await prisma.spendingPattern.findFirst({
      where: {
        userId,
        patternType: pattern.type,
        category: pattern.category || undefined,
        status: 'active',
        detectedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (!existing) {
      // Convert severity to confidence score
      const confidenceMap: Record<PatternSeverity, number> = {
        critical: 0.9,
        high: 0.7,
        medium: 0.5,
        low: 0.3,
      };

      const now = new Date();
      await prisma.spendingPattern.create({
        data: {
          userId,
          patternType: pattern.type,
          category: pattern.category || 'Other',
          description: pattern.description,
          amount: pattern.amount,
          frequency: pattern.frequency,
          confidence: confidenceMap[pattern.severity],
          potentialSavings: 0, // Could be calculated based on pattern type
          detectedAt: now,
          firstSeen: now,
          lastSeen: now,
        },
      });

      // Create notification if severity is medium or higher
      if (pattern.severity === 'medium' || pattern.severity === 'high' || pattern.severity === 'critical') {
        await prisma.notification.create({
          data: {
            userId,
            type: 'spending_pattern',
            title: `${pattern.severity === 'critical' ? '🚨' : '⚠️'} Spending Alert`,
            message: pattern.description,
            actionUrl: '/dashboard/spending-patterns',
            category: pattern.severity === 'critical' ? 'warning' : 'info',
            isRead: false,
          },
        });
      }
    }
  }
}

/**
 * Detect unusual spending (transactions significantly above average)
 */
function detectUnusualSpending(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  // Calculate average transaction amount
  const amounts = transactions.map((tx) => Math.abs(tx.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
  );

  // Find transactions more than 2 standard deviations above average
  const threshold = avgAmount + 2 * stdDev;
  const unusualTransactions = transactions.filter((tx) => Math.abs(tx.amount) > threshold);

  for (const tx of unusualTransactions.slice(0, 3)) {
    // Limit to 3 most recent
    patterns.push({
      type: 'unusual_spending',
      description: `Unusually large transaction of £${Math.abs(tx.amount).toFixed(2)} at ${tx.merchantName || 'Unknown'}`,
      category: tx.category || 'Other',
      amount: Math.abs(tx.amount),
      severity: Math.abs(tx.amount) > threshold * 2 ? 'high' : 'medium',
      metadata: {
        transactionId: tx.id,
        merchantName: tx.merchantName,
        date: tx.transactionDate,
        threshold: threshold.toFixed(2),
      },
    });
  }

  return patterns;
}

/**
 * Detect category spending spikes
 */
function detectCategorySpikes(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  // Group by category and compare this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const categorySpending = new Map<string, { thisMonth: number; lastMonth: number }>();

  for (const tx of transactions) {
    const category = tx.category || 'Other';
    const txDate = new Date(tx.transactionDate);
    const amount = Math.abs(tx.amount);

    if (!categorySpending.has(category)) {
      categorySpending.set(category, { thisMonth: 0, lastMonth: 0 });
    }

    const spending = categorySpending.get(category)!;

    if (txDate >= thisMonthStart) {
      spending.thisMonth += amount;
    } else if (txDate >= lastMonthStart && txDate < thisMonthStart) {
      spending.lastMonth += amount;
    }
  }

  // Find categories with significant increases
  for (const [category, spending] of categorySpending.entries()) {
    if (spending.lastMonth > 0) {
      const increase = ((spending.thisMonth - spending.lastMonth) / spending.lastMonth) * 100;

      if (increase > 50 && spending.thisMonth > 100) {
        patterns.push({
          type: 'category_spike',
          description: `${category} spending increased by ${increase.toFixed(0)}% this month (£${spending.thisMonth.toFixed(2)} vs £${spending.lastMonth.toFixed(2)})`,
          category,
          amount: spending.thisMonth,
          severity: increase > 100 ? 'high' : 'medium',
          metadata: {
            thisMonth: spending.thisMonth,
            lastMonth: spending.lastMonth,
            increase: increase.toFixed(2),
          },
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect recurring expenses
 */
function detectRecurringExpenses(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  // Group by merchant and amount
  const recurringCandidates = new Map<string, any[]>();

  for (const tx of transactions) {
    if (tx.merchantName) {
      const key = `${tx.merchantName}_${Math.abs(tx.amount).toFixed(2)}`;
      if (!recurringCandidates.has(key)) {
        recurringCandidates.set(key, []);
      }
      recurringCandidates.get(key)!.push(tx);
    }
  }

  // Find patterns with 3+ occurrences
  for (const [key, txs] of recurringCandidates.entries()) {
    if (txs.length >= 3) {
      const [merchant, amountStr] = key.split('_');
      const amount = parseFloat(amountStr);

      // Check if intervals are roughly regular
      const dates = txs.map((tx) => new Date(tx.transactionDate).getTime()).sort();
      const intervals: number[] = [];

      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)); // Days
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

      // If roughly monthly or weekly
      if ((avgInterval >= 25 && avgInterval <= 35) || (avgInterval >= 5 && avgInterval <= 9)) {
        const frequency = avgInterval >= 25 ? 'monthly' : 'weekly';

        patterns.push({
          type: 'recurring_expense',
          description: `Recurring ${frequency} payment of £${amount.toFixed(2)} to ${merchant}`,
          category: txs[0].category || 'Other',
          amount,
          frequency,
          severity: 'low',
          metadata: {
            merchant,
            occurrences: txs.length,
            avgInterval: avgInterval.toFixed(1),
          },
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect budget exceeded
 */
function detectBudgetExceeded(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  // Calculate this month's spending
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthSpending = transactions
    .filter((tx) => new Date(tx.transactionDate) >= thisMonthStart)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Assume monthly budget of £1500 (in production, fetch from user settings)
  const monthlyBudget = 1500;

  if (thisMonthSpending > monthlyBudget) {
    const excess = thisMonthSpending - monthlyBudget;
    const percentage = ((thisMonthSpending / monthlyBudget) * 100).toFixed(0);

    patterns.push({
      type: 'budget_exceeded',
      description: `You've exceeded your monthly budget by £${excess.toFixed(2)} (${percentage}% of budget used)`,
      amount: thisMonthSpending,
      severity: excess > monthlyBudget * 0.2 ? 'high' : 'medium',
      metadata: {
        budget: monthlyBudget,
        spent: thisMonthSpending,
        excess: excess.toFixed(2),
        percentage,
      },
    });
  }

  return patterns;
}

/**
 * Detect spending trends
 */
function detectSpendingTrends(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  // Calculate spending for last 3 months
  const now = new Date();
  const monthlySpending: number[] = [];

  for (let i = 0; i < 3; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const spending = transactions
      .filter((tx) => {
        const date = new Date(tx.transactionDate);
        return date >= monthStart && date < monthEnd;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    monthlySpending.unshift(spending);
  }

  if (monthlySpending.length === 3) {
    // Check for increasing trend
    if (monthlySpending[2] > monthlySpending[1] && monthlySpending[1] > monthlySpending[0]) {
      const increase = ((monthlySpending[2] - monthlySpending[0]) / monthlySpending[0]) * 100;

      if (increase > 20) {
        patterns.push({
          type: 'trend_increase',
          description: `Your spending has been increasing for 3 months (up ${increase.toFixed(0)}% overall)`,
          severity: increase > 50 ? 'high' : 'medium',
          metadata: {
            months: monthlySpending,
            increase: increase.toFixed(2),
          },
        });
      }
    }

    // Check for decreasing trend (positive!)
    if (monthlySpending[2] < monthlySpending[1] && monthlySpending[1] < monthlySpending[0]) {
      const decrease = ((monthlySpending[0] - monthlySpending[2]) / monthlySpending[0]) * 100;

      if (decrease > 10) {
        patterns.push({
          type: 'trend_decrease',
          description: `Great job! Your spending has decreased for 3 months (down ${decrease.toFixed(0)}% overall)`,
          severity: 'low',
          metadata: {
            months: monthlySpending,
            decrease: decrease.toFixed(2),
          },
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect weekend spending patterns
 */
function detectWeekendSpending(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  let weekdaySpending = 0;
  let weekendSpending = 0;
  let weekdayCount = 0;
  let weekendCount = 0;

  for (const tx of transactions) {
    const date = new Date(tx.transactionDate);
    const day = date.getDay();
    const amount = Math.abs(tx.amount);

    if (day === 0 || day === 6) {
      // Sunday or Saturday
      weekendSpending += amount;
      weekendCount++;
    } else {
      weekdaySpending += amount;
      weekdayCount++;
    }
  }

  const avgWeekdaySpend = weekdayCount > 0 ? weekdaySpending / weekdayCount : 0;
  const avgWeekendSpend = weekendCount > 0 ? weekendSpending / weekendCount : 0;

  if (avgWeekendSpend > avgWeekdaySpend * 1.5 && weekendSpending > 200) {
    const difference = ((avgWeekendSpend - avgWeekdaySpend) / avgWeekdaySpend) * 100;

    patterns.push({
      type: 'weekend_spending',
      description: `You spend ${difference.toFixed(0)}% more on weekends (avg £${avgWeekendSpend.toFixed(2)} vs £${avgWeekdaySpend.toFixed(2)} on weekdays)`,
      amount: weekendSpending,
      severity: 'low',
      metadata: {
        weekendAvg: avgWeekendSpend.toFixed(2),
        weekdayAvg: avgWeekdaySpend.toFixed(2),
        difference: difference.toFixed(2),
      },
    });
  }

  return patterns;
}

/**
 * Detect late night spending (may indicate impulse purchases)
 */
function detectLateNightSpending(transactions: any[]): PatternData[] {
  const patterns: PatternData[] = [];

  let lateNightSpending = 0;
  let lateNightCount = 0;

  for (const tx of transactions) {
    const date = new Date(tx.transactionDate);
    const hour = date.getHours();

    // Late night = 11pm - 3am
    if (hour >= 23 || hour <= 3) {
      lateNightSpending += Math.abs(tx.amount);
      lateNightCount++;
    }
  }

  if (lateNightCount >= 5 && lateNightSpending > 100) {
    patterns.push({
      type: 'late_night_spending',
      description: `You've made ${lateNightCount} late night transactions (11pm-3am) totaling £${lateNightSpending.toFixed(2)}. These may be impulse purchases.`,
      amount: lateNightSpending,
      severity: 'low',
      metadata: {
        count: lateNightCount,
        total: lateNightSpending.toFixed(2),
        avgAmount: (lateNightSpending / lateNightCount).toFixed(2),
      },
    });
  }

  return patterns;
}

/**
 * Run spending pattern analysis for a user
 */
export async function runSpendingAnalysis(userId: string): Promise<number> {
  const patterns = await analyzeSpendingPatterns(userId);
  await saveSpendingPatterns(userId, patterns);
  return patterns.length;
}
