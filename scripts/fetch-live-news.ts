// Script to fetch real-time financial news and store in database
// Run this script periodically (e.g., every 6 hours) to refresh news
// Supports: NewsAPI (free), Alpha Vantage (free), Perplexity (premium fallback)

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import {
  fetchFinancialNews,
  fetchAlphaVantageNews,
  categorizeNews,
  determineImpactType,
  determineUrgency,
} from '../lib/newsAPI.js';
import {
  fetchPremiumFinancialNews,
  isPerplexityAvailable
} from '../lib/perplexityAPI.js';

const prisma = new PrismaClient();

async function fetchAndStoreNews() {
  console.log('🔄 Fetching live financial news...');
  console.log(`   Perplexity API: ${isPerplexityAvailable() ? '✓ Available (Premium)' : '✗ Not configured'}`);

  try {
    let articles = [];
    let source = 'unknown';

    // Try NewsAPI first (free tier)
    articles = await fetchFinancialNews('all', 30);
    source = 'NewsAPI';

    // If NewsAPI fails or returns nothing, try Alpha Vantage
    if (articles.length === 0) {
      console.log('⚠️  NewsAPI returned no results, trying Alpha Vantage...');
      articles = await fetchAlphaVantageNews(['financial_markets', 'economy_fiscal'], 30);
      source = 'Alpha Vantage';
    }

    // If both free APIs fail and Perplexity is available, use it as fallback
    if (articles.length === 0 && isPerplexityAvailable()) {
      console.log('⚠️  Free APIs exhausted, using Perplexity (Premium)...');
      articles = await fetchPremiumFinancialNews('US', 30);
      source = 'Perplexity Premium';
    }

    if (articles.length === 0) {
      console.log('⚠️  No articles fetched from any source. Check API keys.');
      return;
    }

    console.log(`✓ Fetched ${articles.length} articles from ${source}`);

    // Deactivate old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await prisma.newsImpact.updateMany({
      where: {
        publishedAt: { lt: sevenDaysAgo },
      },
      data: {
        active: false,
      },
    });

    console.log('✓ Deactivated news older than 7 days');

    // Process and store each article
    let newCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      try {
        // Check if article already exists by title
        const existing = await prisma.newsImpact.findFirst({
          where: {
            title: article.title,
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Categorize and determine impact
        const category = categorizeNews(article.title, article.description);
        const impactType = determineImpactType(article.title, article.description);
        const urgency = determineUrgency(article.publishedAt, impactType, article.title);

        // Determine which goal types this affects
        const affectsGoalTypes: string[] = [];
        const text = `${article.title} ${article.description}`.toLowerCase();

        if (text.includes('housing') || text.includes('mortgage') || text.includes('real estate')) {
          affectsGoalTypes.push('house');
        }
        if (text.includes('saving') || text.includes('interest rate')) {
          affectsGoalTypes.push('travel', 'family', 'wedding', 'other');
        }
        if (text.includes('investment') || text.includes('stock') || text.includes('market')) {
          affectsGoalTypes.push('investment');
        }

        // Determine region from source or content
        let region: string | null = null;
        const sourceLower = article.source.toLowerCase();

        // Only set region if it's clearly region-specific
        if (sourceLower.includes('uk') || sourceLower.includes('britain') || sourceLower.includes('british')) {
          region = 'UK';
        } else if (sourceLower.includes('european') || sourceLower.includes('eu ')) {
          region = 'EU';
        } else if (sourceLower.includes('australia')) {
          region = 'AU';
        }
        // Otherwise leave as null (global news)

        // Validate URL - skip if it's just a homepage
        const urlObj = new URL(article.url);
        const isHomepageUrl = urlObj.pathname === '/' || urlObj.pathname === '';
        const finalSourceUrl = isHomepageUrl ? null : article.url;

        // Create news item
        await prisma.newsImpact.create({
          data: {
            title: article.title,
            summary: article.description,
            source: article.source,
            sourceUrl: finalSourceUrl,
            imageUrl: article.imageUrl,
            category,
            impactType,
            urgency,
            fullContent: article.content || article.description,
            affectsGoalTypes,
            hasQuickAction: impactType === 'action_required',
            region, // null for global news, specific region if detected
            active: true,
            publishedAt: new Date(article.publishedAt),
          },
        });

        newCount++;
      } catch (error) {
        console.error(`Failed to process article: ${article.title}`, error);
      }
    }

    console.log(`✅ Successfully stored ${newCount} new articles`);
    console.log(`⏭️  Skipped ${skippedCount} duplicate articles`);

    // Log summary
    const totalActive = await prisma.newsImpact.count({
      where: { active: true },
    });

    console.log(`📊 Total active news items: ${totalActive}`);
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    throw error;
  }
}

// Run the script
fetchAndStoreNews()
  .then(() => {
    console.log('✨ News fetch completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
