/**
 * Multi-source financial news aggregator
 * Supports: NewsAPI, Alpha Vantage, Finnhub, Marketaux, RSS Feeds
 */

import Parser from 'rss-parser';

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  content?: string;
}

const rssParser = new Parser();

/**
 * 1. NewsAPI.org - Primary source
 * Free: 100 requests/day
 * https://newsapi.org/
 */
export async function fetchFromNewsAPI(
  query: string,
  fromDate: Date,
  limit: number = 30
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      from: fromDate.toISOString(),
      pageSize: limit.toString(),
      apiKey,
    });

    const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
    if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);

    const data = await response.json();
    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source?.name || 'NewsAPI',
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
      content: article.content,
    }));
  } catch (error) {
    console.error('NewsAPI failed:', error);
    return [];
  }
}

/**
 * 2. Alpha Vantage - Backup source with sentiment
 * Free: 500 requests/day
 * https://www.alphavantage.co/support/#api-key
 */
export async function fetchFromAlphaVantage(
  topics: string[] = ['financial_markets', 'economy_fiscal'],
  limit: number = 30
): Promise<NewsArticle[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      function: 'NEWS_SENTIMENT',
      topics: topics.join(','),
      limit: limit.toString(),
      apikey: apiKey,
    });

    const response = await fetch(`https://www.alphavantage.co/query?${params}`);
    if (!response.ok) throw new Error(`Alpha Vantage error: ${response.status}`);

    const data = await response.json();
    if (!data.feed) return [];

    return data.feed.map((article: any) => ({
      title: article.title,
      description: article.summary || '',
      source: article.source || 'Alpha Vantage',
      url: article.url,
      imageUrl: article.banner_image,
      publishedAt: article.time_published,
      content: article.summary,
    }));
  } catch (error) {
    console.error('Alpha Vantage failed:', error);
    return [];
  }
}

/**
 * 3. Finnhub - Excellent financial news API
 * Free: 60 calls/minute
 * https://finnhub.io/register
 */
export async function fetchFromFinnhub(
  category: string = 'general',
  minId: number = 0
): Promise<NewsArticle[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      category,
      minId: minId.toString(),
      token: apiKey,
    });

    const response = await fetch(`https://finnhub.io/api/v1/news?${params}`);
    if (!response.ok) throw new Error(`Finnhub error: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((article: any) => ({
      title: article.headline,
      description: article.summary || '',
      source: article.source || 'Finnhub',
      url: article.url,
      imageUrl: article.image,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      content: article.summary,
    }));
  } catch (error) {
    console.error('Finnhub failed:', error);
    return [];
  }
}

/**
 * 4. Marketaux - Financial news aggregator
 * Free: 100 requests/day
 * https://www.marketaux.com/
 */
export async function fetchFromMarketaux(
  symbols: string = 'AAPL,MSFT,GOOGL',
  limit: number = 30
): Promise<NewsArticle[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_token: apiKey,
      symbols,
      limit: limit.toString(),
      language: 'en',
    });

    const response = await fetch(`https://api.marketaux.com/v1/news/all?${params}`);
    if (!response.ok) throw new Error(`Marketaux error: ${response.status}`);

    const data = await response.json();
    if (!data.data) return [];

    return data.data.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source || 'Marketaux',
      url: article.url,
      imageUrl: article.image_url,
      publishedAt: article.published_at,
      content: article.snippet,
    }));
  } catch (error) {
    console.error('Marketaux failed:', error);
    return [];
  }
}

/**
 * 5. RSS Feeds - Always free!
 * Sources: Investopedia, Reuters, CNBC, MarketWatch
 */
export async function fetchFromRSS(): Promise<NewsArticle[]> {
  const feeds = [
    {
      url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
      source: 'CNBC',
    },
    {
      url: 'https://www.marketwatch.com/rss/topstories',
      source: 'MarketWatch',
    },
    {
      url: 'https://feeds.bloomberg.com/markets/news.rss',
      source: 'Bloomberg Markets',
    },
    {
      url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
      source: 'CNBC Business',
    },
    {
      url: 'https://www.marketwatch.com/rss/realtimeheadlines',
      source: 'MarketWatch Real-time',
    },
  ];

  const allArticles: NewsArticle[] = [];

  for (const feed of feeds) {
    try {
      const parsed = await rssParser.parseURL(feed.url);

      const articles = parsed.items.slice(0, 10).map((item: any) => ({
        title: item.title || '',
        description: item.contentSnippet || item.summary || '',
        source: feed.source,
        url: item.link || '',
        imageUrl: item.enclosure?.url || item['media:thumbnail']?.$?.url,
        publishedAt: item.pubDate || new Date().toISOString(),
        content: item.contentSnippet || '',
      }));

      allArticles.push(...articles);
    } catch (error) {
      console.error(`RSS feed ${feed.source} failed:`, error);
    }
  }

  return allArticles;
}

/**
 * Smart multi-source fetcher with fallback chain
 * Priority: NewsAPI → Alpha Vantage → Finnhub → Marketaux → RSS
 */
export async function fetchFromAllSources(
  query: string,
  fromDate: Date,
  limit: number = 30
): Promise<{ articles: NewsArticle[]; sources: string[] }> {
  const allArticles: NewsArticle[] = [];
  const sourcesUsed: string[] = [];

  // Try NewsAPI first (best for date-range queries)
  console.log('Trying NewsAPI...');
  const newsApiArticles = await fetchFromNewsAPI(query, fromDate, limit);
  if (newsApiArticles.length > 0) {
    allArticles.push(...newsApiArticles);
    sourcesUsed.push('NewsAPI');
  }

  // If NewsAPI didn't return enough, try Alpha Vantage
  if (allArticles.length < 10) {
    console.log('Trying Alpha Vantage...');
    const alphaArticles = await fetchFromAlphaVantage(
      ['financial_markets', 'economy_fiscal'],
      limit
    );
    if (alphaArticles.length > 0) {
      allArticles.push(...alphaArticles);
      sourcesUsed.push('Alpha Vantage');
    }
  }

  // If still not enough, try Finnhub
  if (allArticles.length < 10) {
    console.log('Trying Finnhub...');
    const finnhubArticles = await fetchFromFinnhub('general', 0);
    if (finnhubArticles.length > 0) {
      allArticles.push(...finnhubArticles);
      sourcesUsed.push('Finnhub');
    }
  }

  // Try RSS feeds as additional source (always works, no API key needed)
  if (allArticles.length < 20) {
    console.log('Trying RSS Feeds...');
    const rssArticles = await fetchFromRSS();
    if (rssArticles.length > 0) {
      allArticles.push(...rssArticles);
      sourcesUsed.push('RSS Feeds');
    }
  }

  // If still nothing, try Marketaux
  if (allArticles.length < 10) {
    console.log('Trying Marketaux...');
    const marketauxArticles = await fetchFromMarketaux('AAPL,MSFT,GOOGL', limit);
    if (marketauxArticles.length > 0) {
      allArticles.push(...marketauxArticles);
      sourcesUsed.push('Marketaux');
    }
  }

  // Remove duplicates by URL
  const uniqueArticles = allArticles.filter(
    (article, index, self) => index === self.findIndex((a) => a.url === article.url)
  );

  // Sort by published date (newest first)
  uniqueArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return {
    articles: uniqueArticles.slice(0, limit),
    sources: sourcesUsed,
  };
}
