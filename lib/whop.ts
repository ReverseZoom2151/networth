/**
 * Whop API Integration
 *
 * Company Mode - for your own $10/month subscription product
 *
 * Required environment variables:
 * - WHOP_API_KEY (server-side only)
 * - NEXT_PUBLIC_WHOP_COMPANY_ID (your company ID)
 */

import Whop from '@whop/sdk';

/**
 * Check if app is running inside Whop iframe
 */
export function isInWhop(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return false;
  }
}

/**
 * Get Whop user ID from environment
 * In production, this will come from Whop's authentication
 */
export function getWhopUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || null;
}

// Initialize Whop client (server-side only)
let whopClientInstance: Whop | null = null;

function getWhopClient(): Whop | null {
  if (!process.env.WHOP_API_KEY) {
    return null;
  }

  if (!whopClientInstance) {
    whopClientInstance = new Whop({
      apiKey: process.env.WHOP_API_KEY,
    });
  }

  return whopClientInstance;
}

/**
 * Check if a user has an active membership/subscription
 * @param userId - The Whop user ID
 * @returns boolean - true if user has active subscription
 */
export async function checkUserHasAccess(userId: string): Promise<boolean> {
  const client = getWhopClient();

  if (!client) {
    // Development mode - allow access if no API key
    console.warn('WHOP_API_KEY not set - allowing access in development');
    return true;
  }

  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

    if (!companyId) {
      console.error('NEXT_PUBLIC_WHOP_COMPANY_ID not set');
      return false;
    }

    // List all memberships for your company
    const response = await client.memberships.list({
      company_id: companyId,
    });

    // Check if any memberships match this user and are valid
    const userMemberships = response.data.filter((m: any) =>
      m.user?.id === userId && m.valid === true
    );
    return userMemberships.length > 0;
  } catch (error) {
    console.error('Error checking Whop membership:', error);
    // In development, allow access on error
    if (process.env.NODE_ENV === 'development') {
      console.warn('Allowing access in development mode');
      return true;
    }
    return false;
  }
}

/**
 * Get user's active memberships
 * @param userId - The Whop user ID
 * @returns Array of active memberships
 */
export async function getUserMemberships(userId: string) {
  const client = getWhopClient();

  if (!client) {
    return [];
  }

  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

    if (!companyId) {
      console.error('NEXT_PUBLIC_WHOP_COMPANY_ID not set');
      return [];
    }

    const response = await client.memberships.list({
      company_id: companyId,
    });

    // Filter to user's valid memberships
    return response.data.filter((m: any) =>
      m.user?.id === userId && m.valid === true
    );
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return [];
  }
}

/**
 * Get company checkout URL for subscription
 * @returns The checkout URL for your product
 */
export function getCheckoutUrl(): string {
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

  if (!companyId) {
    console.error('NEXT_PUBLIC_WHOP_COMPANY_ID not set');
    return 'https://whop.com';
  }

  // Return the company checkout URL
  // Format: https://whop.com/checkout/{company_id}
  return `https://whop.com/checkout/${companyId}`;
}
