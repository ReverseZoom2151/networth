/**
 * Seed Script for Financial News Data
 *
 * Creates realistic sample news items for:
 * - Interest rate changes
 * - Policy updates
 * - Market news
 * - New financial products
 *
 * Run with: npx tsx scripts/seed-news-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting financial news data seeding...\n');

  // Clean existing data
  console.log('Cleaning existing news data...');
  await prisma.userNewsImpact.deleteMany({});
  await prisma.newsImpact.deleteMany({});
  console.log('✓ Cleaned existing data\n');

  // Sample news items
  const newsItems = [
    // Interest Rate News
    {
      title: 'Federal Reserve Raises Interest Rates by 0.25%',
      summary: 'The Fed announced a quarter-point rate hike to combat inflation, bringing the benchmark rate to 5.5%.',
      source: 'Federal Reserve',
      category: 'interest_rates',
      region: 'US',
      affectsGoalTypes: ['house', 'investment', 'family'],
      impactType: 'action_required',
      urgency: 'high',
      fullContent: `The Federal Reserve has raised interest rates by 0.25 percentage points, marking the 11th increase in the current cycle. This affects both savers and borrowers.

For savers: High-yield savings accounts are now offering rates above 5%, the highest in over 15 years. This is great news if you're saving for a goal.

For borrowers: Mortgage rates, auto loans, and credit cards will become more expensive. If you're planning to borrow, now might be the time to lock in rates before they rise further.

The Fed indicated this may be the final rate hike of the cycle, with cuts potentially coming in late 2024.`,
      sourceUrl: 'https://www.federalreserve.gov',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Find High-Yield Account',
      actionUrl: '/products',
      actionType: 'switch_account',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      title: 'Bank of England Holds Rates Steady at 5.25%',
      summary: 'UK central bank keeps rates unchanged as inflation shows signs of cooling.',
      source: 'Bank of England',
      category: 'interest_rates',
      region: 'UK',
      affectsGoalTypes: ['house', 'wedding', 'travel'],
      impactType: 'positive',
      urgency: 'normal',
      fullContent: `The Bank of England voted 7-2 to keep interest rates at 5.25%, the highest level since 2008. This is good news for savers and suggests rates may have peaked.

What this means:
- Savings rates should remain competitive
- Mortgage rates may start to decline
- No immediate impact on existing fixed-rate mortgages
- Good time to review your savings accounts

Inflation has fallen from 10.1% to 4.6% year-over-year, getting closer to the 2% target.`,
      sourceUrl: 'https://www.bankofengland.co.uk',
      imageUrl: null,
      hasQuickAction: false,
      actionLabel: null,
      actionUrl: null,
      actionType: null,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },

    // Policy News
    {
      title: 'New ISA Allowance Increased to £25,000 for 2024',
      summary: 'UK government raises tax-free savings limit, benefiting long-term savers.',
      source: 'HM Treasury',
      category: 'policy',
      region: 'UK',
      affectsGoalTypes: ['house', 'family', 'investment'],
      impactType: 'positive',
      urgency: 'normal',
      fullContent: `The UK government announced an increase in the ISA (Individual Savings Account) allowance from £20,000 to £25,000 for the 2024-2025 tax year.

Key points:
- You can save up to £25,000 tax-free each year
- Applies to Cash ISAs, Stocks & Shares ISAs, and Lifetime ISAs
- Interest and gains are completely tax-free
- Ideal for long-term goals like buying a house

If you're already using your full allowance, this gives you £5,000 more tax-free space. If you're not, now is a great time to start.`,
      sourceUrl: 'https://www.gov.uk',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Explore ISA Options',
      actionUrl: '/products',
      actionType: 'explore_products',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      title: 'Student Loan Forgiveness Program Updates',
      summary: 'New income-driven repayment plans could reduce monthly payments by 50% for many borrowers.',
      source: 'Department of Education',
      category: 'policy',
      region: 'US',
      affectsGoalTypes: ['family', 'house', 'wedding'],
      impactType: 'positive',
      urgency: 'high',
      fullContent: `The Department of Education announced major changes to income-driven repayment (IDR) plans that could significantly reduce monthly student loan payments.

Key changes:
- Payments capped at 5% of discretionary income (down from 10%)
- $0 payments for those earning under 225% of federal poverty line
- Forgiveness after 10 years for loans under $12,000
- Interest won't accumulate if you make your payment

If you have student loans, apply for the new SAVE plan by December 31st to maximize your benefits. This could free up hundreds of dollars per month for other financial goals.`,
      sourceUrl: 'https://studentaid.gov',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Check Eligibility',
      actionUrl: '/coach',
      actionType: 'check_eligibility',
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },

    // Market News
    {
      title: 'S&P 500 Hits New Record High',
      summary: 'Stock market rally continues as tech stocks lead gains, with S&P 500 up 24% year-to-date.',
      source: 'Financial Times',
      category: 'markets',
      region: null, // Global news
      affectsGoalTypes: ['investment', 'family'],
      impactType: 'positive',
      urgency: 'low',
      fullContent: `The S&P 500 closed at a new record high, driven by strong earnings from major tech companies and optimism about economic resilience.

For young investors:
- Long-term perspective is key - short-term gains shouldn't change your strategy
- Market highs are normal in bull markets
- Continue regular contributions (dollar-cost averaging)
- Don't try to time the market

If you haven't started investing yet, don't let market highs scare you away. Time in the market beats timing the market.`,
      sourceUrl: 'https://www.ft.com',
      imageUrl: null,
      hasQuickAction: false,
      actionLabel: null,
      actionUrl: null,
      actionType: null,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },

    // Product News
    {
      title: 'Marcus by Goldman Sachs Launches 5.4% APY Savings Account',
      summary: 'New high-yield savings account offers competitive rates with no fees or minimum balance.',
      source: 'Marcus by Goldman Sachs',
      category: 'products',
      region: 'US',
      affectsGoalTypes: ['house', 'travel', 'wedding', 'family'],
      impactType: 'positive',
      urgency: 'normal',
      fullContent: `Marcus by Goldman Sachs announced a new high-yield savings account with a 5.4% APY, one of the highest rates available from a major bank.

Features:
- No monthly fees
- No minimum balance requirements
- FDIC insured up to $250,000
- Easy transfers to external accounts
- Rate applies to all balance tiers

If you're earning less than 5% on your savings, it might be worth switching. On $10,000, the difference between 5.4% and 0.5% (average savings account) is $490 per year.`,
      sourceUrl: 'https://www.marcus.com',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Compare Rates',
      actionUrl: '/products',
      actionType: 'compare_products',
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      title: 'Discover It Student Card Introduces 5% Cash Back Categories',
      summary: 'Popular student credit card doubles rewards in rotating categories, plus cashback match in first year.',
      source: 'Discover Financial',
      category: 'products',
      region: 'US',
      affectsGoalTypes: ['travel', 'family'],
      impactType: 'positive',
      urgency: 'low',
      fullContent: `Discover announced enhanced rewards for its Student Cash Back card, making it one of the best options for building credit while earning rewards.

Benefits:
- 5% cash back on rotating categories (up to $1,500 per quarter)
- 1% back on all other purchases
- Cashback Match - Discover matches all cashback earned in first year
- No annual fee
- Free FICO credit score tracking

Great for students who want to build credit responsibly while earning rewards on everyday spending. The cashback match means you effectively earn 10% in rotating categories in year one.`,
      sourceUrl: 'https://www.discover.com',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'View Credit Cards',
      actionUrl: '/products',
      actionType: 'view_credit_cards',
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
    {
      title: 'Vanguard Reduces Index Fund Fees to Record Lows',
      summary: 'Investment giant cuts expense ratios on popular funds, saving investors millions.',
      source: 'Vanguard',
      category: 'products',
      region: null,
      affectsGoalTypes: ['investment', 'family'],
      impactType: 'positive',
      urgency: 'low',
      fullContent: `Vanguard announced fee reductions across 22 index funds and ETFs, bringing expense ratios to historic lows.

Key changes:
- Total Stock Market Index Fund: 0.04% → 0.03%
- Total International Stock Index: 0.11% → 0.11%
- Total Bond Market Index: 0.05% → 0.04%

Why this matters:
Over 30 years, a 0.01% fee reduction on a $10,000 investment growing at 7% annually saves you about $600. Small fees make a big difference over time.

If you're considering starting to invest, low-cost index funds like these are an excellent starting point.`,
      sourceUrl: 'https://investor.vanguard.com',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Learn About Investing',
      actionUrl: '/invest',
      actionType: 'learn_investing',
      publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    },

    // Urgent Action Required
    {
      title: 'Credit Card Interest Rates Hit 20-Year High',
      summary: 'Average APR reaches 24.37%. If you carry a balance, it\'s costing you more than ever.',
      source: 'Consumer Financial Protection Bureau',
      category: 'interest_rates',
      region: 'US',
      affectsGoalTypes: ['house', 'family', 'wedding', 'travel'],
      impactType: 'negative',
      urgency: 'urgent',
      fullContent: `Credit card interest rates have reached their highest level in 20 years, with the average APR now at 24.37%. For those carrying balances, this is extremely expensive debt.

Impact example:
- $5,000 balance at 24.37% APR
- Minimum payments only = $191 in interest per month
- Total interest over time = $7,346

Action steps:
1. Stop using credit cards for new purchases
2. Pay more than the minimum (even $50 extra helps)
3. Consider a balance transfer card with 0% intro APR
4. Create a debt payoff plan

Paying off high-interest credit card debt should be your #1 financial priority. It's costing you thousands of dollars per year.`,
      sourceUrl: 'https://www.consumerfinance.gov',
      imageUrl: null,
      hasQuickAction: true,
      actionLabel: 'Create Payoff Plan',
      actionUrl: '/tools',
      actionType: 'debt_payoff',
      publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      title: 'Rent Prices Decline 3% in Major Cities',
      summary: 'First significant drop in rental costs since 2020, as supply increases and demand softens.',
      source: 'Zillow Research',
      category: 'markets',
      region: 'US',
      affectsGoalTypes: ['house', 'family'],
      impactType: 'positive',
      urgency: 'normal',
      fullContent: `Rental prices have dropped an average of 3% across major U.S. cities in the past quarter, the first sustained decline since the pandemic.

Cities with biggest drops:
- Austin, TX: -8.5%
- Phoenix, AZ: -6.2%
- Nashville, TN: -5.8%
- Seattle, WA: -4.7%

This could be a good time to:
- Negotiate your lease renewal
- Shop around for better deals
- Relocate if you've been considering it
- Bank the savings toward your goals

If you're saving for a house, lower rent means more money available for your down payment fund.`,
      sourceUrl: 'https://www.zillow.com',
      imageUrl: null,
      hasQuickAction: false,
      actionLabel: null,
      actionUrl: null,
      actionType: null,
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
  ];

  console.log('Creating news items...');
  let created = 0;

  for (const item of newsItems) {
    await prisma.newsImpact.create({
      data: item,
    });
    created++;
  }

  console.log(`✓ Created ${created} news items\n`);

  // Summary
  console.log('📊 Seeding Summary:');
  console.log(`   Total News Items: ${created}`);
  console.log(`   Interest Rates: ${newsItems.filter(n => n.category === 'interest_rates').length}`);
  console.log(`   Policy Changes: ${newsItems.filter(n => n.category === 'policy').length}`);
  console.log(`   Market News: ${newsItems.filter(n => n.category === 'markets').length}`);
  console.log(`   Product News: ${newsItems.filter(n => n.category === 'products').length}`);
  console.log(`   Urgent Items: ${newsItems.filter(n => n.urgency === 'urgent').length}`);
  console.log('\n✅ Financial news data seeding completed!');
  console.log('\n💡 Tips:');
  console.log('   - News will appear personalized based on user goals');
  console.log('   - Use /api/news/calculate-impact to generate AI-powered impact analysis');
  console.log('   - Users can view news at /news page');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
