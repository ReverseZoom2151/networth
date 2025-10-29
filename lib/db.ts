/**
 * Database Service Layer
 *
 * Provides database operations with localStorage fallback
 * Gradually migrate from localStorage to database
 */

import prisma from './prisma';
import { UserGoal as UserGoalType } from './types';

// Check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// ============================================
// USER OPERATIONS
// ============================================

export async function findOrCreateUser(whopId: string, email?: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    return await prisma.user.upsert({
      where: { whopId },
      update: { email, updatedAt: new Date() },
      create: { whopId, email },
    });
  } catch (error) {
    console.error('Error finding/creating user:', error);
    return null;
  }
}

export async function getUserByWhopId(whopId: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    return await prisma.user.findUnique({
      where: { whopId },
      include: {
        goal: true,
        budgets: { orderBy: { createdAt: 'desc' }, take: 1 },
        bills: true,
        debts: true,
        netWorthSnapshots: { orderBy: { date: 'desc' }, take: 12 },
      },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// ============================================
// USER GOAL OPERATIONS
// ============================================

export async function saveUserGoal(whopId: string, goal: UserGoalType) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    // Ensure user exists
    const user = await findOrCreateUser(whopId);
    if (!user) return null;

    // Validate required fields
    if (!goal.targetAmount || !goal.timeframe || !goal.region || !goal.currency) {
      throw new Error('Missing required goal fields');
    }

    // Save goal
    return await prisma.userGoal.upsert({
      where: { userId: user.id },
      update: {
        type: goal.type,
        customGoal: goal.customGoal || null,
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings || 0,
        timeframe: goal.timeframe,
        region: goal.region,
        currency: goal.currency,
        monthlyBudget: goal.monthlyBudget || null,
        spendingCategories: goal.spendingCategories || [],
        onboardingComplete: true,
      },
      create: {
        userId: user.id,
        type: goal.type,
        customGoal: goal.customGoal || null,
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings || 0,
        timeframe: goal.timeframe,
        region: goal.region,
        currency: goal.currency,
        monthlyBudget: goal.monthlyBudget || null,
        spendingCategories: goal.spendingCategories || [],
        onboardingComplete: true,
      },
    });
  } catch (error) {
    console.error('Error saving user goal:', error);
    return null;
  }
}

export async function getUserGoal(whopId: string): Promise<UserGoalType | null> {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await prisma.user.findUnique({
      where: { whopId },
      include: { goal: true },
    });

    if (!user?.goal) return null;

    // Convert database format to app format
    return {
      type: user.goal.type as any,
      customGoal: user.goal.customGoal || undefined,
      targetAmount: user.goal.targetAmount,
      currentSavings: user.goal.currentSavings,
      timeframe: user.goal.timeframe,
      region: user.goal.region as any,
      currency: user.goal.currency as any,
      monthlyBudget: user.goal.monthlyBudget || undefined,
      spendingCategories: user.goal.spendingCategories as string[],
    };
  } catch (error) {
    console.error('Error getting user goal:', error);
    return null;
  }
}

export async function updateGoalProgress(whopId: string, currentSavings: number, note?: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await prisma.user.findUnique({
      where: { whopId },
      include: { goal: true },
    });

    if (!user?.goal) return null;

    // Calculate milestone
    const progress = (currentSavings / user.goal.targetAmount) * 100;
    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => progress >= m && progress < m + 5) || null;

    // Update goal
    await prisma.userGoal.update({
      where: { id: user.goal.id },
      data: { currentSavings },
    });

    // Record progress history
    await prisma.progressHistory.create({
      data: {
        userId: user.id,
        amount: currentSavings,
        note,
        milestone,
      },
    });

    return { currentSavings, milestone };
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return null;
  }
}

// ============================================
// DYNAMIC CONTENT OPERATIONS
// ============================================

export async function getCreditTips(region: string, limit: number = 5) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return [];

    return await prisma.creditTip.findMany({
      where: {
        region: { in: [region, 'ALL'] },
        active: true,
      },
      orderBy: { importance: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting credit tips:', error);
    return [];
  }
}

export async function getFAQs(category?: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return [];

    return await prisma.fAQ.findMany({
      where: category ? { category, active: true } : { active: true },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error getting FAQs:', error);
    return [];
  }
}

export async function getGoalTemplates(category?: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return [];

    return await prisma.goalTemplate.findMany({
      where: category ? { category, active: true } : { active: true },
      orderBy: { order: 'asc' },
    });
  } catch (error) {
    console.error('Error getting goal templates:', error);
    return [];
  }
}

export async function getArticles(options: {
  category?: string;
  featured?: boolean;
  limit?: number;
} = {}) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return [];

    const where: any = { published: true };
    if (options.category) where.category = options.category;
    if (options.featured !== undefined) where.featured = options.featured;

    return await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: options.limit || 10,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        featured: true,
        publishedAt: true,
        views: true,
      },
    });
  } catch (error) {
    console.error('Error getting articles:', error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const article = await prisma.article.findUnique({
      where: { slug, published: true },
    });

    if (article) {
      // Increment view count
      await prisma.article.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return article;
  } catch (error) {
    console.error('Error getting article:', error);
    return null;
  }
}

// ============================================
// BUDGET OPERATIONS
// ============================================

export async function saveBudget(whopId: string, month: number, year: number, categories: any) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await findOrCreateUser(whopId);
    if (!user) return null;

    return await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId: user.id,
          month,
          year,
        },
      },
      update: { categories },
      create: {
        userId: user.id,
        month,
        year,
        categories,
      },
    });
  } catch (error) {
    console.error('Error saving budget:', error);
    return null;
  }
}

// ============================================
// BILL OPERATIONS
// ============================================

export async function saveBills(whopId: string, bills: any[]) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await findOrCreateUser(whopId);
    if (!user) return null;

    // Delete existing bills and create new ones
    await prisma.bill.deleteMany({ where: { userId: user.id } });

    return await prisma.bill.createMany({
      data: bills.map(bill => ({
        userId: user.id,
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        dueDate: bill.dueDate,
        recurring: bill.recurring !== false,
        paid: bill.paid || false,
      })),
    });
  } catch (error) {
    console.error('Error saving bills:', error);
    return null;
  }
}

// ============================================
// DEBT OPERATIONS
// ============================================

export async function saveDebts(whopId: string, debts: any[]) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await findOrCreateUser(whopId);
    if (!user) return null;

    // Delete existing debts and create new ones
    await prisma.debt.deleteMany({ where: { userId: user.id } });

    return await prisma.debt.createMany({
      data: debts.map(debt => ({
        userId: user.id,
        name: debt.name,
        type: debt.type,
        balance: debt.balance,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
      })),
    });
  } catch (error) {
    console.error('Error saving debts:', error);
    return null;
  }
}

// ============================================
// NET WORTH OPERATIONS
// ============================================

export async function saveNetWorthSnapshot(whopId: string, snapshot: any) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return null;

    const user = await findOrCreateUser(whopId);
    if (!user) return null;

    const totalAssets = snapshot.savings + snapshot.investments + snapshot.property + snapshot.other;
    const totalLiabilities = snapshot.loans + snapshot.creditCards + snapshot.otherDebts;
    const netWorth = totalAssets - totalLiabilities;

    return await prisma.netWorthSnapshot.create({
      data: {
        userId: user.id,
        savings: snapshot.savings,
        investments: snapshot.investments,
        property: snapshot.property,
        other: snapshot.other,
        loans: snapshot.loans,
        creditCards: snapshot.creditCards,
        otherDebts: snapshot.otherDebts,
        totalAssets,
        totalLiabilities,
        netWorth,
        date: snapshot.date || new Date(),
      },
    });
  } catch (error) {
    console.error('Error saving net worth snapshot:', error);
    return null;
  }
}

export async function getNetWorthHistory(whopId: string, limit: number = 12) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return [];

    const user = await prisma.user.findUnique({
      where: { whopId },
      include: {
        netWorthSnapshots: {
          orderBy: { date: 'desc' },
          take: limit,
        },
      },
    });

    return user?.netWorthSnapshots || [];
  } catch (error) {
    console.error('Error getting net worth history:', error);
    return [];
  }
}

// ============================================
// RAG: USER FINANCIAL CONTEXT
// ============================================

/**
 * Get comprehensive financial context for AI coaching
 * Fetches all user data needed for personalized advice
 */
export async function getUserFinancialContext(whopId: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('[RAG] Database unavailable, returning empty context');
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { whopId },
      include: {
        goal: true,
        budgets: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        bills: {
          where: { recurring: true },
          orderBy: { dueDate: 'asc' },
        },
        debts: {
          orderBy: { balance: 'desc' },
        },
        netWorthSnapshots: {
          orderBy: { date: 'desc' },
          take: 2, // Current and previous for trend
        },
      },
    });

    if (!user) {
      console.log('[RAG] User not found in database');
      return null;
    }

    // Calculate totals
    const totalMonthlyBills = user.bills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalDebt = user.debts.reduce((sum, debt) => sum + debt.balance, 0);
    const weightedDebtAPR = user.debts.length > 0
      ? user.debts.reduce((sum, debt) => sum + (debt.interestRate * debt.balance), 0) / totalDebt
      : 0;

    // Calculate progress
    const progressPercent = user.goal
      ? (user.goal.currentSavings / user.goal.targetAmount) * 100
      : 0;

    // Calculate net worth trend
    let netWorthTrend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown';
    if (user.netWorthSnapshots.length >= 2) {
      const current = user.netWorthSnapshots[0].netWorth;
      const previous = user.netWorthSnapshots[1].netWorth;
      const change = ((current - previous) / Math.abs(previous)) * 100;

      if (change > 2) netWorthTrend = 'improving';
      else if (change < -2) netWorthTrend = 'declining';
      else netWorthTrend = 'stable';
    }

    return {
      // User basic info
      region: user.goal?.region || 'US',
      currency: user.goal?.currency || 'USD',

      // Goal information
      goal: user.goal ? {
        type: user.goal.type,
        customGoal: user.goal.customGoal,
        targetAmount: user.goal.targetAmount,
        currentSavings: user.goal.currentSavings,
        remaining: user.goal.targetAmount - user.goal.currentSavings,
        timeframe: user.goal.timeframe,
        monthlyTarget: (user.goal.targetAmount - user.goal.currentSavings) / (user.goal.timeframe * 12),
        progressPercent,
        onTrack: progressPercent >= (100 / (user.goal.timeframe * 12)) * (Date.now() - user.goal.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
      } : null,

      // Budget information
      budget: user.budgets[0] ? {
        month: user.budgets[0].month,
        year: user.budgets[0].year,
        categories: user.budgets[0].categories as any,
      } : null,

      // Bills
      bills: user.bills.map(bill => ({
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        dueDate: bill.dueDate,
      })),
      totalMonthlyBills,

      // Debts
      debts: user.debts.map(debt => ({
        name: debt.name,
        type: debt.type,
        balance: debt.balance,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
        monthlyInterest: (debt.balance * debt.interestRate / 100) / 12,
      })),
      totalDebt,
      weightedDebtAPR,
      monthlyDebtInterest: (totalDebt * weightedDebtAPR / 100) / 12,

      // Net worth
      netWorth: user.netWorthSnapshots[0] ? {
        current: user.netWorthSnapshots[0].netWorth,
        totalAssets: user.netWorthSnapshots[0].totalAssets,
        totalLiabilities: user.netWorthSnapshots[0].totalLiabilities,
        trend: netWorthTrend,
        lastUpdated: user.netWorthSnapshots[0].date,
      } : null,

      // Summary flags
      hasDebt: totalDebt > 0,
      highInterestDebt: user.debts.some(d => d.interestRate > 15),
      hasGoal: !!user.goal,
      goalProgress: progressPercent,
    };
  } catch (error) {
    console.error('[RAG] Error getting user financial context:', error);
    return null;
  }
}
