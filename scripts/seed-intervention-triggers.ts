/**
 * Seed Script for Intervention Triggers
 *
 * Creates intervention rules for:
 * - Overspending detection
 * - Missed savings reminders
 * - Debt increase warnings
 * - Unusual spending alerts
 * - Goal trajectory issues
 *
 * Run with: npx tsx scripts/seed-intervention-triggers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting intervention triggers seeding...\n');

  // Clean existing data
  console.log('Cleaning existing intervention data...');
  await prisma.interventionHistory.deleteMany({});
  await prisma.interventionTrigger.deleteMany({});
  console.log('✓ Cleaned existing data\n');

  const triggers = [
    // Overspending Triggers
    {
      triggerType: 'overspending',
      category: null,
      threshold: 0.2, // 20% over budget
      consecutive: 1,
      title: 'You\'re Overspending This Month',
      message: 'We noticed you\'ve spent more than your budget in one or more categories this month. This could impact your savings goal if it continues.',
      severity: 'warning',
      suggestedAction: 'Review your spending in the affected category and identify areas where you can cut back for the rest of the month.',
      alternativeOptions: [
        'Set up spending alerts to catch overspending earlier',
        'Adjust your budget to be more realistic',
        'Switch to cash for this category to limit spending',
        'Remove saved payment methods to add friction to purchases',
      ],
      icon: '⚠️',
      color: '#f97316',
      active: true,
      priority: 5,
    },
    {
      triggerType: 'overspending',
      category: null,
      threshold: 0.5, // 50% over budget
      consecutive: 2,
      title: 'Serious Overspending Alert',
      message: 'You\'ve significantly overspent for 2 months in a row. This pattern is preventing you from reaching your savings goal.',
      severity: 'urgent',
      suggestedAction: 'Take immediate action: freeze non-essential spending for the rest of the month and review all subscriptions and recurring charges.',
      alternativeOptions: [
        'Create a "needs vs wants" list before every purchase',
        'Implement a 24-hour rule for non-essential purchases',
        'Find a free alternative to your highest spending category',
        'Consider picking up a side gig to offset the overspending',
      ],
      icon: '🚨',
      color: '#dc2626',
      active: true,
      priority: 10,
    },

    // Missed Savings Triggers
    {
      triggerType: 'missed_savings',
      category: null,
      threshold: null,
      consecutive: 1,
      title: 'You Haven\'t Saved in 30 Days',
      message: 'It\'s been a month since your last deposit to your savings goal. Even small amounts add up over time!',
      severity: 'info',
      suggestedAction: 'Make a deposit today, even if it\'s just $10. Building the habit is more important than the amount.',
      alternativeOptions: [
        'Set up automatic transfers on payday',
        'Use a round-up app to save spare change automatically',
        'Save your next windfall (tax refund, gift money)',
        'Commit to saving $1 per day this week',
      ],
      icon: '💰',
      color: '#3b82f6',
      active: true,
      priority: 3,
    },
    {
      triggerType: 'missed_savings',
      category: null,
      threshold: null,
      consecutive: 2,
      title: 'Savings Streak at Risk',
      message: 'You haven\'t added to your savings in over a month. Consistency is key to reaching your goal on time.',
      severity: 'warning',
      suggestedAction: 'Review your budget to find $25-50 you can move to savings this week. Cut one non-essential expense.',
      alternativeOptions: [
        'Sell something you don\'t use anymore',
        'Skip one restaurant meal and save that money',
        'Cancel a subscription you rarely use',
        'Find a one-time gig or task for extra income',
      ],
      icon: '📉',
      color: '#f97316',
      active: true,
      priority: 6,
    },

    // Debt Increase Triggers
    {
      triggerType: 'debt_increase',
      category: null,
      threshold: 1000, // $1000 increase
      consecutive: 1,
      title: 'Your Debt Has Increased',
      message: 'Your total debt has grown by over $1,000. High-interest debt can significantly slow your progress toward your savings goal.',
      severity: 'warning',
      suggestedAction: 'Stop using credit cards for new purchases and create a debt payoff plan. Focus on paying off the highest interest rate first.',
      alternativeOptions: [
        'Transfer balances to a 0% APR credit card',
        'Consolidate debt with a personal loan at lower rate',
        'Increase minimum payments by even $25/month',
        'Temporarily pause savings to aggressively pay down debt',
      ],
      icon: '💳',
      color: '#ef4444',
      active: true,
      priority: 7,
    },
    {
      triggerType: 'debt_increase',
      category: null,
      threshold: 5000, // $5000 total debt
      consecutive: 1,
      title: 'High Debt Alert',
      message: 'You\'re carrying over $5,000 in debt. At typical credit card rates, this is costing you $100+ per month in interest alone.',
      severity: 'urgent',
      suggestedAction: 'Make debt payoff your #1 financial priority. Use our debt payoff calculator to create a concrete plan.',
      alternativeOptions: [
        'Consider a balance transfer to save on interest',
        'Talk to a non-profit credit counselor (free)',
        'Negotiate lower rates with your credit card companies',
        'Use the avalanche method to pay off high-rate debt first',
      ],
      icon: '🚨',
      color: '#dc2626',
      active: true,
      priority: 9,
    },

    // Unusual Spending Triggers
    {
      triggerType: 'unusual_spend',
      category: null,
      threshold: 3.0, // 3x average transaction
      consecutive: 1,
      title: 'Large Purchase Detected',
      message: 'We noticed an unusually large transaction. Large purchases can derail your savings progress if not planned for.',
      severity: 'info',
      suggestedAction: 'If this was unplanned, consider if you can return it or find a cheaper alternative. If planned, adjust your budget accordingly.',
      alternativeOptions: [
        'Set up a "large purchase fund" for future big expenses',
        'Use the 48-hour rule before large purchases',
        'Calculate how this affects your savings timeline',
        'Find ways to earn back this amount through side income',
      ],
      icon: '💸',
      color: '#8b5cf6',
      active: true,
      priority: 4,
    },

    // Goal Trajectory Issues
    {
      triggerType: 'behind_schedule',
      category: null,
      threshold: 0.1, // 10% behind where they should be
      consecutive: 1,
      title: 'You\'re Falling Behind Your Goal',
      message: 'Based on your current progress, you\'re not on track to reach your goal in your target timeframe.',
      severity: 'warning',
      suggestedAction: 'Increase your monthly savings by 15-20%, or consider extending your timeframe by 6 months.',
      alternativeOptions: [
        'Find one recurring expense to eliminate',
        'Pick up overtime or a side hustle',
        'Adjust your goal timeframe to be more realistic',
        'Lower your target amount to something achievable',
      ],
      icon: '📊',
      color: '#f59e0b',
      active: true,
      priority: 6,
    },
    {
      triggerType: 'no_progress',
      category: null,
      threshold: null,
      consecutive: 3,
      title: 'No Progress for 3 Months',
      message: 'You haven\'t made progress toward your goal in 3 months. Let\'s get back on track!',
      severity: 'urgent',
      suggestedAction: 'Reconnect with your goal. Ask yourself: Is this still important to me? If yes, commit to one small action today.',
      alternativeOptions: [
        'Revisit your "why" - why does this goal matter?',
        'Make your goal more visible (photo on phone wallpaper)',
        'Find an accountability partner',
        'Break your goal into smaller, more manageable milestones',
      ],
      icon: '🎯',
      color: '#dc2626',
      active: true,
      priority: 8,
    },
  ];

  console.log('Creating intervention triggers...');
  let created = 0;

  for (const trigger of triggers) {
    await prisma.interventionTrigger.create({
      data: trigger,
    });
    created++;
  }

  console.log(`✓ Created ${created} intervention triggers\n`);

  // Summary
  console.log('📊 Seeding Summary:');
  console.log(`   Total Triggers: ${created}`);
  console.log(`   Overspending: ${triggers.filter(t => t.triggerType === 'overspending').length}`);
  console.log(`   Missed Savings: ${triggers.filter(t => t.triggerType === 'missed_savings').length}`);
  console.log(`   Debt Increase: ${triggers.filter(t => t.triggerType === 'debt_increase').length}`);
  console.log(`   Unusual Spend: ${triggers.filter(t => t.triggerType === 'unusual_spend').length}`);
  console.log(`   Goal Issues: ${triggers.filter(t => ['behind_schedule', 'no_progress'].includes(t.triggerType)).length}`);
  console.log('\n✅ Intervention triggers seeding completed!');
  console.log('\n💡 Tips:');
  console.log('   - Interventions will be checked when users update their budget or progress');
  console.log('   - Call /api/interventions/check POST to manually trigger evaluation');
  console.log('   - Users will see interventions in dashboard and get notifications');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
