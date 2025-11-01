// API routes for Financial Health Score

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWhopId } from '@/lib/db';
import { calculateFinancialHealthScore } from '@/lib/calculations';
import prisma from '@/lib/prisma';

// GET /api/financial-health - Get user's financial health score
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get latest financial health score
    const latestHealth = await prisma.financialHealth.findFirst({
      where: { userId: user.id },
      orderBy: { calculatedAt: 'desc' },
    });

    if (latestHealth) {
      return NextResponse.json({ financialHealth: latestHealth });
    }

    // Calculate new score if none exists
    const health = await calculateFinancialHealth(user.id);
    return NextResponse.json({ financialHealth: health });
  } catch (error) {
    console.error('Failed to fetch financial health:', error);
    return NextResponse.json({ error: 'Failed to fetch financial health' }, { status: 500 });
  }
}

// POST /api/financial-health - Calculate and save financial health score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const health = await calculateFinancialHealth(user.id);
    return NextResponse.json({ financialHealth: health });
  } catch (error) {
    console.error('Failed to calculate financial health:', error);
    return NextResponse.json({ error: 'Failed to calculate financial health' }, { status: 500 });
  }
}

/**
 * Calculate financial health score from user data
 */
async function calculateFinancialHealth(userId: string) {
  // Get user financial data
  const goal = await prisma.userGoal.findUnique({ where: { userId } });
  const debts = await prisma.debt.findMany({ where: { userId } });
  const budgets = await prisma.budget.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  const investments = await prisma.investment.findMany({ where: { userId } });
  const latestCreditScore = await prisma.creditScore.findFirst({
    where: { userId },
    orderBy: { reportDate: 'desc' },
  });

  // Calculate metrics
  const annualIncome = (goal?.monthlyBudget || 0) * 12;
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  
  // Emergency fund (current savings / monthly expenses)
  const monthlyExpenses = (goal?.monthlyBudget || 0);
  const emergencyFundMonths = monthlyExpenses > 0 ? (goal?.currentSavings || 0) / monthlyExpenses : 0;
  
  // Savings rate
  const savingsRate = annualIncome > 0 ? (goal?.currentSavings || 0) / annualIncome : 0;
  
  // Debt-to-income ratio
  const debtToIncomeRatio = annualIncome > 0 ? totalDebt / annualIncome : 0;
  
  // Investment ratio
  const investmentRatio = annualIncome > 0 ? totalInvestments / annualIncome : 0;
  
  // Budget adherence (simplified - count months within budget)
  const budgetAdherence = budgets.length > 0 ? budgets.filter(b => {
    const categories = b.categories as Record<string, any>;
    return Object.values(categories).every((cat: any) => 
      cat.spent <= cat.budgeted * 1.1 // Within 10% of budget
    );
  }).length / budgets.length : 0.5;

  const creditScore = latestCreditScore?.score || 650; // Default to 650 if no score

  // Calculate health score
  const scores = calculateFinancialHealthScore({
    emergencyFundMonths,
    savingsRate,
    debtToIncomeRatio,
    creditScore,
    investmentRatio,
    budgetAdherence,
  });

  // Generate recommendations
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (scores.savingsScore >= 70) {
    strengths.push('Strong emergency fund');
  } else {
    weaknesses.push('Emergency fund needs improvement');
    recommendations.push('Aim for 3-6 months of expenses in your emergency fund');
  }

  if (scores.debtScore >= 70) {
    strengths.push('Low debt-to-income ratio');
  } else {
    weaknesses.push('High debt relative to income');
    recommendations.push('Focus on paying down high-interest debt');
  }

  if (scores.spendingScore >= 70) {
    strengths.push('Good budget adherence');
  } else {
    weaknesses.push('Spending exceeds budget');
    recommendations.push('Review spending categories and adjust budget');
  }

  if (scores.investmentScore >= 50) {
    strengths.push('Investment portfolio growing');
  } else {
    weaknesses.push('Limited investment portfolio');
    recommendations.push('Consider starting retirement savings');
  }

  // Save to database
  const financialHealth = await prisma.financialHealth.create({
    data: {
      userId,
      overallScore: scores.overallScore,
      savingsScore: scores.savingsScore,
      debtScore: scores.debtScore,
      spendingScore: scores.spendingScore,
      investmentScore: scores.investmentScore,
      creditScore: scores.creditScore,
      strengths,
      weaknesses,
      recommendations,
      metrics: {
        emergencyFundMonths,
        savingsRate,
        debtToIncomeRatio,
        creditScore,
        investmentRatio,
        budgetAdherence,
        totalDebt,
        totalInvestments,
        annualIncome,
      },
    },
  });

  return financialHealth;
}

