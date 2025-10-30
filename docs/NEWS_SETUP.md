# Real-Time News Integration Setup

This guide explains how to set up real-time financial news in the NetWorth app.

## Overview

The app can fetch live financial news from two sources:
- **NewsAPI.org** (Primary) - 100 requests/day free tier
- **Alpha Vantage** (Backup) - 500 requests/day free tier

News is automatically categorized, assigned urgency levels, and personalized using Claude AI.

## Quick Start

### 1. Get API Keys

**Option 1: NewsAPI (Recommended)**
1. Go to https://newsapi.org/register
2. Sign up for a free account
3. Copy your API key
4. Add to `.env`: `NEWS_API_KEY=your_key_here`

**Option 2: Alpha Vantage (Alternative)**
1. Go to https://www.alphavantage.co/support/#api-key
2. Claim your free API key
3. Copy your API key
4. Add to `.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

### 2. Fetch News

**Manual Fetch (for testing):**
```bash
npm run news:fetch
```

**Via API Endpoint:**
```bash
curl -X POST http://localhost:3000/api/news/refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check Status:**
```bash
curl http://localhost:3000/api/news/refresh
```

## Features

### Automatic Categorization
News is automatically categorized into:
- **Interest Rates** - Fed rate changes, monetary policy
- **Inflation** - CPI data, cost of living updates
- **Housing** - Real estate, mortgage rates
- **Markets** - Stock market, investing news
- **General** - Other financial news

### Impact Analysis
Each article is analyzed for:
- **Impact Type**: positive, negative, neutral, action_required
- **Urgency**: low, normal, high, urgent
- **Affected Goal Types**: Which financial goals this impacts

### Personalization
Using Claude AI, each user gets:
- Custom explanation of how the news affects their specific goal
- Dollar amount impact calculation
- Recommended actions

## Automation Setup

### Vercel Cron (Production)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/news/refresh",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours.

### GitHub Actions (Alternative)

Create `.github/workflows/fetch-news.yml`:
```yaml
name: Fetch News
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  fetch-news:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger news fetch
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/news/refresh \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Local Development

Add to your crontab:
```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * cd /path/to/networth-mvp && npm run news:fetch
```

## Environment Variables

Add these to your `.env` file:

```bash
# Required: At least one news API
NEWS_API_KEY=your_newsapi_key
ALPHA_VANTAGE_API_KEY=your_alphavantage_key

# Optional: Secure the refresh endpoint
CRON_SECRET=your_random_secret_string

# Required: For AI personalization
ANTHROPIC_API_KEY=your_anthropic_key
```

## API Rate Limits

| Provider      | Free Tier   | Cost After |
|---------------|-------------|------------|
| NewsAPI       | 100/day     | $449/mo    |
| Alpha Vantage | 500/day     | Contact    |

**Tip**: Start with NewsAPI. If you need more, add Alpha Vantage as backup.

## Troubleshooting

### No articles fetched
1. Check your API keys are set correctly
2. Verify API key is active (test at provider dashboard)
3. Check rate limits (you may have hit daily quota)
4. Look at console logs for specific errors

### Duplicate articles
The system automatically skips duplicates by title. This is normal.

### Old news showing
Run the refresh script. It automatically deactivates news older than 7 days.

### Personalization not working
1. Ensure `ANTHROPIC_API_KEY` is set
2. Check user has a goal set up (required for personalization)
3. View `/api/news/calculate-impact` logs for errors

## News Lifecycle

1. **Fetch** - News fetched from API
2. **Store** - Saved to `NewsImpact` table with metadata
3. **Display** - Shown to users filtered by goal type
4. **Personalize** - Claude AI calculates impact when user views
5. **Archive** - Auto-deactivated after 7 days

## Manual Testing

```bash
# 1. Fetch news
npm run news:fetch

# 2. Check database
npm run db:studio

# 3. View in app
# Go to: http://localhost:3000/news

# 4. Test API endpoint
curl http://localhost:3000/api/news/refresh
```

## Best Practices

1. **Frequency**: Don't fetch more than every 6 hours (respects rate limits)
2. **Monitoring**: Set up alerts if fetch fails
3. **Backup**: Configure both NewsAPI and Alpha Vantage
4. **Security**: Keep `CRON_SECRET` in production to prevent abuse
5. **Storage**: Regularly archive old news (done automatically)

## Cost Optimization

- Free tier is usually sufficient for most apps
- Fetch 30 articles per run (optimal for diversity)
- Run every 6-12 hours (4-2 fetches per day)
- This keeps you well under free tier limits

## Example Output

```
🔄 Fetching live financial news...
✓ Fetched 30 articles
✓ Deactivated news older than 7 days
✅ Successfully stored 28 new articles
⏭️  Skipped 2 duplicate articles
📊 Total active news items: 45
✨ News fetch completed successfully!
```

## Support

For issues with:
- **NewsAPI**: https://newsapi.org/support
- **Alpha Vantage**: https://www.alphavantage.co/support/
- **This integration**: Open an issue on GitHub
