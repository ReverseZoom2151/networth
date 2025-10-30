// Premium Product Search API - Uses Perplexity for real-time product research
// Provides up-to-date financial product recommendations

import { NextRequest, NextResponse } from 'next/server';
import { searchFinancialProducts, isPerplexityAvailable } from '@/lib/perplexityAPI';
import prisma from '@/lib/prisma';

// GET /api/products/premium-search - Search for financial products using Perplexity
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const productType = searchParams.get('type') as 'savings' | 'credit-cards' | 'mortgages' | 'investment-platforms';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!productType) {
      return NextResponse.json({ error: 'Product type is required' }, { status: 400 });
    }

    // Check if Perplexity is available
    if (!isPerplexityAvailable()) {
      return NextResponse.json(
        {
          error: 'Premium search not available',
          message: 'This feature requires Perplexity API configuration',
        },
        { status: 503 }
      );
    }

    // Get user profile for personalized recommendations
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userProfile = user.goal
      ? {
          goal: user.goal.type,
          amount: user.goal.targetAmount,
        }
      : undefined;

    // Search for products using Perplexity
    const products = await searchFinancialProducts(
      productType,
      user.goal?.region || 'US',
      userProfile
    );

    return NextResponse.json({
      success: true,
      productType,
      products,
      count: products.length,
      updatedAt: new Date().toISOString(),
      source: 'Perplexity Premium',
    });
  } catch (error) {
    console.error('Failed to search products:', error);
    return NextResponse.json(
      {
        error: 'Failed to search products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
