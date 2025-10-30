// Banking Service - Main entry point
// Abstracts banking providers and provides unified interface

import { BankingProvider, BankingProviderType, BankingConfig } from './types';
import { MockBankingProvider } from './providers/mock';
import { TrueLayerProvider } from './providers/truelayer';

export * from './types';

/**
 * Get the configured banking provider
 */
export function getBankingProvider(type?: BankingProviderType): BankingProvider {
  const providerType = type || (process.env.BANKING_PROVIDER as BankingProviderType) || 'mock';

  const config: BankingConfig = {
    provider: providerType,
    clientId: process.env.TRUELAYER_CLIENT_ID,
    clientSecret: process.env.TRUELAYER_CLIENT_SECRET,
    redirectUri: process.env.TRUELAYER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/banking/callback`,
    environment: (process.env.TRUELAYER_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  switch (providerType) {
    case 'truelayer':
      return new TrueLayerProvider(config);
    case 'mock':
      return new MockBankingProvider();
    default:
      console.warn(`Unknown banking provider: ${providerType}, falling back to mock`);
      return new MockBankingProvider();
  }
}

/**
 * Encryption helpers for storing tokens securely
 * In production, use proper encryption library like @aws-crypto/client-node
 */
export function encryptToken(token: string): string {
  // TODO: Implement proper encryption
  // For now, just base64 encode (NOT SECURE FOR PRODUCTION)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Implement proper token encryption before deploying to production');
  }
  return Buffer.from(token).toString('base64');
}

export function decryptToken(encryptedToken: string): string {
  // TODO: Implement proper decryption
  // For now, just base64 decode (NOT SECURE FOR PRODUCTION)
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Implement proper token decryption before deploying to production');
  }
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}
