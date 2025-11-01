# OpenAI Agents SDK Integration

This document describes the OpenAI Agents SDK integration in the Networth MVP application.

## Overview

The application has been augmented with the OpenAI Agents SDK to provide:

- **Multi-agent orchestration** - Specialized agents for coaching, research, and calculations
- **Guardrails** - Input/output validation and safety checks
- **Handoffs** - Seamless delegation between agents
- **Tracing** - Comprehensive logging and evaluation
- **Rate limiting** - Protection against abuse
- **Quality evaluation** - Automatic response quality scoring

## Architecture

### Agent Hierarchy

```
Coach Agent (Primary Orchestrator)
├── Calculator Agent (Financial calculations)
├── Research Agent (Deep multi-source research)
└── Context Agent (User data & knowledge base)
```

### Request Flow

1. **Input Validation** - Validate and sanitize user input
2. **Rate Limiting** - Check request limits
3. **Agent Routing** - Select appropriate agent based on query
4. **Agent Execution** - Run agent with tools and handoffs
5. **Output Validation** - Validate and enhance response
6. **Tracing & Evaluation** - Log metrics and evaluate quality

## Agents

### Coach Agent (`coachAgent`)

**Purpose**: Primary financial coach that orchestrates specialist agents and maintains conversation context.

**Model**: GPT-4o

**Tools**:
- Basic financial calculators (future value, monthly payment, time to goal)

**Handoffs**:
- Calculator Agent (for complex calculations)
- Research Agent (for deep research)
- Context Agent (for user data)

**Instructions**: Provides personalized financial advice with empathy and practical guidance.

### Calculator Agent (`calculatorAgent`)

**Purpose**: Specialist for performing precise financial calculations.

**Model**: GPT-4o

**Tools**:
- Future value calculator
- Monthly payment calculator
- Time to goal calculator
- Debt payoff calculator
- Loan payment calculator
- Compound interest calculator

**Instructions**: Performs accurate calculations and explains results step-by-step.

### Research Agent (`researchAgent`)

**Purpose**: Conducts comprehensive financial research using multiple sources.

**Model**: GPT-4o

**Tools**:
- Deep research tool (Perplexity API)
- Knowledge base search tool

**Instructions**: Synthesizes information from multiple authoritative sources with citations.

### Context Agent (`contextAgent`)

**Purpose**: Fetches user financial data and searches knowledge base.

**Model**: GPT-4o-mini (faster/cheaper for data retrieval)

**Tools**:
- Fetch user context tool
- Search knowledge base tool

**Instructions**: Gathers and organizes relevant context for other agents.

## Guardrails

### Input Guardrails

Located in `/lib/guardrails.ts`:

```typescript
validateInput({
  message: string,
  userId?: string,
  goalType?: string,
  region?: string,
  deepResearch?: boolean,
  model?: string,
})
```

**Checks**:
- Schema validation (Zod)
- Blocked content detection (harmful/illegal patterns)
- Message length limits
- Required fields

**Returns**:
- `valid: boolean`
- `sanitized?: input` (cleaned input)
- `error?: string`
- `warnings?: string[]`

### Output Guardrails

```typescript
validateOutput(
  output: string,
  context: { requiresDisclaimer: boolean }
)
```

**Checks**:
- Empty responses
- Problematic patterns (guarantees, get-rich-quick)
- Disclaimer requirements
- Output length

**Enhancements**:
- Automatic disclaimer injection
- Warning flags for review

### Rate Limiting

```typescript
checkRateLimit(
  userId: string,
  maxRequests: number = 20,
  windowMs: number = 60000
)
```

**Default**: 20 requests per minute per user

**Returns**:
- `allowed: boolean`
- `remaining?: number` (requests left)
- `resetIn?: number` (milliseconds until reset)

## Tracing & Evaluation

### Starting a Trace

```typescript
const traceId = startTrace({
  userId: 'user_123',
  message: 'How much should I save monthly?',
  goalType: 'house',
  region: 'US',
  deepResearch: false,
  model: 'gpt-4o',
});
```

### Adding Events

```typescript
addTraceEvent(traceId, 'agent_start', { agent: 'coach' });
addTraceEvent(traceId, 'tool_call', { tool: 'calculate_future_value' });
addTraceEvent(traceId, 'handoff', { from: 'coach', to: 'calculator' });
addTraceEvent(traceId, 'agent_end', { agent: 'calculator' });
```

### Ending a Trace

```typescript
endTrace(traceId, {
  response: '...',
  research: {...},
  warnings: [],
  agentUsed: 'coach',
});
```

### Recording Errors

```typescript
traceError(traceId, error, 'QUERY_ERROR');
```

### Evaluating Responses

```typescript
const evaluation = evaluateResponse(
  traceId,
  inputMessage,
  outputResponse,
  warnings
);

console.log(evaluation);
// {
//   traceId: 'trace_...',
//   score: 85, // 0-100
//   dimensions: {
//     relevance: 90,
//     accuracy: 95,
//     helpfulness: 80,
//     safety: 85,
//     completeness: 75,
//   },
//   feedback?: 'Response may be incomplete...',
//   timestamp: 1234567890
// }
```

## API Usage

### AI Query Endpoint

**Endpoint**: `POST /api/ai/query`

**Body**:
```json
{
  "message": "How much should I save for a house?",
  "model": "gpt-4o",
  "modelCategory": "openai",
  "deepResearch": false,
  "goal": {
    "type": "house",
    "targetAmount": 100000,
    "currentSavings": 10000,
    "timeframe": 60,
    "region": "US"
  },
  "history": [],
  "userId": "user_123",
  "useAgentsSDK": true
}
```

**Response**:
```json
{
  "response": "Based on your goal to save $100,000 in 60 months...",
  "research": null,
  "model": "gpt-4o",
  "metadata": {
    "agentUsed": "coach",
    "duration": 2534,
    "warnings": [],
    "traceId": "trace_1234567890_abc123",
    "evaluation": {
      "score": 85,
      "dimensions": {
        "relevance": 90,
        "accuracy": 95,
        "helpfulness": 80,
        "safety": 85,
        "completeness": 75
      }
    }
  }
}
```

### Analytics Endpoint

**Endpoint**: `GET /api/ai/analytics`

**Actions**:

1. **Get analytics summary** (default):
   ```
   GET /api/ai/analytics
   ```

2. **Get specific trace**:
   ```
   GET /api/ai/analytics?action=trace&traceId=trace_123
   ```

3. **Get user traces**:
   ```
   GET /api/ai/analytics?action=user&userId=user_123
   ```

4. **Get all traces**:
   ```
   GET /api/ai/analytics?action=all
   ```

5. **Export traces**:
   ```
   GET /api/ai/analytics?action=export
   ```
   Downloads JSON file with all traces.

6. **Log analytics to console**:
   ```
   GET /api/ai/analytics?action=log
   ```

**Example Response** (analytics summary):
```json
{
  "analytics": {
    "totalRequests": 150,
    "successfulRequests": 145,
    "failedRequests": 5,
    "averageDuration": 2340,
    "averageScore": 82,
    "agentUsage": {
      "coach": 100,
      "calculator": 30,
      "research": 15
    },
    "modelUsage": {
      "gpt-4o": 120,
      "claude-sonnet-4-5-20250929": 25
    },
    "topWarnings": {
      "investment_disclaimer_required": 20,
      "long_query_may_take_time": 5
    },
    "timestamp": 1234567890
  }
}
```

## Configuration

### Enabling/Disabling SDK

The SDK can be toggled via the `useAgentsSDK` parameter:

```typescript
// Use Agents SDK (default)
const response = await fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({
    ...requestData,
    useAgentsSDK: true, // Uses specialized agents
  }),
});

// Use legacy API
const response = await fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({
    ...requestData,
    useAgentsSDK: false, // Uses direct Claude/OpenAI calls
  }),
});
```

**Note**: SDK is only available for OpenAI models (`modelCategory: 'openai'`). Claude models use the legacy path.

### Agent Routing Logic

The system automatically routes queries to the appropriate agent:

1. **Deep Research Query** → Research Agent
   - Triggered when `deepResearch: true`

2. **Calculation Query** → Calculator Agent
   - Detected by keywords: calculate, compute, how much, how long, payment, interest, etc.

3. **General Query** → Coach Agent
   - Default for conversational financial advice

## Tools

All calculator tools are automatically available to agents:

- `futureValueTool` - Calculate future value with compound interest
- `monthlyPaymentTool` - Calculate monthly savings needed
- `timeToGoalTool` - Calculate time to reach goal
- `debtPayoffTool` - Calculate debt payoff timeline
- `loanPaymentTool` - Calculate loan payment
- `compoundInterestTool` - Calculate compound interest
- `fetchUserContextTool` - Fetch user financial data
- `searchKnowledgeTool` - Search knowledge base
- `deepResearchTool` - Perform multi-source research

## Handoffs

Agents can hand off to specialists:

```typescript
// Coach Agent can hand off to:
coachAgent.handoffs = [
  calculatorAgent,  // For complex calculations
  researchAgent,    // For deep research
  contextAgent,     // For user data
];
```

The SDK handles handoffs automatically based on agent instructions and context.

## Monitoring & Debugging

### Console Logs

The system provides detailed console logging:

```
[Trace trace_123] 🎬 Started
[AI Query] ✅ Input validated. Warnings: []
[AI Query] 🤖 Using OpenAI Agents SDK
[AI Query] 💬 Routing to Coach Agent
[Trace trace_123] 📝 Event: agent_start
[Trace trace_123] 📝 Event: tool_call
[Trace trace_123] 📝 Event: agent_end
[AI Query] ✅ Request completed in 2534ms
[Trace trace_123] ✅ Completed in 2534ms
[Trace trace_123] Metrics: 2 tool calls, 0 handoffs
[Trace trace_123] 📊 Evaluation score: 85/100
```

### Analytics Dashboard

Access analytics via the API:

```bash
# View summary
curl http://localhost:3000/api/ai/analytics

# View specific trace
curl http://localhost:3000/api/ai/analytics?action=trace&traceId=trace_123

# Export all traces
curl http://localhost:3000/api/ai/analytics?action=export > traces.json
```

## Best Practices

### 1. Always Use Guardrails

Input and output validation catches issues early:

```typescript
const validation = validateInput(userInput);
if (!validation.valid) {
  return { error: validation.error };
}
```

### 2. Monitor Rate Limits

Prevent abuse with rate limiting:

```typescript
const rateLimit = checkRateLimit(userId);
if (!rateLimit.allowed) {
  return { error: 'Rate limit exceeded' };
}
```

### 3. Enable Tracing for Debugging

Traces provide visibility into agent behavior:

```typescript
const traceId = startTrace(requestData);
// ... process request ...
endTrace(traceId, results);
```

### 4. Review Evaluations

Check evaluation scores to identify quality issues:

```typescript
const evaluation = evaluateResponse(traceId, input, output, warnings);
if (evaluation.score < 70) {
  console.warn('Low quality response:', evaluation.feedback);
}
```

### 5. Use Appropriate Agents

Route queries to the right agent for best results:

- Complex calculations → Calculator Agent
- Research questions → Research Agent
- General advice → Coach Agent

## Future Enhancements

Potential improvements:

1. **Persistent Storage** - Store traces in database instead of memory
2. **Advanced Evaluation** - Use LLM-as-judge for more sophisticated evaluation
3. **Agent Metrics** - Track per-agent performance and costs
4. **User Feedback Loop** - Collect user ratings to improve evaluation
5. **Adaptive Routing** - ML-based query classification for better routing
6. **Multi-modal Agents** - Support for image/voice inputs
7. **Realtime Agents** - Voice-based financial coaching
8. **MCP Integration** - Connect to external tools via Model Context Protocol

## Troubleshooting

### Agent not routing correctly

Check the `isCalculationQuery()` function in `/app/api/ai/query/route.ts`:

```typescript
function isCalculationQuery(message: string): boolean {
  const calculationKeywords = [
    'calculate', 'compute', 'how much', 'how long',
    'payment', 'interest', 'save', 'months', 'years',
    'debt payoff', 'loan',
  ];
  return calculationKeywords.some(k => message.toLowerCase().includes(k));
}
```

### Traces not appearing

Ensure tracing is enabled and check console logs for the trace ID.

### Rate limiting too strict

Adjust limits in the API handler:

```typescript
checkRateLimit(userId, 50, 60000); // 50 requests per minute
```

### Low evaluation scores

Review the evaluation dimensions to identify specific issues:

```typescript
console.log(evaluation.dimensions);
// { relevance: 90, accuracy: 60, ... }
```

## References

- [OpenAI Agents SDK Documentation](https://github.com/openai/openai-agents-sdk)
- [Agent Architecture](/lib/agents.ts)
- [Guardrails System](/lib/guardrails.ts)
- [Tracing Infrastructure](/lib/tracing.ts)
