// API route for fetching active interventions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/interventions/active - Get active interventions for user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get active, unviewed interventions for the user
    const interventions = await prisma.interventionHistory.findMany({
      where: {
        userId,
        viewed: false,
        dismissed: false,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: limit,
    });

    // Get trigger details for each intervention
    const triggerIds = interventions.map(i => i.triggerId);
    const triggers = await prisma.interventionTrigger.findMany({
      where: {
        id: { in: triggerIds },
      },
    });

    const triggersMap = new Map(triggers.map(t => [t.id, t]));

    // Format response with trigger details
    const formatted = interventions.map(intervention => {
      const trigger = triggersMap.get(intervention.triggerId);

      return {
        id: intervention.id,
        triggerType: trigger?.triggerType || '',
        title: trigger?.title || '',
        message: trigger?.message || '',
        severity: trigger?.severity || 'info',
        suggestedAction: trigger?.suggestedAction,
        alternativeOptions: trigger?.alternativeOptions || [],
        icon: trigger?.icon,
        color: trigger?.color,
        calculatedImpact: intervention.calculatedImpact,
        contextData: intervention.contextData,
        triggeredAt: intervention.triggeredAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch active interventions:', error);
    return NextResponse.json({ error: 'Failed to fetch interventions' }, { status: 500 });
  }
}
