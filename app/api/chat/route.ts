import { NextRequest, NextResponse } from 'next/server';
import { getFinancialAdvice } from '@/lib/ai';
import { UserGoal, Message } from '@/lib/types';
import { getUserFinancialContext } from '@/lib/db';
import { searchKnowledge } from '@/lib/vector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, goal, history, userId } = body as {
      message: string;
      goal: UserGoal;
      history: Message[];
      userId?: string;
    };

    if (!message || !goal) {
      return NextResponse.json(
        { error: 'Message and goal are required' },
        { status: 400 }
      );
    }

    // PHASE 1 RAG: Fetch user's financial context (debts, bills, goals, net worth)
    let financialContext = null;
    if (userId) {
      console.log('[RAG Phase 1] Fetching financial context for user:', userId);
      financialContext = await getUserFinancialContext(userId);

      if (financialContext) {
        console.log('[RAG Phase 1] Context loaded:', {
          hasGoal: financialContext.hasGoal,
          hasDebt: financialContext.hasDebt,
          totalDebt: financialContext.totalDebt,
          billsCount: financialContext.bills.length,
        });
      } else {
        console.log('[RAG Phase 1] No financial context available');
      }
    }

    // PHASE 2 RAG: Search knowledge base for relevant content
    console.log('[RAG Phase 2] Searching knowledge base for:', message.substring(0, 50));
    const relevantKnowledge = await searchKnowledge(message, {
      limit: 3, // Top 3 most relevant results
      region: goal.region, // Match user's region
      minSimilarity: 0.75, // Only very relevant content
    });

    console.log('[RAG Phase 2] Found', relevantKnowledge.length, 'relevant knowledge entries');

    // Get AI response with enhanced context (Phase 1 + Phase 2)
    const response = await getFinancialAdvice(
      message,
      goal,
      history,
      financialContext,
      relevantKnowledge.map(item => ({
        content: item.content,
        title: item.title || undefined,
        contentType: item.contentType,
        similarity: item.similarity,
      }))
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
