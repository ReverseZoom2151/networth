// News API integration for real-time financial news
// Using NewsAPI.org - Free tier: 100 requests/day
// Alternative: Alpha Vantage, Marketaux, or RSS feeds

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  content?: string;
}

/**
 * Fetch financial news from NewsAPI
 * Free API key from: https://newsapi.org/
 */
export async function fetchFinancialNews(
  category: 'business' | 'markets' | 'economy' | 'all' = 'all',
  limit: number = 20
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.warn('NEWS_API_KEY not set - using fallback empty array');
    return [];
  }

  try {
    // Build query based on category
    let query = '';
    switch (category) {
      case 'business':
        query = 'finance OR banking OR loans OR savings OR credit';
        break;
      case 'markets':
        query = 'stock market OR investing OR bonds OR ETF';
        break;
      case 'economy':
        query = 'inflation OR interest rates OR federal reserve OR economy';
        break;
      default:
        query = 'finance OR economy OR investing OR savings OR banking';
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: Math.min(limit, 100).toString(),
      apiKey,
    });

    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || article.content?.substring(0, 200) || '',
      source: article.source.name,
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
      content: article.content,
    }));
  } catch (error) {
    console.error('Failed to fetch news from NewsAPI:', error);
    return [];
  }
}

/**
 * Fetch from Alpha Vantage (alternative free API)
 * Free API key from: https://www.alphavantage.co/support/#api-key
 */
export async function fetchAlphaVantageNews(
  topics: string[] = ['financial_markets', 'economy_fiscal'],
  limit: number = 20
): Promise<NewsArticle[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.warn('ALPHA_VANTAGE_API_KEY not set - using fallback empty array');
    return [];
  }

  try {
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      topics: topics.join(','),
      limit: limit.toString(),
      apikey: apiKey,
    });

    const response = await fetch(`https://www.alphavantage.co/query?${params}`, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.feed) return [];

    return data.feed.map((article: any) => ({
      title: article.title,
      description: article.summary,
      source: article.source,
      url: article.url,
      imageUrl: article.banner_image,
      publishedAt: article.time_published,
      content: article.summary,
    }));
  } catch (error) {
    console.error('Failed to fetch news from Alpha Vantage:', error);
    return [];
  }
}

/**
 * Categorize news article into our system's categories
 */
export function categorizeNews(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes('interest rate') ||
    text.includes('federal reserve') ||
    text.includes('fed ') ||
    text.includes('rate hike') ||
    text.includes('rate cut')
  ) {
    return 'interest_rates';
  }

  if (
    text.includes('inflation') ||
    text.includes('cpi') ||
    text.includes('prices rising') ||
    text.includes('cost of living')
  ) {
    return 'inflation';
  }

  if (
    text.includes('housing') ||
    text.includes('real estate') ||
    text.includes('home prices') ||
    text.includes('mortgage')
  ) {
    return 'housing';
  }

  if (
    text.includes('stock') ||
    text.includes('market') ||
    text.includes('s&p') ||
    text.includes('dow jones')
  ) {
    return 'markets';
  }

  return 'general';
}

/**
 * Determine impact type based on article content
 */
export function determineImpactType(
  title: string,
  description: string
): 'positive' | 'negative' | 'neutral' | 'action_required' {
  const text = `${title} ${description}`.toLowerCase();

  // Negative indicators
  const negativeWords = [
    'crash',
    'decline',
    'fall',
    'drop',
    'plunge',
    'crisis',
    'recession',
    'increase in rates',
    'rate hike',
    'inflation surge',
  ];

  // Positive indicators
  const positiveWords = [
    'rise',
    'gain',
    'surge',
    'boom',
    'recovery',
    'growth',
    'rate cut',
    'lower rates',
    'decrease in inflation',
  ];

  // Action required indicators
  const actionWords = ['deadline', 'must act', 'urgent', 'breaking', 'change in law', 'new rule'];

  if (actionWords.some((word) => text.includes(word))) {
    return 'action_required';
  }

  const negativeCount = negativeWords.filter((word) => text.includes(word)).length;
  const positiveCount = positiveWords.filter((word) => text.includes(word)).length;

  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';

  return 'neutral';
}

/**
 * Determine urgency based on article content and recency
 */
export function determineUrgency(
  publishedAt: string,
  impactType: string,
  title: string
): 'low' | 'normal' | 'high' | 'urgent' {
  const hoursOld = (Date.now() - new Date(publishedAt).getTime()) / 1000 / 60 / 60;
  const titleLower = title.toLowerCase();

  // Breaking news or very recent action-required
  if (
    hoursOld < 6 &&
    (impactType === 'action_required' ||
      titleLower.includes('breaking') ||
      titleLower.includes('urgent'))
  ) {
    return 'urgent';
  }

  // Recent important news
  if (hoursOld < 24 && (impactType === 'action_required' || impactType === 'negative')) {
    return 'high';
  }

  // Recent or moderate impact
  if (hoursOld < 48) {
    return 'normal';
  }

  return 'low';
}
