import { NextRequest } from 'next/server';
import { WebSocket } from 'ws';

/**
 * Voice Agent API Route
 *
 * This route establishes a WebSocket connection to OpenAI's Realtime API
 * for real-time voice conversations with the financial coach agent.
 *
 * Flow:
 * 1. Client connects via WebSocket
 * 2. Server proxies connection to OpenAI Realtime API
 * 3. Audio streams bidirectionally (client <-> OpenAI)
 * 4. Function calls are intercepted and executed server-side
 * 5. Results are sent back to the conversation
 */

// AI Models - consistent with codebase
// Note: Realtime API uses GPT-4o Realtime model (voice-specific)
const AI_MODELS = {
  realtime: 'gpt-4o-realtime-preview-2024-10-01', // Voice/Realtime API model
  // Standard GPT-5 models for reference (consistent with codebase)
  main: 'gpt-5-2025-08-07',
  mini: 'gpt-5-mini-2025-08-07',
  pro: 'gpt-5-pro-2025-10-06',
  nano: 'gpt-5-nano-2025-08-07',
} as const;

// WebSocket upgrade handler for Next.js
export async function GET(request: NextRequest) {
  const upgradeHeader = request.headers.get('upgrade');

  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const goalType = searchParams.get('goalType');
  const region = searchParams.get('region') || 'US';

  // Validate OpenAI API key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  try {
    // Note: Next.js API routes don't natively support WebSocket upgrades
    // We'll return connection instructions instead
    return new Response(
      JSON.stringify({
        message: 'Voice agent ready',
        instructions: 'Connect via WebSocket to wss://api.openai.com/v1/realtime',
        model: AI_MODELS.realtime,
        userId,
        goalType,
        region,
        note: 'For production, consider using a dedicated WebSocket server or serverless function that supports WebSocket upgrades'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Voice Agent] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize voice agent' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Voice Agent Configuration
 *
 * These settings are used by the client to configure the voice agent
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, userId, goalType, region } = body;

  if (action === 'get-config') {
    // Return voice agent configuration
    const config = {
      model: AI_MODELS.realtime,
      modalities: ['text', 'audio'],
      voice: 'alloy', // Options: alloy, echo, shimmer
      instructions: buildVoiceAgentInstructions(goalType, region),
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      tools: getVoiceAgentTools(),
      temperature: 0.8,
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ error: 'Invalid action' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Build system instructions for voice agent
 */
function buildVoiceAgentInstructions(goalType?: string | null, region?: string | null): string {
  return `You are an expert financial coach conducting a voice conversation. Your role is to:

1. **Be Conversational & Natural**
   - Speak in a warm, friendly tone as if having a real conversation
   - Use contractions (I'll, you're, we'll) to sound natural
   - Acknowledge what the user says before responding
   - Use verbal cues like "I see", "That makes sense", "Good question"

2. **Keep Responses Concise**
   - Voice conversations require shorter, more digestible responses
   - Break complex topics into smaller chunks
   - Ask if they want more details rather than overwhelming them
   - Speak at a comfortable pace

3. **Ask Clarifying Questions**
   - When important details are missing, ask specific questions
   - Make it easy for users to provide information verbally
   - Confirm understanding by summarizing back what you heard

4. **Use Financial Tools When Needed**
   - When users ask "how much" questions, use the calculation tools
   - Explain the results in simple, relatable terms
   - Round numbers for easier verbal comprehension ($1,350 vs $1,347.83)

5. **Provide Context-Aware Advice**
   ${goalType ? `- Focus on ${goalType} savings strategies` : '- Tailor advice to their financial goals'}
   ${region ? `- Reference ${region}-specific financial products and regulations` : '- Consider regional differences when relevant'}

6. **Handle Interruptions Gracefully**
   - If interrupted, acknowledge and adjust your response
   - Don't repeat information unnecessarily
   - Follow the user's lead in the conversation

7. **Be Encouraging & Supportive**
   - Celebrate progress and good decisions
   - Frame challenges as opportunities
   - Provide realistic, achievable next steps

8. **Important Guidelines**
   - This is educational advice, not professional financial planning
   - For complex situations, recommend consulting a professional
   - Be honest about uncertainty
   - Emphasize that past performance doesn't guarantee future results

Remember: You're speaking out loud, so keep it natural, concise, and conversational!`;
}

/**
 * Get voice agent tool definitions
 */
function getVoiceAgentTools() {
  return [
    {
      type: 'function',
      name: 'calculate_monthly_savings',
      description: 'Calculate how much to save monthly to reach a financial goal',
      parameters: {
        type: 'object',
        properties: {
          target_amount: {
            type: 'number',
            description: 'The goal amount in dollars',
          },
          years: {
            type: 'number',
            description: 'Number of years to reach the goal',
          },
          current_savings: {
            type: 'number',
            description: 'Current amount saved (default: 0)',
          },
          annual_return: {
            type: 'number',
            description: 'Expected annual return rate as percentage (e.g., 5 for 5%)',
          },
        },
        required: ['target_amount', 'years'],
      },
    },
    {
      type: 'function',
      name: 'calculate_future_value',
      description: 'Calculate how much savings will grow over time',
      parameters: {
        type: 'object',
        properties: {
          current_savings: {
            type: 'number',
            description: 'Current amount saved',
          },
          monthly_contribution: {
            type: 'number',
            description: 'Amount added each month',
          },
          years: {
            type: 'number',
            description: 'Number of years to calculate',
          },
          annual_return: {
            type: 'number',
            description: 'Expected annual return rate as percentage',
          },
        },
        required: ['current_savings', 'monthly_contribution', 'years'],
      },
    },
    {
      type: 'function',
      name: 'get_user_context',
      description: 'Fetch the user\'s saved financial goals and context',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'User ID',
          },
        },
        required: ['user_id'],
      },
    },
  ];
}
