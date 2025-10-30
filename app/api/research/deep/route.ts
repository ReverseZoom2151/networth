// Deep Research API - Premium feature using Perplexity
// Provides comprehensive multi-source research on financial topics

import { NextRequest, NextResponse } from 'next/server';
import { performDeepResearch, isPerplexityAvailable } from '@/lib/perplexityAPI';
import prisma from '@/lib/prisma';

// POST /api/research/deep - Perform deep research on a topic
export async function POST(req: NextRequest) {
  try {
    const { userId, topic, includeUserContext = true } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Research topic is required' }, { status: 400 });
    }

    // Check if Perplexity is available
    if (!isPerplexityAvailable()) {
      return NextResponse.json(
        {
          error: 'Deep research feature not available',
          message: 'This premium feature requires Perplexity API configuration',
        },
        { status: 503 }
      );
    }

    // Check user access (premium feature)
    // In production, verify user has premium subscription
    const user = await prisma.user.findUnique({
      where: { whopId: userId },
      include: { goal: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user context for personalized research
    let userGoal: string | undefined;
    let userRegion: string | undefined;

    if (includeUserContext && user.goal) {
      userGoal = user.goal.type;
      userRegion = user.goal.region;
    }

    // Perform deep research using Perplexity
    const research = await performDeepResearch(topic, userGoal, userRegion);

    // Log research request for analytics
    console.log(`[Deep Research] User: ${userId}, Topic: "${topic}"`);

    return NextResponse.json({
      success: true,
      topic,
      research: {
        summary: research.summary,
        keyFindings: research.keyFindings,
        recommendations: research.recommendations,
        sources: research.sources,
        generatedAt: new Date().toISOString(),
      },
      userContext: includeUserContext
        ? {
            goal: userGoal,
            region: userRegion,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Failed to perform deep research:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete research',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/research/deep - Get research history (optional)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // In production, fetch research history from database
    // For now, return empty array
    return NextResponse.json({
      history: [],
      message: 'Research history feature coming soon',
    });
  } catch (error) {
    console.error('Failed to fetch research history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
