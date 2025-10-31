# Multi-Source News API System

Your news system now supports **5 different sources** with smart fallback, ensuring you always have fresh financial news even if one source fails.

## Supported Sources

### 1. 📰 **NewsAPI.org** (Primary)
- **Status**: ✅ Already configured
- **Free Tier**: 100 requests/day
- **Strengths**: Best date-range filtering, 80,000+ sources
- **Get Key**: https://newsapi.org/register
- **Env Variable**: `NEWS_API_KEY`

**Use case**: Primary source for all timeframe queries

---

### 2. 📊 **Alpha Vantage** (Backup #1)
- **Status**: Available (in codebase)
- **Free Tier**: 500 requests/day ⭐
- **Strengths**: Financial news with sentiment analysis
- **Get Key**: https://www.alphavantage.co/support/#api-key
- **Env Variable**: `ALPHA_VANTAGE_API_KEY`

**Use case**: Kicks in when NewsAPI fails or returns no results

---

### 3. 📈 **Finnhub** (Backup #2)
- **Status**: NEW - Just added!
- **Free Tier**: 60 API calls/minute (generous!)
- **Strengths**: Excellent for stock market and company news
- **Get Key**: https://finnhub.io/register
- **Env Variable**: `FINNHUB_API_KEY`

**Use case**: Financial markets, company news, earnings reports

---

### 4. 💰 **Marketaux** (Backup #3)
- **Status**: NEW - Just added!
- **Free Tier**: 100 requests/day
- **Strengths**: Aggregates from 50+ financial news sources
- **Get Key**: https://www.marketaux.com/
- **Env Variable**: `MARKETAUX_API_KEY`

**Use case**: Broad financial news coverage

---

### 5. 📡 **RSS Feeds** (Always Available!)
- **Status**: ✅ Works without API keys!
- **Free Tier**: Unlimited - No API key needed
- **Sources**:
  - **Investopedia** - Personal finance education
  - **Reuters Finance** - Breaking financial news
  - **CNBC** - Market updates
  - **MarketWatch** - Stock market news
  - **Bloomberg Markets** - Global financial news

**Use case**: Fallback when all APIs fail, or as supplementary source

---

## How the Fallback Chain Works

```
User visits /news page with "This Week" filter
    ↓
1. Try NewsAPI first
   ├─ Success? Use articles → DONE
   └─ Failed/Empty? Continue to #2

2. Try Alpha Vantage
   ├─ Success? Use articles → DONE
   └─ Failed/Empty? Continue to #3

3. Try Finnhub
   ├─ Success? Use articles → DONE
   └─ Failed/Empty? Continue to #4

4. Try RSS Feeds (Investopedia, Reuters, etc.)
   ├─ Always works (no API key needed)
   └─ Returns articles → DONE

5. Try Marketaux (last resort)
   └─ Use whatever we got
```

## Setup Instructions

### Minimum Setup (What you have now)
```env
NEWS_API_KEY="89bac039e4f342ee9c49155e507af00f"  ✅ Already set
```
- This alone will work for most cases
- RSS feeds are automatic fallback (no key needed)

### Recommended Setup (Better reliability)
```env
NEWS_API_KEY="..."                  # Primary
ALPHA_VANTAGE_API_KEY="..."         # Backup (500/day!)
```
- Get Alpha Vantage key in 30 seconds: https://www.alphavantage.co/support/#api-key
- No credit card required, just email

### Maximum Setup (Best reliability)
```env
NEWS_API_KEY="..."                  # 100/day
ALPHA_VANTAGE_API_KEY="..."         # 500/day
FINNHUB_API_KEY="..."               # 60/min
MARKETAUX_API_KEY="..."             # 100/day
```
- Total: **1,260 API requests/day** across all sources
- RSS feeds provide unlimited additional coverage

---

## API Key Setup Guide

### 1. NewsAPI (Already done!)
You already have this:
```env
NEWS_API_KEY="89bac039e4f342ee9c49155e507af00f"
```

### 2. Alpha Vantage (Recommended - 30 seconds)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Copy the key immediately shown
4. Add to `.env.local`:
   ```env
   ALPHA_VANTAGE_API_KEY="your_key_here"
   ```

### 3. Finnhub (Optional - 2 minutes)
1. Visit: https://finnhub.io/register
2. Sign up with email
3. Go to Dashboard → Copy API Key
4. Add to `.env.local`:
   ```env
   FINNHUB_API_KEY="your_key_here"
   ```

### 4. Marketaux (Optional)
1. Visit: https://www.marketaux.com/
2. Sign up for free account
3. Get API token from dashboard
4. Add to `.env.local`:
   ```env
   MARKETAUX_API_KEY="your_key_here"
   ```

---

## Source Comparison

| Source | Free Limit | Speed | Quality | Date Filter | Best For |
|--------|-----------|-------|---------|-------------|----------|
| **NewsAPI** | 100/day | Fast | Excellent | ✅ Yes | Date-range queries |
| **Alpha Vantage** | 500/day | Fast | Excellent | ❌ No | High volume |
| **Finnhub** | 60/min | Very Fast | Good | ❌ No | Real-time markets |
| **Marketaux** | 100/day | Medium | Good | ✅ Yes | Aggregated news |
| **RSS Feeds** | Unlimited | Fast | Variable | ❌ No | Always available |

---

## Testing Your Setup

### Test which sources are working:
```bash
# Visit the news page and check the browser console
# You'll see logs like:
# "Trying NewsAPI..."
# "Trying Alpha Vantage..."
# "Fetched 25 articles from: NewsAPI, RSS Feeds"
```

### Test individual sources:
```typescript
// In browser console (on /news page)
fetch('/api/news/realtime?userId=standalone-user&timeframe=1w')
  .then(r => r.json())
  .then(data => {
    console.log(`Got ${data.count} articles`);
    console.log('Articles:', data.articles);
  });
```

---

## Cost Analysis

### Current Setup (Just NewsAPI + RSS)
- **Daily limit**: 100 requests
- **Monthly cost**: $0 (free tier)
- **Sufficient for**: ~100-500 users/month

### With Alpha Vantage Added
- **Daily limit**: 600 requests (100 + 500)
- **Monthly cost**: $0 (free tier)
- **Sufficient for**: ~1,000-5,000 users/month

### Full Setup (All sources)
- **Daily limit**: 1,260+ requests
- **Monthly cost**: $0 (all free tiers)
- **Sufficient for**: ~10,000+ users/month
- **RSS**: Unlimited additional coverage

---

## Troubleshooting

### No news appearing
1. Check if `NEWS_API_KEY` is set in `.env.local`
2. Restart dev server after adding new API keys
3. Check browser console for error messages
4. RSS feeds should always work as fallback

### Only seeing RSS feed articles
- This means all API keys failed or aren't set
- RSS-only mode is fine for testing
- Add Alpha Vantage key for better coverage

### API rate limits hit
- NewsAPI free tier: 100/day limit
- Solution: Add Alpha Vantage (500/day extra)
- Or wait until next day for reset

---

## Best Practices

1. **Start simple**: Just NewsAPI + RSS feeds (your current setup)
2. **Add Alpha Vantage next**: Easiest to set up, highest free tier (500/day)
3. **Add Finnhub/Marketaux**: Only if you need more coverage
4. **Monitor usage**: Check which sources are being used most
5. **Cache effectively**: Current 30-minute cache reduces API calls significantly

---

## Example Response

```json
{
  "articles": [
    {
      "id": "news-1w-0-1234567890",
      "title": "Fed Holds Interest Rates Steady",
      "summary": "The Federal Reserve announced...",
      "source": "Reuters Finance",  // From RSS Feed!
      "sourceUrl": "https://reuters.com/...",
      "category": "interest_rates",
      "impactType": "neutral",
      "urgency": "high",
      "publishedAt": "2025-01-15T10:00:00Z",
      "affectsGoalTypes": ["emergency_fund", "house"]
    }
  ],
  "cached": false,
  "timeframe": "1w",
  "count": 25
}
```

---

## RSS Feeds Included (Always Free!)

Your system automatically fetches from these sources:

1. **Investopedia** (`investopedia.com`)
   - Personal finance education
   - Investment guides
   - Market analysis

2. **Reuters Finance** (`reuters.com/finance`)
   - Breaking financial news
   - Global markets
   - Economic policy

3. **CNBC** (`cnbc.com`)
   - Stock market updates
   - Business news
   - Investment trends

4. **MarketWatch** (`marketwatch.com`)
   - Market data
   - Stock analysis
   - Personal finance

5. **Bloomberg Markets** (`bloomberg.com`)
   - Global financial news
   - Market movements
   - Economic indicators

These RSS feeds provide a solid baseline of news **without requiring any API keys**.

---

## Summary

✅ **You already have NewsAPI working**
✅ **RSS feeds provide free unlimited fallback**
🎯 **Recommended next step**: Add Alpha Vantage key (30 seconds, 500 extra requests/day)
🚀 **For maximum reliability**: Add Finnhub and Marketaux too

Your users will always see news, even if APIs fail, thanks to RSS feeds!
