# Voice Agent - Real-Time Financial Coaching

This document describes the Voice Agent feature that enables real-time speech-to-speech conversations with your AI financial coach.

## Overview

The Voice Agent uses OpenAI's Realtime API to provide natural, conversational financial coaching via voice. Users can speak their questions and receive spoken responses in real-time, with full access to financial calculations and personalized data.

### Key Features

- **Real-Time Speech-to-Speech** - Natural voice conversations with minimal latency
- **Automatic Transcription** - Conversations are transcribed for reference
- **Function Calling** - Agent can perform calculations and fetch user data during conversation
- **Turn Detection** - Automatic detection of when user starts/stops speaking
- **Mobile Support** - Full Capacitor integration for iOS and Android
- **Secure & Private** - All audio is processed securely via OpenAI's API

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  components/ai/VoiceAgent.tsx                                   │
│  ┌──────────────────────────────────────────────┐               │
│  │ 1. Request microphone permission              │               │
│  │ 2. Capture audio from microphone              │               │
│  │ 3. Convert to PCM16 format                    │               │
│  │ 4. Send via WebSocket to OpenAI               │               │
│  │ 5. Receive audio chunks from OpenAI           │               │
│  │ 6. Play back through speakers                 │               │
│  └──────────────────────────────────────────────┘               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ WebSocket Connection
                         │ (wss://api.openai.com/v1/realtime)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OPENAI REALTIME API                            │
│  ┌──────────────────────────────────────────────┐               │
│  │ • Speech-to-Text (Whisper)                   │               │
│  │ • GPT-4o Realtime Model                      │               │
│  │ • Text-to-Speech (Alloy voice)               │               │
│  │ • Function Calling                           │               │
│  │ • Turn Detection                             │               │
│  └──────────────────────────────────────────────┘               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Function Calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND FUNCTIONS                               │
│  app/api/ai/voice/route.ts                                      │
│  ┌──────────────────────────────────────────────┐               │
│  │ • calculate_monthly_savings()                │               │
│  │ • calculate_future_value()                   │               │
│  │ • get_user_context()                         │               │
│  └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Voice Agent Component ([components/ai/VoiceAgent.tsx](../components/ai/VoiceAgent.tsx))

The main React component that handles the voice interface.

**Key Functions:**

- `requestMicrophonePermission()` - Requests browser/device microphone access
- `connect()` - Establishes WebSocket connection to OpenAI Realtime API
- `disconnect()` - Closes connection and cleans up resources
- `startAudioStreaming()` - Begins capturing and streaming microphone audio
- `handleRealtimeEvent()` - Processes events from OpenAI (transcripts, audio, function calls)
- `handleFunctionCall()` - Executes financial calculations and returns results
- `playAudioQueue()` - Plays back AI's spoken responses

**State Management:**

```typescript
connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
conversationState: 'idle' | 'listening' | 'thinking' | 'speaking'
transcript: string  // Full conversation transcript
error: string | null
```

**Props:**

```typescript
interface VoiceAgentProps {
  userId?: string;       // User ID for personalization
  goalType?: string;     // Financial goal type (house, car, etc.)
  region?: string;       // Region for regional advice (US, CA, UK, AU)
  onClose?: () => void;  // Callback when user closes voice mode
}
```

---

### 2. Voice Agent API Route ([app/api/ai/voice/route.ts](../app/api/ai/voice/route.ts))

Backend API that provides voice agent configuration and connection instructions.

**Endpoints:**

#### `GET /api/ai/voice`
Returns connection instructions for WebSocket upgrade.

**Query Parameters:**
- `userId` - User ID
- `goalType` - Financial goal type
- `region` - User's region

**Response:**
```json
{
  "message": "Voice agent ready",
  "instructions": "Connect via WebSocket to wss://api.openai.com/v1/realtime",
  "model": "gpt-4o-realtime-preview-2024-10-01",
  "userId": "user_123",
  "goalType": "house",
  "region": "US"
}
```

#### `POST /api/ai/voice`
Returns voice agent configuration for session setup.

**Request Body:**
```json
{
  "action": "get-config",
  "userId": "user_123",
  "goalType": "house",
  "region": "US"
}
```

**Response:**
```json
{
  "model": "gpt-4o-realtime-preview-2024-10-01",
  "modalities": ["text", "audio"],
  "voice": "alloy",
  "instructions": "You are an expert financial coach...",
  "input_audio_transcription": {
    "model": "whisper-1"
  },
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  },
  "tools": [...],
  "temperature": 0.8
}
```

---

### 3. AI Assistant Page Integration ([app/ai/page.tsx](../app/ai/page.tsx))

The voice agent is integrated into the main AI Assistant page with a toggle button.

**Voice Mode Toggle:**

```tsx
<button
  onClick={() => setVoiceMode(!voiceMode)}
  className={voiceMode ? 'bg-green-600' : 'bg-gray-100'}
>
  {voiceMode ? '🎤 Voice Mode' : '⌨️ Text Mode'}
</button>
```

**Conditional Rendering:**

```tsx
{voiceMode ? (
  <VoiceAgent
    userId={userId}
    goalType={goal?.type}
    region={goal?.region}
    onClose={() => setVoiceMode(false)}
  />
) : (
  /* Text chat interface */
)}
```

---

## Audio Processing

### Input Audio (User → AI)

1. **Capture** - `navigator.mediaDevices.getUserMedia({ audio: true })`
2. **Process** - `AudioContext` with `ScriptProcessor` (4096 sample buffer)
3. **Convert** - Float32Array → Int16Array (PCM16 format)
4. **Encode** - Base64 encoding for WebSocket transmission
5. **Send** - `input_audio_buffer.append` event to OpenAI

```typescript
// Audio processing pipeline
const audioContext = new AudioContext({ sampleRate: 24000 });
const source = audioContext.createMediaStreamSource(mediaStream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0);
  const pcm16 = convertToPCM16(inputData);
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

  ws.send(JSON.stringify({
    type: 'input_audio_buffer.append',
    audio: base64Audio,
  }));
};
```

### Output Audio (AI → User)

1. **Receive** - `response.audio.delta` events from OpenAI
2. **Decode** - Base64 → Float32Array
3. **Queue** - Store chunks in audio queue
4. **Create Buffer** - `AudioContext.createBuffer()`
5. **Play** - `AudioBufferSourceNode.start()`

```typescript
// Audio playback pipeline
const handleAudioDelta = (event: any) => {
  const audioChunk = base64ToFloat32Array(event.delta);
  audioQueueRef.current.push(audioChunk);
  playAudioQueue();
};

const playAudioQueue = () => {
  const audioContext = audioContextRef.current;
  const audioChunk = audioQueueRef.current.shift();

  const audioBuffer = audioContext.createBuffer(1, audioChunk.length, 24000);
  audioBuffer.getChannelData(0).set(audioChunk);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

---

## Event Handling

### OpenAI Realtime Events

The Voice Agent handles these key events from the Realtime API:

| Event Type | Description | Handler Action |
|------------|-------------|----------------|
| `conversation.item.input_audio_transcription.completed` | User's speech transcribed | Display transcript, set state to "thinking" |
| `response.audio.delta` | AI audio chunk | Queue and play audio |
| `response.audio_transcript.delta` | AI transcript chunk | Append to transcript display |
| `response.audio.done` | AI finished speaking | Set state to "listening" |
| `response.function_call_arguments.done` | Function call completed | Execute function and return result |
| `input_audio_buffer.speech_started` | User started speaking | Set state to "listening" |
| `input_audio_buffer.speech_stopped` | User stopped speaking | Set state to "thinking" |
| `error` | Error occurred | Display error message |

### Example Event Flow

```
User starts speaking
  → input_audio_buffer.speech_started
  → State: listening

User stops speaking
  → input_audio_buffer.speech_stopped
  → conversation.item.input_audio_transcription.completed
  → Transcript: "How much should I save monthly to buy a $50,000 car?"
  → State: thinking

AI calls function
  → response.function_call_arguments.done
  → Execute: calculate_monthly_savings(50000, 3, 0, 0.05)
  → Return: { monthly_payment: 1357 }

AI responds
  → response.audio_transcript.delta "To save $50,000..."
  → response.audio.delta [audio chunks]
  → State: speaking

AI finishes
  → response.audio.done
  → State: listening
```

---

## Function Calling

The Voice Agent can call these functions during conversation:

### 1. `calculate_monthly_savings`

Calculate monthly savings needed to reach a goal.

**Parameters:**
- `target_amount` (number) - Goal amount in dollars
- `years` (number) - Years to reach goal
- `current_savings` (number, optional) - Current amount saved
- `annual_return` (number) - Expected return rate (%)

**Returns:**
```json
{
  "monthly_payment": 1357.50
}
```

**Example:**
> User: "I want to save $50,000 in 3 years. How much monthly?"
>
> Function Call: `calculate_monthly_savings(50000, 3, 0, 5)`
>
> AI: "You'll need to save about $1,357 per month, assuming a 5% annual return."

### 2. `calculate_future_value`

Calculate how savings will grow over time.

**Parameters:**
- `current_savings` (number) - Current amount saved
- `monthly_contribution` (number) - Monthly addition
- `years` (number) - Time period
- `annual_return` (number) - Expected return rate (%)

**Returns:**
```json
{
  "future_value": 75234.89
}
```

**Example:**
> User: "If I save $1,000 monthly for 5 years, how much will I have?"
>
> Function Call: `calculate_future_value(0, 1000, 5, 5)`
>
> AI: "After 5 years of saving $1,000 monthly with a 5% return, you'll have approximately $68,000."

### 3. `get_user_context`

Fetch user's saved financial data and goals.

**Parameters:**
- `user_id` (string) - User ID

**Returns:**
```json
{
  "goal": {
    "type": "house",
    "targetAmount": 100000,
    "currentSavings": 15000,
    "timeframe": 60,
    "region": "US"
  },
  "preferences": {...}
}
```

**Example:**
> User: "What's my current savings progress?"
>
> Function Call: `get_user_context("user_123")`
>
> AI: "You're saving for a house. You've saved $15,000 of your $100,000 goal, which is 15% complete."

---

## Voice Instructions

The voice agent uses specialized instructions optimized for conversational coaching:

```
You are an expert financial coach conducting a voice conversation.

1. Be Conversational & Natural
   - Speak in a warm, friendly tone
   - Use contractions (I'll, you're, we'll)
   - Use verbal cues like "I see", "That makes sense"

2. Keep Responses Concise
   - Voice requires shorter, digestible responses
   - Break complex topics into smaller chunks
   - Ask if they want more details

3. Ask Clarifying Questions
   - When details are missing, ask specific questions
   - Confirm understanding by summarizing

4. Use Financial Tools When Needed
   - When users ask "how much" questions, use calculation tools
   - Explain results in simple, relatable terms
   - Round numbers ($1,350 vs $1,347.83)

5. Handle Interruptions Gracefully
   - If interrupted, acknowledge and adjust
   - Don't repeat unnecessarily

6. Be Encouraging & Supportive
   - Celebrate progress
   - Frame challenges as opportunities
```

---

## Mobile Integration (Capacitor)

### Permissions Configuration

Added to [capacitor.config.ts](../capacitor.config.ts):

```typescript
plugins: {
  CapacitorHttp: {
    enabled: true,
  },
},
permissions: {
  microphone: 'required',  // For voice input
  audio: 'required',       // For audio playback
},
```

### iOS Configuration

Add to `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Voice conversations with your AI financial coach</string>
```

### Android Configuration

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

---

## Usage

### For Users

1. **Enable Voice Mode**
   - Go to AI Assistant page ([/app/ai](../app/ai))
   - Click "Voice Mode" toggle (🎤 icon)

2. **Start Conversation**
   - Click "Start Voice Chat" button
   - Allow microphone permission when prompted
   - Wait for "Connected" status

3. **Talk Naturally**
   - Speak your question clearly
   - Agent will respond automatically
   - View transcript in real-time

4. **End Conversation**
   - Click "End Chat" button
   - Or click "Close" to exit voice mode

### For Developers

**Import Component:**

```tsx
import { VoiceAgent } from '@/components/ai/VoiceAgent';
```

**Basic Usage:**

```tsx
<VoiceAgent
  userId="user_123"
  goalType="house"
  region="US"
  onClose={() => setVoiceMode(false)}
/>
```

**With State Management:**

```tsx
const [voiceMode, setVoiceMode] = useState(false);

{voiceMode ? (
  <VoiceAgent
    userId={userId}
    goalType={goal?.type}
    region={goal?.region}
    onClose={() => setVoiceMode(false)}
  />
) : (
  <TextChatInterface />
)}
```

---

## Environment Variables

Required environment variables:

```bash
# OpenAI API Key (required for Realtime API)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Note: Realtime API key must be exposed to client
# Ensure proper usage limits and monitoring
```

**⚠️ Security Note:** The Realtime API requires client-side access to the API key. Implement proper rate limiting and monitoring. Consider:

1. Using a proxy server for production
2. Implementing per-user usage limits
3. Monitoring API costs
4. Restricting API key permissions

---

## Best Practices

### 1. Audio Quality

- Use headphones to avoid echo/feedback
- Speak clearly at normal pace
- Minimize background noise
- Test microphone levels before starting

### 2. Conversation Flow

- Ask one question at a time
- Wait for AI to finish before speaking
- Be specific with financial numbers
- Use natural language (no need for formal commands)

### 3. Function Calls

- AI automatically calls functions when needed
- No need to explicitly request calculations
- Trust the AI to fetch your data when relevant

### 4. Error Handling

- If connection drops, click "Start Voice Chat" again
- Check microphone permissions in browser settings
- Ensure stable internet connection
- Try refreshing page if issues persist

---

## Limitations

### Current Limitations

1. **No Streaming in Next.js** - Next.js API routes don't natively support WebSocket upgrades. Client connects directly to OpenAI.

2. **Client-Side API Key** - OpenAI API key must be exposed to client for direct connection. Use proxy in production.

3. **Browser Support** - Requires modern browsers with Web Audio API support (Chrome 23+, Firefox 25+, Safari 6+).

4. **Mobile Considerations** - Some mobile browsers have restrictions on audio autoplay and background audio.

5. **Network Latency** - Voice quality depends on network speed. Minimum 1 Mbps recommended.

### Known Issues

- **Echo on Some Devices** - Use headphones if experiencing echo
- **Safari Audio Context** - May require user gesture to initialize on Safari
- **Mobile Background** - Audio may pause when app backgrounds (platform limitation)

---

## Future Enhancements

Potential improvements:

1. **Server-Side Proxy** - Dedicated WebSocket server for better security and control
2. **Voice Selection** - Allow users to choose from multiple AI voices
3. **Conversation History** - Save voice conversation transcripts
4. **Sentiment Analysis** - Detect user emotion and adjust coaching tone
5. **Multi-language Support** - Support for non-English conversations
6. **Voice Commands** - Special commands like "pause", "repeat", "calculate"
7. **Background Mode** - Continue conversations in mobile background
8. **Call Recording** - Optional recording and playback of conversations

---

## Troubleshooting

### Microphone Not Working

1. **Check Browser Permissions**
   - Click lock icon in browser address bar
   - Ensure microphone is allowed

2. **Check Device Permissions**
   - macOS: System Preferences → Security & Privacy → Microphone
   - Windows: Settings → Privacy → Microphone
   - iOS: Settings → [App Name] → Microphone
   - Android: Settings → Apps → [App Name] → Permissions

3. **Check Hardware**
   - Ensure microphone is connected
   - Test in other apps
   - Check volume/mute settings

### Connection Errors

1. **Network Issues**
   - Check internet connection
   - Try disabling VPN
   - Check firewall settings (allow WSS connections)

2. **API Key Issues**
   - Verify `NEXT_PUBLIC_OPENAI_API_KEY` is set
   - Check API key has Realtime API access
   - Monitor API usage limits

3. **Browser Issues**
   - Try different browser
   - Clear browser cache
   - Disable browser extensions

### Audio Quality Issues

1. **Choppy Audio**
   - Close other apps using bandwidth
   - Move closer to WiFi router
   - Reduce audio quality in settings (if available)

2. **Echo/Feedback**
   - Use headphones
   - Reduce speaker volume
   - Move away from speakers

3. **Latency**
   - Check network speed (aim for <100ms ping)
   - Consider wired connection
   - Close bandwidth-heavy apps

---

## API Costs

### OpenAI Realtime API Pricing

The Realtime API has different pricing than standard API calls:

- **Audio Input**: $0.06 per minute
- **Audio Output**: $0.24 per minute
- **Text Input/Output**: $0.01 per 1K tokens

**Example Costs:**

- 5-minute conversation: ~$1.50
- 10-minute conversation: ~$3.00
- 30-minute conversation: ~$9.00

**Cost Optimization Tips:**

1. Implement session timeouts (e.g., 10 minutes max)
2. Add usage limits per user
3. Monitor API costs dashboard
4. Consider offering voice as premium feature
5. Use text mode for simple queries

---

## References

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Capacitor Audio Plugin](https://capacitorjs.com/docs/apis/audio)
- [Voice Agent Component](../components/ai/VoiceAgent.tsx)
- [Voice API Route](../app/api/ai/voice/route.ts)

---

**Last Updated:** 2025-11-01
**Version:** 1.0.0
