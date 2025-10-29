import Anthropic from '@anthropic-ai/sdk';
import { UserGoal } from './types';
import { getRegionConfig, formatCurrencyByRegion } from './regions';
import {
  calculateFutureValue,
  calculateMonthlyPayment,
  calculateTimeToGoal,
  calculateDebtPayoff,
  calculateDebtPayoffMultiple,
  calculateCompoundInterest,
  calculateLoanPayment,
  DEFAULT_RATES,
} from './calculations';

/**
 * Networth AI Integration
 *
 * Models used:
 * - Claude Sonnet 4.5 (claude-sonnet-4-5-20250929): Main chat - best quality
 * - Claude Haiku 4.5 (claude-haiku-4-5-20251001): Daily tips - fastest & cheapest
 *
 * Pricing (as of Jan 2025):
 * - Sonnet 4.5: $3/MTok input, $15/MTok output
 * - Haiku 4.5: $1/MTok input, $5/MTok output
 *
 * Also available but not used:
 * - Claude Opus 4.1 (claude-opus-4-1-20250805): Most capable, highest cost
 */

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Financial calculator tools for Claude
const calculatorTools: Anthropic.Tool[] = [
  {
    name: 'calculate_future_value',
    description: 'Calculate the future value of savings with compound interest. Use this when users ask "how much will I have" or "what will my savings grow to".',
    input_schema: {
      type: 'object',
      properties: {
        presentValue: {
          type: 'number',
          description: 'Current amount saved (starting balance)',
        },
        monthlyContribution: {
          type: 'number',
          description: 'Amount added each month',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.045 for 4.5%). Use 0.045 for high-yield savings, 0.07 for investments, 0.02 for regular savings.',
        },
        years: {
          type: 'number',
          description: 'Number of years to calculate',
        },
      },
      required: ['presentValue', 'monthlyContribution', 'annualRate', 'years'],
    },
  },
  {
    name: 'calculate_monthly_payment',
    description: 'Calculate the monthly savings payment needed to reach a specific goal. Use this when users ask "how much do I need to save per month" or "what monthly amount will get me to my goal".',
    input_schema: {
      type: 'object',
      properties: {
        targetAmount: {
          type: 'number',
          description: 'The goal amount to reach',
        },
        currentAmount: {
          type: 'number',
          description: 'Amount already saved',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.045 for 4.5%). Use 0.045 for high-yield savings, 0.07 for investments, 0.02 for regular savings.',
        },
        years: {
          type: 'number',
          description: 'Years to reach the goal',
        },
      },
      required: ['targetAmount', 'currentAmount', 'annualRate', 'years'],
    },
  },
  {
    name: 'calculate_time_to_goal',
    description: 'Calculate how long it will take to reach a savings goal with current contribution rate. Use this when users ask "how long will it take" or "when will I reach my goal".',
    input_schema: {
      type: 'object',
      properties: {
        targetAmount: {
          type: 'number',
          description: 'The goal amount to reach',
        },
        currentAmount: {
          type: 'number',
          description: 'Amount already saved',
        },
        monthlyContribution: {
          type: 'number',
          description: 'Amount being saved each month',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.045 for 4.5%). Use 0.045 for high-yield savings, 0.07 for investments, 0.02 for regular savings.',
        },
      },
      required: ['targetAmount', 'currentAmount', 'monthlyContribution', 'annualRate'],
    },
  },
  {
    name: 'calculate_debt_payoff',
    description: 'Calculate how long it will take to pay off a single debt and total interest paid. Use this for credit cards, loans, or any single debt payoff question.',
    input_schema: {
      type: 'object',
      properties: {
        principal: {
          type: 'number',
          description: 'The debt amount (balance owed)',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.20 for 20%). Credit cards are typically 0.15-0.25, student loans 0.04-0.07, personal loans 0.08-0.15.',
        },
        monthlyPayment: {
          type: 'number',
          description: 'Amount paid each month toward the debt',
        },
      },
      required: ['principal', 'annualRate', 'monthlyPayment'],
    },
  },
  {
    name: 'calculate_loan_payment',
    description: 'Calculate the required monthly payment for a loan. Use this for mortgage, auto loan, or any fixed-term loan questions.',
    input_schema: {
      type: 'object',
      properties: {
        loanAmount: {
          type: 'number',
          description: 'The principal loan amount',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.07 for 7%). Mortgages typically 0.06-0.08, auto loans 0.04-0.08, personal loans 0.08-0.15.',
        },
        years: {
          type: 'number',
          description: 'Loan term in years (e.g., 30 for mortgage, 5 for auto loan)',
        },
      },
      required: ['loanAmount', 'annualRate', 'years'],
    },
  },
  {
    name: 'calculate_compound_interest',
    description: 'Calculate simple compound interest growth without contributions. Use this for "how much will X grow to" questions without monthly additions.',
    input_schema: {
      type: 'object',
      properties: {
        principal: {
          type: 'number',
          description: 'Initial amount',
        },
        annualRate: {
          type: 'number',
          description: 'Annual interest rate as a decimal (e.g., 0.045 for 4.5%)',
        },
        years: {
          type: 'number',
          description: 'Number of years',
        },
        compoundFrequency: {
          type: 'number',
          description: 'Times per year interest compounds (12 for monthly, 365 for daily). Default is 12.',
        },
      },
      required: ['principal', 'annualRate', 'years'],
    },
  },
];

// Goal descriptions for context
const goalDescriptions = {
  house: 'buying a house',
  travel: 'traveling the world',
  family: 'starting or supporting a family',
  wedding: 'getting married',
  investment: 'building an investment portfolio',
  other: 'achieving your financial goal',
};

/**
 * Execute a financial calculator tool
 */
function executeCalculatorTool(toolName: string, input: Record<string, unknown>): unknown {
  try {
    switch (toolName) {
      case 'calculate_future_value': {
        const { presentValue, monthlyContribution, annualRate, years } = input as {
          presentValue: number;
          monthlyContribution: number;
          annualRate: number;
          years: number;
        };
        const result = calculateFutureValue(presentValue, monthlyContribution, annualRate, years);
        return {
          futureValue: Math.round(result * 100) / 100,
          totalContributions: Math.round((presentValue + monthlyContribution * years * 12) * 100) / 100,
          totalInterest: Math.round((result - (presentValue + monthlyContribution * years * 12)) * 100) / 100,
        };
      }

      case 'calculate_monthly_payment': {
        const { targetAmount, currentAmount, annualRate, years } = input as {
          targetAmount: number;
          currentAmount: number;
          annualRate: number;
          years: number;
        };
        const payment = calculateMonthlyPayment(targetAmount, currentAmount, annualRate, years);
        return {
          monthlyPayment: Math.round(payment * 100) / 100,
          totalMonths: years * 12,
          totalContributions: Math.round((currentAmount + payment * years * 12) * 100) / 100,
        };
      }

      case 'calculate_time_to_goal': {
        const { targetAmount, currentAmount, monthlyContribution, annualRate } = input as {
          targetAmount: number;
          currentAmount: number;
          monthlyContribution: number;
          annualRate: number;
        };
        const months = calculateTimeToGoal(targetAmount, currentAmount, monthlyContribution, annualRate);
        if (months === null) {
          return {
            error: 'Cannot reach goal with current contribution rate',
            suggestion: 'Increase monthly contributions or extend timeframe',
          };
        }
        return {
          months,
          years: Math.floor(months / 12),
          remainingMonths: months % 12,
          totalContributions: Math.round((currentAmount + monthlyContribution * months) * 100) / 100,
        };
      }

      case 'calculate_debt_payoff': {
        const { principal, annualRate, monthlyPayment } = input as {
          principal: number;
          annualRate: number;
          monthlyPayment: number;
        };
        const result = calculateDebtPayoff(principal, annualRate, monthlyPayment);
        if (!result) {
          return {
            error: 'Monthly payment does not cover interest charges',
            suggestion: 'Increase monthly payment amount',
          };
        }
        return result;
      }

      case 'calculate_loan_payment': {
        const { loanAmount, annualRate, years } = input as {
          loanAmount: number;
          annualRate: number;
          years: number;
        };
        const payment = calculateLoanPayment(loanAmount, annualRate, years);
        const totalPaid = payment * years * 12;
        const totalInterest = totalPaid - loanAmount;
        return {
          monthlyPayment: Math.round(payment * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
        };
      }

      case 'calculate_compound_interest': {
        const { principal, annualRate, years, compoundFrequency } = input as {
          principal: number;
          annualRate: number;
          years: number;
          compoundFrequency?: number;
        };
        const result = calculateCompoundInterest(principal, annualRate, years, compoundFrequency || 12);
        return {
          finalAmount: Math.round(result * 100) / 100,
          interestEarned: Math.round((result - principal) * 100) / 100,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return { error: `Failed to execute ${toolName}` };
  }
}

export async function getFinancialAdvice(
  userMessage: string,
  userGoal: UserGoal,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  financialContext?: any,
  relevantKnowledge?: Array<{ content: string; title?: string; contentType: string; similarity: number }>
): Promise<string> {
  const goalDescription = userGoal.customGoal || goalDescriptions[userGoal.type];
  const region = userGoal.region || 'US';
  const regionConfig = getRegionConfig(region);

  // Format amounts with proper currency
  const targetAmountFormatted = userGoal.targetAmount
    ? formatCurrencyByRegion(userGoal.targetAmount, region)
    : '';
  const monthlyBudgetFormatted = userGoal.monthlyBudget
    ? formatCurrencyByRegion(userGoal.monthlyBudget, region)
    : '';
  const currentSavingsFormatted = userGoal.currentSavings
    ? formatCurrencyByRegion(userGoal.currentSavings, region)
    : '';

  // Build enhanced context from RAG data
  let enhancedContext = '';
  if (financialContext) {
    // Debts section
    if (financialContext.hasDebt && financialContext.debts.length > 0) {
      enhancedContext += '\n\n**Current Debts:**\n';
      financialContext.debts.forEach((debt: any) => {
        enhancedContext += `- ${debt.name}: ${formatCurrencyByRegion(debt.balance, region)} at ${debt.interestRate}% APR (${formatCurrencyByRegion(debt.monthlyInterest, region)}/month in interest)\n`;
      });
      enhancedContext += `- Total Debt: ${formatCurrencyByRegion(financialContext.totalDebt, region)}\n`;
      enhancedContext += `- Monthly Interest Cost: ${formatCurrencyByRegion(financialContext.monthlyDebtInterest, region)}\n`;
      if (financialContext.highInterestDebt) {
        enhancedContext += '- ⚠️ HAS HIGH-INTEREST DEBT (>15% APR) - This should be a priority!\n';
      }
    }

    // Bills section
    if (financialContext.bills && financialContext.bills.length > 0) {
      enhancedContext += '\n**Monthly Recurring Bills:**\n';
      financialContext.bills.slice(0, 5).forEach((bill: any) => {
        enhancedContext += `- ${bill.name}: ${formatCurrencyByRegion(bill.amount, region)} (${bill.category})\n`;
      });
      enhancedContext += `- Total Monthly Bills: ${formatCurrencyByRegion(financialContext.totalMonthlyBills, region)}\n`;
    }

    // Goal progress section
    if (financialContext.goal) {
      enhancedContext += '\n**Goal Progress:**\n';
      enhancedContext += `- Saved so far: ${formatCurrencyByRegion(financialContext.goal.currentSavings, region)} of ${formatCurrencyByRegion(financialContext.goal.targetAmount, region)} (${financialContext.goal.progressPercent.toFixed(1)}%)\n`;
      enhancedContext += `- Amount remaining: ${formatCurrencyByRegion(financialContext.goal.remaining, region)}\n`;
      enhancedContext += `- Monthly target to stay on track: ${formatCurrencyByRegion(financialContext.goal.monthlyTarget, region)}\n`;
      enhancedContext += `- Currently ${financialContext.goal.onTrack ? '✅ ON TRACK' : '⚠️ BEHIND TARGET'}\n`;
    }

    // Net worth section
    if (financialContext.netWorth) {
      enhancedContext += '\n**Net Worth Overview:**\n';
      enhancedContext += `- Current Net Worth: ${formatCurrencyByRegion(financialContext.netWorth.current, region)}\n`;
      enhancedContext += `- Total Assets: ${formatCurrencyByRegion(financialContext.netWorth.totalAssets, region)}\n`;
      enhancedContext += `- Total Liabilities: ${formatCurrencyByRegion(financialContext.netWorth.totalLiabilities, region)}\n`;
      enhancedContext += `- Trend: ${financialContext.netWorth.trend === 'improving' ? '📈 Improving' : financialContext.netWorth.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}\n`;
    }

    // Add actionable insights
    enhancedContext += '\n**Key Insights:**\n';
    if (financialContext.hasDebt && financialContext.highInterestDebt) {
      enhancedContext += '- PRIORITY: Address high-interest debt first - it\'s costing significant money in interest\n';
    }
    if (financialContext.goal && !financialContext.goal.onTrack) {
      enhancedContext += '- Behind on savings goal - consider increasing monthly contributions or adjusting timeline\n';
    }
    if (financialContext.monthlyDebtInterest > 0) {
      const annualInterestCost = financialContext.monthlyDebtInterest * 12;
      enhancedContext += `- Paying ${formatCurrencyByRegion(annualInterestCost, region)}/year in debt interest - paying off debt could redirect this to savings\n`;
    }
  }

  // Add relevant knowledge from vector search (Phase 2 RAG)
  if (relevantKnowledge && relevantKnowledge.length > 0) {
    enhancedContext += '\n\n**Relevant Financial Knowledge:**\n';
    enhancedContext += '(Use this information to provide accurate, well-informed answers)\n\n';
    relevantKnowledge.forEach((item, index) => {
      enhancedContext += `${index + 1}. ${item.title || item.contentType.toUpperCase()}\n`;
      enhancedContext += `   ${item.content}\n`;
      enhancedContext += `   (Relevance: ${(item.similarity * 100).toFixed(1)}%)\n\n`;
    });
  }

  const systemPrompt = `You are Networth, a friendly and knowledgeable AI financial coach helping people achieve their financial goals.

**User Context:**
- Primary Goal: ${goalDescription}
- Timeframe: ${userGoal.timeframe} years
- Region: ${region === 'EU' ? 'European Union' : region === 'UK' ? 'United Kingdom' : 'United States'}
- Currency: ${regionConfig.currencySymbol}
${targetAmountFormatted ? `- Target Amount: ${targetAmountFormatted}` : ''}
${currentSavingsFormatted ? `- Current Savings: ${currentSavingsFormatted}` : ''}
${monthlyBudgetFormatted ? `- Monthly Budget: ${monthlyBudgetFormatted}` : ''}
${userGoal.spendingCategories && userGoal.spendingCategories.length > 0 ? `- Main Spending Areas: ${userGoal.spendingCategories.join(', ')}` : ''}
${enhancedContext}

**Your Role:**
- Provide clear, actionable financial advice tailored to their goal and region
- Use simple, non-jargon language (explain terms when necessary)
- Focus on ${region}-specific financial products:
  * Retirement: ${regionConfig.financialProducts.retirementAccounts.join(', ')}
  * Savings: ${regionConfig.financialProducts.savingsAccounts.join(', ')}
  * Student Loans: ${regionConfig.financialProducts.studentLoans}
- Be encouraging, realistic, and empathetic to their financial situation
- Reference the user's specific goal in your advice when relevant
- Keep responses concise (2-3 short paragraphs max)
- Always use ${regionConfig.currencySymbol} when mentioning amounts

**CRITICAL - Using Calculator Tools:**
- You have access to financial calculator tools - USE THEM for all mathematical calculations
- NEVER estimate or approximate financial calculations - always use the tools
- When users ask about savings, time to goal, debt payoff, or loan payments, call the appropriate tool
- Present the calculated results clearly with proper currency formatting
- Default interest rates: High-yield savings: ${DEFAULT_RATES.highYieldSavings}, Investments: ${DEFAULT_RATES.investment}, Credit cards: ${DEFAULT_RATES.creditCard}, Student loans: ${DEFAULT_RATES.studentLoan}
- Always show your work: explain what you calculated and why the result matters to their goal

**Key Insights to Consider:**
- Many people have gaps in financial literacy - meet them where they are
- Financial anxiety is common - create a judgment-free, supportive space
- People value freedom and experiences, not just accumulation
- Mental health and money are deeply connected - be sensitive
- Small, consistent actions compound into big results
- Community and accountability drive positive financial behaviors

**Important Guidelines:**
- Don't provide regulated financial advice (e.g., "buy X stock")
- Don't assume their financial background or family support
- Don't be condescending - everyone's on their own journey
- Do encourage small, achievable steps
- Do celebrate progress and good decisions
- Do acknowledge financial challenges are real and varied`;

  try {
    // Build initial messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Tool use loop - Claude may need multiple rounds to use tools and respond
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      tools: calculatorTools,
      messages,
    });

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute all tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const toolResult = executeCalculatorTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        });
      }

      // Add assistant's response and tool results to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Get next response from Claude with tool results
      response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        tools: calculatorTools,
        messages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return textContent?.text || 'I apologize, but I encountered an error. Please try again.';
  } catch (error) {
    console.error('AI Error:', error);
    throw new Error('Failed to get financial advice. Please try again.');
  }
}

// Generate daily tip based on user goal
export async function generateDailyTip(userGoal: UserGoal): Promise<string> {
  const goalDescription = userGoal.customGoal || goalDescriptions[userGoal.type];
  const region = userGoal.region || 'US';
  const regionConfig = getRegionConfig(region);

  const systemPrompt = `Generate a single, actionable financial tip for someone in the ${region === 'EU' ? 'European Union' : region === 'UK' ? 'United Kingdom' : 'United States'} saving for ${goalDescription} over ${userGoal.timeframe} years.

The tip should be:
- 1-2 sentences maximum
- Specific and actionable
- ${region}-focused (${regionConfig.financialProducts.retirementAccounts.join(', ')}, ${regionConfig.financialProducts.savingsAccounts[0]}, etc.)
- Use ${regionConfig.currencySymbol} when mentioning amounts
- Encouraging and realistic
- Practical and immediately useful
- Different from generic advice (be creative!)

Just provide the tip, no preamble.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Claude Haiku 4.5 - Fastest & cheapest for tips
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'Give me today\'s financial tip.' },
      ],
    });

    const textContent = message.content.find(block => block.type === 'text');

    // Fallback tip with region-aware currency
    const fallbackTip = `Start tracking your spending today - even ${regionConfig.currencySymbol}5 saved daily adds up to ${formatCurrencyByRegion(1825, region)} a year!`;

    return textContent && 'text' in textContent ? textContent.text : fallbackTip;
  } catch (error) {
    console.error('Daily tip error:', error);
    const regionConfig = getRegionConfig(region);
    return `Start tracking your spending today - even ${regionConfig.currencySymbol}5 saved daily adds up to ${formatCurrencyByRegion(1825, region)} a year!`;
  }
}
