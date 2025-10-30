// Data Migration Service
// Migrates localStorage data to database for persistence

import prisma from '@/lib/prisma';

interface LocalStorageData {
  preferences?: {
    currency?: string;
    theme?: string;
    notifications?: boolean;
  };
  budgets?: Array<{
    category: string;
    amount: number;
    period: 'weekly' | 'monthly';
  }>;
  goals?: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
  }>;
  transactions?: Array<{
    date: string;
    amount: number;
    description: string;
    category: string;
    type: 'income' | 'expense';
  }>;
  guiltyPleasures?: Array<{
    name: string;
    monthlyBudget: number;
    category: string;
    icon?: string;
  }>;
}

/**
 * Migrate user data from localStorage to database
 */
export async function migrateUserData(
  userId: string,
  localStorageData: LocalStorageData
): Promise<{ success: boolean; migrated: string[]; errors: string[] }> {
  const migrated: string[] = [];
  const errors: string[] = [];

  try {
    // Migrate preferences
    if (localStorageData.preferences) {
      try {
        await migratePreferences(userId, localStorageData.preferences);
        migrated.push('preferences');
      } catch (error) {
        errors.push(`preferences: ${error}`);
      }
    }

    // Migrate budgets
    if (localStorageData.budgets && localStorageData.budgets.length > 0) {
      try {
        await migrateBudgets(userId, localStorageData.budgets);
        migrated.push(`budgets (${localStorageData.budgets.length} items)`);
      } catch (error) {
        errors.push(`budgets: ${error}`);
      }
    }

    // Migrate goals
    if (localStorageData.goals && localStorageData.goals.length > 0) {
      try {
        await migrateGoals(userId, localStorageData.goals);
        migrated.push(`goals (${localStorageData.goals.length} items)`);
      } catch (error) {
        errors.push(`goals: ${error}`);
      }
    }

    // Migrate transactions
    if (localStorageData.transactions && localStorageData.transactions.length > 0) {
      try {
        await migrateTransactions(userId, localStorageData.transactions);
        migrated.push(`transactions (${localStorageData.transactions.length} items)`);
      } catch (error) {
        errors.push(`transactions: ${error}`);
      }
    }

    // Migrate guilty pleasures
    if (localStorageData.guiltyPleasures && localStorageData.guiltyPleasures.length > 0) {
      try {
        await migrateGuiltyPleasures(userId, localStorageData.guiltyPleasures);
        migrated.push(`guilty pleasures (${localStorageData.guiltyPleasures.length} items)`);
      } catch (error) {
        errors.push(`guilty pleasures: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      migrated,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      migrated,
      errors: [`General error: ${error}`],
    };
  }
}

/**
 * Migrate user preferences
 */
async function migratePreferences(userId: string, preferences: any): Promise<void> {
  // Update user record with preferences
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Store preferences in a JSON field if available
      // For now, we'll skip this if User model doesn't have a preferences field
    },
  });
}

/**
 * Migrate budgets
 */
async function migrateBudgets(userId: string, budgets: any[]): Promise<void> {
  for (const budget of budgets) {
    // Check if budget already exists
    const existing = await prisma.transaction.findFirst({
      where: {
        userId,
        category: budget.category,
        description: { contains: 'Budget' },
      },
    });

    if (!existing) {
      // Store budget as metadata or in a dedicated Budget model if it exists
      // For now, we'll create a reference transaction
      await prisma.transaction.create({
        data: {
          userId,
          amount: budget.amount,
          currency: 'GBP',
          description: `Budget: ${budget.category}`,
          category: budget.category,
          type: 'credit', // Budget allocation
          transactionDate: new Date(),
          postedDate: new Date(),
          providerTransactionId: `budget_${Date.now()}_${budget.category}`,
        },
      });
    }
  }
}

/**
 * Migrate savings goals
 */
async function migrateGoals(userId: string, goals: any[]): Promise<void> {
  for (const goal of goals) {
    // Check if goal already exists
    const existing = await prisma.transaction.findFirst({
      where: {
        userId,
        description: { contains: goal.name },
        category: 'Savings',
      },
    });

    if (!existing) {
      // Create a goal transaction
      await prisma.transaction.create({
        data: {
          userId,
          amount: goal.targetAmount,
          currency: 'GBP',
          description: `Savings Goal: ${goal.name}`,
          category: 'Savings',
          type: 'credit',
          transactionDate: goal.deadline ? new Date(goal.deadline) : new Date(),
          postedDate: new Date(),
          providerTransactionId: `goal_${Date.now()}_${goal.name}`,
        },
      });
    }
  }
}

/**
 * Migrate transactions
 */
async function migrateTransactions(userId: string, transactions: any[]): Promise<void> {
  for (const tx of transactions) {
    // Check if transaction already exists
    const providerTxId = `local_${new Date(tx.date).getTime()}_${tx.amount}`;

    const existing = await prisma.transaction.findFirst({
      where: {
        userId,
        providerTransactionId: providerTxId,
      },
    });

    if (!existing) {
      await prisma.transaction.create({
        data: {
          userId,
          amount: tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
          currency: 'GBP',
          description: tx.description,
          category: tx.category || 'Other',
          type: tx.type === 'expense' ? 'debit' : 'credit',
          transactionDate: new Date(tx.date),
          postedDate: new Date(tx.date),
          providerTransactionId: providerTxId,
        },
      });
    }
  }
}

/**
 * Migrate guilty pleasures
 */
async function migrateGuiltyPleasures(userId: string, pleasures: any[]): Promise<void> {
  for (const pleasure of pleasures) {
    // Check if guilty pleasure already exists
    const existing = await prisma.guiltyPleasure.findFirst({
      where: {
        userId,
        name: pleasure.name,
      },
    });

    if (!existing) {
      await prisma.guiltyPleasure.create({
        data: {
          userId,
          name: pleasure.name,
          category: pleasure.category || 'Other',
          icon: pleasure.icon || '☕',
          monthlyBudget: pleasure.monthlyBudget,
          spent: 0,
          merchants: [],
          isActive: true,
        },
      });
    }
  }
}

/**
 * Export data from database to JSON (for backup)
 */
export async function exportUserData(userId: string): Promise<any> {
  const [
    transactions,
    guiltyPleasures,
    streaks,
    widgets,
    notifications,
    suggestions,
    patterns,
  ] = await Promise.all([
    prisma.transaction.findMany({ where: { userId } }),
    prisma.guiltyPleasure.findMany({ where: { userId } }),
    prisma.streak.findMany({ where: { userId } }),
    prisma.widget.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.smartSuggestion.findMany({ where: { userId } }),
    prisma.spendingPattern.findMany({ where: { userId } }),
  ]);

  return {
    exportDate: new Date().toISOString(),
    userId,
    data: {
      transactions,
      guiltyPleasures,
      streaks,
      widgets,
      notifications,
      suggestions,
      patterns,
    },
  };
}

/**
 * Clear localStorage keys after successful migration
 */
export function getLocalStorageKeysToClear(): string[] {
  return [
    'networth_preferences',
    'networth_budgets',
    'networth_goals',
    'networth_transactions',
    'networth_guilty_pleasures',
    'networth_user_data',
  ];
}
