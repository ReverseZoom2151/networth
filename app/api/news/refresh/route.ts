// API route to manually trigger news refresh
// Can also be called by cron jobs (e.g., Vercel Cron, GitHub Actions)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  fetchFinancialNews,
  fetchAlphaVantageNews,
  categorizeNews,
  determineImpactType,
  determineUrgency,
} from '@/lib/newsAPI';

const prisma = new PrismaClient();

// POST /api/news/refresh - Fetch and store latest news
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching live financial news...');

    // Try NewsAPI first
    let articles = await fetchFinancialNews('all', 30);

    // If NewsAPI fails, try Alpha Vantage
    if (articles.length === 0) {
      articles = await fetchAlphaVantageNews(['financial_markets', 'economy_fiscal'], 30);
    }

    if (articles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No articles fetched. Check API keys.',
          newCount: 0,
        },
        { status: 200 }
      );
    }

    // Deactivate old news (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deactivated = await prisma.newsImpact.updateMany({
      where: {
        publishedAt: { lt: sevenDaysAgo },
      },
      data: {
        active: false,
      },
    });

    // Process and store each article
    let newCount = 0;
    let skippedCount = 0;

    for (const article of articles) {
      try {
        // Check if article already exists
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

        // Determine affected goal types
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

    const totalActive = await prisma.newsImpact.count({
      where: { active: true },
    });

    return NextResponse.json({
      success: true,
      message: 'News refresh completed',
      newCount,
      skippedCount,
      deactivatedCount: deactivated.count,
      totalActive,
    });
  } catch (error) {
    console.error('Failed to refresh news:', error);
    return NextResponse.json(
      { error: 'Failed to refresh news', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/news/refresh - Get refresh status
export async function GET() {
  try {
    const totalActive = await prisma.newsImpact.count({
      where: { active: true },
    });

    const latestNews = await prisma.newsImpact.findFirst({
      where: { active: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        title: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalActive,
      latestNews,
      lastUpdated: latestNews?.createdAt,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
