import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { cache } from '@/lib/cache';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Available AI models for story processing
const AI_MODELS = {
  // Claude Models (Anthropic)
  claude: 'claude-sonnet-4-5-20250929',
  claudeHaiku: 'claude-haiku-4-5-20251001',
  claudeOpus: 'claude-opus-4-1-20250805',
  // OpenAI GPT-5 Models
  gpt5: 'gpt-5-2025-08-07',
  gpt5mini: 'gpt-5-mini-2025-08-07',
  gpt5pro: 'gpt-5-pro-2025-10-06',
  gpt5nano: 'gpt-5-nano-2025-08-07',
} as const;

type AIModel = keyof typeof AI_MODELS;

interface RawStory {
  source: string;
  content: string;
  url?: string;
}

interface ProcessedStory {
  name: string;
  age: number;
  occupation: string;
  goalTitle: string;
  goalType: string;
  startingPoint: string;
  achievement: string;
  amountSaved: number;
  timeframe: number;
  monthlyContribution: number;
  story: string;
  challenges: string[];
  strategies: string[];
  keyTakeaway: string;
  featured: boolean;
}

/**
 * Search for financial success stories using Perplexity AI
 */
async function searchSuccessStories(goalType: string): Promise<RawStory[]> {
  const searchQueries: Record<string, string> = {
    house: 'real stories of people who saved for their first home down payment reddit personalfinance',
    travel: 'real stories of people who saved money to travel the world reddit',
    debt_free: 'real stories of people who paid off student loans or credit card debt reddit personalfinance',
    emergency_fund: 'real stories of people who built emergency fund from scratch reddit personalfinance',
    retirement: 'real stories of young people who started investing for retirement early reddit',
    car: 'real stories of people who saved money to buy their first car reddit',
  };

  const query = searchQueries[goalType] || searchQueries['emergency_fund'];

  try {
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
            content: 'You are a financial success story researcher. Find real, detailed personal finance success stories from Reddit and other credible sources.',
          },
          {
            role: 'user',
            content: `Find 3-5 real, detailed financial success stories about ${query}. Include specific numbers, timelines, and strategies. Focus on realistic, relatable stories from everyday people. Include source URLs.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const stories: RawStory[] = [];
    const sections = content.split(/\n\n(?=\d+\.|Story \d+|###)/);

    for (const section of sections) {
      if (section.trim().length > 100) {
        stories.push({
          source: 'perplexity_search',
          content: section.trim(),
          url: extractUrl(section),
        });
      }
    }

    return stories;
  } catch (error) {
    console.error('Error searching with Perplexity:', error);
    return [];
  }
}

function extractUrl(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : undefined;
}

function getStoryProcessingPrompt(rawStory: RawStory, goalType: string): string {
  return `Analyze this real financial success story and convert it into a structured, anonymized format.

IMPORTANT RULES:
1. Anonymize all personal information (change names, locations, specific employers)
2. Keep financial numbers realistic and verify they make sense
3. Ensure the story is relatable to young adults (ages 22-35)
4. Extract specific, actionable strategies
5. Identify real challenges they faced
6. If the story seems fake or unrealistic, return null

Raw Story:
${rawStory.content}

Goal Type: ${goalType}

Return a JSON object with this exact structure:
{
  "name": "First name only (anonymized)",
  "age": number (22-35 range),
  "occupation": "realistic job title",
  "goalTitle": "Short title like 'Saved $15k in 18 months'",
  "goalType": "${goalType}",
  "startingPoint": "Their financial situation at the start (2-3 sentences)",
  "achievement": "What they accomplished with specific numbers (2-3 sentences)",
  "amountSaved": number (total amount saved or debt paid, no $ sign),
  "timeframe": number (total months it took),
  "monthlyContribution": number (average monthly savings/payment, no $ sign),
  "story": "Full narrative in their voice, 3-4 paragraphs telling the complete journey",
  "challenges": ["challenge 1", "challenge 2", "challenge 3"],
  "strategies": ["strategy 1", "strategy 2", "strategy 3"],
  "keyTakeaway": "One main lesson learned (1-2 sentences)",
  "featured": false
}

If the story is not credible or doesn't have enough detail, respond with just: null`;
}

async function processWithClaude(
  rawStory: RawStory,
  goalType: string,
  model: AIModel
): Promise<string> {
  const message = await anthropic.messages.create({
    model: AI_MODELS[model],
    max_tokens: 2500,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: getStoryProcessingPrompt(rawStory, goalType),
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

async function processWithOpenAI(
  rawStory: RawStory,
  goalType: string,
  model: AIModel
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: AI_MODELS[model],
    messages: [
      {
        role: 'system',
        content: 'You are a financial success story analyst. Extract structured data from real stories while protecting privacy.',
      },
      {
        role: 'user',
        content: getStoryProcessingPrompt(rawStory, goalType),
      },
    ],
    temperature: 0.3,
    max_tokens: 2500,
  });

  return completion.choices[0].message.content || '';
}

async function processStoryWithAI(
  rawStory: RawStory,
  goalType: string,
  preferredModel?: AIModel
): Promise<ProcessedStory | null> {
  try {
    const model = preferredModel || selectRandomModel();
    console.log(`Processing with ${model} model...`);

    let responseText: string;

    if (model === 'claude' || model === 'claudeHaiku' || model === 'claudeOpus') {
      responseText = await processWithClaude(rawStory, goalType, model);
    } else {
      responseText = await processWithOpenAI(rawStory, goalType, model);
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const processed = JSON.parse(jsonMatch[0]);

    if (!processed || processed === 'null' || !processed.name || !processed.age) {
      return null;
    }

    if (processed.age < 18 || processed.age > 45) {
      processed.age = Math.floor(Math.random() * 13) + 23;
    }

    if (!processed.amountSaved || processed.amountSaved < 0) {
      processed.amountSaved = 5000;
    }
    if (!processed.timeframe || processed.timeframe < 1) {
      processed.timeframe = 12;
    }
    if (!processed.monthlyContribution || processed.monthlyContribution < 0) {
      processed.monthlyContribution = Math.floor(processed.amountSaved / processed.timeframe);
    }

    return processed;
  } catch (error) {
    console.error('Error processing with AI:', error);
    return null;
  }
}

function selectRandomModel(): AIModel {
  const models: AIModel[] = [
    'claude',
    'claudeHaiku',
    'gpt5',
    'gpt5mini',
    'gpt5pro',
    'gpt5nano',
  ];

  const weights = [
    0.25,  // Claude Sonnet
    0.15,  // Claude Haiku
    0.20,  // GPT-5
    0.15,  // GPT-5 Mini
    0.15,  // GPT-5 Pro
    0.10,  // GPT-5 Nano
  ];

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < models.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return models[i];
    }
  }

  return 'claude';
}

/**
 * Generate stories for a goal type in real-time
 * No database storage - uses in-memory cache only
 */
async function generateStoriesRealtime(goalType: string): Promise<ProcessedStory[]> {
  console.log(`Generating real-time stories for: ${goalType}`);

  const rawStories = await searchSuccessStories(goalType);
  console.log(`Found ${rawStories.length} raw stories`);

  const processedStories: ProcessedStory[] = [];

  for (const rawStory of rawStories) {
    const processed = await processStoryWithAI(rawStory, goalType);

    if (processed) {
      processedStories.push(processed);
    }

    // Rate limiting between AI calls
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Generated ${processedStories.length} stories`);
  return processedStories;
}

/**
 * API endpoint for real-time story generation
 * GET /api/stories/realtime?goalType=house
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalType = searchParams.get('goalType') || 'all';

    // Check cache first
    const cacheKey = `stories_realtime_${goalType}`;
    const cachedStories = cache.get<ProcessedStory[]>(cacheKey);

    if (cachedStories) {
      console.log(`Returning cached stories for ${goalType}`);
      return NextResponse.json({
        stories: cachedStories,
        cached: true,
        goalType,
      });
    }

    // Generate stories in real-time
    let allStories: ProcessedStory[] = [];

    if (goalType === 'all') {
      // Generate stories for all goal types
      const goalTypes = ['house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car'];

      for (const type of goalTypes) {
        const stories = await generateStoriesRealtime(type);
        allStories = allStories.concat(stories);
      }
    } else {
      // Generate for specific goal type
      allStories = await generateStoriesRealtime(goalType);
    }

    // Cache for 5 minutes (300 seconds)
    cache.set(cacheKey, allStories, 300);

    return NextResponse.json({
      stories: allStories,
      cached: false,
      goalType,
      count: allStories.length,
    });
  } catch (error) {
    console.error('Error generating stories:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate stories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
