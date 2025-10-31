import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import prisma from '@/lib/prisma';
import { fetchFromAllSources, fetchFromRSS } from '@/lib/newsSourcesMulti';

// Import news APIs
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  category: string;
  impactType: 'positive' | 'negative' | 'neutral' | 'action_required';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  affectsGoalTypes: string[];
  region: string | null;
}

/**
 * Fetch news from NewsAPI.org
 */
async function fetchFromNewsAPI(
  timeframe: string,
  goalType?: string
): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set');
    return [];
  }

  try {
    // Calculate date range
    const now = new Date();
    const fromDate = new Date(now);

    switch (timeframe) {
      case '1h':
        fromDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        fromDate.setHours(now.getHours() - 6);
        break;
      case '1d':
        fromDate.setDate(now.getDate() - 1);
        break;
      case '3d':
        fromDate.setDate(now.getDate() - 3);
        break;
      case '1w':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '2w':
        fromDate.setDate(now.getDate() - 14);
        break;
      case '1m':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      default:
        fromDate.setDate(now.getDate() - 7); // Default: 1 week
    }

    // Build query based on goal type
    let query = 'finance OR economy OR investing OR savings OR banking';

    if (goalType && goalType !== 'all') {
      const goalQueries: Record<string, string> = {
        house: 'mortgage OR housing OR real estate OR home buying',
        travel: 'travel deals OR airline OR hotel OR vacation savings',
        debt_free: 'debt relief OR student loans OR credit card debt',
        emergency_fund: 'savings account OR emergency fund OR interest rates',
        retirement: 'retirement OR 401k OR IRA OR pension',
        car: 'car loans OR auto financing OR vehicle purchase',
      };
      query = goalQueries[goalType] || query;
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      from: fromDate.toISOString(),
      pageSize: '30',
      apiKey: NEWS_API_KEY,
    });

    const response = await fetch(`https://newsapi.org/v2/everything?${params}`);

    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return data.articles.map((article: any, index: number) => {
      const category = categorizeNews(article.title, article.description || '');
      const impactType = determineImpactType(article.title, article.description || '');
      const urgency = determineUrgency(article.publishedAt, impactType, article.title);
      const affectsGoalTypes = determineAffectedGoals(article.title, article.description || '');
      const region = determineRegion(article.source?.name || '');

      return {
        id: `news-${timeframe}-${index}-${Date.now()}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) || '',
        source: article.source?.name || 'Unknown',
        sourceUrl: article.url,
        imageUrl: article.urlToImage,
        category,
        impactType,
        urgency,
        publishedAt: article.publishedAt,
        affectsGoalTypes,
        region,
      };
    }).filter((article: NewsArticle) => article.title && article.summary);
  } catch (error) {
    console.error('Failed to fetch from NewsAPI:', error);
    return [];
  }
}

/**
 * Fetch news from Perplexity AI (premium fallback)
 */
async function fetchFromPerplexity(
  timeframe: string,
  goalType?: string
): Promise<NewsArticle[]> {
  if (!PERPLEXITY_API_KEY) {
    return [];
  }

  try {
    const timeframeDescriptions: Record<string, string> = {
      '1h': 'in the last hour',
      '6h': 'in the last 6 hours',
      '1d': 'today',
      '3d': 'in the last 3 days',
      '1w': 'this week',
      '2w': 'in the last 2 weeks',
      '1m': 'this month',
      '3m': 'in the last 3 months',
    };

    const timeDesc = timeframeDescriptions[timeframe] || 'this week';

    let query = `Latest financial news ${timeDesc} related to personal finance, savings, investing, and banking`;

    if (goalType && goalType !== 'all') {
      const goalQueries: Record<string, string> = {
        house: `home buying, mortgages, and real estate news ${timeDesc}`,
        travel: `travel deals, airline, and vacation savings news ${timeDesc}`,
        debt_free: `debt relief, student loans, and credit card news ${timeDesc}`,
        emergency_fund: `savings accounts and interest rate news ${timeDesc}`,
        retirement: `retirement, 401k, and pension news ${timeDesc}`,
        car: `car loans and auto financing news ${timeDesc}`,
      };
      query = `Latest ${goalQueries[goalType] || query}`;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news aggregator. Find and summarize recent financial news articles with titles, sources, and URLs.',
          },
          {
            role: 'user',
            content: `Find 5-10 recent news articles about: ${query}. For each article, provide: title, brief summary (2-3 sentences), source name, and URL. Format as a list.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse Perplexity response to extract articles
    const articles: NewsArticle[] = [];
    const sections = content.split(/\n\n(?=\d+\.|\*\*|###)/);

    sections.forEach((section, index) => {
      if (section.trim().length > 100) {
        const titleMatch = section.match(/(?:\d+\.\s*)?(?:\*\*)?([^\n*]+?)(?:\*\*)?[\n:]/);
        const title = titleMatch ? titleMatch[1].trim() : `Financial News ${index + 1}`;

        const lines = section.split('\n').filter(line => line.trim());
        const summary = lines.slice(1, 4).join(' ').trim();

        const urlMatch = section.match(/https?:\/\/[^\s]+/);
        const sourceUrl = urlMatch ? urlMatch[0] : null;

        const sourceMatch = section.match(/Source:\s*([^\n]+)/i) ||
                           section.match(/\[([^\]]+)\]/);
        const source = sourceMatch ? sourceMatch[1].trim() : 'Web';

        const category = categorizeNews(title, summary);
        const impactType = determineImpactType(title, summary);
        const urgency = determineUrgency(new Date().toISOString(), impactType, title);
        const affectsGoalTypes = determineAffectedGoals(title, summary);
        const region = null; // Perplexity returns global news

        articles.push({
          id: `perplexity-${timeframe}-${index}-${Date.now()}`,
          title,
          summary: summary || title,
          source,
          sourceUrl,
          imageUrl: null,
          category,
          impactType,
          urgency,
          publishedAt: new Date().toISOString(),
          affectsGoalTypes,
          region,
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('Failed to fetch from Perplexity:', error);
    return [];
  }
}

/**
 * Categorize news based on content
 */
function categorizeNews(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('interest rate') || text.includes('fed') || text.includes('federal reserve')) {
    return 'interest_rates';
  }
  if (text.includes('policy') || text.includes('regulation') || text.includes('law') || text.includes('government')) {
    return 'policy';
  }
  if (text.includes('stock') || text.includes('market') || text.includes('investment') || text.includes('trading')) {
    return 'markets';
  }
  if (text.includes('credit card') || text.includes('savings account') || text.includes('bank account') || text.includes('loan')) {
    return 'products';
  }

  return 'general';
}

/**
 * Determine impact type
 */
function determineImpactType(title: string, description: string): 'positive' | 'negative' | 'neutral' | 'action_required' {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('cut') || text.includes('drop') || text.includes('fall') || text.includes('decrease')) {
    return text.includes('rate') ? 'negative' : 'positive'; // Rate cuts are negative for savers
  }
  if (text.includes('raise') || text.includes('rise') || text.includes('increase') || text.includes('hike')) {
    return text.includes('rate') ? 'positive' : 'negative'; // Rate hikes are positive for savers
  }
  if (text.includes('new') || text.includes('launch') || text.includes('offer')) {
    return 'action_required';
  }
  if (text.includes('warning') || text.includes('crisis') || text.includes('crash')) {
    return 'negative';
  }

  return 'neutral';
}

/**
 * Determine urgency level
 */
function determineUrgency(publishedAt: string, impactType: string, title: string): 'low' | 'normal' | 'high' | 'urgent' {
  const text = title.toLowerCase();
  const hoursSincePublished = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);

  if (text.includes('breaking') || text.includes('urgent') || text.includes('immediate')) {
    return 'urgent';
  }
  if (impactType === 'action_required' && hoursSincePublished < 24) {
    return 'high';
  }
  if (hoursSincePublished < 6) {
    return 'high';
  }
  if (hoursSincePublished < 24) {
    return 'normal';
  }

  return 'low';
}

/**
 * Determine which goal types this affects
 */
function determineAffectedGoals(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const affected: string[] = [];

  if (text.includes('housing') || text.includes('mortgage') || text.includes('real estate') || text.includes('home')) {
    affected.push('house');
  }
  if (text.includes('saving') || text.includes('interest rate') || text.includes('savings account')) {
    affected.push('travel', 'emergency_fund', 'car');
  }
  if (text.includes('investment') || text.includes('stock') || text.includes('market') || text.includes('retirement') || text.includes('portfolio') || text.includes('dividend') || text.includes('fund') || text.includes('capital')) {
    affected.push('investment', 'retirement');
  }
  if (text.includes('debt') || text.includes('loan') || text.includes('credit')) {
    affected.push('debt_free', 'house', 'car');
  }
  if (text.includes('travel') || text.includes('airline') || text.includes('hotel')) {
    affected.push('travel');
  }
  if (text.includes('car') || text.includes('auto') || text.includes('vehicle')) {
    affected.push('car');
  }

  // If no specific goals, apply to all (including investment)
  if (affected.length === 0) {
    affected.push('house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car', 'investment');
  }

  return [...new Set(affected)]; // Remove duplicates
}

/**
 * Determine region from source
 */
function determineRegion(source: string): string | null {
  const sourceLower = source.toLowerCase();

  if (sourceLower.includes('uk') || sourceLower.includes('britain') || sourceLower.includes('british')) {
    return 'UK';
  }
  if (sourceLower.includes('europe') || sourceLower.includes('eu ')) {
    return 'EU';
  }
  if (sourceLower.includes('australia') || sourceLower.includes('aussie')) {
    return 'AU';
  }
  if (sourceLower.includes('canada') || sourceLower.includes('canadian')) {
    return 'CA';
  }

  return null; // Global news
}

/**
 * GET /api/news/realtime
 * Fetch real-time news with timeline filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '1w'; // Default: 1 week
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');

    // Validate timeframe
    const validTimeframes = ['1h', '6h', '1d', '3d', '1w', '2w', '1m', '3m'];
    const selectedTimeframe = validTimeframes.includes(timeframe) ? timeframe : '1w';

    // Get user's goal type and region if userId provided
    let userGoalType: string | undefined;
    let userRegion: string | undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { whopId: userId },
        include: { goal: true },
      });

      if (user?.goal) {
        userGoalType = user.goal.type;
        userRegion = user.goal.region || undefined;
      }
    }

    // Check cache first
    const cacheKey = `news_realtime_${selectedTimeframe}_${userGoalType || 'all'}_${category || 'all'}_${urgency || 'all'}`;
    const cachedNews = cache.get<NewsArticle[]>(cacheKey);

    if (cachedNews) {
      console.log(`Returning cached news for ${selectedTimeframe}`);

      // Apply region filter if user has specific region
      let filteredNews = cachedNews;
      if (userRegion) {
        filteredNews = cachedNews.filter(
          article => article.region === userRegion || article.region === null
        );
      }

      return NextResponse.json({
        articles: filteredNews,
        cached: true,
        timeframe: selectedTimeframe,
        count: filteredNews.length,
      });
    }

    // Fetch news in real-time
    console.log(`Fetching real-time news for timeframe: ${selectedTimeframe}`);

    // Build search query based on goal type
    let query = 'finance OR economy OR investing OR savings OR banking';
    if (userGoalType && userGoalType !== 'all') {
      const goalQueries: Record<string, string> = {
        house: 'mortgage OR housing OR real estate OR home buying',
        travel: 'travel deals OR airline OR hotel OR vacation savings',
        debt_free: 'debt relief OR student loans OR credit card debt',
        emergency_fund: 'savings account OR emergency fund OR interest rates',
        retirement: 'retirement OR 401k OR IRA OR pension',
        car: 'car loans OR auto financing OR vehicle purchase',
      };
      query = goalQueries[userGoalType] || query;
    }

    // Calculate from date
    const now = new Date();
    const fromDate = new Date(now);
    switch (selectedTimeframe) {
      case '1h':
        fromDate.setHours(now.getHours() - 1);
        break;
      case '6h':
        fromDate.setHours(now.getHours() - 6);
        break;
      case '1d':
        fromDate.setDate(now.getDate() - 1);
        break;
      case '3d':
        fromDate.setDate(now.getDate() - 3);
        break;
      case '1w':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '2w':
        fromDate.setDate(now.getDate() - 14);
        break;
      case '1m':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        fromDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Try multi-source fetcher (NewsAPI → Alpha Vantage → Finnhub → RSS → Marketaux)
    const result = await fetchFromAllSources(query, fromDate, 30);
    console.log(`Fetched ${result.articles.length} articles from: ${result.sources.join(', ')}`);

    // Map to our format
    let articles: NewsArticle[] = result.articles.map((article, index) => {
      const category = categorizeNews(article.title, article.description);
      const impactType = determineImpactType(article.title, article.description);
      const urgency = determineUrgency(article.publishedAt, impactType, article.title);
      const affectsGoalTypes = determineAffectedGoals(article.title, article.description);
      const region = determineRegion(article.source);

      return {
        id: `news-${selectedTimeframe}-${index}-${Date.now()}`,
        title: article.title,
        summary: article.description,
        source: article.source,
        sourceUrl: article.url,
        imageUrl: article.imageUrl || null,
        category,
        impactType,
        urgency,
        publishedAt: article.publishedAt,
        affectsGoalTypes,
        region,
      };
    });

    console.log(`📊 After mapping: ${articles.length} articles`);
    console.log(`Filters - Category: ${category}, Urgency: ${urgency}, UserRegion: ${userRegion}, UserGoalType: ${userGoalType}`);

    // Filter by category if specified
    if (category && category !== 'all') {
      const before = articles.length;
      articles = articles.filter(article => article.category === category);
      console.log(`Category filter: ${before} → ${articles.length}`);
    }

    // Filter by urgency if specified
    if (urgency && urgency !== 'all') {
      const before = articles.length;
      articles = articles.filter(article => article.urgency === urgency);
      console.log(`Urgency filter: ${before} → ${articles.length}`);
    }

    // Filter by user's region if specified
    if (userRegion) {
      const before = articles.length;
      articles = articles.filter(
        article => article.region === userRegion || article.region === null
      );
      console.log(`Region filter (looking for ${userRegion}): ${before} → ${articles.length}`);
      if (articles.length === 0 && before > 0) {
        console.log(`Sample regions in articles:`, result.articles.slice(0, 3).map(a => ({ source: a.source, region: determineRegion(a.source) })));
      }
    }

    // Filter by user's goal type if specified
    if (userGoalType && userGoalType !== 'all') {
      const before = articles.length;
      articles = articles.filter(
        article => article.affectsGoalTypes.includes(userGoalType) || article.affectsGoalTypes.length === 0
      );
      console.log(`Goal type filter (looking for ${userGoalType}): ${before} → ${articles.length}`);
      if (articles.length === 0 && before > 0) {
        console.log(`Sample goal types:`, result.articles.slice(0, 3).map(a => ({ title: a.title.substring(0, 30), goals: determineAffectedGoals(a.title, a.description) })));
      }
    }

    // Sort by urgency and date
    articles.sort((a, b) => {
      const urgencyOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Cache for 10 minutes (shorter timeframes = shorter cache)
    const cacheDuration = selectedTimeframe === '1h' ? 300 : // 5 minutes
                          selectedTimeframe === '6h' ? 600 : // 10 minutes
                          selectedTimeframe === '1d' ? 900 : // 15 minutes
                          1800; // 30 minutes for longer timeframes

    cache.set(cacheKey, articles, cacheDuration);

    console.log(`✅ Returning ${articles.length} articles to frontend`);
    console.log(`Sample article:`, articles[0] ? {
      id: articles[0].id,
      title: articles[0].title.substring(0, 50),
      category: articles[0].category,
      urgency: articles[0].urgency,
    } : 'No articles');

    return NextResponse.json({
      articles,
      cached: false,
      timeframe: selectedTimeframe,
      count: articles.length,
    });
  } catch (error) {
    console.error('Error fetching real-time news:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
