import { NextRequest, NextResponse } from 'next/server';
import { getFinancialAdvice } from '@/lib/ai';
import { UserGoal, Message } from '@/lib/types';
import { getUserFinancialContext } from '@/lib/db';

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

    // Fetch comprehensive financial context if userId provided
    let financialContext = null;
    if (userId) {
      console.log('[RAG] Fetching financial context for user:', userId);
      financialContext = await getUserFinancialContext(userId);

      if (financialContext) {
        console.log('[RAG] Context loaded:', {
          hasGoal: financialContext.hasGoal,
          hasDebt: financialContext.hasDebt,
          totalDebt: financialContext.totalDebt,
          billsCount: financialContext.bills.length,
        });
      } else {
        console.log('[RAG] No financial context available (database unavailable or user not found)');
      }
    }

    // Get AI response with enhanced context
    const response = await getFinancialAdvice(message, goal, history, financialContext);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
