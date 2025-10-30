// API routes for peer comparison metrics
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/peer-metrics - Get peer comparison for user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const goalId = searchParams.get('goalId');

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

    // Find matching peer metric
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

    if (!peerMetric) {
      // Return mock data if no peer metrics exist yet
      return NextResponse.json({
        userSavings: userGoal.currentSavings,
        userProgress: (userGoal.currentSavings / userGoal.targetAmount) * 100,
        userPercentile: 50,
        peerMetric: {
          id: 'mock',
          goalType: userGoal.type,
          region: userGoal.region,
          timeframe: userGoal.timeframe,
          averageSavings: userGoal.targetAmount * 0.3,
          medianSavings: userGoal.targetAmount * 0.25,
          averageProgress: 30,
          percentile25: userGoal.targetAmount * 0.15,
          percentile50: userGoal.targetAmount * 0.25,
          percentile75: userGoal.targetAmount * 0.45,
          percentile90: userGoal.targetAmount * 0.65,
          userCount: 100,
          averageMonthlyDeposit: userGoal.targetAmount * 0.05,
          averageTimeToGoal: userGoal.timeframe * 12,
          successRate: 0.72,
        },
        performanceTier: 'average',
        message: 'Start tracking your progress to see how you compare!',
      });
    }

    // Calculate user's percentile
    const userSavings = userGoal.currentSavings;
    const userProgress = (userSavings / userGoal.targetAmount) * 100;

    let userPercentile = 0;
    if (userSavings >= peerMetric.percentile90) {
      userPercentile = 90 + (userSavings - peerMetric.percentile90) / (peerMetric.averageSavings * 0.5) * 10;
    } else if (userSavings >= peerMetric.percentile75) {
      userPercentile = 75 + (userSavings - peerMetric.percentile75) / (peerMetric.percentile90 - peerMetric.percentile75) * 15;
    } else if (userSavings >= peerMetric.percentile50) {
      userPercentile = 50 + (userSavings - peerMetric.percentile50) / (peerMetric.percentile75 - peerMetric.percentile50) * 25;
    } else if (userSavings >= peerMetric.percentile25) {
      userPercentile = 25 + (userSavings - peerMetric.percentile25) / (peerMetric.percentile50 - peerMetric.percentile25) * 25;
    } else {
      userPercentile = (userSavings / peerMetric.percentile25) * 25;
    }

    userPercentile = Math.min(100, Math.max(0, userPercentile));

    // Determine performance tier
    let performanceTier: 'top_10' | 'top_25' | 'above_average' | 'average' | 'below_average';
    if (userPercentile >= 90) {
      performanceTier = 'top_10';
    } else if (userPercentile >= 75) {
      performanceTier = 'top_25';
    } else if (userPercentile >= 50) {
      performanceTier = 'above_average';
    } else if (userPercentile >= 25) {
      performanceTier = 'average';
    } else {
      performanceTier = 'below_average';
    }

    // Generate personalized message
    let message = '';
    if (performanceTier === 'top_10') {
      message = "Incredible! You're in the top 10% of savers. Your consistent efforts are paying off big time!";
    } else if (performanceTier === 'top_25') {
      message = "Excellent work! You're ahead of 75% of savers. Keep up the momentum to reach the top 10%!";
    } else if (performanceTier === 'above_average') {
      message = "Great job! You're saving more than the average person with similar goals. Stay consistent!";
    } else if (performanceTier === 'average') {
      message = "You're on track! Consider increasing your monthly deposits by 10-15% to accelerate your progress.";
    } else {
      message = "Every journey starts somewhere! Small, consistent increases can help you catch up quickly.";
    }

    return NextResponse.json({
      userSavings,
      userProgress,
      userPercentile,
      peerMetric,
      performanceTier,
      message,
    });
  } catch (error) {
    console.error('Failed to fetch peer metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch peer metrics' }, { status: 500 });
  }
}

// POST /api/peer-metrics - Calculate and update peer metrics (admin/cron job)
export async function POST(req: NextRequest) {
  try {
    const { goalType, region, timeframe } = await req.json();

    if (!goalType || !region || !timeframe) {
      return NextResponse.json(
        { error: 'Goal type, region, and timeframe are required' },
        { status: 400 }
      );
    }

    // Get all users with this goal type, region, and timeframe
    const users = await prisma.userGoal.findMany({
      where: {
        type: goalType,
        region,
        timeframe,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found for this cohort' }, { status: 404 });
    }

    // Calculate statistics
    const savings = users.map(u => u.currentSavings).sort((a, b) => a - b);
    const progress = users.map(u => (u.currentSavings / u.targetAmount) * 100);

    const sum = savings.reduce((a, b) => a + b, 0);
    const averageSavings = sum / savings.length;
    const medianSavings = savings[Math.floor(savings.length / 2)];
    const averageProgress = progress.reduce((a, b) => a + b, 0) / progress.length;

    const percentile25 = savings[Math.floor(savings.length * 0.25)];
    const percentile50 = medianSavings;
    const percentile75 = savings[Math.floor(savings.length * 0.75)];
    const percentile90 = savings[Math.floor(savings.length * 0.90)];

    // Approximate monthly deposits (simplified)
    const averageMonthlyDeposit = averageSavings / (timeframe * 12);

    // Create new peer metric snapshot
    const peerMetric = await prisma.peerMetric.create({
      data: {
        goalType,
        region,
        timeframe,
        averageSavings,
        medianSavings,
        averageProgress,
        percentile25,
        percentile50,
        percentile75,
        percentile90,
        userCount: users.length,
        averageMonthlyDeposit,
        averageTimeToGoal: null, // Can be calculated with more data
        successRate: null, // Can be calculated with goal completion tracking
      },
    });

    return NextResponse.json(peerMetric);
  } catch (error) {
    console.error('Failed to calculate peer metrics:', error);
    return NextResponse.json({ error: 'Failed to calculate peer metrics' }, { status: 500 });
  }
}
