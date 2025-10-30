// API routes for spending pattern analysis
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/spending-patterns - Get all spending patterns for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const where: any = { userId };
    if (type) where.patternType = type;
    if (isActive !== null && isActive !== undefined) {
      where.status = isActive === 'true' ? 'active' : 'dismissed';
    }

    const patterns = await prisma.spendingPattern.findMany({
      where,
      orderBy: [
        { confidence: 'desc' },
        { detectedAt: 'desc' },
      ],
    });

    return NextResponse.json(patterns);
  } catch (error) {
    console.error('Failed to fetch spending patterns:', error);
    return NextResponse.json({ error: 'Failed to fetch spending patterns' }, { status: 500 });
  }
}

// POST /api/spending-patterns - Create a new spending pattern
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      type,
      description,
      category,
      amount,
      frequency,
      confidence,
      potentialSavings,
      suggestion,
      suggestionType,
    } = await req.json();

    if (!userId || !type || !description) {
      return NextResponse.json(
        { error: 'userId, type, and description are required' },
        { status: 400 }
      );
    }

    const pattern = await prisma.spendingPattern.create({
      data: {
        userId,
        patternType: type,
        description,
        category,
        amount,
        frequency,
        confidence: confidence ?? 0.5,
        potentialSavings: potentialSavings ?? 0,
        suggestion,
        suggestionType,
        detectedAt: new Date(),
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    });

    return NextResponse.json(pattern);
  } catch (error) {
    console.error('Failed to create spending pattern:', error);
    return NextResponse.json({ error: 'Failed to create spending pattern' }, { status: 500 });
  }
}

// PUT /api/spending-patterns - Update a spending pattern
export async function PUT(req: NextRequest) {
  try {
    const { patternId, isActive, isAcknowledged } = await req.json();

    if (!patternId) {
      return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isAcknowledged !== undefined) {
      updateData.isAcknowledged = isAcknowledged;
      if (isAcknowledged) {
        updateData.acknowledgedAt = new Date();
      }
    }

    const pattern = await prisma.spendingPattern.update({
      where: { id: patternId },
      data: updateData,
    });

    return NextResponse.json(pattern);
  } catch (error) {
    console.error('Failed to update spending pattern:', error);
    return NextResponse.json({ error: 'Failed to update spending pattern' }, { status: 500 });
  }
}

// DELETE /api/spending-patterns - Delete a spending pattern
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const patternId = searchParams.get('id');

    if (!patternId) {
      return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 });
    }

    await prisma.spendingPattern.delete({
      where: { id: patternId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete spending pattern:', error);
    return NextResponse.json({ error: 'Failed to delete spending pattern' }, { status: 500 });
  }
}
