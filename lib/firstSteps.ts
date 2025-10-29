import { GoalType, Region } from './types';

export interface FirstStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionable: boolean; // Can the user click to learn more?
}

type FirstStepsConfig = Record<Region, Record<GoalType, FirstStep[]>>;

export const FIRST_STEPS: FirstStepsConfig = {
  US: {
    house: [
      {
        id: 'check-credit-score',
        title: 'Check Your Credit Score',
        description: 'Your credit score affects mortgage rates. Check it for free at AnnualCreditReport.com',
        icon: '📊',
        actionable: true,
      },
      {
        id: 'research-fha',
        title: 'Research FHA vs Conventional Loans',
        description: 'FHA loans require as little as 3.5% down. Compare options to find what works for you',
        icon: '🏛️',
        actionable: true,
      },
      {
        id: 'automate-savings',
        title: 'Automate Your Savings',
        description: 'Set up automatic transfers to a high-yield savings account dedicated to your down payment',
        icon: '💰',
        actionable: false,
      },
      {
        id: 'calculate-affordability',
        title: 'Calculate What You Can Afford',
        description: 'Use the 28/36 rule: housing costs should be ≤28% of gross income',
        icon: '🧮',
        actionable: false,
      },
    ],
    travel: [
      {
        id: 'open-travel-card',
        title: 'Consider a Travel Rewards Card',
        description: 'Earn points on everyday spending. Look for cards with no foreign transaction fees',
        icon: '💳',
        actionable: false,
      },
      {
        id: 'set-monthly-goal',
        title: 'Break Down Your Goal',
        description: 'Divide your target by months remaining. Save that amount automatically each month',
        icon: '📅',
        actionable: false,
      },
      {
        id: 'track-travel-deals',
        title: 'Track Flight & Hotel Deals',
        description: 'Use tools like Google Flights alerts and Hopper to find the best prices',
        icon: '✈️',
        actionable: false,
      },
    ],
    family: [
      {
        id: 'build-emergency-fund',
        title: 'Build Your Emergency Fund',
        description: 'Aim for 3-6 months of expenses before major family changes',
        icon: '🛡️',
        actionable: false,
      },
      {
        id: 'review-insurance',
        title: 'Review Insurance Coverage',
        description: 'Life insurance and health coverage become crucial with family',
        icon: '📋',
        actionable: false,
      },
      {
        id: 'open-529',
        title: 'Consider a 529 Plan',
        description: 'Tax-advantaged savings for future education expenses',
        icon: '🎓',
        actionable: false,
      },
    ],
    wedding: [
      {
        id: 'set-realistic-budget',
        title: 'Set a Realistic Budget',
        description: 'Average US wedding costs $30k, but you can do it for much less. Prioritize what matters',
        icon: '💒',
        actionable: false,
      },
      {
        id: 'track-every-expense',
        title: 'Track Every Expense',
        description: 'Wedding costs add up fast. Use a spreadsheet to track deposits and payments',
        icon: '📝',
        actionable: false,
      },
      {
        id: 'negotiate-vendors',
        title: 'Negotiate with Vendors',
        description: 'Everything is negotiable. Get multiple quotes and ask about off-season discounts',
        icon: '💬',
        actionable: false,
      },
    ],
    investment: [
      {
        id: 'max-401k-match',
        title: 'Max Out 401(k) Match',
        description: 'Free money! Contribute enough to get full employer match first',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'open-roth-ira',
        title: 'Open a Roth IRA',
        description: 'Tax-free growth! $7,000/year limit. Great for long-term wealth building',
        icon: '🌱',
        actionable: false,
      },
      {
        id: 'learn-index-funds',
        title: 'Learn About Index Funds',
        description: 'Low-cost, diversified investing. Start with S&P 500 index funds',
        icon: '📚',
        actionable: true,
      },
    ],
    other: [
      {
        id: 'define-goal-clearly',
        title: 'Define Your Goal Clearly',
        description: 'Write down exactly what you want and why. Clarity drives action',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'calculate-timeline',
        title: 'Calculate Your Timeline',
        description: 'Break your goal into monthly savings targets. Make it concrete',
        icon: '📅',
        actionable: false,
      },
      {
        id: 'automate-everything',
        title: 'Automate Your Savings',
        description: 'Set up automatic transfers on payday. Pay yourself first',
        icon: '⚡',
        actionable: false,
      },
    ],
  },
  UK: {
    house: [
      {
        id: 'open-lisa',
        title: 'Open a Lifetime ISA',
        description: '25% government bonus on savings up to £4,000/year for first-time buyers',
        icon: '🏠',
        actionable: true,
      },
      {
        id: 'check-help-to-buy',
        title: 'Check Help to Buy Eligibility',
        description: 'See if you qualify for government schemes to boost your deposit',
        icon: '🏛️',
        actionable: true,
      },
      {
        id: 'improve-credit-score',
        title: 'Improve Your Credit Score',
        description: 'Check your credit report at ClearScore or Experian. Fix any errors',
        icon: '📊',
        actionable: false,
      },
      {
        id: 'research-mortgages',
        title: 'Research Mortgage Options',
        description: 'Compare fixed vs variable rates. Use MoneySavingExpert for guidance',
        icon: '🔍',
        actionable: false,
      },
    ],
    travel: [
      {
        id: 'open-travel-savings',
        title: 'Open a Dedicated Savings Account',
        description: 'Separate account for travel = easier tracking. Look for high-interest accounts',
        icon: '💰',
        actionable: false,
      },
      {
        id: 'use-price-comparison',
        title: 'Use Price Comparison Sites',
        description: 'Skyscanner, Kayak, and Google Flights help find the best deals',
        icon: '✈️',
        actionable: false,
      },
      {
        id: 'consider-travel-card',
        title: 'Get a Fee-Free Travel Card',
        description: 'Cards like Starling or Monzo have no foreign transaction fees',
        icon: '💳',
        actionable: false,
      },
    ],
    family: [
      {
        id: 'build-emergency-fund-uk',
        title: 'Build Your Emergency Fund',
        description: 'Aim for 3-6 months expenses in an easy-access savings account',
        icon: '🛡️',
        actionable: false,
      },
      {
        id: 'check-child-benefit',
        title: 'Check Child Benefit Eligibility',
        description: '£25/week for first child, £16.50 for additional children',
        icon: '👶',
        actionable: true,
      },
      {
        id: 'review-life-insurance-uk',
        title: 'Review Life Insurance',
        description: 'Protect your family financially. Compare policies at MoneySuperMarket',
        icon: '📋',
        actionable: false,
      },
    ],
    wedding: [
      {
        id: 'set-budget-uk',
        title: 'Set Your Wedding Budget',
        description: 'Average UK wedding costs £20k, but you decide what matters to you',
        icon: '💒',
        actionable: false,
      },
      {
        id: 'prioritize-spending',
        title: 'Prioritize What Matters Most',
        description: 'Venue? Photos? Food? Spend big on priorities, save on the rest',
        icon: '⭐',
        actionable: false,
      },
      {
        id: 'track-deposits',
        title: 'Track All Deposits & Payments',
        description: 'Keep receipts and track payment schedules to avoid surprises',
        icon: '📝',
        actionable: false,
      },
    ],
    investment: [
      {
        id: 'open-stocks-isa',
        title: 'Open a Stocks & Shares ISA',
        description: 'Tax-free investment growth up to £20,000/year',
        icon: '📈',
        actionable: true,
      },
      {
        id: 'contribute-pension',
        title: 'Maximize Pension Contributions',
        description: 'Get employer match + tax relief. Free money for your future',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'learn-etfs',
        title: 'Learn About Index Funds & ETFs',
        description: 'Low-cost, diversified investing through platforms like Vanguard',
        icon: '📚',
        actionable: true,
      },
    ],
    other: [
      {
        id: 'define-goal-clearly-uk',
        title: 'Define Your Goal Clearly',
        description: 'Write down exactly what you want and why. Clarity drives action',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'automate-savings-uk',
        title: 'Set Up Standing Orders',
        description: 'Automate transfers to savings on payday. Pay yourself first',
        icon: '⚡',
        actionable: false,
      },
      {
        id: 'use-budgeting-app',
        title: 'Use a Budgeting App',
        description: 'Tools like Emma or Monzo help track spending automatically',
        icon: '📱',
        actionable: false,
      },
    ],
  },
  EU: {
    house: [
      {
        id: 'research-local-schemes',
        title: 'Research Local Home-Buying Schemes',
        description: 'Many EU countries offer first-time buyer benefits. Check your local programs',
        icon: '🏠',
        actionable: true,
      },
      {
        id: 'open-savings-account-eu',
        title: 'Open a Dedicated Savings Account',
        description: 'Look for high-interest savings accounts for your down payment',
        icon: '💰',
        actionable: false,
      },
      {
        id: 'calculate-costs',
        title: 'Calculate All Purchase Costs',
        description: 'Include notary fees, taxes, and registration costs (can be 10-15% of price)',
        icon: '🧮',
        actionable: false,
      },
      {
        id: 'improve-credit-eu',
        title: 'Build Your Credit History',
        description: 'Good credit history helps secure better mortgage rates',
        icon: '📊',
        actionable: false,
      },
    ],
    travel: [
      {
        id: 'use-budget-airlines',
        title: 'Use Budget Airlines & Trains',
        description: 'Ryanair, EasyJet, and rail passes offer great value for EU travel',
        icon: '✈️',
        actionable: false,
      },
      {
        id: 'automate-travel-savings',
        title: 'Automate Monthly Savings',
        description: 'Set up automatic transfers to reach your travel goal',
        icon: '💰',
        actionable: false,
      },
      {
        id: 'track-deal-alerts',
        title: 'Set Up Price Alerts',
        description: 'Use Skyscanner and Google Flights to track prices for your destinations',
        icon: '🔔',
        actionable: false,
      },
    ],
    family: [
      {
        id: 'emergency-fund-eu',
        title: 'Build Your Emergency Fund',
        description: 'Save 3-6 months of expenses before major family changes',
        icon: '🛡️',
        actionable: false,
      },
      {
        id: 'check-family-benefits',
        title: 'Check Family Benefits',
        description: 'Most EU countries offer child allowances. Check your eligibility',
        icon: '👶',
        actionable: true,
      },
      {
        id: 'review-insurance-eu',
        title: 'Review Insurance Coverage',
        description: 'Ensure adequate health and life insurance for your growing family',
        icon: '📋',
        actionable: false,
      },
    ],
    wedding: [
      {
        id: 'set-budget-eu',
        title: 'Set a Realistic Budget',
        description: 'Wedding costs vary across EU. Set your budget based on priorities',
        icon: '💒',
        actionable: false,
      },
      {
        id: 'compare-venues',
        title: 'Compare Venue Options',
        description: 'Venue is often the biggest expense. Get quotes from multiple locations',
        icon: '🏰',
        actionable: false,
      },
      {
        id: 'track-expenses-eu',
        title: 'Track Every Expense',
        description: 'Use a spreadsheet to track all deposits, payments, and pending costs',
        icon: '📝',
        actionable: false,
      },
    ],
    investment: [
      {
        id: 'open-investment-account',
        title: 'Open an Investment Account',
        description: 'Research brokers like DeGiro, Trade Republic, or Scalable Capital',
        icon: '📈',
        actionable: false,
      },
      {
        id: 'maximize-pension-eu',
        title: 'Contribute to Pension Plans',
        description: 'Take advantage of employer matching and tax benefits',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'learn-etf-investing',
        title: 'Learn About ETF Investing',
        description: 'Low-cost index funds offer diversified, long-term growth',
        icon: '📚',
        actionable: true,
      },
    ],
    other: [
      {
        id: 'set-clear-goal-eu',
        title: 'Define Your Goal Clearly',
        description: 'Be specific about what you want and when you want it',
        icon: '🎯',
        actionable: false,
      },
      {
        id: 'automate-savings-eu',
        title: 'Automate Your Savings',
        description: 'Set up automatic transfers on payday to reach your goal',
        icon: '⚡',
        actionable: false,
      },
      {
        id: 'track-progress-eu',
        title: 'Track Your Progress',
        description: 'Review monthly to stay motivated and adjust as needed',
        icon: '📊',
        actionable: false,
      },
    ],
  },
};

// Get first steps for a specific goal and region
export function getFirstSteps(goalType: GoalType, region: Region): FirstStep[] {
  return FIRST_STEPS[region]?.[goalType] || FIRST_STEPS[region]?.other || [];
}
