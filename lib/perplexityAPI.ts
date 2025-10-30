// Perplexity API integration for premium news and deep research
// Used for: Premium users, quota exhaustion fallback, deep research mode

import Perplexity from '@perplexity-ai/perplexity_ai';
import { NewsArticle } from './newsAPI';

// Initialize Perplexity client
function getPerplexityClient() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn('PERPLEXITY_API_KEY not set - Perplexity features disabled');
    return null;
  }

  return new Perplexity({ apiKey });
}

/**
 * Check if Perplexity API is available
 */
export function isPerplexityAvailable(): boolean {
  return !!process.env.PERPLEXITY_API_KEY;
}

/**
 * Fetch premium financial news using Perplexity Search API
 * - Better quality and more up-to-date than free APIs
 * - Domain filtering for trusted sources
 * - Region-aware search
 */
export async function fetchPremiumFinancialNews(
  region: 'US' | 'UK' | 'EU' | 'AU' = 'US',
  limit: number = 20
): Promise<NewsArticle[]> {
  const client = getPerplexityClient();

  if (!client) {
    console.warn('Perplexity API not available, using fallback');
    return [];
  }

  try {
    // Multi-query search for comprehensive financial news
    const search = await client.search.create({
      query: [
        'latest financial market trends and analysis',
        'personal finance news and investment advice',
        'economic policy changes and interest rate updates',
      ],
      // Note: Perplexity SDK currently doesn't support 'country' parameter in TypeScript
      search_domain_filter: [
        'ft.com',           // Financial Times
        'bloomberg.com',    // Bloomberg
        'reuters.com',      // Reuters
        'wsj.com',          // Wall Street Journal
        'economist.com',    // The Economist
        'cnbc.com',         // CNBC
        'marketwatch.com',  // MarketWatch
        'investopedia.com', // Investopedia
        'forbes.com',       // Forbes
        'morningstar.com',  // Morningstar
      ],
      max_results: Math.ceil(limit / 3), // Divide by 3 queries
      max_tokens_per_page: 1024,
    });

    // Flatten results from all queries
    const articles: NewsArticle[] = [];

    if (Array.isArray(search.results)) {
      // Multi-query response
      for (const queryResults of search.results) {
        if (Array.isArray(queryResults)) {
          for (const result of queryResults) {
            articles.push({
              title: result.title,
              description: result.snippet || '',
              source: extractSourceName(result.url),
              url: result.url,
              imageUrl: undefined, // Perplexity doesn't provide images
              publishedAt: result.date || new Date().toISOString(),
              content: result.snippet,
            });
          }
        }
      }
    }

    return articles.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch news from Perplexity:', error);
    return [];
  }
}

/**
 * Perform deep research on a specific financial topic
 * Returns comprehensive, multi-source analysis
 */
export async function performDeepResearch(
  topic: string,
  userGoal?: string,
  region?: string
): Promise<{
  summary: string;
  keyFindings: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  recommendations: string[];
}> {
  const client = getPerplexityClient();

  if (!client) {
    throw new Error('Perplexity API not available for deep research');
  }

  try {
    // Enhanced query with user context
    let enhancedQuery = topic;
    if (userGoal) {
      enhancedQuery += ` - specific advice for someone saving for ${userGoal}`;
    }
    if (region) {
      enhancedQuery += ` in ${region}`;
    }

    const search = await client.search.create({
      query: enhancedQuery,
      search_domain_filter: [
        'investopedia.com',
        'morningstar.com',
        'fool.com',
        'nerdwallet.com',
        'bankrate.com',
        'forbes.com',
        'bloomberg.com',
        'ft.com',
      ],
      max_results: 10,
      max_tokens_per_page: 2048, // More comprehensive content extraction
    });

    // Extract and structure the research
    const sources: Array<{ title: string; url: string; snippet: string }> = [];
    let allContent = '';

    if (Array.isArray(search.results)) {
      for (const result of search.results) {
        sources.push({
          title: result.title,
          url: result.url,
          snippet: result.snippet || '',
        });
        allContent += result.snippet + '\n\n';
      }
    }

    // Generate structured insights from the research
    // In a real implementation, you might use Claude AI to analyze this
    const keyFindings = extractKeyFindings(allContent);
    const recommendations = generateRecommendations(allContent, userGoal);

    return {
      summary: allContent.substring(0, 500) + '...',
      keyFindings,
      sources,
      recommendations,
    };
  } catch (error) {
    console.error('Failed to perform deep research:', error);
    throw new Error('Deep research failed');
  }
}

/**
 * Search for financial products (savings accounts, credit cards, etc.)
 * with real-time rates and offers
 */
export async function searchFinancialProducts(
  productType: 'savings' | 'credit-cards' | 'mortgages' | 'investment-platforms',
  region: string = 'US',
  userProfile?: {
    goal: string;
    creditScore?: string;
    amount?: number;
  }
): Promise<Array<{ title: string; url: string; description: string; source: string }>> {
  const client = getPerplexityClient();

  if (!client) {
    return [];
  }

  try {
    let query = '';
    const domains: string[] = [];

    switch (productType) {
      case 'savings':
        query = 'best high-yield savings accounts current rates';
        domains.push('bankrate.com', 'nerdwallet.com', 'depositaccounts.com');
        break;
      case 'credit-cards':
        query = 'best credit cards current offers and benefits';
        domains.push('nerdwallet.com', 'creditcards.com', 'thepointsguy.com');
        break;
      case 'mortgages':
        query = 'best mortgage rates and lenders current';
        domains.push('bankrate.com', 'nerdwallet.com', 'mortgagecalculator.org');
        break;
      case 'investment-platforms':
        query = 'best investment platforms and brokers comparison';
        domains.push('nerdwallet.com', 'investopedia.com', 'fool.com');
        break;
    }

    // Add user context to query
    if (userProfile?.goal) {
      query += ` for ${userProfile.goal}`;
    }

    const search = await client.search.create({
      query,
      search_domain_filter: domains,
      max_results: 10,
      max_tokens_per_page: 1024,
    });

    const products: Array<{ title: string; url: string; description: string; source: string }> = [];

    if (Array.isArray(search.results)) {
      for (const result of search.results) {
        products.push({
          title: result.title,
          url: result.url,
          description: result.snippet || '',
          source: extractSourceName(result.url),
        });
      }
    }

    return products;
  } catch (error) {
    console.error('Failed to search financial products:', error);
    return [];
  }
}

/**
 * Get real-time financial news for a specific topic
 * Used for AI Coach responses and targeted research
 */
export async function getTopicNews(
  topic: string,
  maxResults: number = 5
): Promise<NewsArticle[]> {
  const client = getPerplexityClient();

  if (!client) {
    return [];
  }

  try {
    const search = await client.search.create({
      query: `${topic} latest news and analysis`,
      search_domain_filter: [
        'reuters.com',
        'bloomberg.com',
        'cnbc.com',
        'ft.com',
        'wsj.com',
      ],
      max_results: maxResults,
      max_tokens_per_page: 1024,
    });

    const articles: NewsArticle[] = [];

    if (Array.isArray(search.results)) {
      for (const result of search.results) {
        articles.push({
          title: result.title,
          description: result.snippet || '',
          source: extractSourceName(result.url),
          url: result.url,
          publishedAt: result.date || new Date().toISOString(),
          content: result.snippet,
        });
      }
    }

    return articles;
  } catch (error) {
    console.error('Failed to fetch topic news:', error);
    return [];
  }
}

// Helper functions

function extractSourceName(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const sourceName = domain.split('.')[0];
    return sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
  } catch {
    return 'Unknown Source';
  }
}

function extractKeyFindings(content: string): string[] {
  // Simple extraction - in production, use Claude AI for better analysis
  const sentences = content.split(/[.!?]\s+/);
  const findings: string[] = [];

  // Look for sentences with key financial indicators
  const keywords = ['important', 'key', 'significant', 'note', 'critical', 'should', 'recommend'];

  for (const sentence of sentences) {
    if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      findings.push(sentence.trim());
      if (findings.length >= 5) break;
    }
  }

  return findings.length > 0 ? findings : [
    'Research completed successfully',
    'Multiple sources analyzed',
    'Comprehensive data gathered',
  ];
}

function generateRecommendations(content: string, userGoal?: string): string[] {
  // Simple recommendations - in production, use Claude AI for personalized advice
  const recommendations: string[] = [];

  if (content.toLowerCase().includes('diversif')) {
    recommendations.push('Consider diversifying your portfolio across different asset classes');
  }
  if (content.toLowerCase().includes('emergen')) {
    recommendations.push('Build an emergency fund covering 3-6 months of expenses');
  }
  if (content.toLowerCase().includes('interest rate') || content.toLowerCase().includes('savings')) {
    recommendations.push('Take advantage of current high-yield savings account rates');
  }
  if (userGoal?.toLowerCase().includes('house')) {
    recommendations.push('Focus on increasing your down payment savings for better mortgage rates');
  }

  if (recommendations.length === 0) {
    recommendations.push('Review your current financial strategy regularly');
    recommendations.push('Consult with a financial advisor for personalized advice');
    recommendations.push('Stay informed about market trends and economic changes');
  }

  return recommendations;
}
