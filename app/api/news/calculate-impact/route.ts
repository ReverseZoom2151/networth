// API route for calculating personalized news impact using Claude AI
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/prisma';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/news/calculate-impact - Calculate personalized impact for news item
export async function POST(req: NextRequest) {
  try {
    const { userId, newsId } = await req.json();

    if (!userId || !newsId) {
      return NextResponse.json(
        { error: 'User ID and News ID are required' },
        { status: 400 }
      );
    }

    // Get user's goal and financial data
    const userGoal = await prisma.userGoal.findUnique({
      where: { userId },
    });

    if (!userGoal) {
      return NextResponse.json({ error: 'User goal not found' }, { status: 404 });
    }

    // Get news item
    const news = await prisma.newsImpact.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    // Calculate personalized impact using Claude
    const prompt = `You are a financial advisor explaining news to a university student.

News Item:
Title: ${news.title}
Summary: ${news.summary}
Category: ${news.category}
Full Context: ${news.fullContent || news.summary}

User's Financial Situation:
- Goal: ${userGoal.type} (${userGoal.customGoal || ''})
- Target Amount: $${userGoal.targetAmount}
- Current Savings: $${userGoal.currentSavings}
- Timeframe: ${userGoal.timeframe} years
- Region: ${userGoal.region}
- Monthly Budget: $${userGoal.monthlyBudget || 'Not set'}

Task: Explain in 2-3 sentences how this news specifically affects this person's goal. Be conversational, clear, and avoid jargon. Calculate approximate dollar impact if applicable.

If this is about interest rate changes, calculate the impact on their savings or loan costs.
If this is about policy changes, explain direct effects on their timeline or strategy.
If this is about new products, explain if they should consider switching.

Format your response as:
IMPACT: [2-3 sentence explanation]
AMOUNT: [dollar amount impact per year, or "N/A" if not applicable]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse response
    const impactMatch = responseText.match(/IMPACT:\s*([\s\S]*?)(?=AMOUNT:|$)/);
    const amountMatch = responseText.match(/AMOUNT:\s*([\s\S]*?)$/);

    const personalizedImpact = impactMatch ? impactMatch[1].trim() : responseText;
    let impactAmount: number | null = null;

    if (amountMatch) {
      const amountText = amountMatch[1].trim();
      const numberMatch = amountText.match(/[-+]?[\d,]+/);
      if (numberMatch) {
        impactAmount = parseFloat(numberMatch[0].replace(/,/g, ''));
      }
    }

    // Store the calculated impact
    const userNewsImpact = await prisma.userNewsImpact.upsert({
      where: {
        userId_newsImpactId: {
          userId,
          newsImpactId: newsId,
        },
      },
      update: {
        personalizedImpact,
        impactAmount,
      },
      create: {
        userId,
        newsImpactId: newsId,
        personalizedImpact,
        impactAmount,
      },
    });

    return NextResponse.json({
      personalizedImpact,
      impactAmount,
      userNewsImpact,
    });
  } catch (error) {
    console.error('Failed to calculate news impact:', error);
    return NextResponse.json({ error: 'Failed to calculate news impact' }, { status: 500 });
  }
}
