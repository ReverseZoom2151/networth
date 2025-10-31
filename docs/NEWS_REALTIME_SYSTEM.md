# Real-Time News System

The news section generates **real-time financial news** directly from web sources without database storage. Users can select custom timeframes to view the most relevant and fresh news.

## Overview

### Key Features
- **Real-Time Generation**: News fetched live from NewsAPI & Perplexity AI when users visit the page
- **Timeline Filtering**: Users select timeframes from 1 hour to 3 months
- **Smart Caching**: In-memory cache (5-30 minutes depending on timeframe) to reduce API costs
- **No Database Storage**: News is never stored - always fresh from sources
- **Personalized Filtering**: Automatically filtered by user's goal type and region
- **Multi-Source**: Falls back from NewsAPI → Perplexity if primary source fails

---

## Architecture

### Data Flow

```
User visits /news page
    ↓
Select timeframe (1h, 1d, 1w, 1m, etc.)
    ↓
Check in-memory cache
    ↓
Cache hit? → Return instantly
    ↓
Cache miss? → Fetch in real-time:
    ↓
1. Try NewsAPI first (free tier: 100 req/day)
2. If fails, try Perplexity AI (premium)
3. Filter by user's goal type & region
4. Categorize (interest rates, policy, markets, products)
5. Determine impact type & urgency
6. Cache for 5-30 minutes (based on timeframe)
7. Return to user
```

---

## Components

### 1. Real-Time API Endpoint
**File:** [app/api/news/realtime/route.ts](../app/api/news/realtime/route.ts)

**Endpoint:** `GET /api/news/realtime`

**Query Parameters:**
```typescript
userId: string          // User's Whop ID (for goal/region filtering)
timeframe: string       // Timeline filter (1h, 6h, 1d, 3d, 1w, 2w, 1m, 3m)
category?: string       // Optional: interest_rates, policy, markets, products, general
urgency?: string        // Optional: urgent, high, normal, low
```

**Response:**
```json
{
  "articles": [
    {
      "id": "news-1w-0-1234567890",
      "title": "Fed Raises Interest Rates by 0.5%",
      "summary": "The Federal Reserve announced...",
      "source": "Reuters",
      "sourceUrl": "https://reuters.com/...",
      "imageUrl": "https://...",
      "category": "interest_rates",
      "impactType": "positive",
      "urgency": "high",
      "publishedAt": "2025-01-15T10:30:00Z",
      "affectsGoalTypes": ["emergency_fund", "house", "car"],
      "region": null
    }
  ],
  "cached": false,
  "timeframe": "1w",
  "count": 25
}
```

### 2. News Feed Component
**File:** [components/news/NewsImpactFeed.tsx](../components/news/NewsImpactFeed.tsx)

**Timeline Filters:**
- ⚡ **Last Hour** (1h) - Breaking news, cached 5 minutes
- 🕐 **Last 6 Hours** (6h) - Very recent, cached 10 minutes
- 📅 **Today** (1d) - Daily news, cached 15 minutes
- 📆 **Last 3 Days** (3d) - Recent developments, cached 30 minutes
- 📊 **This Week** (1w) - Weekly digest, cached 30 minutes (default)
- 📈 **Last 2 Weeks** (2w) - Biweekly updates, cached 30 minutes
- 🗓️ **This Month** (1m) - Monthly overview, cached 30 minutes
- 📉 **Last 3 Months** (3m) - Quarterly trends, cached 30 minutes

**Category Filters:**
- 📰 **All News** - Everything
- 💰 **Interest Rates** - Fed decisions, savings rates, mortgage rates
- 📋 **Policy Changes** - Government regulations, tax changes
- 📊 **Market News** - Stock market, investing trends
- 🏦 **New Products** - Bank accounts, credit cards, financial tools

**Urgency Filters:**
- All
- Urgent Only
- High Priority

### 3. News Sources

#### Primary: NewsAPI.org
**File:** Uses NewsAPI.org REST API
**Rate Limit:** 100 requests/day (free tier)
**Coverage:** Global financial news from 80,000+ sources

**Query Strategy:**
- Goal-specific searches (e.g., "mortgage" for house goal)
- Date range filtering based on timeframe
- Language: English only
- Sorted by: Published date (newest first)

**Example Query:**
```javascript
https://newsapi.org/v2/everything?
  q=mortgage+OR+housing+OR+real+estate&
  language=en&
  sortBy=publishedAt&
  from=2025-01-08&
  pageSize=30&
  apiKey=YOUR_KEY
```

#### Fallback: Perplexity AI
**File:** Uses Perplexity AI Chat Completions API
**Rate Limit:** Based on plan
**Coverage:** Real-time web search with AI summarization

**Query Strategy:**
- Natural language search queries
- AI-powered summarization
- Extracts titles, summaries, sources, URLs
- More expensive but more reliable

---

## News Categorization

### Automatic Categorization Logic

**Interest Rates** (💰)
- Keywords: "interest rate", "fed", "federal reserve", "basis points"
- Impact: Affects savings accounts, mortgages, loans

**Policy Changes** (📋)
- Keywords: "policy", "regulation", "law", "government", "IRS"
- Impact: Tax implications, benefit changes, compliance

**Market News** (📊)
- Keywords: "stock", "market", "investment", "trading", "dow", "nasdaq"
- Impact: Investment portfolios, retirement accounts

**New Products** (🏦)
- Keywords: "credit card", "savings account", "bank account", "loan", "new offer"
- Impact: Better rates, rewards, features

**General** (📰)
- Everything else
- Broad financial topics

---

## Impact Classification

### Impact Types

**Positive** (✅)
- Good news for users
- Examples: Savings rate increases, new benefits, better deals
- Color: Green

**Negative** (⚠️)
- Bad news for users
- Examples: Loan rate increases, fee hikes, benefit cuts
- Color: Red/Orange

**Neutral** (ℹ️)
- Informational, no direct impact
- Examples: Market updates, general trends
- Color: Gray/Blue

**Action Required** (🚨)
- Urgent action needed
- Examples: Limited-time offers, deadline-driven changes
- Color: Purple

### Urgency Levels

**Urgent** (🔴)
- Immediate action needed (24-48 hours)
- Keywords: "breaking", "urgent", "immediate"
- Published: < 6 hours ago

**High** (🟠)
- Important but not immediate (1-2 weeks)
- Action required items < 24 hours old
- Published: < 6 hours ago

**Normal** (🟡)
- Keep informed, no rush
- Published: 6-24 hours ago

**Low** (🟢)
- Background information
- Published: > 24 hours ago

---

## Goal Type Filtering

News is automatically filtered based on user's goal:

**House Goal**
- Keywords: "housing", "mortgage", "real estate", "home buying"
- Affects: Interest rates, housing market, down payment strategies

**Travel Goal**
- Keywords: "travel", "airline", "hotel", "vacation"
- Affects: Savings rates, travel deals, credit card rewards

**Debt-Free Goal**
- Keywords: "debt", "loan", "credit card", "refinance"
- Affects: Interest rates, debt relief programs, consolidation

**Emergency Fund Goal**
- Keywords: "savings account", "interest rate", "emergency fund"
- Affects: High-yield savings accounts, rate changes

**Retirement Goal**
- Keywords: "retirement", "401k", "IRA", "investment", "stock market"
- Affects: Market performance, retirement accounts, tax changes

**Car Goal**
- Keywords: "car loan", "auto financing", "vehicle"
- Affects: Auto loan rates, dealer incentives

---

## Region Filtering

News is filtered by user's region (from their goal settings):

**Global News** (region = null)
- Shows to all users regardless of region
- General financial news

**US News** (region = "US")
- Federal Reserve decisions
- US tax policy
- American banks and products

**UK News** (region = "UK")
- Bank of England decisions
- UK-specific banking
- British financial products

**EU News** (region = "EU")
- European Central Bank
- EU regulations
- European financial services

**Canada** (region = "CA"), **Australia** (region = "AU"), etc.

---

## Caching Strategy

### Cache Duration by Timeframe

```typescript
const cacheDuration = {
  '1h': 300,   // 5 minutes  - Very fresh, breaking news
  '6h': 600,   // 10 minutes - Recent news
  '1d': 900,   // 15 minutes - Daily updates
  '3d': 1800,  // 30 minutes - Multi-day view
  '1w': 1800,  // 30 minutes - Weekly digest (default)
  '2w': 1800,  // 30 minutes - Biweekly
  '1m': 1800,  // 30 minutes - Monthly
  '3m': 1800,  // 30 minutes - Quarterly
};
```

### Cache Keys
```typescript
`news_realtime_${timeframe}_${goalType}_${category}_${urgency}`
```

**Examples:**
- `news_realtime_1w_house_all_all` - Week of house news, all categories/urgencies
- `news_realtime_1d_all_interest_rates_urgent` - Today's urgent interest rate news
- `news_realtime_1m_retirement_markets_all` - Month of retirement market news

### Cache Benefits
- **Cost Reduction**: Avoid repeated API calls for same query
- **Performance**: Instant response for cached queries
- **Reliability**: Serves cached data if API fails

---

## User Experience

### First Visit (Cache Miss)
1. User selects timeframe (e.g., "This Week")
2. Loading screen: "Fetching latest financial news... This may take a few seconds"
3. API fetches from NewsAPI (3-5 seconds)
4. News displayed, cached for 30 minutes

### Subsequent Visits (Cache Hit)
1. User selects same timeframe
2. Instant display (< 100ms)
3. Shows "(X articles)" count

### Timeline Change
1. User changes from "1w" to "1d"
2. New cache key checked
3. If miss: Fetch new data for that timeframe
4. If hit: Instant display

---

## API Cost Management

### NewsAPI (Free Tier)
- **Limit**: 100 requests/day
- **Cost**: Free
- **Strategy**: Primary source for most users

**Estimated Usage:**
- Without caching: 100 users = 100 API calls = Limit reached immediately
- With 30-min caching: 100 users = ~12 API calls/day = Well within limit

### Perplexity AI (Paid)
- **Limit**: Based on plan
- **Cost**: ~$0.01-0.02 per search
- **Strategy**: Fallback only when NewsAPI fails

**Estimated Usage:**
- Only triggered when NewsAPI returns 0 results
- ~5-10% of requests (very rare)

### Total Monthly Costs

**Low Traffic** (100 users/month):
- NewsAPI: Free
- Perplexity: ~$0.50/month (5% fallback rate)
- **Total: $0.50/month**

**Medium Traffic** (1,000 users/month):
- NewsAPI: Free
- Perplexity: ~$5/month (5% fallback rate)
- **Total: $5/month**

**High Traffic** (10,000 users/month):
- NewsAPI: Free (cached effectively)
- Perplexity: ~$50/month (5% fallback rate)
- **Total: $50/month**

---

## Comparison with Database Approach

### ❌ Old Approach (Database Storage)
- ✅ Fast page loads (instant)
- ❌ Stale content (only fresh when script runs)
- ❌ Requires periodic script execution (`npm run news:fetch`)
- ❌ Database maintenance overhead
- ❌ Complex deployment (cron jobs, scheduled tasks)
- ❌ Limited flexibility (fixed refresh intervals)

### ✅ New Approach (Real-Time Generation)
- ✅ Always fresh content (live from sources)
- ✅ User-controlled timeframes (1h to 3m)
- ✅ No database storage needed
- ✅ No scheduled jobs required
- ✅ Simple deployment (just API endpoint)
- ✅ Smart caching reduces costs
- ⚠️ Slightly slower first load (3-5 seconds, but cached after)

---

## Environment Variables

```env
# Required
NEWS_API_KEY=your_newsapi_key          # Get free key from newsapi.org
PERPLEXITY_API_KEY=your_perplexity_key # Optional: Premium fallback

# Optional (for AI impact calculation - future feature)
ANTHROPIC_API_KEY=your_claude_key      # For personalized impact analysis
```

**Get API Keys:**
- NewsAPI: https://newsapi.org/register (free tier: 100 req/day)
- Perplexity: https://www.perplexity.ai/settings/api (paid plans)

---

## Usage

### For Users
1. Visit `/news` page
2. Select timeframe from dropdown (default: This Week)
3. Optionally filter by category and urgency
4. Browse personalized news
5. Click article to read on source website

### For Developers

**Fetch news programmatically:**
```typescript
// Fetch this week's news for a user
const response = await fetch('/api/news/realtime?userId=user_123&timeframe=1w');
const data = await response.json();

console.log(`Fetched ${data.count} articles (cached: ${data.cached})`);
data.articles.forEach(article => {
  console.log(`${article.title} - ${article.source}`);
});
```

**Change cache duration:**
```typescript
// In app/api/news/realtime/route.ts
const cacheDuration = selectedTimeframe === '1h' ? 300 : 600; // Adjust values
cache.set(cacheKey, articles, cacheDuration);
```

---

## Troubleshooting

### No News Appearing

**Problem**: Empty news feed for all timeframes

**Solutions:**
1. Check `NEWS_API_KEY` is set in `.env.local`
2. Verify API key is valid at newsapi.org
3. Check browser console for API errors
4. Try increasing timeframe (1h → 1w)
5. Check if NewsAPI free tier limit reached (100/day)

### Slow Loading

**Problem**: News takes >10 seconds to load

**Solutions:**
1. Increase cache duration to reduce API calls
2. Use longer timeframes (they cache longer)
3. Check internet connection
4. Verify NewsAPI isn't rate limiting

### Repetitive Articles

**Problem**: Same articles across different timeframes

**Solutions:**
1. Clear cache by restarting dev server
2. Adjust timeframe date range calculation
3. Change search queries in API endpoint

---

## Best Practices

1. **Default Timeframe**: Start with "This Week" (1w) - good balance
2. **Cache Monitoring**: Log cache hit/miss rates in production
3. **Error Handling**: Always have Perplexity as fallback
4. **User Education**: Explain what each timeframe means
5. **Cost Management**: Monitor API usage, upgrade plans as needed
6. **Performance**: Keep cache durations appropriate for freshness needs

---

## Future Enhancements

Potential improvements:
- [ ] **AI Personalized Impact**: Use Claude to calculate dollar impact per user
- [ ] **Push Notifications**: Alert users for urgent breaking news
- [ ] **Bookmarking**: Save articles for later (local storage)
- [ ] **Sharing**: Share articles on social media
- [ ] **Multi-language**: Support for non-English news
- [ ] **News Sources Preference**: Let users choose preferred sources
- [ ] **Email Digests**: Daily/weekly email summaries
- [ ] **Advanced Filtering**: Custom keyword searches

---

## Related Files

- [app/api/news/realtime/route.ts](../app/api/news/realtime/route.ts) - Real-time API endpoint
- [components/news/NewsImpactFeed.tsx](../components/news/NewsImpactFeed.tsx) - News feed component
- [app/news/page.tsx](../app/news/page.tsx) - News page
- [lib/cache.ts](../lib/cache.ts) - Caching utility
- [lib/newsAPI.ts](../lib/newsAPI.ts) - NewsAPI integration helpers

---

**Note:** This system fetches real news from public APIs in real-time. Always respect rate limits, cache intelligently, and monitor API costs carefully.
