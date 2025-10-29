import { NextRequest, NextResponse } from 'next/server';
import { getFinancialAdvice } from '@/lib/ai';
import { UserGoal, Message } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, goal, history } = body as {
      message: string;
      goal: UserGoal;
      history: Message[];
    };

    if (!message || !goal) {
      return NextResponse.json(
        { error: 'Message and goal are required' },
        { status: 400 }
      );
    }

    // Get AI response
    const response = await getFinancialAdvice(message, goal, history);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
