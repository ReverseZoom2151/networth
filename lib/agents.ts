import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import {
  calculateFutureValue,
  calculateMonthlyPayment,
  calculateTimeToGoal,
  calculateDebtPayoff,
  calculateLoanPayment,
  calculateCompoundInterest,
} from './calculations';
import { getUserFinancialContext } from './db';
import { searchKnowledge } from './vector';
import { performDeepResearch } from './perplexityAPI';

// AI Models - consistent with codebase
// Using GPT-5 models since OpenAI Agents SDK supports OpenAI models
const AI_MODELS = {
  main: 'gpt-5-2025-08-07',        // Main model - equivalent to Claude Sonnet
  mini: 'gpt-5-mini-2025-08-07',   // Lightweight model - equivalent to Claude Haiku
  pro: 'gpt-5-pro-2025-10-06',    // Advanced reasoning - for complex tasks
  nano: 'gpt-5-nano-2025-08-07',  // Lightest model - for simple cases
} as const;

// ============================================================================
// FINANCIAL CALCULATOR TOOLS
// ============================================================================

/**
 * Calculate the future value of savings with compound interest
 */
const futureValueTool = tool({
  description: 'Calculate the future value of savings with compound interest',
  parameters: z.object({
    presentValue: z.number().describe('Current amount saved (starting balance)'),
    monthlyContribution: z.number().describe('Amount added each month'),
    annualRate: z.number().describe('Annual interest rate as a decimal (e.g., 0.045 for 4.5%)'),
    years: z.number().describe('Number of years to calculate'),
  }),
  execute: async ({ presentValue, monthlyContribution, annualRate, years }) => {
    return calculateFutureValue(
      presentValue,
      monthlyContribution,
      annualRate,
      years
    );
  },
});

/**
 * Calculate monthly savings needed to reach a goal
 */
const monthlyPaymentTool = tool({
  description: 'Calculate monthly savings needed to reach a goal',
  parameters: z.object({
    targetAmount: z.number().describe('The goal amount to reach'),
    years: z.number().describe('Years to reach the goal'),
    annualRate: z.number().describe('Annual interest rate as a decimal'),
    currentSavings: z.number().optional().describe('Current amount saved'),
  }),
  execute: async ({ targetAmount, years, annualRate, currentSavings = 0 }) => {
    return calculateMonthlyPayment(
      targetAmount,
      years,
      annualRate,
      currentSavings
    );
  },
});

/**
 * Calculate how long it will take to reach a savings goal
 */
const timeToGoalTool = tool({
  description: 'Calculate how long it will take to reach a savings goal',
  parameters: z.object({
    targetAmount: z.number().describe('The goal amount to reach'),
    currentSavings: z.number().describe('Current amount saved'),
    monthlyContribution: z.number().describe('Amount added each month'),
    annualRate: z.number().describe('Annual interest rate as a decimal'),
  }),
  execute: async ({ targetAmount, currentSavings, monthlyContribution, annualRate }) => {
    return calculateTimeToGoal(
      targetAmount,
      currentSavings,
      monthlyContribution,
      annualRate
    );
  },
});

/**
 * Calculate debt payoff timeline and total interest
 */
const debtPayoffTool = tool({
  description: 'Calculate debt payoff timeline and total interest',
  parameters: z.object({
    principal: z.number().describe('Principal amount owed'),
    annualRate: z.number().describe('Annual interest rate as a decimal'),
    monthlyPayment: z.number().describe('Monthly payment amount'),
  }),
  execute: async ({ principal, annualRate, monthlyPayment }) => {
    return calculateDebtPayoff(
      principal,
      annualRate,
      monthlyPayment
    );
  },
});

/**
 * Calculate monthly loan payment amount
 */
const loanPaymentTool = tool({
  description: 'Calculate monthly loan payment amount',
  parameters: z.object({
    principal: z.number().describe('Principal loan amount'),
    annualRate: z.number().describe('Annual interest rate as a decimal'),
    years: z.number().describe('Loan term in years'),
  }),
  execute: async ({ principal, annualRate, years }) => {
    return calculateLoanPayment(principal, annualRate, years);
  },
});

/**
 * Calculate compound interest on an investment
 */
const compoundInterestTool = tool({
  description: 'Calculate compound interest on an investment',
  parameters: z.object({
    principal: z.number().describe('Principal investment amount'),
    annualRate: z.number().describe('Annual interest rate as a decimal'),
    years: z.number().describe('Investment period in years'),
    compoundingFrequency: z.number().optional().describe('Number of times interest compounds per year (default: 12)'),
  }),
  execute: async ({ principal, annualRate, years, compoundingFrequency = 12 }) => {
    return calculateCompoundInterest(
      principal,
      annualRate,
      years,
      compoundingFrequency
    );
  },
});

// ============================================================================
// KNOWLEDGE BASE AND CONTEXT TOOLS
// ============================================================================

/**
 * Fetch user's financial context from database
 */
const fetchUserContextTool = tool({
  description: 'Fetch user financial context from database',
  parameters: z.object({
    userId: z.string().describe('User ID to fetch context for'),
  }),
  execute: async ({ userId }) => {
    const context = await getUserFinancialContext(userId);
    return context || { message: 'No financial context found for this user' };
  },
});

/**
 * Search financial knowledge base using vector similarity
 */
const searchKnowledgeTool = tool({
  description: 'Search financial knowledge base using vector similarity',
  parameters: z.object({
    query: z.string().describe('Search query'),
    region: z.string().optional().describe('Region filter (US, CA, UK, AU)'),
    limit: z.number().optional().describe('Maximum number of results'),
  }),
  execute: async ({ query, region, limit = 3 }) => {
    const results = await searchKnowledge(query, {
      limit,
      region,
      minSimilarity: 0.75,
    });
    return results.length > 0
      ? results
      : { message: 'No relevant knowledge found' };
  },
});

/**
 * Perform deep multi-source research on a financial topic
 */
const deepResearchTool = tool({
  description: 'Perform deep multi-source research on a financial topic',
  parameters: z.object({
    topic: z.string().describe('Research topic'),
    goalType: z.string().optional().describe('Goal type filter'),
    region: z.string().optional().describe('Region filter (US, CA, UK, AU)'),
  }),
  execute: async ({ topic, goalType, region }) => {
    const research = await performDeepResearch(
      topic,
      goalType,
      region
    );
    return research;
  },
});

// ============================================================================
// CALCULATOR AGENT - Specialized for financial calculations
// ============================================================================

export const calculatorAgent = new Agent({
  name: 'Calculator',
  instructions: `You are a financial calculator specialist. Your role is to:
1. Perform accurate financial calculations using the provided tools
2. Explain calculations in simple terms
3. Show your work step-by-step
4. Provide insights about the results
5. Suggest optimizations when appropriate

Always verify inputs are reasonable before calculating. For example:
- Interest rates should typically be between 0% and 20% annually
- Timeframes should be realistic (1-50 years)
- Amounts should be positive numbers

When presenting results, format currency values clearly and explain what the numbers mean in practical terms.`,
  model: AI_MODELS.main,
  tools: [
    futureValueTool,
    monthlyPaymentTool,
    timeToGoalTool,
    debtPayoffTool,
    loanPaymentTool,
    compoundInterestTool,
  ],
});

// ============================================================================
// RESEARCH AGENT - Deep research using multiple sources
// ============================================================================

export const researchAgent = new Agent({
  name: 'Research',
  instructions: `You are a financial research specialist. Your role is to:
1. Conduct thorough research on financial topics
2. Synthesize information from multiple sources
3. Provide evidence-based recommendations
4. Cite sources appropriately
5. Identify risks and opportunities

When researching:
- Always verify information from multiple sources
- Focus on recent and relevant data
- Consider regional differences (US, CA, UK, AU)
- Provide actionable insights
- Highlight any important disclaimers

Present research in a structured format with:
- Summary of key findings
- Detailed analysis
- Specific recommendations
- Source citations`,
  model: AI_MODELS.pro,
  tools: [deepResearchTool, searchKnowledgeTool],
});

// ============================================================================
// CONTEXT AGENT - Fetches user data and knowledge base
// ============================================================================

export const contextAgent = new Agent({
  name: 'Context',
  instructions: `You are a financial context specialist. Your role is to:
1. Fetch user financial data from the database
2. Search the knowledge base for relevant information
3. Organize context in a clear, structured format
4. Identify missing or incomplete information
5. Suggest what additional context might be helpful

Always respect user privacy and only share information that's relevant to the current query.`,
  model: AI_MODELS.mini,
  tools: [fetchUserContextTool, searchKnowledgeTool],
});

// ============================================================================
// COACH AGENT - Main orchestrator for financial coaching
// ============================================================================

export const coachAgent = new Agent({
  name: 'Coach',
  instructions: `You are an expert financial coach helping users achieve their savings goals. Your role is to:

1. **Understand the User's Situation**
   - Ask clarifying questions when needed
   - Consider their financial context, goals, and constraints
   - Be empathetic and encouraging

2. **Provide Personalized Advice**
   - Tailor recommendations to their specific situation
   - Consider regional differences (currency, regulations, products)
   - Break down complex topics into simple steps
   - Be practical and actionable

3. **Orchestrate Specialist Agents**
   - Hand off to Calculator agent for complex calculations
   - Hand off to Research agent for in-depth research
   - Hand off to Context agent to fetch user data
   - Synthesize information from multiple agents

4. **Maintain Quality Standards**
   - Always verify calculations and facts
   - Provide disclaimers for investment advice
   - Acknowledge uncertainty when appropriate
   - Encourage users to consult professionals for major decisions

5. **Communication Style**
   - Be warm, supportive, and professional
   - Use clear, jargon-free language
   - Structure responses logically
   - Use formatting (bullets, numbers) for clarity

**Important Guidelines:**
- Financial advice should be educational, not definitive recommendations
- Always consider the user's risk tolerance and time horizon
- Encourage diversification and emergency funds
- Remind users that past performance doesn't guarantee future results
- For tax, legal, or complex investment questions, recommend consulting a professional`,
  model: AI_MODELS.main,
  tools: [
    // Include basic tools directly
    futureValueTool,
    monthlyPaymentTool,
    timeToGoalTool,
  ],
  // Handoffs to specialist agents
  handoffs: [calculatorAgent, researchAgent, contextAgent],
});

// ============================================================================
// AGENT SYSTEM INITIALIZATION
// ============================================================================

/**
 * Run the coach agent with user query and context
 */
export async function runCoachAgent(input: {
  message: string;
  userId?: string;
  goalType?: string;
  region?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}) {
  // Build context string
  let contextString = `User Query: ${input.message}\n\n`;

  if (input.goalType) {
    contextString += `Goal Type: ${input.goalType}\n`;
  }

  if (input.region) {
    contextString += `Region: ${input.region}\n`;
  }

  if (input.userId) {
    contextString += `User ID: ${input.userId}\n`;
    contextString += `Note: Use the Context agent to fetch detailed user financial data if needed.\n`;
  }

  // Run the coach agent using SDK's run() function
  const { run } = await import('@openai/agents');
  const result = await run(coachAgent, contextString);

  return result;
}

/**
 * Run the research agent directly for deep research queries
 */
export async function runResearchAgent(input: {
  topic: string;
  goalType?: string;
  region?: string;
}) {
  const { run } = await import('@openai/agents');

  const query = `Conduct comprehensive research on: ${input.topic}\n\nGoal Type: ${input.goalType || 'general'}\nRegion: ${input.region || 'US'}`;

  const result = await run(researchAgent, query);

  return result;
}

/**
 * Run the calculator agent directly for calculation queries
 */
export async function runCalculatorAgent(input: {
  query: string;
  context?: string;
}) {
  const { run } = await import('@openai/agents');

  const fullQuery = input.context
    ? `${input.query}\n\nContext: ${input.context}`
    : input.query;

  const result = await run(calculatorAgent, fullQuery);

  return result;
}
