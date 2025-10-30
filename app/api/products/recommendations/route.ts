// API route for personalized product recommendations
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/recommendations - Get personalized product recommendations
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's goal
    const userGoal = await prisma.userGoal.findUnique({
      where: { userId },
    });

    if (!userGoal) {
      return NextResponse.json({ error: 'User goal not found' }, { status: 404 });
    }

    // Get all active products
    const products = await prisma.financialProduct.findMany({
      where: { active: true },
      orderBy: [
        { featured: 'desc' },
        { priority: 'desc' },
      ],
    });

    // Calculate relevance score for each product
    const scoredProducts = products.map(product => {
      let score = 0;
      let matchReason = '';
      let potentialBenefit: number | null = null;

      // Goal type match (40 points)
      if (product.suitableForGoals.includes(userGoal.type)) {
        score += 40;
        matchReason = `Perfect for ${userGoal.type} goals. `;
      }

      // Region match (20 points)
      if (product.region === userGoal.region || product.region === null) {
        score += 20;
      } else {
        // Penalize wrong region
        score -= 30;
      }

      // Balance level match (20 points)
      const currentBalance = userGoal.currentSavings;
      if (product.minDeposit !== null) {
        if (currentBalance >= product.minDeposit) {
          score += 20;
        } else {
          score -= 10;
        }
      } else {
        score += 20; // No minimum is good
      }

      // Featured products get bonus (10 points)
      if (product.featured) {
        score += 10;
      }

      // Calculate potential benefit for savings products
      if (product.productType === 'savings_account' || product.productType === 'isa') {
        if (product.interestRate && currentBalance > 0) {
          // Assume they're currently getting 0.5% (average checking)
          const currentEarnings = currentBalance * 0.005;
          const newEarnings = currentBalance * (product.interestRate / 100);
          potentialBenefit = Math.round(newEarnings - currentEarnings);

          if (potentialBenefit > 0) {
            matchReason += `You could earn $${potentialBenefit} more per year. `;
            score += 10;
          }
        }
      }

      // Generate match reason if not already set
      if (!matchReason) {
        matchReason = `${product.primaryBenefit} while ${product.secondaryBenefit.toLowerCase()}.`;
      }

      // Normalize score to 0-1
      const relevanceScore = Math.max(0, Math.min(1, score / 100));

      return {
        productId: product.id,
        productName: product.name,
        provider: product.provider,
        productType: product.productType,
        interestRate: product.interestRate,
        primaryBenefit: product.primaryBenefit,
        secondaryBenefit: product.secondaryBenefit,
        relevanceScore,
        matchReason: matchReason.trim(),
        potentialBenefit,
      };
    });

    // Sort by relevance score and take top N
    const topRecommendations = scoredProducts
      .filter(p => p.relevanceScore > 0.3) // Minimum threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Store recommendations in database for tracking
    for (const rec of topRecommendations) {
      await prisma.productRecommendation.upsert({
        where: {
          userId_productId: {
            userId,
            productId: rec.productId,
          },
        },
        update: {
          relevanceScore: rec.relevanceScore,
          matchReason: rec.matchReason,
          potentialBenefit: rec.potentialBenefit,
          recommendedAt: new Date(),
        },
        create: {
          userId,
          productId: rec.productId,
          relevanceScore: rec.relevanceScore,
          matchReason: rec.matchReason,
          potentialBenefit: rec.potentialBenefit,
        },
      });
    }

    return NextResponse.json(topRecommendations);
  } catch (error) {
    console.error('Failed to get product recommendations:', error);
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
