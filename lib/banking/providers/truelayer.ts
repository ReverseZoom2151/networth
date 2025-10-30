// TrueLayer Banking Provider
// UK Open Banking integration
// Docs: https://docs.truelayer.com/

import {
  BankingProvider,
  BankAccount,
  BankTransaction,
  BankConnectionAuth,
  BankConnectionResult,
  BankingConfig,
} from '../types';

export class TrueLayerProvider implements BankingProvider {
  name = 'truelayer';
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;

  constructor(config: BankingConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('TrueLayer clientId and clientSecret are required');
    }

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.truelayer.com'
        : 'https://api.truelayer-sandbox.com';
  }

  async getAuthUrl(userId: string, redirectUri: string): Promise<BankConnectionAuth> {
    // Generate state for security
    const state = `tl_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // TrueLayer Auth URL
    const authUrl = new URL('https://auth.truelayer.com');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'info accounts balance transactions offline_access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('providers', 'uk-ob-all uk-oauth-all'); // All UK banks

    return {
      authUrl: authUrl.toString(),
      state,
    };
  }

  async exchangeCode(code: string, state: string): Promise<BankConnectionResult> {
    // Exchange authorization code for tokens
    const response = await fetch(`${this.baseUrl}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`TrueLayer token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      accountId: '', // Will be populated when fetching accounts
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    const response = await fetch(`${this.baseUrl}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('TrueLayer token refresh failed');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    const response = await fetch(`${this.baseUrl}/data/v1/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts from TrueLayer');
    }

    const data = await response.json();

    return data.results.map((account: any) => ({
      id: account.account_id,
      accountName: account.display_name || account.account_type,
      accountType: this.mapAccountType(account.account_type),
      currency: account.currency,
      currentBalance: account.current || 0,
      availableBalance: account.available || 0,
      accountNumber: account.account_number?.number?.slice(-4),
      sortCode: account.account_number?.sort_code,
    }));
  }

  async getBalance(
    accessToken: string,
    accountId: string
  ): Promise<{ current: number; available: number }> {
    const response = await fetch(`${this.baseUrl}/data/v1/accounts/${accountId}/balance`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch balance from TrueLayer');
    }

    const data = await response.json();

    return {
      current: data.results[0]?.current || 0,
      available: data.results[0]?.available || 0,
    };
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    from: Date,
    to: Date
  ): Promise<BankTransaction[]> {
    const url = new URL(`${this.baseUrl}/data/v1/accounts/${accountId}/transactions`);
    url.searchParams.set('from', from.toISOString().split('T')[0]);
    url.searchParams.set('to', to.toISOString().split('T')[0]);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions from TrueLayer');
    }

    const data = await response.json();

    return data.results.map((tx: any) => ({
      id: tx.transaction_id,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      merchantName: tx.merchant_name,
      category: tx.transaction_category || 'Other',
      type: tx.amount >= 0 ? 'credit' : 'debit',
      transactionDate: new Date(tx.timestamp),
      postedDate: new Date(tx.timestamp),
      pending: false,
    }));
  }

  async disconnect(accessToken: string): Promise<void> {
    // TrueLayer doesn't require explicit disconnection
    // Tokens can be revoked or will expire naturally
    return Promise.resolve();
  }

  private mapAccountType(trueLayerType: string): 'checking' | 'savings' | 'credit_card' {
    switch (trueLayerType.toLowerCase()) {
      case 'transaction':
      case 'current':
        return 'checking';
      case 'savings':
        return 'savings';
      case 'credit_card':
        return 'credit_card';
      default:
        return 'checking';
    }
  }
}
