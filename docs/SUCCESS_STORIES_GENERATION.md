# Success Stories Generation System

This system generates real, dynamic success stories **in real-time** using Perplexity AI for search and multiple AI models (Claude + OpenAI GPT-5 family) for processing and anonymization.

## Overview

This system generates fresh success stories on-demand:
- **Real-time Generation**: Stories are generated when users visit the /stories page
- **Web Search**: Uses Perplexity AI to find real financial success stories from Reddit and credible sources
- **Multi-Model Processing**: Rotates between 7 AI models (Claude + OpenAI GPT-5 family) for diverse perspectives
- **Smart Caching**: In-memory cache (5 minutes) prevents repeated expensive API calls
- **No Database Storage**: Stories are never stored in the database - always fresh from the web
- **Anonymization**: All personal information is anonymized while keeping stories authentic

### AI Models Used

The system rotates between 7 different AI models to generate diverse, authentic stories:

**Claude Models (Anthropic)** - Consistent with codebase:
1. **Claude Sonnet 4.5** (25% weight) - `claude-sonnet-4-5-20250929` - Best quality/cost balance
2. **Claude Haiku 4.5** (15% weight) - `claude-haiku-4-5-20251001` - Fastest, cheapest for high-volume
3. **Claude Opus 4.1** (Available) - `claude-opus-4-1-20250805` - Premium quality (not in default rotation)

**OpenAI GPT-5 Models:**
4. **GPT-5** (20% weight) - Strong at narrative generation and structure
5. **GPT-5 Mini** (15% weight) - Fast and efficient for straightforward stories
6. **GPT-5 Pro** (15% weight) - Advanced reasoning for complex financial scenarios
7. **GPT-5 Nano** (10% weight) - Lightweight model for simple cases

**Model Pricing (as of Jan 2025):**
- Claude Sonnet 4.5: $3/MTok input, $15/MTok output
- Claude Haiku 4.5: $1/MTok input, $5/MTok output (3x cheaper than Sonnet)
- Claude Opus 4.1: $15/MTok input, $75/MTok output (5x more expensive than Sonnet)

This multi-model approach ensures:
- ✅ Diverse writing styles (stories don't all sound the same)
- ✅ Different perspectives on financial success
- ✅ Cost optimization (using smaller models when appropriate)
- ✅ Redundancy (if one model fails, others continue working)
- ✅ Consistency with codebase (same Claude versions as [lib/ai.ts](../lib/ai.ts))

## Architecture

### Real-Time Generation Flow

```
User visits /stories page
    ↓
Check in-memory cache (5 min TTL)
    ↓
Cache hit? → Return cached stories
    ↓
Cache miss? → Generate stories in real-time
    ↓
1. Perplexity AI searches Reddit/web for real stories
2. AI models (Claude/OpenAI) process and anonymize
3. Validate story quality and authenticity
4. Return stories to user
5. Cache for 5 minutes
```

### Key Components

#### 1. Real-Time API Endpoint
**File:** [app/api/stories/realtime/route.ts](../app/api/stories/realtime/route.ts)

Generates stories on-demand without database storage:

```bash
GET /api/stories/realtime?goalType=house
```

**Query Parameters:**
- `goalType`: Specific goal type or `all` for all types
  - Options: `house`, `travel`, `debt_free`, `emergency_fund`, `retirement`, `car`, `all`

**Response:**
```json
{
  "stories": [...],
  "cached": false,
  "goalType": "house",
  "count": 3
}
```

**Features:**
- ✅ Real-time generation using Perplexity + AI models
- ✅ In-memory caching (5 minutes)
- ✅ No database storage
- ✅ Automatic model rotation for diversity
- ✅ Rate limiting between API calls

#### 2. In-Memory Cache
**File:** [lib/cache.ts](../lib/cache.ts)

Simple in-memory cache to avoid repeated expensive AI API calls:

```typescript
import { cache } from '@/lib/cache';

// Get cached stories
const stories = cache.get<ProcessedStory[]>('stories_realtime_house');

// Set with 5-minute TTL
cache.set('stories_realtime_house', stories, 300);
```

**Features:**
- ✅ Automatic expiration (default 5 minutes)
- ✅ Automatic cleanup of expired entries
- ✅ Singleton pattern for consistency
- ✅ Type-safe with generics

**Cache Keys:**
- `stories_realtime_all` - All goal types
- `stories_realtime_house` - House/apartment stories
- `stories_realtime_travel` - Travel stories
- etc.

#### 3. Stories Display Page
**File:** [app/stories/page.tsx](../app/stories/page.tsx)

Client-side page that fetches stories from real-time API:

```typescript
// Fetches from real-time generation API
const response = await fetch(`/api/stories/realtime?goalType=${goalType}`);
const data = await response.json();
setStories(data.stories);
```

**User Experience:**
- Shows loading message: "Generating real success stories from the web... This may take 10-15 seconds."
- First load: 10-15 seconds (real-time generation)
- Subsequent loads within 5 minutes: Instant (cached)
- After cache expires: Fresh stories generated

#### 4. Testing Script (Optional)
**File:** [scripts/generate-success-stories.ts](../scripts/generate-success-stories.ts)

Test story generation locally without API:

```bash
npm run stories:generate
```

**Note:** This script is for testing ONLY. Stories are NOT saved to database. Use the real-time API endpoint in production.

## Story Processing Flow

### Step 1: Search with Perplexity AI
```typescript
// Searches for real stories from Reddit, forums, news
const rawStories = await searchSuccessStories('house');
// Returns: Array of raw story content with sources
```

**Search Queries by Goal Type:**
- `house`: "real stories of people who saved for their first home down payment reddit personalfinance"
- `travel`: "real stories of people who saved money to travel the world reddit"
- `debt_free`: "real stories of people who paid off student loans or credit card debt reddit personalfinance"
- `emergency_fund`: "real stories of people who built emergency fund from scratch reddit personalfinance"
- `retirement`: "real stories of young people who started investing for retirement early reddit"
- `car`: "real stories of people who saved money to buy their first car reddit"

### Step 2: Process with AI (Claude or OpenAI)
```typescript
// AI extracts structured data and anonymizes (rotates between models)
const processed = await processStoryWithAI(rawStory, 'house');
// Automatically selects: claude, gpt5, gpt5mini, gpt5pro, or gpt5nano
```

**AI Model Tasks:**
- ✅ Extract key information (name, age, occupation, timeline, strategy)
- ✅ Anonymize all personal identifiers
- ✅ Validate financial numbers are realistic
- ✅ Ensure story is relatable to target demographic (ages 22-35)
- ✅ Extract actionable strategies and challenges faced
- ✅ Generate full narrative in authentic voice
- ❌ Reject stories that seem fake or lack detail

**Model Selection:**
- Uses weighted random selection (Claude 25%, GPT-5 20%, etc.)
- Logs which model was used for each story
- Provides diversity in writing styles

### Step 3: Validation
```typescript
// Validates before returning
- Age must be 18-45 (adjusted to 23-35 if outside range)
- Must have name, goal, strategies, timeline
- Financial numbers must be realistic
- Challenges and strategies must be actionable
```

### Step 4: Return & Cache
```typescript
// Return to user and cache for 5 minutes
cache.set(cacheKey, processedStories, 300);
return NextResponse.json({ stories: processedStories });
```

## Data Structure

Each success story contains:

```typescript
interface ProcessedStory {
  name: string;              // Anonymized first name only
  age: number;               // 22-35 range
  occupation: string;        // Realistic job title
  goalTitle: string;         // Short title like "Saved $15k in 18 months"
  goalType: string;          // Category (house, travel, etc.)
  startingPoint: string;     // Initial financial situation (2-3 sentences)
  achievement: string;       // What they accomplished with numbers (2-3 sentences)
  amountSaved: number;       // Total amount saved/debt paid (no $ sign)
  timeframe: number;         // Total months it took
  monthlyContribution: number; // Average monthly savings/payment (no $ sign)
  story: string;             // Full narrative in their voice (3-4 paragraphs)
  challenges: string[];      // Array of challenges faced (3 items)
  strategies: string[];      // Array of strategies used (3 items)
  keyTakeaway: string;       // One main lesson learned (1-2 sentences)
  featured: boolean;         // Whether to feature prominently
}
```

## Usage

### User Experience

When users visit the `/stories` page:

1. **First Visit (or after cache expires):**
   - Loading screen: "Generating real success stories from the web... This may take 10-15 seconds."
   - System searches Perplexity AI for real Reddit stories
   - AI processes and anonymizes 3-5 stories
   - Stories displayed to user
   - Cached for 5 minutes

2. **Within 5 Minutes:**
   - Instant load from cache
   - Same stories as previous visitor

3. **After 5 Minutes:**
   - Cache expired - fresh generation
   - New stories from the web
   - Ensures content stays fresh

### API Usage

Fetch stories programmatically:

```typescript
// Get stories for specific goal type
const response = await fetch('/api/stories/realtime?goalType=house');
const data = await response.json();

console.log(data);
// {
//   stories: [...],      // Array of ProcessedStory
//   cached: false,       // Whether from cache
//   goalType: 'house',   // Goal type requested
//   count: 3             // Number of stories
// }
```

```typescript
// Get stories for all goal types
const response = await fetch('/api/stories/realtime?goalType=all');
const data = await response.json();
// Returns stories from all 6 goal types (15-30 stories total)
```

### Testing Locally

Test story generation without using the API:

```bash
# Test generation for all goal types
npm run stories:generate

# This script:
# - Searches Perplexity for real stories
# - Processes with AI models
# - Displays results in console
# - Does NOT save to database
```

### Model Testing

Compare different AI models side-by-side:

```bash
# Test all models
npm run test:models

# Shows:
# - Processing time for each model
# - Story quality and structure
# - Which models succeed/fail
# - Comparative analysis
```

## Configuration

### Cache TTL

Adjust cache duration in [app/api/stories/realtime/route.ts](../app/api/stories/realtime/route.ts):

```typescript
// Current: 5 minutes (300 seconds)
cache.set(cacheKey, allStories, 300);

// Increase for longer cache (reduce costs):
cache.set(cacheKey, allStories, 600); // 10 minutes

// Decrease for fresher content (increase costs):
cache.set(cacheKey, allStories, 180); // 3 minutes
```

### Model Weights

Adjust model selection weights in [app/api/stories/realtime/route.ts](../app/api/stories/realtime/route.ts):

```typescript
const weights = [
  0.25,  // Claude Sonnet (25%) - Increase for better quality
  0.15,  // Claude Haiku (15%) - Increase for lower costs
  0.20,  // GPT-5 (20%)
  0.15,  // GPT-5 Mini (15%)
  0.15,  // GPT-5 Pro (15%)
  0.10,  // GPT-5 Nano (10%)
];
```

### Rate Limiting

Adjust delay between API calls:

```typescript
// Current: 1 second between stories
await new Promise(resolve => setTimeout(resolve, 1000));

// Increase if hitting rate limits:
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

## Environment Variables

Required API keys:

```env
# AI Models
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# Web Search
PERPLEXITY_API_KEY=your_perplexity_api_key
```

**Note:** All three API keys are required. The system uses:
- **Perplexity** for searching real stories from Reddit/web
- **Claude** (Anthropic) for AI processing and anonymization
- **OpenAI GPT-5** for AI processing with different perspectives

## Quality Assurance

### ✅ Authenticity
- Stories sourced from real Reddit posts and verified sources
- AI validates story structure and coherence
- Rejects stories without enough detail
- Sources real financial numbers and timelines

### ✅ Privacy
- All names anonymized
- Locations generalized
- Specific employers removed
- Personal identifiers stripped
- No PII in final stories

### ✅ Realism
- Financial numbers verified for accuracy
- Timeline matches achievement level
- Age appropriate for career stage
- Strategies are actionable and specific

### ✅ Relatability
- Target demographic: Ages 22-35
- Everyday occupations (not celebrities)
- Realistic starting points (debt, low income)
- Achievable goals

## Cost Optimization

### Cache Duration Impact

**5-minute cache (current):**
- ✅ Fresh content every 5 minutes
- ✅ Good balance of cost vs freshness
- 💰 Moderate API costs

**10-minute cache:**
- ✅ Lower API costs (50% reduction)
- ⚠️ Less fresh content
- Best for: High traffic sites

**3-minute cache:**
- ✅ Very fresh content
- ⚠️ Higher API costs (67% increase)
- Best for: Demo/testing

### Model Selection Impact

**High Quality (higher cost):**
```typescript
const weights = [
  0.40,  // Claude Sonnet (40%)
  0.10,  // Claude Haiku (10%)
  0.25,  // GPT-5 (25%)
  0.05,  // GPT-5 Mini (5%)
  0.20,  // GPT-5 Pro (20%)
  0.00,  // GPT-5 Nano (0%)
];
```

**Cost Optimized (lower cost):**
```typescript
const weights = [
  0.15,  // Claude Sonnet (15%)
  0.35,  // Claude Haiku (35%) - cheapest
  0.15,  // GPT-5 (15%)
  0.30,  // GPT-5 Mini (30%) - fast & cheap
  0.05,  // GPT-5 Pro (5%)
  0.00,  // GPT-5 Nano (0%)
];
```

## Troubleshooting

### Stories Taking Too Long to Generate

**Problem:** Page loads slowly (>20 seconds)

**Solutions:**
1. Increase cache duration to reduce generation frequency
2. Pre-warm cache by visiting page during deployment
3. Reduce number of stories generated per request
4. Use faster models (Claude Haiku, GPT-5 Mini)

### Stories Seem Repetitive

**Problem:** Stories sound too similar

**Solutions:**
1. Increase temperature in AI model calls (currently 0.3)
2. Adjust model weights to use more variety
3. Reduce cache duration for fresher content
4. Change Perplexity search queries for different sources

### API Rate Limits Hit

**Problem:** Perplexity or AI APIs return rate limit errors

**Solutions:**
1. Increase delay between API calls (currently 1 second)
2. Reduce number of stories generated per request
3. Increase cache duration to reduce API calls
4. Upgrade API plan for higher rate limits

### Cache Not Working

**Problem:** Stories regenerate on every request

**Solutions:**
1. Check if multiple server instances (cache is per-instance)
2. Consider using Redis for shared cache across instances
3. Verify cache TTL is set correctly (300 seconds = 5 minutes)
4. Check server logs for cache hit/miss information

## Best Practices

1. **Cache Duration**: Start with 5 minutes, adjust based on traffic and costs
2. **Model Testing**: Use `npm run test:models` to evaluate quality before adjusting weights
3. **Monitoring**: Log cache hit/miss rates to optimize TTL
4. **Error Handling**: System gracefully handles API failures by returning cached stories or empty array
5. **Cost Management**: Monitor AI API usage and adjust cache/model settings accordingly

## Performance Characteristics

**First Load (Cache Miss):**
- Perplexity search: 3-5 seconds
- AI processing (3-5 stories): 5-10 seconds
- **Total: 10-15 seconds**

**Subsequent Loads (Cache Hit):**
- **Total: <100ms** (instant)

**API Costs per Generation:**
- Perplexity: ~$0.01-0.02 per search
- AI processing: ~$0.05-0.15 per story (varies by model)
- **Total: ~$0.20-0.50 per full generation**

**With 5-minute cache:**
- High traffic (100 users/hour): ~$1.20/hour
- Medium traffic (50 users/hour): ~$0.60/hour
- Low traffic (20 users/hour): ~$0.30/hour

## Comparison with Database Approach

### ❌ Old Approach (Database Storage)
- ✅ Fast page loads (instant)
- ❌ Stale content (stories outdated)
- ❌ Requires database maintenance
- ❌ Needs scheduled refresh jobs
- ❌ Complex deployment (cron jobs)

### ✅ New Approach (Real-Time Generation)
- ✅ Always fresh content (from live web sources)
- ✅ No database maintenance needed
- ✅ No scheduled jobs required
- ✅ Simple deployment (just API endpoint)
- ✅ Diverse stories (different each time)
- ⚠️ Slower first load (10-15 seconds)
- ⚠️ Higher API costs (but controlled by cache)

## Future Enhancements

Potential improvements:
- [ ] Redis cache for shared caching across multiple servers
- [ ] Background pre-warming of cache on deployment
- [ ] User-specific story recommendations based on their goals
- [ ] Story rating/feedback system
- [ ] Regional customization (currency, locations)
- [ ] Multi-language support
- [ ] A/B testing different AI models
- [ ] Analytics on story engagement

## Related Files

- [app/api/stories/realtime/route.ts](../app/api/stories/realtime/route.ts) - Real-time generation API
- [app/stories/page.tsx](../app/stories/page.tsx) - Stories display page
- [lib/cache.ts](../lib/cache.ts) - In-memory cache utility
- [scripts/generate-success-stories.ts](../scripts/generate-success-stories.ts) - Testing script
- [scripts/test-ai-models.ts](../scripts/test-ai-models.ts) - Model comparison tool

---

**Note:** This system generates real stories from public sources in real-time. Always respect privacy, ensure compliance with content usage policies, and monitor API costs carefully.
