import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserGoal() {
  // Check if there are any users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      whopId: true,
      email: true,
      createdAt: true,
    },
  });

  console.log('\n👥 Users in database:');
  console.log('='.repeat(80));

  if (users.length === 0) {
    console.log('❌ No users found in database');
  } else {
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. User ID: ${user.id}`);
      console.log(`   Whop ID: ${user.whopId}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // Check for user goals
  const goals = await prisma.userGoal.findMany({
    select: {
      id: true,
      userId: true,
      type: true,
      targetAmount: true,
      currentSavings: true,
      timeframe: true,
      region: true,
    },
  });

  console.log('\n🎯 Goals in database:');
  console.log('='.repeat(80));

  if (goals.length === 0) {
    console.log('❌ No goals found in database');
    console.log('\n💡 Tip: Users need to complete onboarding to set up their goal.');
  } else {
    goals.forEach((goal, i) => {
      console.log(`\n${i + 1}. Goal ID: ${goal.id}`);
      console.log(`   User ID: ${goal.userId}`);
      console.log(`   Type: ${goal.type}`);
      console.log(`   Target: $${goal.targetAmount} in ${goal.timeframe} years`);
      console.log(`   Current: $${goal.currentSavings}`);
      console.log(`   Region: ${goal.region}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  await prisma.$disconnect();
}

checkUserGoal();
