import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNewsUrls() {
  console.log('\n🔄 Updating news articles...\n');

  // Get all active news
  const news = await prisma.newsImpact.findMany({
    where: { active: true },
  });

  let updatedRegions = 0;
  let removedHomepageUrls = 0;

  for (const article of news) {
    const updates: any = {};

    // Fix region - change US to null (global news)
    if (article.region === 'US' && article.source) {
      const sourceLower = article.source.toLowerCase();

      if (sourceLower.includes('uk') || sourceLower.includes('britain') || sourceLower.includes('british')) {
        updates.region = 'UK';
      } else if (sourceLower.includes('european') || sourceLower.includes('eu ')) {
        updates.region = 'EU';
      } else if (sourceLower.includes('australia')) {
        updates.region = 'AU';
      } else {
        updates.region = null; // Global news
      }
      updatedRegions++;
    }

    // Remove homepage-only URLs
    if (article.sourceUrl) {
      try {
        const urlObj = new URL(article.sourceUrl);
        const isHomepageUrl = urlObj.pathname === '/' || urlObj.pathname === '';

        if (isHomepageUrl) {
          updates.sourceUrl = null;
          removedHomepageUrls++;
          console.log(`  ❌ Removed homepage URL: ${article.title}`);
        }
      } catch (error) {
        // Invalid URL, remove it
        updates.sourceUrl = null;
        removedHomepageUrls++;
        console.log(`  ❌ Removed invalid URL: ${article.title}`);
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await prisma.newsImpact.update({
        where: { id: article.id },
        data: updates,
      });
    }
  }

  console.log('\n✅ Update complete:');
  console.log(`   - ${updatedRegions} articles updated to global/region-specific`);
  console.log(`   - ${removedHomepageUrls} homepage URLs removed`);
  console.log(`   - ${news.length} total articles processed\n`);

  await prisma.$disconnect();
}

updateNewsUrls();
