// API route for progress vs average over time
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const goalId = searchParams.get('goalId');
    const months = parseInt(searchParams.get('months') || '12');

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

    // Get user's progress history
    const progressHistory = await prisma.progressHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: months,
    });

    // Get peer metrics for comparison
    const peerMetric = await prisma.peerMetric.findFirst({
      where: {
        goalType: userGoal.type,
        region: userGoal.region,
        timeframe: userGoal.timeframe,
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Generate mock data points if no real data exists
    const dataPoints = [];
    const currentMonth = new Date().getMonth() + 1;

    for (let i = 0; i < months; i++) {
      const monthOffset = months - i - 1;
      const month = ((currentMonth - monthOffset - 1 + 12) % 12) + 1;

      // Calculate user balance (either from history or interpolate)
      let userBalance = 0;
      if (progressHistory.length > i) {
        userBalance = progressHistory[i].amount;
      } else {
        // Interpolate based on current savings
        userBalance = (userGoal.currentSavings / months) * (i + 1);
      }

      // Calculate average balance (based on peer metrics or mock data)
      const averageBalance = peerMetric
        ? (peerMetric.averageSavings / userGoal.timeframe / 12) * (i + 1)
        : (userGoal.targetAmount * 0.3 / months) * (i + 1);

      // Percentiles
      const percentile25 = peerMetric ? (peerMetric.percentile25 / userGoal.timeframe / 12) * (i + 1) : averageBalance * 0.6;
      const percentile50 = peerMetric ? (peerMetric.percentile50 / userGoal.timeframe / 12) * (i + 1) : averageBalance * 0.85;
      const percentile75 = peerMetric ? (peerMetric.percentile75 / userGoal.timeframe / 12) * (i + 1) : averageBalance * 1.5;
      const percentile90 = peerMetric ? (peerMetric.percentile90 / userGoal.timeframe / 12) * (i + 1) : averageBalance * 2.2;

      dataPoints.push({
        month,
        userBalance,
        averageBalance,
        percentile25,
        percentile50,
        percentile75,
        percentile90,
      });
    }

    return NextResponse.json(dataPoints);
  } catch (error) {
    console.error('Failed to fetch progress data:', error);
    return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
  }
}
