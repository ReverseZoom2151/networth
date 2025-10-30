// API route for tracking module completion
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/invest/module-complete - Mark a learning module as completed
export async function POST(req: NextRequest) {
  try {
    const { userId, moduleId } = await req.json();

    if (!userId || !moduleId) {
      return NextResponse.json({ error: 'User ID and module ID are required' }, { status: 400 });
    }

    // Get current profile
    const profile = await prisma.investmentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Add module to completed list if not already there
    const modulesCompleted = profile.modulesCompleted || [];
    if (!modulesCompleted.includes(moduleId)) {
      modulesCompleted.push(moduleId);

      await prisma.investmentProfile.update({
        where: { userId },
        data: {
          modulesCompleted,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, modulesCompleted });
  } catch (error) {
    console.error('Failed to mark module as complete:', error);
    return NextResponse.json({ error: 'Failed to update completion status' }, { status: 500 });
  }
}
