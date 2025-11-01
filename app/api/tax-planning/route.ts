// API routes for Tax Planning

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWhopId } from '@/lib/db';
import { calculateTaxEstimate } from '@/lib/calculations';
import prisma from '@/lib/prisma';

// GET /api/tax-planning - Get user's tax plans
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const taxYear = request.nextUrl.searchParams.get('taxYear');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where: any = { userId: user.id };
    if (taxYear) {
      where.taxYear = parseInt(taxYear);
    }

    const taxPlans = await prisma.taxPlan.findMany({
      where,
      orderBy: { taxYear: 'desc' },
    });

    return NextResponse.json({ taxPlans });
  } catch (error) {
    console.error('Failed to fetch tax plans:', error);
    return NextResponse.json({ error: 'Failed to fetch tax plans' }, { status: 500 });
  }
}

// POST /api/tax-planning - Create or update tax plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, taxYear, annualIncome, filingStatus, region, deductions, credits } = body;

    if (!userId || !taxYear || !annualIncome) {
      return NextResponse.json(
        { error: 'userId, taxYear, and annualIncome are required' },
        { status: 400 }
      );
    }

    const user = await getUserByWhopId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate tax estimate
    const taxEstimate = calculateTaxEstimate({
      annualIncome,
      filingStatus: filingStatus || 'single',
      region: region || 'US',
      deductions,
      credits,
    });

    // Generate recommendations
    const recommendations: string[] = [];
    const actionItems: any[] = [];

    if (!deductions || deductions === 0) {
      recommendations.push('Consider itemizing deductions if they exceed standard deduction');
      actionItems.push({
        type: 'deduction',
        description: 'Track deductible expenses throughout the year',
        potentialSavings: taxEstimate.effectiveRate * annualIncome * 0.1, // Estimate 10% savings
      });
    }

    if (taxEstimate.effectiveRate > 0.20) {
      recommendations.push('Consider tax-advantaged accounts (401(k), IRA, HSA)');
      actionItems.push({
        type: 'retirement_account',
        description: 'Contribute to retirement accounts to reduce taxable income',
        potentialSavings: annualIncome * 0.1 * taxEstimate.marginalRate,
      });
    }

    // Save or update tax plan
    const taxPlan = await prisma.taxPlan.upsert({
      where: {
        userId_taxYear: {
          userId: user.id,
          taxYear: parseInt(taxYear),
        },
      },
      update: {
        estimatedIncome: annualIncome,
        estimatedTax: taxEstimate.estimatedTax,
        estimatedRefund: taxEstimate.afterTaxIncome - annualIncome,
        deductions: deductions || {},
        credits: credits || {},
        potentialSavings: actionItems.reduce((sum, item) => sum + (item.potentialSavings || 0), 0),
        recommendations,
        actionItems,
      },
      create: {
        userId: user.id,
        taxYear: parseInt(taxYear),
        estimatedIncome: annualIncome,
        estimatedTax: taxEstimate.estimatedTax,
        estimatedRefund: taxEstimate.afterTaxIncome - annualIncome,
        deductions: deductions || {},
        credits: credits || {},
        potentialSavings: actionItems.reduce((sum, item) => sum + (item.potentialSavings || 0), 0),
        recommendations,
        actionItems,
      },
    });

    return NextResponse.json({ taxPlan, taxEstimate });
  } catch (error) {
    console.error('Failed to create tax plan:', error);
    return NextResponse.json({ error: 'Failed to create tax plan' }, { status: 500 });
  }
}

