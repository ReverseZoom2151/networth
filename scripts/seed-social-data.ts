/**
 * Seed Script for Social Features Mock Data
 *
 * This script creates mock data for:
 * - Peer metrics (anonymized aggregate data)
 * - Sample achievements
 * - User sharing settings
 *
 * Run with: npx tsx scripts/seed-social-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting social features data seeding...\n');

  // Clean existing data (optional - comment out if you want to preserve existing data)
  console.log('Cleaning existing social data...');
  await prisma.achievement.deleteMany({});
  await prisma.peerMetric.deleteMany({});
  await prisma.userAchievementShare.deleteMany({});
  console.log('✓ Cleaned existing data\n');

  // 1. Seed Peer Metrics for various goal types
  console.log('Creating peer metrics...');

  const goalTypes = ['house', 'travel', 'wedding', 'family', 'investment'];
  const regions = ['US', 'UK', 'EU'];
  const timeframes = [1, 3, 5, 10];

  const peerMetrics = [];
  for (const goalType of goalTypes) {
    for (const region of regions) {
      for (const timeframe of timeframes) {
        // Generate realistic metrics based on goal type and timeframe
        let baseAmount = 10000;
        if (goalType === 'house') baseAmount = 100000;
        if (goalType === 'wedding') baseAmount = 30000;
        if (goalType === 'family') baseAmount = 50000;
        if (goalType === 'investment') baseAmount = 25000;
        if (goalType === 'travel') baseAmount = 5000;

        const targetAmount = baseAmount * timeframe;
        const averageProgress = 0.3 + (Math.random() * 0.2); // 30-50% average progress
        const averageSavings = targetAmount * averageProgress;

        const metric = await prisma.peerMetric.create({
          data: {
            goalType,
            region,
            timeframe,
            averageSavings: Math.round(averageSavings),
            medianSavings: Math.round(averageSavings * 0.85),
            averageProgress: averageProgress * 100,
            percentile25: Math.round(averageSavings * 0.5),
            percentile50: Math.round(averageSavings * 0.85),
            percentile75: Math.round(averageSavings * 1.5),
            percentile90: Math.round(averageSavings * 2.2),
            userCount: Math.floor(50 + Math.random() * 200),
            averageMonthlyDeposit: Math.round(averageSavings / (timeframe * 12)),
            averageTimeToGoal: timeframe * 12 * 1.2, // Slightly longer than target
            successRate: 0.65 + (Math.random() * 0.15), // 65-80% success rate
          },
        });

        peerMetrics.push(metric);
      }
    }
  }

  console.log(`✓ Created ${peerMetrics.length} peer metric records\n`);

  // 2. Seed Sample Achievements
  console.log('Creating sample achievements...');

  const achievementTemplates = [
    {
      type: 'streak_milestone',
      title: 'Reached 30-day saving streak!',
      description: 'Consistently saved for 30 days in a row',
      icon: '🔥',
      color: '#f97316',
      value: 30,
      milestone: '30_day_streak',
    },
    {
      type: 'savings_goal',
      title: 'Saved $10,000 milestone',
      description: 'Successfully saved $10,000 toward my goal',
      icon: '💰',
      color: '#10b981',
      value: 10000,
      milestone: '10k_saved',
    },
    {
      type: 'debt_paid',
      title: 'Paid off credit card debt',
      description: 'Fully eliminated $5,000 in credit card debt',
      icon: '🎉',
      color: '#8b5cf6',
      value: 5000,
      milestone: 'debt_free',
    },
    {
      type: 'first_investment',
      title: 'Made first investment',
      description: 'Started investing journey with first contribution',
      icon: '📈',
      color: '#3b82f6',
      value: null,
      milestone: 'first_investment',
    },
    {
      type: 'budget_master',
      title: 'Stayed under budget for 3 months',
      description: 'Successfully maintained budget discipline',
      icon: '🎯',
      color: '#ec4899',
      value: 3,
      milestone: 'budget_master_3',
    },
    {
      type: 'streak_milestone',
      title: 'Reached 100-day streak!',
      description: 'Incredible consistency - 100 days of saving',
      icon: '👑',
      color: '#eab308',
      value: 100,
      milestone: '100_day_streak',
    },
    {
      type: 'savings_goal',
      title: 'Halfway to goal!',
      description: 'Reached 50% of savings target',
      icon: '🎊',
      color: '#06b6d4',
      value: null,
      milestone: '50_percent_goal',
    },
    {
      type: 'streak_milestone',
      title: '7-day streak milestone',
      description: 'One week of consistent saving!',
      icon: '⭐',
      color: '#f59e0b',
      value: 7,
      milestone: '7_day_streak',
    },
  ];

  // Note: We can't create achievements without actual user IDs
  // So we'll just log the templates that would be created
  console.log(`✓ Prepared ${achievementTemplates.length} achievement templates`);
  console.log('  (Achievements will be created when users reach milestones)\n');

  // 3. Display summary
  console.log('📊 Seeding Summary:');
  console.log(`   Peer Metrics: ${peerMetrics.length} records`);
  console.log(`   Goal Types: ${goalTypes.join(', ')}`);
  console.log(`   Regions: ${regions.join(', ')}`);
  console.log(`   Timeframes: ${timeframes.join(', ')} years`);
  console.log('\n✅ Social features data seeding completed!');
  console.log('\n💡 Tips:');
  console.log('   - Achievements will be created automatically when users hit milestones');
  console.log('   - Peer metrics will be recalculated weekly (can be triggered via /api/peer-metrics POST)');
  console.log('   - Users can configure sharing settings via /community page');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
