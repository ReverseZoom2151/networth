import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { UserGoal, Message } from '@/lib/types';
import { getUserFinancialContext } from '@/lib/db';
import { searchKnowledge } from '@/lib/vector';
import { performDeepResearch, isPerplexityAvailable } from '@/lib/perplexityAPI';
import { getRegionConfig } from '@/lib/regions';
import {
  calculateFutureValue,
  calculateMonthlyPayment,
  calculateTimeToGoal,
  calculateDebtPayoff,
  calculateLoanPayment,
  calculateCompoundInterest,
} from '@/lib/calculations';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Financial calculator tools for Claude
const calculatorTools: Anthropic.Tool[] = [
  {
    name: 'calculate_future_value',
    description: 'Calculate the future value of savings with compound interest.',
    input_schema: {
      type: 'object',
      properties: {
        presentValue: { type: 'number', description: 'Current amount saved' },
        monthlyContribution: { type: 'number', description: 'Amount added each month' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal, e.g., 0.05 for 5%)' },
        years: { type: 'number', description: 'Number of years' },
      },
      required: ['presentValue', 'monthlyContribution', 'annualRate', 'years'],
    },
  },
  {
    name: 'calculate_monthly_payment',
    description: 'Calculate monthly savings needed to reach a goal.',
    input_schema: {
      type: 'object',
      properties: {
        targetAmount: { type: 'number', description: 'Goal amount to reach' },
        years: { type: 'number', description: 'Number of years to save' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal)' },
        currentSavings: { type: 'number', description: 'Current amount saved' },
      },
      required: ['targetAmount', 'years', 'annualRate'],
    },
  },
  {
    name: 'calculate_time_to_goal',
    description: 'Calculate how long it will take to reach a savings goal.',
    input_schema: {
      type: 'object',
      properties: {
        targetAmount: { type: 'number', description: 'Goal amount' },
        currentSavings: { type: 'number', description: 'Current savings' },
        monthlyContribution: { type: 'number', description: 'Monthly savings' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal)' },
      },
      required: ['targetAmount', 'currentSavings', 'monthlyContribution', 'annualRate'],
    },
  },
  {
    name: 'calculate_debt_payoff',
    description: 'Calculate debt payoff timeline and interest.',
    input_schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: 'Debt amount' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal)' },
        monthlyPayment: { type: 'number', description: 'Monthly payment amount' },
      },
      required: ['principal', 'annualRate', 'monthlyPayment'],
    },
  },
  {
    name: 'calculate_loan_payment',
    description: 'Calculate monthly loan payment.',
    input_schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: 'Loan amount' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal)' },
        years: { type: 'number', description: 'Loan term in years' },
      },
      required: ['principal', 'annualRate', 'years'],
    },
  },
  {
    name: 'calculate_compound_interest',
    description: 'Calculate compound interest on an investment.',
    input_schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', description: 'Initial investment' },
        annualRate: { type: 'number', description: 'Annual interest rate (as decimal)' },
        years: { type: 'number', description: 'Number of years' },
        compoundingFrequency: { type: 'number', description: 'Times compounded per year' },
      },
      required: ['principal', 'annualRate', 'years'],
    },
  },
];

// Handle tool calls for Claude
function executeToolCall(toolName: string, toolInput: any): any {
  switch (toolName) {
    case 'calculate_future_value':
      return calculateFutureValue(
        toolInput.presentValue,
        toolInput.monthlyContribution,
        toolInput.annualRate,
        toolInput.years
      );
    case 'calculate_monthly_payment':
      return calculateMonthlyPayment(
        toolInput.targetAmount,
        toolInput.years,
        toolInput.annualRate,
        toolInput.currentSavings || 0
      );
    case 'calculate_time_to_goal':
      return calculateTimeToGoal(
        toolInput.targetAmount,
        toolInput.currentSavings,
        toolInput.monthlyContribution,
        toolInput.annualRate
      );
    case 'calculate_debt_payoff':
      return calculateDebtPayoff(
        toolInput.principal,
        toolInput.annualRate,
        toolInput.monthlyPayment
      );
    case 'calculate_loan_payment':
      return calculateLoanPayment(
        toolInput.principal,
        toolInput.annualRate,
        toolInput.years
      );
    case 'calculate_compound_interest':
      return calculateCompoundInterest(
        toolInput.principal,
        toolInput.annualRate,
        toolInput.years,
        toolInput.compoundingFrequency || 12
      );
    default:
      return { error: 'Unknown tool' };
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      model,
      modelCategory,
      deepResearch,
      goal,
      history,
      userId,
    } = body as {
      message: string;
      model: string;
      modelCategory: 'claude' | 'openai';
      deepResearch: boolean;
      goal: UserGoal;
      history: Message[];
      userId?: string;
    };

    if (!message || !goal || !model) {
      return NextResponse.json(
        { error: 'Message, model, and goal are required' },
        { status: 400 }
      );
    }

    // RAG Phase 1: Fetch user's financial context
    let financialContext = null;
    if (userId) {
      financialContext = await getUserFinancialContext(userId);
    }

    // RAG Phase 2: Search knowledge base
    const relevantKnowledge = await searchKnowledge(message, {
      limit: 3,
      region: goal.region,
      minSimilarity: 0.75,
    });

    // Phase 3: Deep Research (optional)
    let researchData = null;
    if (deepResearch && isPerplexityAvailable()) {
      try {
        researchData = await performDeepResearch(message, goal.type, goal.region);
      } catch (error) {
        console.error('Deep research failed:', error);
        // Continue without research if it fails
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(goal, financialContext, relevantKnowledge, researchData);

    // Get response based on model category
    let response: string;
    if (modelCategory === 'claude') {
      response = await getClaudeResponse(model, systemPrompt, message, history);
    } else {
      response = await getOpenAIResponse(model, systemPrompt, message, history);
    }

    return NextResponse.json({
      response,
      research: researchData,
      model,
    });
  } catch (error) {
    console.error('AI Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Build comprehensive system prompt
function buildSystemPrompt(
  goal: UserGoal,
  financialContext: any,
  knowledge: any[],
  research: any
): string {
  const regionConfig = getRegionConfig(goal.region);

  let prompt = `You are an expert financial coach helping someone save for their goal: ${goal.type}.

User Context:
- Goal: Save ${regionConfig.currencySymbol}${goal.targetAmount?.toLocaleString() || 'amount'} in ${goal.timeframe || 'X'} months
- Current savings: ${regionConfig.currencySymbol}${goal.currentSavings?.toLocaleString() || '0'}
- Region: ${goal.region}
- Currency: ${regionConfig.currency}
`;

  if (financialContext) {
    prompt += `\nFinancial Context:
- Total debt: ${regionConfig.currencySymbol}${financialContext.totalDebt?.toLocaleString() || '0'}
- Monthly bills: ${regionConfig.currencySymbol}${financialContext.monthlyBills?.toLocaleString() || '0'}
- Net worth: ${regionConfig.currencySymbol}${financialContext.netWorth?.toLocaleString() || '0'}
`;
  }

  if (knowledge.length > 0) {
    prompt += `\nRelevant Financial Knowledge:\n`;
    knowledge.forEach((item, i) => {
      prompt += `${i + 1}. ${item.content}\n`;
    });
  }

  if (research) {
    prompt += `\nDeep Research Results:
Summary: ${research.summary}

Key Findings:
${research.keyFindings.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

Recommendations:
${research.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}
`;
  }

  prompt += `\nProvide personalized, actionable financial advice. Be encouraging and specific. Use calculations when helpful.`;

  return prompt;
}

// Get response from Claude
async function getClaudeResponse(
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: Message[]
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  let response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages,
    tools: calculatorTools,
  });

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(block => block.type === 'tool_use') as any;

    if (!toolUse) break;

    const toolResult = executeToolCall(toolUse.name, toolUse.input);

    messages.push({
      role: 'assistant',
      content: response.content,
    });

    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        },
      ],
    });

    response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages,
      tools: calculatorTools,
    });
  }

  const textBlock = response.content.find(block => block.type === 'text') as any;
  return textBlock?.text || 'No response generated';
}

// Get response from OpenAI
async function getOpenAIResponse(
  model: string,
  systemPrompt: string,
  userMessage: string,
  history: Message[]
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0].message.content || 'No response generated';
}
