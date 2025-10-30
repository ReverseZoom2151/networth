// API routes for smart suggestions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/suggestions - Get all active suggestions for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const where: any = {
      userId,
      status: { not: 'dismissed' }, // Get non-dismissed suggestions
    };

    if (type) {
      where.suggestionType = type;
    }

    const suggestions = await prisma.smartSuggestion.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}

// POST /api/suggestions - Create a new suggestion
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      type,
      title,
      description,
      potentialSavings,
      timeframe,
      actionUrl,
      actionLabel,
      priority = 0,
      relevanceScore = 0.5,
      productType,
      productDetails,
      imageUrl,
      expiresAt,
    } = await req.json();

    if (!userId || !type || !title || !description) {
      return NextResponse.json(
        { error: 'userId, type, title, and description are required' },
        { status: 400 }
      );
    }

    const suggestion = await prisma.smartSuggestion.create({
      data: {
        userId,
        suggestionType: type,
        title,
        description,
        potentialSavings,
        timeframe,
        actionUrl,
        actionLabel,
        priority,
        relevanceScore,
        productType,
        productDetails,
        imageUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Failed to create suggestion:', error);
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
  }
}

// PUT /api/suggestions - Update suggestion (mark as dismissed, etc.)
export async function PUT(req: NextRequest) {
  try {
    const { suggestionId, status, userFeedback } = await req.json();

    if (!suggestionId) {
      return NextResponse.json({ error: 'Suggestion ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (userFeedback !== undefined) updateData.userFeedback = userFeedback;

    const suggestion = await prisma.smartSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Failed to update suggestion:', error);
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
  }
}

// DELETE /api/suggestions - Delete a suggestion
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const suggestionId = searchParams.get('id');

    if (!suggestionId) {
      return NextResponse.json({ error: 'Suggestion ID is required' }, { status: 400 });
    }

    await prisma.smartSuggestion.delete({
      where: { id: suggestionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete suggestion:', error);
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 });
  }
}
