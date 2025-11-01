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
import { runCoachAgent, runResearchAgent, runCalculatorAgent } from '@/lib/agents';
import {
  validateInput,
  validateOutput,
  checkRateLimit,
  requiresDisclaimer,
} from '@/lib/guardrails';
import {
  startTrace,
  addTraceEvent,
  endTrace,
  traceError,
  evaluateResponse,
} from '@/lib/tracing';

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

// Main API handler with OpenAI Agents SDK integration
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let traceId: string | undefined;

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
      useAgentsSDK = true, // New flag to enable/disable SDK
    } = body as {
      message: string;
      model: string;
      modelCategory: 'claude' | 'openai';
      deepResearch: boolean;
      goal: UserGoal;
      history: Message[];
      userId?: string;
      useAgentsSDK?: boolean;
    };

    if (!message || !goal || !model) {
      return NextResponse.json(
        { error: 'Message, model, and goal are required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // PHASE 0: START TRACING
    // ========================================================================

    traceId = startTrace({
      userId,
      message,
      goalType: goal.type,
      region: goal.region,
      deepResearch,
      model,
    });

    // ========================================================================
    // PHASE 1: INPUT VALIDATION & GUARDRAILS
    // ========================================================================

    const inputValidation = validateInput({
      message,
      userId,
      goalType: goal.type,
      region: goal.region,
      deepResearch,
      model,
    });

    if (!inputValidation.valid) {
      console.log('[AI Query] ❌ Input validation failed:', inputValidation.error);
      addTraceEvent(traceId, 'validation_fail', {
        phase: 'input',
        error: inputValidation.error,
      });
      return NextResponse.json(
        { error: inputValidation.error },
        { status: 400 }
      );
    }

    // Check rate limits
    if (userId) {
      const rateLimitCheck = checkRateLimit(userId, 20, 60000); // 20 requests per minute
      if (!rateLimitCheck.allowed) {
        console.log(`[AI Query] 🚫 Rate limit exceeded for user: ${userId}`);
        addTraceEvent(traceId, 'rate_limit', {
          userId,
          resetIn: rateLimitCheck.resetIn,
        });
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Please wait ${Math.ceil((rateLimitCheck.resetIn || 0) / 1000)} seconds before trying again`,
          },
          { status: 429 }
        );
      }
    }

    console.log(`[AI Query] ✅ Input validated. Warnings:`, inputValidation.warnings);

    // ========================================================================
    // PHASE 2: ROUTE TO APPROPRIATE AGENT OR LEGACY PATH
    // ========================================================================

    let response: string;
    let researchData = null;
    let agentUsed = 'legacy';

    // Use OpenAI Agents SDK if enabled and model supports it
    if (useAgentsSDK && modelCategory === 'openai') {
      console.log('[AI Query] 🤖 Using OpenAI Agents SDK');

      // Determine which agent to use based on query
      if (deepResearch) {
        // Use research agent for deep research queries
        console.log('[AI Query] 📚 Routing to Research Agent');
        addTraceEvent(traceId, 'agent_start', { agent: 'research' });

        const result = await runResearchAgent({
          topic: message,
          goalType: goal.type,
          region: goal.region,
        });

        response = (result.finalOutput || 'No response generated') as string;
        agentUsed = 'research';
        addTraceEvent(traceId, 'agent_end', { agent: 'research' });
      } else if (isCalculationQuery(message)) {
        // Use calculator agent for calculation-heavy queries
        console.log('[AI Query] 🔢 Routing to Calculator Agent');
        addTraceEvent(traceId, 'agent_start', { agent: 'calculator' });

        const regionConfig = getRegionConfig(goal.region);
        const context = `Goal: Save ${regionConfig.currencySymbol}${goal.targetAmount?.toLocaleString() || 'amount'} in ${goal.timeframe || 'X'} months. Current savings: ${regionConfig.currencySymbol}${goal.currentSavings?.toLocaleString() || '0'}`;

        const result = await runCalculatorAgent({
          query: message,
          context,
        });

        response = (result.finalOutput || 'No response generated') as string;
        agentUsed = 'calculator';
        addTraceEvent(traceId, 'agent_end', { agent: 'calculator' });
      } else {
        // Use coach agent for general coaching queries
        console.log('[AI Query] 💬 Routing to Coach Agent');
        addTraceEvent(traceId, 'agent_start', { agent: 'coach' });

        const result = await runCoachAgent({
          message,
          userId,
          goalType: goal.type,
          region: goal.region,
          conversationHistory: history,
        });

        response = (result.finalOutput || 'No response generated') as string;
        agentUsed = 'coach';
        addTraceEvent(traceId, 'agent_end', { agent: 'coach' });
      }
    } else {
      // Legacy path: Use direct Claude/OpenAI API calls
      console.log('[AI Query] 🔧 Using legacy API path');

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
      if (deepResearch && isPerplexityAvailable()) {
        try {
          researchData = await performDeepResearch(message, goal.type, goal.region);
        } catch (error) {
          console.error('Deep research failed:', error);
        }
      }

      // Build system prompt
      const systemPrompt = buildSystemPrompt(goal, financialContext, relevantKnowledge, researchData);

      // Get response based on model category
      if (modelCategory === 'claude') {
        response = await getClaudeResponse(model, systemPrompt, message, history);
        agentUsed = 'claude-legacy';
      } else {
        response = await getOpenAIResponse(model, systemPrompt, message, history);
        agentUsed = 'openai-legacy';
      }
    }

    // ========================================================================
    // PHASE 3: OUTPUT VALIDATION & GUARDRAILS
    // ========================================================================

    const needsDisclaimer = requiresDisclaimer(message);
    const outputValidation = validateOutput(response, {
      requiresDisclaimer: needsDisclaimer,
    });

    if (!outputValidation.valid) {
      console.log('[AI Query] ❌ Output validation failed:', outputValidation.error);
      addTraceEvent(traceId, 'validation_fail', {
        phase: 'output',
        error: outputValidation.error,
      });
      return NextResponse.json(
        { error: 'Failed to generate valid response' },
        { status: 500 }
      );
    }

    if (outputValidation.warnings) {
      console.log('[AI Query] ⚠️ Output warnings:', outputValidation.warnings);
    }

    // Use enhanced output (with disclaimer if needed)
    const finalResponse = outputValidation.enhanced || response;

    // ========================================================================
    // PHASE 4: LOGGING, TRACING & EVALUATION
    // ========================================================================

    const duration = Date.now() - startTime;
    console.log(`[AI Query] ✅ Request completed in ${duration}ms`);
    console.log(`[AI Query] Agent used: ${agentUsed}`);
    console.log(`[AI Query] Model: ${model}`);
    console.log(`[AI Query] Deep research: ${deepResearch ? 'Yes' : 'No'}`);
    console.log(`[AI Query] Response length: ${finalResponse.length} chars`);

    // End trace
    const allWarnings = [
      ...(inputValidation.warnings || []),
      ...(outputValidation.warnings || []),
    ];

    endTrace(traceId, {
      response: finalResponse,
      research: researchData,
      warnings: allWarnings,
      agentUsed,
    });

    // Evaluate response quality
    const evaluation = evaluateResponse(
      traceId,
      message,
      finalResponse,
      allWarnings
    );

    return NextResponse.json({
      response: finalResponse,
      research: researchData,
      model,
      metadata: {
        agentUsed,
        duration,
        warnings: allWarnings,
        traceId,
        evaluation: {
          score: evaluation.score,
          dimensions: evaluation.dimensions,
        },
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Query] ❌ Error after ${duration}ms:`, error);

    // Record error in trace
    if (traceId) {
      traceError(
        traceId,
        error instanceof Error ? error : new Error(String(error)),
        'QUERY_ERROR'
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to detect if query is calculation-focused
function isCalculationQuery(message: string): boolean {
  const calculationKeywords = [
    'calculate',
    'compute',
    'how much',
    'how long',
    'payment',
    'interest',
    'save',
    'months',
    'years',
    'debt payoff',
    'loan',
  ];

  const lowerMessage = message.toLowerCase();
  return calculationKeywords.some((keyword) => lowerMessage.includes(keyword));
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
