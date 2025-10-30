// API route for tracking product clicks
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/products/track-click - Track when user clicks on product
export async function POST(req: NextRequest) {
  try {
    const { productId, userId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Increment click count
    await prisma.financialProduct.update({
      where: { id: productId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    // If userId provided, update recommendation
    if (userId) {
      const recommendation = await prisma.productRecommendation.findFirst({
        where: {
          userId,
          productId,
        },
      });

      if (recommendation) {
        await prisma.productRecommendation.update({
          where: { id: recommendation.id },
          data: {
            clicked: true,
            viewedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track product click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
