// Smart Suggestion Engine
// Analyzes spending patterns and generates actionable money-saving suggestions

import prisma from '@/lib/prisma';

export type SuggestionType =
  | 'two_for_one_deal'
  | 'subscription_savings'
  | 'spending_alert'
  | 'better_deal'
  | 'cashback_opportunity'
  | 'switching_savings'
  | 'budget_optimization'
  | 'seasonal_tip';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'urgent';

interface SuggestionData {
  type: SuggestionType;
  title: string;
  description: string;
  potentialSaving?: number;
  actionUrl?: string;
  actionLabel?: string;
  priority: SuggestionPriority;
  expiresAt?: Date;
}

/**
 * Generate all suggestions for a user
 */
export async function generateSuggestionsForUser(userId: string): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Get user's transactions from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: ninetyDaysAgo },
    },
    orderBy: { transactionDate: 'desc' },
  });

  // Run all suggestion generators
  suggestions.push(...(await findTwoForOneDeals(userId, transactions)));
  suggestions.push(...(await findSubscriptionSavings(userId, transactions)));
  suggestions.push(...(await findBetterDeals(userId, transactions)));
  suggestions.push(...(await findCashbackOpportunities(userId, transactions)));
  suggestions.push(...(await findSwitchingSavings(userId, transactions)));
  suggestions.push(...(await analyzeSpendingPatterns(userId, transactions)));
  suggestions.push(...(await generateSeasonalTips(userId)));

  return suggestions;
}

/**
 * Save suggestions to database
 */
export async function saveSuggestions(userId: string, suggestions: SuggestionData[]): Promise<void> {
  for (const suggestion of suggestions) {
    // Check if similar suggestion already exists
    const existing = await prisma.smartSuggestion.findFirst({
      where: {
        userId,
        suggestionType: suggestion.type,
        title: suggestion.title,
        status: { not: 'dismissed' }, // Get non-dismissed suggestions
      },
    });

    if (!existing) {
      // Convert priority string to number
      const priorityMap: Record<SuggestionPriority, number> = {
        urgent: 100,
        high: 75,
        medium: 50,
        low: 25,
      };

      await prisma.smartSuggestion.create({
        data: {
          userId,
          suggestionType: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          potentialSavings: suggestion.potentialSaving,
          timeframe: suggestion.potentialSaving && suggestion.potentialSaving > 100 ? 'annually' : 'monthly',
          priority: priorityMap[suggestion.priority],
          actionUrl: suggestion.actionUrl,
          actionLabel: suggestion.actionLabel,
          expiresAt: suggestion.expiresAt,
        },
      });
    }
  }
}

/**
 * Find "two for one" deals based on frequent merchant spending
 */
async function findTwoForOneDeals(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Group by merchant
  const merchantSpending = new Map<string, { count: number; total: number }>();

  for (const tx of transactions) {
    if (tx.type === 'debit' && tx.merchantName) {
      const current = merchantSpending.get(tx.merchantName) || { count: 0, total: 0 };
      merchantSpending.set(tx.merchantName, {
        count: current.count + 1,
        total: current.total + Math.abs(tx.amount),
      });
    }
  }

  // Find frequent merchants (visited 5+ times in 90 days)
  const frequentMerchants = Array.from(merchantSpending.entries())
    .filter(([_, data]) => data.count >= 5)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);

  for (const [merchant, data] of frequentMerchants) {
    const avgSpend = data.total / data.count;

    // Check if it's a food/dining category
    if (merchant.toLowerCase().includes('restaurant') ||
        merchant.toLowerCase().includes('cafe') ||
        merchant.toLowerCase().includes('coffee')) {
      suggestions.push({
        type: 'two_for_one_deal',
        title: `Look for deals at ${merchant}`,
        description: `You've spent £${data.total.toFixed(2)} at ${merchant} in the last 90 days. Check if they offer loyalty programs or two-for-one deals that could save you money!`,
        potentialSaving: data.total * 0.15, // Estimate 15% savings
        actionLabel: 'Find Deals',
        priority: data.total > 100 ? 'high' : 'medium',
      });
    }
  }

  return suggestions;
}

/**
 * Find subscription savings opportunities
 */
async function findSubscriptionSavings(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Identify recurring payments
  const recurringPayments = new Map<string, number[]>();

  for (const tx of transactions) {
    if (tx.type === 'debit' && tx.merchantName) {
      const key = `${tx.merchantName}_${Math.abs(tx.amount).toFixed(2)}`;
      if (!recurringPayments.has(key)) {
        recurringPayments.set(key, []);
      }
      recurringPayments.get(key)!.push(tx.transactionDate.getTime());
    }
  }

  // Find subscriptions (same amount, regular intervals)
  for (const [key, dates] of recurringPayments.entries()) {
    if (dates.length >= 3) {
      const [merchant, amountStr] = key.split('_');
      const amount = parseFloat(amountStr);
      const annualCost = amount * 12;

      // Check for common subscription services
      const subscriptionKeywords = ['netflix', 'spotify', 'amazon', 'apple', 'disney', 'hbo', 'gym', 'membership'];
      const isSubscription = subscriptionKeywords.some(keyword =>
        merchant.toLowerCase().includes(keyword)
      );

      if (isSubscription && annualCost > 50) {
        suggestions.push({
          type: 'subscription_savings',
          title: `Review ${merchant} subscription`,
          description: `You're paying £${amount.toFixed(2)}/month for ${merchant} (£${annualCost.toFixed(2)}/year). Consider if you're getting value or if there are cheaper alternatives.`,
          potentialSaving: annualCost * 0.3,
          priority: annualCost > 120 ? 'high' : 'medium',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Find better deals by comparing similar merchants
 */
async function findBetterDeals(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Group groceries spending
  const groceryMerchants = ['tesco', 'sainsbury', 'asda', 'morrisons', 'waitrose', 'lidl', 'aldi'];
  const grocerySpending = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === 'debit' && tx.merchantName) {
      const merchantLower = tx.merchantName.toLowerCase();
      for (const grocery of groceryMerchants) {
        if (merchantLower.includes(grocery)) {
          grocerySpending.set(grocery, (grocerySpending.get(grocery) || 0) + Math.abs(tx.amount));
        }
      }
    }
  }

  // If shopping at premium grocers, suggest cheaper alternatives
  const premiumSpend = (grocerySpending.get('waitrose') || 0) + (grocerySpending.get('sainsbury') || 0);
  const budgetSpend = (grocerySpending.get('lidl') || 0) + (grocerySpending.get('aldi') || 0);

  if (premiumSpend > 200 && budgetSpend < premiumSpend * 0.3) {
    suggestions.push({
      type: 'better_deal',
      title: 'Save on groceries with budget supermarkets',
      description: `You spent £${premiumSpend.toFixed(2)} at premium supermarkets. Switching some shopping to Lidl or Aldi could save you up to 30%!`,
      potentialSaving: premiumSpend * 0.3,
      actionLabel: 'Learn More',
      priority: 'high',
    });
  }

  return suggestions;
}

/**
 * Find cashback opportunities
 */
async function findCashbackOpportunities(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Calculate online shopping spend
  const onlineMerchants = ['amazon', 'ebay', 'asos', 'boohoo', 'very', 'argos'];
  let onlineSpend = 0;

  for (const tx of transactions) {
    if (tx.type === 'debit' && tx.merchantName) {
      const merchantLower = tx.merchantName.toLowerCase();
      if (onlineMerchants.some(m => merchantLower.includes(m))) {
        onlineSpend += Math.abs(tx.amount);
      }
    }
  }

  if (onlineSpend > 100) {
    suggestions.push({
      type: 'cashback_opportunity',
      title: 'Earn cashback on online shopping',
      description: `You spent £${onlineSpend.toFixed(2)} online. Use cashback sites like TopCashback or Quidco to earn 2-10% back on purchases!`,
      potentialSaving: onlineSpend * 0.05, // Estimate 5% cashback
      actionLabel: 'Get Cashback',
      priority: 'medium',
    });
  }

  return suggestions;
}

/**
 * Find switching savings (energy, insurance, broadband)
 */
async function findSwitchingSavings(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Identify utility bills
  const utilities = new Map<string, number>();
  const utilityKeywords = {
    energy: ['british gas', 'eon', 'edf', 'scottish power', 'ovo'],
    broadband: ['bt', 'virgin', 'sky', 'talktalk'],
    insurance: ['insurance', 'aviva', 'direct line'],
  };

  for (const tx of transactions) {
    if (tx.type === 'debit' && tx.merchantName) {
      const merchantLower = tx.merchantName.toLowerCase();

      for (const [category, keywords] of Object.entries(utilityKeywords)) {
        if (keywords.some(k => merchantLower.includes(k))) {
          utilities.set(category, (utilities.get(category) || 0) + Math.abs(tx.amount));
        }
      }
    }
  }

  // Suggest switching if spending is high
  for (const [category, amount] of utilities.entries()) {
    if (amount > 150) {
      suggestions.push({
        type: 'switching_savings',
        title: `Could you save on your ${category}?`,
        description: `You've paid £${amount.toFixed(2)} for ${category} in 90 days. Compare providers - switching could save you £200+/year!`,
        potentialSaving: 200,
        actionLabel: 'Compare Deals',
        priority: 'high',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }
  }

  return suggestions;
}

/**
 * Analyze spending patterns for alerts
 */
async function analyzeSpendingPatterns(userId: string, transactions: any[]): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];

  // Calculate this month vs last month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthSpend = transactions
    .filter(tx => tx.type === 'debit' && tx.transactionDate >= thisMonthStart)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const lastMonthSpend = transactions
    .filter(tx => tx.type === 'debit' && tx.transactionDate >= lastMonthStart && tx.transactionDate < thisMonthStart)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const increase = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;

  if (increase > 20 && lastMonthSpend > 0) {
    suggestions.push({
      type: 'spending_alert',
      title: 'Spending increased this month',
      description: `Your spending is up ${increase.toFixed(0)}% compared to last month. Review your transactions to identify any unusual expenses.`,
      priority: 'high',
      actionUrl: '/dashboard/transactions',
      actionLabel: 'Review Transactions',
    });
  }

  return suggestions;
}

/**
 * Generate seasonal money-saving tips
 */
async function generateSeasonalTips(userId: string): Promise<SuggestionData[]> {
  const suggestions: SuggestionData[] = [];
  const month = new Date().getMonth();

  // Seasonal tips based on month
  const seasonalTips: Record<number, SuggestionData> = {
    0: { // January
      type: 'seasonal_tip',
      title: 'January sales are here!',
      description: 'Take advantage of January sales for essentials you need. But beware of impulse purchases - stick to your list!',
      priority: 'low',
    },
    11: { // December
      type: 'seasonal_tip',
      title: 'Budget for holiday season',
      description: 'Set a Christmas budget and stick to it. Consider Secret Santa or homemade gifts to reduce costs.',
      priority: 'medium',
    },
  };

  if (seasonalTips[month]) {
    suggestions.push(seasonalTips[month]);
  }

  return suggestions;
}

/**
 * Run suggestion engine for a user (to be called periodically)
 */
export async function runSuggestionEngine(userId: string): Promise<number> {
  const suggestions = await generateSuggestionsForUser(userId);
  await saveSuggestions(userId, suggestions);
  return suggestions.length;
}
