// Automated refresh script for success stories
// Run this periodically (e.g., weekly via cron job) to keep stories fresh

import { PrismaClient } from '@prisma/client';
import { generateStoriesForGoalType } from './generate-success-stories';

const prisma = new PrismaClient();

interface RefreshConfig {
  minStoriesPerGoal: number;
  maxStoriesPerGoal: number;
  refreshOlderThan: number; // days
  goalTypes: string[];
}

const config: RefreshConfig = {
  minStoriesPerGoal: 5, // Minimum stories to keep per goal type
  maxStoriesPerGoal: 15, // Maximum stories per goal type
  refreshOlderThan: 90, // Refresh stories older than 90 days
  goalTypes: ['house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car'],
};

/**
 * Check if we need to generate stories for a goal type
 */
async function needsRefresh(goalType: string): Promise<boolean> {
  const count = await prisma.successStory.count({
    where: { goalType },
  });

  console.log(`   ${goalType}: ${count} stories in database`);

  // Need refresh if below minimum
  if (count < config.minStoriesPerGoal) {
    console.log(`   ⚠️  Below minimum (${config.minStoriesPerGoal})`);
    return true;
  }

  // Check for old stories
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - config.refreshOlderThan);

  const oldStoryCount = await prisma.successStory.count({
    where: {
      goalType,
      createdAt: {
        lt: oldDate,
      },
    },
  });

  if (oldStoryCount > 0) {
    console.log(`   ⚠️  ${oldStoryCount} stories older than ${config.refreshOlderThan} days`);
    return true;
  }

  console.log(`   ✅ Fresh enough`);
  return false;
}

/**
 * Clean up old stories if we have too many
 */
async function cleanupOldStories(goalType: string): Promise<number> {
  const count = await prisma.successStory.count({
    where: { goalType },
  });

  if (count <= config.maxStoriesPerGoal) {
    return 0;
  }

  // Get oldest non-featured stories
  const oldStories = await prisma.successStory.findMany({
    where: {
      goalType,
      featured: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: count - config.maxStoriesPerGoal,
  });

  if (oldStories.length === 0) {
    return 0;
  }

  // Delete old stories
  const deleted = await prisma.successStory.deleteMany({
    where: {
      id: {
        in: oldStories.map(s => s.id),
      },
    },
  });

  console.log(`   🗑️  Deleted ${deleted.count} old stories`);
  return deleted.count;
}

/**
 * Generate featured stories
 * Automatically feature the best stories based on engagement
 */
async function updateFeaturedStories(): Promise<void> {
  console.log('\n⭐ Updating featured stories...');

  // Unfeature all current featured stories
  await prisma.successStory.updateMany({
    where: { featured: true },
    data: { featured: false },
  });

  // Feature 2 stories per goal type (most recent ones)
  for (const goalType of config.goalTypes) {
    const topStories = await prisma.successStory.findMany({
      where: { goalType },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    if (topStories.length > 0) {
      await prisma.successStory.updateMany({
        where: {
          id: {
            in: topStories.map(s => s.id),
          },
        },
        data: { featured: true },
      });

      console.log(`   ⭐ Featured ${topStories.length} stories for ${goalType}`);
    }
  }
}

/**
 * Main refresh function
 */
async function main() {
  console.log('🔄 Starting automated success story refresh...\n');
  console.log(`📋 Configuration:`);
  console.log(`   Min stories per goal: ${config.minStoriesPerGoal}`);
  console.log(`   Max stories per goal: ${config.maxStoriesPerGoal}`);
  console.log(`   Refresh older than: ${config.refreshOlderThan} days\n`);

  let totalGenerated = 0;
  let totalDeleted = 0;

  // Check each goal type
  for (const goalType of config.goalTypes) {
    console.log(`\n📊 Checking ${goalType}...`);

    try {
      // Clean up if too many stories
      const deleted = await cleanupOldStories(goalType);
      totalDeleted += deleted;

      // Check if needs refresh
      const needsUpdate = await needsRefresh(goalType);

      if (needsUpdate) {
        console.log(`   🚀 Generating new stories...`);
        const generated = await generateStoriesForGoalType(goalType);
        totalGenerated += generated;

        // Rate limiting between goal types
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${goalType}:`, error);
    }
  }

  // Update featured stories
  await updateFeaturedStories();

  // Final stats
  console.log(`\n✨ Refresh complete!`);
  console.log(`   📝 Generated: ${totalGenerated} new stories`);
  console.log(`   🗑️  Deleted: ${totalDeleted} old stories`);

  const totalStories = await prisma.successStory.count();
  const featuredStories = await prisma.successStory.count({
    where: { featured: true },
  });

  console.log(`\n📊 Database stats:`);
  console.log(`   Total stories: ${totalStories}`);
  console.log(`   Featured stories: ${featuredStories}`);

  // Show breakdown by goal type
  console.log(`\n📈 Stories by goal type:`);
  for (const goalType of config.goalTypes) {
    const count = await prisma.successStory.count({
      where: { goalType },
    });
    console.log(`   ${goalType}: ${count}`);
  }

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as refreshSuccessStories };
