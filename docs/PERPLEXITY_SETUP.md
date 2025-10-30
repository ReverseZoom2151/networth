# Perplexity AI Integration Setup

This guide explains how to set up and use Perplexity AI for premium features in Networth.

## Overview

Perplexity AI provides enhanced search capabilities for:
- **Deep Financial Research**: Comprehensive multi-source analysis
- **Premium News**: High-quality articles from Financial Times, Bloomberg, etc.
- **Product Search**: Real-time rates for savings accounts, credit cards, etc.
- **Fallback Source**: When free APIs (NewsAPI, Alpha Vantage) are exhausted

## Features

### 1. Deep Research (Premium)
- Multi-source financial topic analysis
- Personalized to user's goals and region
- Comprehensive sources (10+ trusted financial sites)
- Key findings and recommendations
- **Route**: `/research`

### 2. Premium News
- Better quality than free APIs
- Domain filtering for trusted sources
- Region-aware (US, UK, EU, AU)
- Real-time updates
- **Used as**: Fallback in news refresh script

### 3. Premium Product Search
- Real-time financial product recommendations
- Personalized based on user profile
- Up-to-date rates and offers
- **Route**: `/api/products/premium-search`

## Getting Started

### 1. Get API Key

1. Go to https://www.perplexity.ai/settings/api
2. Create an account or sign in
3. Generate an API key
4. **Important**: Keep this key secure!

### 2. Add to Environment Variables

```bash
# Add to .env.local
PERPLEXITY_API_KEY=pplx-your-key-here
```

### 3. Verify Setup

Run the news fetch script to see if Perplexity is detected:

```bash
npm run news:fetch
```

You should see:
```
🔄 Fetching live financial news...
   Perplexity API: ✓ Available (Premium)
```

## Usage

### Deep Research API

**Endpoint**: `POST /api/research/deep`

**Request**:
```json
{
  "userId": "user-123",
  "topic": "Best investment strategies for building wealth",
  "includeUserContext": true
}
```

**Response**:
```json
{
  "success": true,
  "topic": "Best investment strategies for building wealth",
  "research": {
    "summary": "Comprehensive summary...",
    "keyFindings": [
      "Diversification is key...",
      "Index funds offer low-cost exposure..."
    ],
    "recommendations": [
      "Start with a 3-6 month emergency fund",
      "Consider tax-advantaged accounts first"
    ],
    "sources": [
      {
        "title": "Investment Strategies 2025",
        "url": "https://investopedia.com/...",
        "snippet": "..."
      }
    ],
    "generatedAt": "2025-01-30T..."
  }
}
```

### Premium Product Search

**Endpoint**: `GET /api/products/premium-search`

**Parameters**:
- `userId`: User ID (required)
- `type`: Product type - `savings`, `credit-cards`, `mortgages`, `investment-platforms`

**Example**:
```bash
GET /api/products/premium-search?userId=user-123&type=savings
```

### Premium News (Automatic)

Perplexity is automatically used as a fallback in the news refresh script:

```typescript
// scripts/fetch-live-news.ts
// 1. Try NewsAPI (free, 100 req/day)
// 2. Try Alpha Vantage (free, 500 req/day)
// 3. Try Perplexity (premium, unlimited) ← fallback
```

## API Limits & Pricing

Perplexity pricing varies by plan. Check https://perplexity.ai/pricing for current rates.

**Recommendations**:
- Start without Perplexity (use free APIs)
- Add Perplexity when you have paid users
- Use as fallback for quota exhaustion
- Enable for premium tier only

## Integration Points

### 1. News Refresh (Fallback)
```typescript
// scripts/fetch-live-news.ts
if (articles.length === 0 && isPerplexityAvailable()) {
  articles = await fetchPremiumFinancialNews('US', 30);
}
```

### 2. Deep Research Page
```typescript
// app/research/page.tsx
<button onClick={handleResearch}>Start Deep Research</button>
```

### 3. Premium Features Check
```typescript
// Check if available
if (isPerplexityAvailable()) {
  // Show premium features
}
```

## Best Practices

### 1. **Use as Premium Feature**
- Only enable for paid users
- Show "Premium" badge on Research page
- Redirect free users to subscription

### 2. **Optimize Costs**
- Use free APIs first
- Perplexity as fallback only
- Cache results where possible
- Set rate limits per user

### 3. **User Experience**
- Show "Powered by Perplexity" badge
- Display source attribution
- Link to original articles
- Show research progress

## Troubleshooting

### "Perplexity API not available"
- **Cause**: API key not set or invalid
- **Fix**: Check `.env.local` for `PERPLEXITY_API_KEY`

### "Deep research failed"
- **Cause**: API quota exceeded or network error
- **Fix**: Check Perplexity dashboard for quota, retry

### "Premium search not working"
- **Cause**: Invalid product type or region
- **Fix**: Use valid types: `savings`, `credit-cards`, `mortgages`, `investment-platforms`

## Testing

### Test Deep Research
```bash
curl -X POST http://localhost:3000/api/research/deep \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "topic": "retirement planning strategies"
  }'
```

### Test Premium Product Search
```bash
curl "http://localhost:3000/api/products/premium-search?userId=test-user&type=savings"
```

### Test News Fallback
1. Remove or invalidate NEWS_API_KEY
2. Remove or invalidate ALPHA_VANTAGE_API_KEY
3. Run: `npm run news:fetch`
4. Should see: "using Perplexity (Premium)"

## Feature Roadmap

- [ ] Research history tracking
- [ ] Research sharing (via links)
- [ ] AI-powered insights on research
- [ ] Comparison mode (multiple topics)
- [ ] Export research as PDF
- [ ] Research templates (retirement, investing, etc.)

## Support

For Perplexity API support:
- Docs: https://docs.perplexity.ai
- Email: support@perplexity.ai
- Dashboard: https://perplexity.ai/settings

For Networth integration support:
- Check this documentation
- Review `/lib/perplexityAPI.ts`
- Test with example queries above

## Security Notes

⚠️ **Never commit API keys to git**
- Use `.env.local` for local development
- Use environment variables in production
- Add `.env.local` to `.gitignore`
- Rotate keys if exposed

✓ **Keep keys secure**
- Don't share in screenshots
- Don't log in client-side code
- Use server-side API routes only
- Monitor usage in Perplexity dashboard
