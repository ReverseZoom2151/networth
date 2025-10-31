# Success Stories Generation System

This system generates real, dynamic success stories using Perplexity AI for search and multiple AI models (Claude + OpenAI GPT-5 family) for processing and anonymization.

## Overview

Instead of hardcoded success stories, this system:
- **Searches** for real financial success stories from Reddit and other credible sources using Perplexity AI
- **Processes** stories with multiple AI models (Claude Sonnet 4.5, Haiku 4.5 + OpenAI GPT-5 family) to extract structured data
- **Rotates** between models automatically for diverse perspectives and writing styles
- **Anonymizes** all personal information while keeping stories authentic
- **Validates** story quality to ensure realistic and relatable content
- **Stores** in database with automatic refresh cycles

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

### 1. Story Generation Script
**File:** `scripts/generate-success-stories.ts`

Main script that orchestrates the entire generation process:

```bash
npm run stories:generate
```

**What it does:**
1. Uses Perplexity AI to search for real success stories across goal types
2. Processes each story with Claude AI to extract structured data
3. Anonymizes personal information (names, locations, employers)
4. Validates story authenticity and realism
5. Stores validated stories in database

**Goal Types Supported:**
- `house` - Saving for first home down payment
- `travel` - Saving to travel the world
- `debt-free` - Paying off student loans or credit card debt
- `emergency` - Building emergency fund from scratch
- `retirement` - Starting early retirement investing
- `business` - Saving to start a business

### 2. Automated Refresh Script
**File:** `scripts/refresh-success-stories.ts`

Maintains story freshness and quality:

```bash
npm run stories:refresh
```

**What it does:**
- Checks story count per goal type (maintains 5-15 stories each)
- Removes stories older than 90 days
- Generates new stories when needed
- Updates featured stories automatically
- Provides detailed statistics

**Configuration:**
```typescript
{
  minStoriesPerGoal: 5,    // Minimum stories to keep
  maxStoriesPerGoal: 15,   // Maximum stories per goal
  refreshOlderThan: 90,    // Days before refresh
}
```

### 3. API Endpoint
**File:** `app/api/stories/generate/route.ts`

Manual story generation via API:

```bash
POST /api/stories/generate
Content-Type: application/json

{
  "goalType": "house",  // Optional: specific goal type
  "count": 3            // Optional: number to generate
}
```

**Example usage:**
```typescript
// Generate stories for specific goal
const response = await fetch('/api/stories/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ goalType: 'debt-free' }),
});

// Generate stories for all goals
const response = await fetch('/api/stories/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
```

## Story Processing Flow

### Step 1: Search with Perplexity AI
```typescript
// Searches for real stories from Reddit, forums, news
const rawStories = await searchSuccessStories('house');
// Returns: Array of raw story content with sources
```

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
- Uses weighted random selection (Claude 30%, GPT-5 25%, etc.)
- Can specify preferred model: `processStoryWithAI(story, goalType, 'gpt5pro')`
- Logs which model was used for each story

### Step 3: Validation
```typescript
// Validates before storing
- Age must be 18-45 (adjusted to 23-35 if outside range)
- Must have name, goal, strategies, timeline
- Financial numbers must be realistic
- No duplicate stories (checks by name + goal)
```

### Step 4: Storage
```typescript
// Stores in database with metadata
await prisma.successStory.create({
  data: {
    name: "Sarah",
    age: 28,
    occupation: "Software Engineer",
    goal: "Saved $50,000 for home down payment",
    goalType: "house",
    startingPoint: "Living paycheck to paycheck with $15K debt",
    strategy: ["Created automatic savings transfers", "Cut subscriptions", "Side hustle"],
    timeline: "24 months",
    result: "Purchased first home in Austin",
    keyLessons: ["Automate savings", "Track every expense", "Be patient"],
    quote: "The hardest part was starting. Once I saw the first $1000, I was hooked.",
    region: "US",
    isFeatured: false,
  }
});
```

## Data Structure

Each success story contains:

```typescript
interface SuccessStory {
  id: number;
  name: string;              // Anonymized first name only
  age: number;               // 22-35 range
  occupation: string;        // Realistic job title
  goal: string;              // Specific goal achieved
  goalType: string;          // Category (house, travel, etc.)
  startingPoint: string;     // Initial financial situation
  strategy: string[];        // Array of specific actions taken
  timeline: string;          // How long it took ("18 months", "2 years")
  result: string;            // What they achieved with numbers
  keyLessons: string[];      // 3 main takeaways
  quote: string;             // Inspiring quote from their perspective
  region: string;            // Geographic region (US, EU, etc.)
  isFeatured: boolean;       // Featured on homepage
  createdAt: Date;           // When story was generated
  updatedAt: Date;           // Last updated
}
```

## Usage Examples

### Generate Initial Stories
```bash
# Generate stories for all goal types (first time setup)
npm run stories:generate
```

### Scheduled Refresh
Set up a cron job for weekly refresh:

```bash
# Linux/Mac crontab
0 2 * * 1 cd /path/to/networth-mvp && npm run stories:refresh

# Or use Vercel Cron Jobs (vercel.json)
{
  "crons": [{
    "path": "/api/stories/generate",
    "schedule": "0 2 * * 1"
  }]
}
```

### Manual Generation via API
```typescript
// In your admin panel or dashboard
const generateStories = async () => {
  const response = await fetch('/api/stories/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalType: 'emergency_fund' }),
  });

  const data = await response.json();
  console.log(`Generated ${data.generated} stories`);
};
```

### Model Control and Testing

Test different AI models programmatically:

```typescript
// In your script or testing file
import { processStoryWithAI } from './scripts/generate-success-stories';

// Test with specific model
const story = await processStoryWithAI(rawStory, 'house', 'gpt5pro');

// Or use automatic rotation (default)
const story2 = await processStoryWithAI(rawStory, 'travel');
```

**Model Selection Strategy:**

```typescript
// Default weights (can be modified in generate-success-stories.ts)
const weights = {
  claude: 0.30,      // 30% - Best for privacy and nuance
  gpt5: 0.25,        // 25% - Best for narratives
  gpt5mini: 0.20,    // 20% - Fast and efficient
  gpt5pro: 0.15,     // 15% - Complex scenarios
  gpt5nano: 0.10,    // 10% - Simple cases
};
```

**Force specific model for testing:**
```bash
# Modify scripts/generate-success-stories.ts temporarily
const processed = await processStoryWithAI(rawStory, goalType, 'gpt5pro');
```

## Quality Validation

Built-in validation ensures:

### ✅ Authenticity
- Stories sourced from real Reddit posts and verified sources
- Claude validates story structure and coherence
- Rejects stories without enough detail

### ✅ Privacy
- All names anonymized
- Locations generalized
- Specific employers removed
- Personal identifiers stripped

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

## Environment Variables Required

```env
# Required for story generation
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Database (already configured)
DATABASE_URL=your_postgres_url
```

**Note:** Both AI provider keys are required. The system automatically rotates between Claude and OpenAI models for optimal results.

## Monitoring & Maintenance

### Check Story Stats
```bash
# Run refresh script to see current state
npm run stories:refresh

# Output shows:
# - Total stories in database
# - Stories per goal type
# - Featured stories count
# - Stories needing refresh
```

### Database Queries
```typescript
// Check story distribution
const stats = await prisma.successStory.groupBy({
  by: ['goalType'],
  _count: true,
});

// Find old stories
const oldStories = await prisma.successStory.findMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  }
});

// Update featured status
await prisma.successStory.update({
  where: { id: storyId },
  data: { isFeatured: true }
});
```

## Troubleshooting

### No Stories Generated
1. Check API keys are set correctly
2. Verify Perplexity API has credits
3. Check Claude API rate limits
4. Review logs for errors: `console.log` output in scripts

### Stories Seem Unrealistic
1. Review Claude prompt in `generate-success-stories.ts`
2. Adjust validation rules (age range, financial numbers)
3. Change Perplexity search queries for better sources

### Rate Limiting
- Script includes 2-3 second delays between API calls
- Adjust in code: `await new Promise(resolve => setTimeout(resolve, 2000))`
- Reduce stories per batch if needed

## Testing AI Models

Compare different AI models to see which produces the best results for your use case:

```bash
# Compare all models side-by-side
npm run test:models

# Test specific model only
npm run test:models claude
npm run test:models gpt5
npm run test:models gpt5pro
npm run test:models gpt5mini
npm run test:models gpt5nano
```

**What the test shows:**
- ✅ Processing time for each model
- ✅ Story structure and completeness
- ✅ Narrative length and style
- ✅ Financial data accuracy
- ✅ Which models succeed/fail

**Use this to:**
- Evaluate model performance before production use
- Adjust model weights based on quality
- Troubleshoot API issues with specific providers
- Compare costs vs quality tradeoffs

## Best Practices

1. **Initial Setup:** Run `npm run stories:generate` once to populate database
2. **Test Models First:** Run `npm run test:models` to verify all AI providers are working
3. **Weekly Refresh:** Schedule `npm run stories:refresh` weekly via cron
4. **Monitor Quality:** Regularly review stories in database for quality
5. **Adjust Model Weights:** Based on test results, tune weights in `generate-success-stories.ts`
6. **Featured Stories:** Manually feature best stories via database or admin panel
7. **Regional Content:** Add region-specific stories by filtering Perplexity searches

## Future Enhancements

Potential improvements:
- [ ] User voting on story helpfulness
- [ ] Story engagement tracking (views, saves)
- [ ] Multi-language support
- [ ] Integration with user goals (show relevant stories)
- [ ] Story comments and discussions
- [ ] Video testimonials (if sources found)
- [ ] Regional customization (currency, locations)

## Related Files

- `app/api/stories/route.ts` - Fetch stories endpoint
- `app/stories/page.tsx` - Stories display UI
- `prisma/schema.prisma` - Database schema
- `lib/perplexity.ts` - Perplexity AI integration (if exists)

---

**Note:** This system generates real stories from public sources. Always respect privacy and ensure compliance with content usage policies.
