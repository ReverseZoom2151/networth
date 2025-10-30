// API route for financial products
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products - Get all active products with optional filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productType = searchParams.get('productType');
    const region = searchParams.get('region');
    const goalType = searchParams.get('goalType');

    // Build where clause
    const where: any = {
      active: true,
    };

    if (productType) {
      where.productType = productType;
    }

    if (region) {
      where.region = region;
    }

    if (goalType) {
      where.suitableForGoals = {
        has: goalType,
      };
    }

    // Fetch products
    const products = await prisma.financialProduct.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { priority: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
