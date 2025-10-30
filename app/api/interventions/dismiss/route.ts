// API route for dismissing interventions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/interventions/dismiss - Dismiss an intervention
export async function POST(req: NextRequest) {
  try {
    const { userId, interventionId, feedback } = await req.json();

    if (!userId || !interventionId) {
      return NextResponse.json(
        { error: 'User ID and Intervention ID are required' },
        { status: 400 }
      );
    }

    // Update intervention history
    const updated = await prisma.interventionHistory.update({
      where: { id: interventionId },
      data: {
        dismissed: true,
        viewed: true,
        viewedAt: new Date(),
        feedback,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to dismiss intervention:', error);
    return NextResponse.json({ error: 'Failed to dismiss intervention' }, { status: 500 });
  }
}
