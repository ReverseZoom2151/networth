// ============================================================================
// TRACING & EVALUATION INFRASTRUCTURE
// Comprehensive logging, metrics, and quality evaluation for AI agents
// ============================================================================

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface TraceEvent {
  id: string;
  timestamp: number;
  type:
    | 'request_start'
    | 'request_end'
    | 'agent_start'
    | 'agent_end'
    | 'tool_call'
    | 'handoff'
    | 'error'
    | 'validation_fail'
    | 'rate_limit';
  data: any;
}

export interface AgentTrace {
  traceId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  agentUsed: string;
  model: string;
  input: {
    message: string;
    goalType?: string;
    region?: string;
    deepResearch?: boolean;
  };
  output?: {
    response: string;
    research?: any;
    warnings?: string[];
  };
  events: TraceEvent[];
  metrics: {
    tokenCount?: number;
    toolCalls?: number;
    handoffs?: number;
    validationFailures?: number;
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// ============================================================================
// IN-MEMORY TRACE STORAGE (Replace with database in production)
// ============================================================================

const traces = new Map<string, AgentTrace>();
const MAX_TRACES = 1000; // Keep last 1000 traces in memory

/**
 * Generate a unique trace ID
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start a new trace
 */
export function startTrace(input: {
  userId?: string;
  message: string;
  goalType?: string;
  region?: string;
  deepResearch?: boolean;
  model: string;
}): string {
  const traceId = generateTraceId();
  const startTime = Date.now();

  const trace: AgentTrace = {
    traceId,
    userId: input.userId,
    startTime,
    agentUsed: 'pending',
    model: input.model,
    input: {
      message: input.message,
      goalType: input.goalType,
      region: input.region,
      deepResearch: input.deepResearch,
    },
    events: [
      {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: startTime,
        type: 'request_start',
        data: { input },
      },
    ],
    metrics: {
      toolCalls: 0,
      handoffs: 0,
      validationFailures: 0,
    },
  };

  traces.set(traceId, trace);

  // Clean up old traces if limit exceeded
  if (traces.size > MAX_TRACES) {
    const oldestTraceId = Array.from(traces.keys())[0];
    traces.delete(oldestTraceId);
  }

  console.log(`[Trace ${traceId}] 🎬 Started`);

  return traceId;
}

/**
 * Add an event to a trace
 */
export function addTraceEvent(
  traceId: string,
  type: TraceEvent['type'],
  data: any
): void {
  const trace = traces.get(traceId);
  if (!trace) {
    console.warn(`[Trace ${traceId}] Trace not found`);
    return;
  }

  const event: TraceEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    data,
  };

  trace.events.push(event);

  // Update metrics based on event type
  if (type === 'tool_call') {
    trace.metrics.toolCalls = (trace.metrics.toolCalls || 0) + 1;
  } else if (type === 'handoff') {
    trace.metrics.handoffs = (trace.metrics.handoffs || 0) + 1;
  } else if (type === 'validation_fail') {
    trace.metrics.validationFailures =
      (trace.metrics.validationFailures || 0) + 1;
  }

  console.log(`[Trace ${traceId}] 📝 Event: ${type}`);
}

/**
 * End a trace with results
 */
export function endTrace(
  traceId: string,
  output: {
    response: string;
    research?: any;
    warnings?: string[];
    agentUsed: string;
  }
): void {
  const trace = traces.get(traceId);
  if (!trace) {
    console.warn(`[Trace ${traceId}] Trace not found`);
    return;
  }

  const endTime = Date.now();
  trace.endTime = endTime;
  trace.duration = endTime - trace.startTime;
  trace.output = output;
  trace.agentUsed = output.agentUsed;

  trace.events.push({
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: endTime,
    type: 'request_end',
    data: { output },
  });

  console.log(`[Trace ${traceId}] ✅ Completed in ${trace.duration}ms`);
  console.log(
    `[Trace ${traceId}] Metrics: ${trace.metrics.toolCalls} tool calls, ${trace.metrics.handoffs} handoffs`
  );
}

/**
 * Record an error in a trace
 */
export function traceError(
  traceId: string,
  error: Error | string,
  code?: string
): void {
  const trace = traces.get(traceId);
  if (!trace) {
    console.warn(`[Trace ${traceId}] Trace not found`);
    return;
  }

  const errorData =
    typeof error === 'string'
      ? { message: error, code }
      : { message: error.message, stack: error.stack, code };

  trace.error = errorData;

  trace.events.push({
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type: 'error',
    data: errorData,
  });

  console.error(`[Trace ${traceId}] ❌ Error: ${errorData.message}`);
}

/**
 * Get a trace by ID
 */
export function getTrace(traceId: string): AgentTrace | undefined {
  return traces.get(traceId);
}

/**
 * Get all traces (for debugging/analytics)
 */
export function getAllTraces(): AgentTrace[] {
  return Array.from(traces.values());
}

/**
 * Get traces by user ID
 */
export function getTracesByUser(userId: string): AgentTrace[] {
  return Array.from(traces.values()).filter(
    (trace) => trace.userId === userId
  );
}

// ============================================================================
// EVALUATION FRAMEWORK
// ============================================================================

export interface EvaluationResult {
  traceId: string;
  score: number; // 0-100
  dimensions: {
    relevance: number; // How relevant is the response?
    accuracy: number; // Is the information accurate?
    helpfulness: number; // Is it actionable and helpful?
    safety: number; // Does it follow safety guidelines?
    completeness: number; // Does it fully answer the question?
  };
  feedback?: string;
  timestamp: number;
}

/**
 * Evaluate a response for quality (simple heuristic-based evaluation)
 */
export function evaluateResponse(
  traceId: string,
  input: string,
  output: string,
  warnings: string[] = []
): EvaluationResult {
  const trace = traces.get(traceId);

  // Relevance: Check if output addresses the input
  const relevance = calculateRelevance(input, output);

  // Accuracy: Check for problematic patterns
  const accuracy = calculateAccuracy(output, warnings);

  // Helpfulness: Check for actionable advice
  const helpfulness = calculateHelpfulness(output);

  // Safety: Check for warnings and disclaimers
  const safety = calculateSafety(output, warnings);

  // Completeness: Check response length and structure
  const completeness = calculateCompleteness(output);

  const dimensions = {
    relevance,
    accuracy,
    helpfulness,
    safety,
    completeness,
  };

  const score = Math.round(
    (relevance + accuracy + helpfulness + safety + completeness) / 5
  );

  const evaluation: EvaluationResult = {
    traceId,
    score,
    dimensions,
    timestamp: Date.now(),
  };

  // Add feedback if score is low
  if (score < 70) {
    evaluation.feedback = generateFeedback(dimensions);
  }

  console.log(`[Trace ${traceId}] 📊 Evaluation score: ${score}/100`);
  console.log(
    `[Trace ${traceId}] Dimensions:`,
    JSON.stringify(dimensions, null, 2)
  );

  return evaluation;
}

// Helper functions for evaluation dimensions

function calculateRelevance(input: string, output: string): number {
  // Simple keyword overlap check
  const inputWords = input.toLowerCase().split(/\s+/);
  const outputWords = output.toLowerCase().split(/\s+/);

  const overlap = inputWords.filter((word) =>
    outputWords.some((oWord) => oWord.includes(word) || word.includes(oWord))
  ).length;

  const relevanceRatio = Math.min(overlap / inputWords.length, 1);
  return Math.round(relevanceRatio * 100);
}

function calculateAccuracy(output: string, warnings: string[]): number {
  let score = 100;

  // Penalize for problematic output warnings
  if (warnings.includes('output_contains_potentially_misleading_claims')) {
    score -= 30;
  }

  // Check for hedging language (indicates uncertainty)
  const hedgingPatterns = [
    /might/gi,
    /could/gi,
    /possibly/gi,
    /may/gi,
    /perhaps/gi,
  ];
  const hedgingCount = hedgingPatterns.reduce(
    (count, pattern) => count + (output.match(pattern) || []).length,
    0
  );

  // Some hedging is good (shows caution), too much is bad
  if (hedgingCount > 10) {
    score -= 10;
  }

  return Math.max(score, 0);
}

function calculateHelpfulness(output: string): number {
  let score = 50; // Base score

  // Check for actionable advice indicators
  const actionablePatterns = [
    /you should/gi,
    /consider/gi,
    /recommend/gi,
    /try/gi,
    /step/gi,
    /\d+\./g, // Numbered lists
    /•/g, // Bullet points
  ];

  const actionableCount = actionablePatterns.reduce(
    (count, pattern) => count + (output.match(pattern) || []).length,
    0
  );

  // Bonus for actionable content
  score += Math.min(actionableCount * 5, 40);

  // Check for examples or calculations
  if (/\$[\d,]+/g.test(output)) {
    score += 10; // Bonus for specific dollar amounts
  }

  return Math.min(score, 100);
}

function calculateSafety(output: string, warnings: string[]): number {
  let score = 100;

  // Penalize for missing disclaimer when needed
  if (
    warnings.includes('investment_disclaimer_required') &&
    !output.includes('disclaimer')
  ) {
    score -= 20;
  }

  // Check for absolutist language
  const absolutistPatterns = [
    /guaranteed/gi,
    /always/gi,
    /never/gi,
    /100%/gi,
    /definitely/gi,
  ];

  const absolutistCount = absolutistPatterns.reduce(
    (count, pattern) => count + (output.match(pattern) || []).length,
    0
  );

  score -= Math.min(absolutistCount * 10, 40);

  return Math.max(score, 0);
}

function calculateCompleteness(output: string): number {
  // Check response length
  const length = output.length;

  if (length < 100) return 30; // Too short
  if (length < 300) return 60; // Somewhat complete
  if (length < 1000) return 80; // Good length
  if (length < 3000) return 100; // Comprehensive
  if (length < 5000) return 90; // Very long (might be too verbose)

  return 70; // Extremely long (likely too verbose)
}

function generateFeedback(dimensions: EvaluationResult['dimensions']): string {
  const issues: string[] = [];

  if (dimensions.relevance < 70) {
    issues.push('Response may not fully address the user query');
  }
  if (dimensions.accuracy < 70) {
    issues.push('Response contains potentially misleading information');
  }
  if (dimensions.helpfulness < 70) {
    issues.push('Response lacks actionable advice');
  }
  if (dimensions.safety < 70) {
    issues.push('Response may not follow safety guidelines');
  }
  if (dimensions.completeness < 70) {
    issues.push('Response may be incomplete or too brief');
  }

  return issues.join('. ');
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface AnalyticsSnapshot {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDuration: number;
  averageScore: number;
  agentUsage: Record<string, number>;
  modelUsage: Record<string, number>;
  topWarnings: Record<string, number>;
  timestamp: number;
}

/**
 * Get analytics snapshot from traces
 */
export function getAnalytics(): AnalyticsSnapshot {
  const allTraces = getAllTraces();
  const completedTraces = allTraces.filter(
    (t) => t.endTime && !t.error
  );
  const failedTraces = allTraces.filter((t) => t.error);

  // Calculate averages
  const totalDuration = completedTraces.reduce(
    (sum, t) => sum + (t.duration || 0),
    0
  );
  const averageDuration = completedTraces.length
    ? Math.round(totalDuration / completedTraces.length)
    : 0;

  // Aggregate agent usage
  const agentUsage: Record<string, number> = {};
  completedTraces.forEach((trace) => {
    agentUsage[trace.agentUsed] = (agentUsage[trace.agentUsed] || 0) + 1;
  });

  // Aggregate model usage
  const modelUsage: Record<string, number> = {};
  allTraces.forEach((trace) => {
    modelUsage[trace.model] = (modelUsage[trace.model] || 0) + 1;
  });

  // Aggregate warnings
  const topWarnings: Record<string, number> = {};
  completedTraces.forEach((trace) => {
    (trace.output?.warnings || []).forEach((warning) => {
      topWarnings[warning] = (topWarnings[warning] || 0) + 1;
    });
  });

  return {
    totalRequests: allTraces.length,
    successfulRequests: completedTraces.length,
    failedRequests: failedTraces.length,
    averageDuration,
    averageScore: 0, // Would need to store evaluations
    agentUsage,
    modelUsage,
    topWarnings,
    timestamp: Date.now(),
  };
}

/**
 * Log analytics summary to console
 */
export function logAnalyticsSummary(): void {
  const analytics = getAnalytics();

  console.log('\n========================================');
  console.log('📊 AGENT ANALYTICS SUMMARY');
  console.log('========================================');
  console.log(`Total Requests: ${analytics.totalRequests}`);
  console.log(`Successful: ${analytics.successfulRequests}`);
  console.log(`Failed: ${analytics.failedRequests}`);
  console.log(`Average Duration: ${analytics.averageDuration}ms`);
  console.log('\nAgent Usage:');
  Object.entries(analytics.agentUsage).forEach(([agent, count]) => {
    console.log(`  ${agent}: ${count}`);
  });
  console.log('\nModel Usage:');
  Object.entries(analytics.modelUsage).forEach(([model, count]) => {
    console.log(`  ${model}: ${count}`);
  });
  if (Object.keys(analytics.topWarnings).length > 0) {
    console.log('\nTop Warnings:');
    Object.entries(analytics.topWarnings).forEach(([warning, count]) => {
      console.log(`  ${warning}: ${count}`);
    });
  }
  console.log('========================================\n');
}

/**
 * Export traces to JSON (for analysis or backup)
 */
export function exportTraces(): string {
  return JSON.stringify(Array.from(traces.values()), null, 2);
}

/**
 * Clear all traces (for testing or cleanup)
 */
export function clearTraces(): void {
  traces.clear();
  console.log('[Tracing] 🗑️ All traces cleared');
}
