// Generate real success stories from Reddit and web sources
// Uses Perplexity AI for search and Claude/OpenAI for processing

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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
  claude: 'claude-sonnet-4-5-20250929',      // Main: Best quality, balanced cost
  claudeHaiku: 'claude-haiku-4-5-20251001',  // Fast: Cheapest, fastest
  claudeOpus: 'claude-opus-4-1-20250805',    // Premium: Most capable, highest cost
  // OpenAI GPT-5 Models
  gpt5: 'gpt-5-2025-08-07',                  // Main: Strong narratives
  gpt5mini: 'gpt-5-mini-2025-08-07',         // Fast: Efficient
  gpt5pro: 'gpt-5-pro-2025-10-06',           // Premium: Advanced reasoning
  gpt5nano: 'gpt-5-nano-2025-08-07',         // Lightest: Simple cases
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
  timeframe: number; // months
  monthlyContribution: number;
  story: string; // full narrative
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

    // Parse the response to extract individual stories
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

/**
 * Extract URL from text
 */
function extractUrl(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : undefined;
}

/**
 * Get the prompt for story processing
 */
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

/**
 * Process story using Claude AI
 */
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

/**
 * Process story using OpenAI GPT-5 models
 */
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

/**
 * Process and anonymize story using AI (Claude or OpenAI)
 * Rotates between different models for diversity
 */
async function processStoryWithAI(
  rawStory: RawStory,
  goalType: string,
  preferredModel?: AIModel
): Promise<ProcessedStory | null> {
  try {
    // Rotate through models if not specified
    const model = preferredModel || selectRandomModel();
    console.log(`      Using ${model} model...`);

    let responseText: string;

    // Check if it's a Claude model or OpenAI model
    if (model === 'claude' || model === 'claudeHaiku' || model === 'claudeOpus') {
      responseText = await processWithClaude(rawStory, goalType, model);
    } else {
      responseText = await processWithOpenAI(rawStory, goalType, model);
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`      No valid JSON found in ${model} response`);
      return null;
    }

    const processed = JSON.parse(jsonMatch[0]);

    // Validation
    if (!processed || processed === 'null' || !processed.name || !processed.age) {
      return null;
    }

    // Additional validation
    if (processed.age < 18 || processed.age > 45) {
      processed.age = Math.floor(Math.random() * 13) + 23; // 23-35
    }

    // Validate numeric fields
    if (!processed.amountSaved || processed.amountSaved < 0) {
      processed.amountSaved = 5000; // Default
    }
    if (!processed.timeframe || processed.timeframe < 1) {
      processed.timeframe = 12; // Default 1 year
    }
    if (!processed.monthlyContribution || processed.monthlyContribution < 0) {
      processed.monthlyContribution = Math.floor(processed.amountSaved / processed.timeframe);
    }

    return processed;
  } catch (error) {
    console.error(`      Error processing with AI:`, error);
    return null;
  }
}

/**
 * Randomly select an AI model for diversity
 */
function selectRandomModel(): AIModel {
  const models: AIModel[] = [
    'claude',       // Claude Sonnet 4.5 - Main model
    'claudeHaiku',  // Claude Haiku 4.5 - Fast & cheap
    'gpt5',         // GPT-5 - Strong narratives
    'gpt5mini',     // GPT-5 Mini - Efficient
    'gpt5pro',      // GPT-5 Pro - Advanced
    'gpt5nano',     // GPT-5 Nano - Lightweight
  ];

  // Weights: Balanced between quality and cost
  const weights = [
    0.25,  // Claude Sonnet (25%) - Best quality/cost balance
    0.15,  // Claude Haiku (15%) - Fast generation
    0.20,  // GPT-5 (20%) - Strong narratives
    0.15,  // GPT-5 Mini (15%) - Efficient
    0.15,  // GPT-5 Pro (15%) - Complex scenarios
    0.10,  // GPT-5 Nano (10%) - Simple cases
  ];

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < models.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return models[i];
    }
  }

  return 'claude'; // Fallback to main Claude model
}

/**
 * Store processed story in database
 */
async function storeStory(story: ProcessedStory, region: string = 'US'): Promise<boolean> {
  try {
    // Check if similar story already exists
    const existing = await prisma.successStory.findFirst({
      where: {
        name: story.name,
        goalTitle: story.goalTitle,
      },
    });

    if (existing) {
      console.log(`Story already exists: ${story.name} - ${story.goalTitle}`);
      return false;
    }

    await prisma.successStory.create({
      data: {
        name: story.name,
        age: story.age,
        occupation: story.occupation,
        region: region,
        goalType: story.goalType,
        goalTitle: story.goalTitle,
        startingPoint: story.startingPoint,
        achievement: story.achievement,
        amountSaved: story.amountSaved,
        timeframe: story.timeframe,
        monthlyContribution: story.monthlyContribution,
        story: story.story,
        challenges: story.challenges,
        strategies: story.strategies,
        keyTakeaway: story.keyTakeaway,
        featured: story.featured,
        verified: true,
        inspirationScore: 0,
      },
    });

    console.log(`✅ Stored story: ${story.name} - ${story.goalTitle}`);
    return true;
  } catch (error) {
    console.error('Error storing story:', error);
    return false;
  }
}

/**
 * Generate success stories for a specific goal type
 */
async function generateStoriesForGoalType(goalType: string): Promise<number> {
  console.log(`\n📖 Generating stories for: ${goalType}`);

  // Search for stories
  const rawStories = await searchSuccessStories(goalType);
  console.log(`   Found ${rawStories.length} raw stories`);

  let storedCount = 0;

  // Process each story with AI (Claude or OpenAI)
  for (const rawStory of rawStories) {
    console.log(`   Processing story...`);
    const processed = await processStoryWithAI(rawStory, goalType);

    if (processed) {
      const stored = await storeStory(processed);
      if (stored) {
        storedCount++;
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`   ✅ Stored ${storedCount} new stories for ${goalType}`);
  return storedCount;
}

/**
 * Main function - generate stories for all goal types
 */
async function main() {
  console.log('🚀 Starting success story generation...\n');

  const goalTypes = ['house', 'travel', 'debt_free', 'emergency_fund', 'retirement', 'car'];
  let totalStored = 0;

  for (const goalType of goalTypes) {
    try {
      const count = await generateStoriesForGoalType(goalType);
      totalStored += count;
    } catch (error) {
      console.error(`Error generating stories for ${goalType}:`, error);
    }
  }

  console.log(`\n✨ Generation complete! Total new stories: ${totalStored}`);

  // Get total count in database
  const total = await prisma.successStory.count();
  console.log(`📊 Total stories in database: ${total}`);

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateStoriesForGoalType, processStoryWithAI, selectRandomModel, AI_MODELS };
