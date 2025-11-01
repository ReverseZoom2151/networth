import { z } from 'zod';

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating user financial queries
 */
export const FinancialQuerySchema = z.object({
  message: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(2000, 'Query is too long (max 2000 characters)'),
  userId: z.string().optional(),
  goalType: z
    .enum([
      'house',
      'car',
      'travel',
      'emergency_fund',
      'debt_free',
      'retirement',
      'investment',
    ])
    .optional(),
  region: z.enum(['US', 'CA', 'UK', 'AU']).optional(),
  deepResearch: z.boolean().optional(),
  model: z.string().optional(),
});

/**
 * Schema for validating calculator inputs
 */
export const CalculatorInputSchema = z.object({
  presentValue: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0).optional(),
  annualRate: z.number().min(0).max(1, 'Annual rate must be between 0 and 1').optional(),
  years: z.number().min(0).max(100, 'Years must be between 0 and 100').optional(),
  targetAmount: z.number().min(0).optional(),
  currentSavings: z.number().min(0).optional(),
  principal: z.number().min(0).optional(),
  monthlyPayment: z.number().min(0).optional(),
  compoundingFrequency: z.number().min(1).max(365).optional(),
});

/**
 * Schema for validating research requests
 */
export const ResearchRequestSchema = z.object({
  topic: z
    .string()
    .min(3, 'Research topic must be at least 3 characters')
    .max(500, 'Research topic is too long'),
  goalType: z.string().optional(),
  region: z.string().optional(),
});

// ============================================================================
// CONTENT SAFETY FILTERS
// ============================================================================

/**
 * Blocked content patterns that should not be processed
 */
const BLOCKED_PATTERNS = [
  /hack|exploit|steal|fraud|scam|illegal/i,
  /insider\s+trading|money\s+laundering/i,
  /guaranteed\s+returns?|get\s+rich\s+quick/i,
  /ponzi|pyramid\s+scheme/i,
];

/**
 * Financial disclaimer keywords that should trigger warnings
 */
const DISCLAIMER_KEYWORDS = [
  'invest',
  'stock',
  'crypto',
  'trading',
  'portfolio',
  'securities',
  'options',
  'futures',
  'forex',
];

/**
 * Check if content contains blocked patterns
 */
export function containsBlockedContent(text: string): {
  blocked: boolean;
  reason?: string;
} {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: 'Query contains potentially harmful or illegal content',
      };
    }
  }
  return { blocked: false };
}

/**
 * Check if content requires financial disclaimer
 */
export function requiresDisclaimer(text: string): boolean {
  return DISCLAIMER_KEYWORDS.some((keyword) =>
    text.toLowerCase().includes(keyword)
  );
}

/**
 * Standard financial disclaimer text
 */
export const FINANCIAL_DISCLAIMER = `
⚠️ **Important Disclaimer**: This information is for educational purposes only and should not be considered as financial advice. Always consult with a qualified financial advisor before making significant financial decisions. Past performance does not guarantee future results.
`;

// ============================================================================
// INPUT GUARDRAILS
// ============================================================================

/**
 * Validate and sanitize user input before processing
 */
export function validateInput(input: {
  message: string;
  userId?: string;
  goalType?: string;
  region?: string;
  deepResearch?: boolean;
  model?: string;
}): {
  valid: boolean;
  sanitized?: typeof input;
  error?: string;
  warnings?: string[];
} {
  // Validate schema
  const schemaValidation = FinancialQuerySchema.safeParse(input);
  if (!schemaValidation.success) {
    return {
      valid: false,
      error: schemaValidation.error.errors[0].message,
    };
  }

  // Check for blocked content
  const contentCheck = containsBlockedContent(input.message);
  if (contentCheck.blocked) {
    return {
      valid: false,
      error: contentCheck.reason,
    };
  }

  // Sanitize input
  const sanitized = {
    ...input,
    message: input.message.trim(),
  };

  // Generate warnings
  const warnings: string[] = [];
  if (requiresDisclaimer(input.message)) {
    warnings.push('investment_disclaimer_required');
  }

  // Check message length
  if (input.message.length > 1000) {
    warnings.push('long_query_may_take_time');
  }

  return {
    valid: true,
    sanitized,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================================================
// OUTPUT GUARDRAILS
// ============================================================================

/**
 * Patterns that indicate potentially problematic outputs
 */
const PROBLEMATIC_OUTPUT_PATTERNS = [
  /guaranteed\s+to/i,
  /can't\s+lose|cannot\s+lose|zero\s+risk/i,
  /100%\s+safe|completely\s+safe/i,
  /get\s+rich/i,
];

/**
 * Validate agent output before returning to user
 */
export function validateOutput(
  output: string,
  inputContext: { requiresDisclaimer: boolean }
): {
  valid: boolean;
  enhanced?: string;
  error?: string;
  warnings?: string[];
} {
  // Check for empty output
  if (!output || output.trim().length === 0) {
    return {
      valid: false,
      error: 'Agent produced empty response',
    };
  }

  // Check for problematic patterns
  const warnings: string[] = [];
  for (const pattern of PROBLEMATIC_OUTPUT_PATTERNS) {
    if (pattern.test(output)) {
      warnings.push('output_contains_potentially_misleading_claims');
      break;
    }
  }

  // Add disclaimer if needed
  let enhanced = output;
  if (inputContext.requiresDisclaimer && !output.includes('disclaimer')) {
    enhanced = output + '\n\n' + FINANCIAL_DISCLAIMER;
  }

  // Check output length
  if (output.length > 10000) {
    warnings.push('output_very_long');
  }

  return {
    valid: true,
    enhanced,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check and update rate limits for a user
 * Returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 20,
  windowMs: number = 60000 // 1 minute
): {
  allowed: boolean;
  remaining?: number;
  resetIn?: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // No entry or expired window
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    };
  }

  // Within window
  if (entry.count < maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // Rate limited
  return {
    allowed: false,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Clear rate limit for a user (useful for testing or admin override)
 */
export function clearRateLimit(userId: string): void {
  rateLimitMap.delete(userId);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate financial calculation inputs
 */
export function validateCalculatorInput(input: any): {
  valid: boolean;
  error?: string;
} {
  const validation = CalculatorInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      valid: false,
      error: validation.error.errors[0].message,
    };
  }

  // Additional business logic validation
  if (input.annualRate && (input.annualRate < 0 || input.annualRate > 0.5)) {
    return {
      valid: false,
      error: 'Annual interest rate seems unrealistic (should be between 0% and 50%)',
    };
  }

  if (input.years && input.years > 100) {
    return {
      valid: false,
      error: 'Time period is unrealistic (should be less than 100 years)',
    };
  }

  return { valid: true };
}

/**
 * Validate research request
 */
export function validateResearchRequest(input: any): {
  valid: boolean;
  error?: string;
} {
  const validation = ResearchRequestSchema.safeParse(input);
  if (!validation.success) {
    return {
      valid: false,
      error: validation.error.errors[0].message,
    };
  }

  // Check for blocked content
  const contentCheck = containsBlockedContent(input.topic);
  if (contentCheck.blocked) {
    return {
      valid: false,
      error: contentCheck.reason,
    };
  }

  return { valid: true };
}
