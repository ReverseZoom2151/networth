// Plaid Banking Provider
// US/Canada Open Banking integration
// Docs: https://plaid.com/docs/

import {
  BankingProvider,
  BankAccount,
  BankTransaction,
  BankConnectionAuth,
  BankConnectionResult,
  BankingConfig,
} from '../types';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

export class PlaidProvider implements BankingProvider {
  name = 'plaid';
  private client: PlaidApi;
  private environment: string;

  constructor(config: BankingConfig) {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      throw new Error('Plaid CLIENT_ID and SECRET are required');
    }

    // Determine Plaid environment
    this.environment = config.environment === 'production' ? 'production' : 'sandbox';

    const plaidEnv =
      config.environment === 'production'
        ? PlaidEnvironments.production
        : PlaidEnvironments.sandbox;

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: plaidEnv,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  /**
   * Generate Plaid Link token for frontend
   * Plaid uses Link token (not OAuth URL like TrueLayer)
   */
  async getAuthUrl(userId: string, redirectUri: string): Promise<BankConnectionAuth> {
    try {
      // Create Link token
      const response = await this.client.linkTokenCreate({
        user: {
          client_user_id: userId,
        },
        client_name: 'Networth Finance Coach',
        products: [Products.Transactions, Products.Auth],
        country_codes: [CountryCode.Us, CountryCode.Ca],
        language: 'en',
        redirect_uri: redirectUri,
      });

      const linkToken = response.data.link_token;
      const state = `plaid_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Return link token as "authUrl" (frontend will use this differently)
      return {
        authUrl: linkToken, // This is actually the link token, not a URL
        state,
      };
    } catch (error: any) {
      console.error('Plaid link token creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create Plaid Link token: ${error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   * In Plaid, the "code" is the public_token from Link
   */
  async exchangeCode(publicToken: string, state: string): Promise<BankConnectionResult> {
    try {
      // Exchange public token for access token
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      // Access tokens don't expire in Plaid, but we set a far future date
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10);

      return {
        accessToken,
        refreshToken: '', // Plaid doesn't use refresh tokens
        expiresAt,
        accountId: itemId,
      };
    } catch (error: any) {
      console.error('Plaid token exchange failed:', error.response?.data || error.message);
      throw new Error(`Failed to exchange Plaid public token: ${error.message}`);
    }
  }

  /**
   * Plaid access tokens don't expire, so refresh is not needed
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    // Plaid access tokens don't expire
    throw new Error('Plaid access tokens do not need refreshing');
  }

  /**
   * Get all accounts for an access token
   */
  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((account) => ({
        id: account.account_id,
        accountName: account.name,
        accountType: this.mapAccountType(account.type, account.subtype || ''),
        currency: 'USD', // Plaid defaults to USD
        currentBalance: account.balances.current || 0,
        availableBalance: account.balances.available || account.balances.current || 0,
        accountNumber: account.mask ?? undefined, // Last 4 digits, convert null to undefined
      }));
    } catch (error: any) {
      console.error('Plaid accounts fetch failed:', error.response?.data || error.message);
      throw new Error(`Failed to fetch accounts from Plaid: ${error.message}`);
    }
  }

  /**
   * Get balance for a specific account
   */
  async getBalance(
    accessToken: string,
    accountId: string
  ): Promise<{ current: number; available: number }> {
    try {
      const response = await this.client.accountsBalanceGet({
        access_token: accessToken,
        options: {
          account_ids: [accountId],
        },
      });

      const account = response.data.accounts.find((acc) => acc.account_id === accountId);

      if (!account) {
        throw new Error('Account not found');
      }

      return {
        current: account.balances.current || 0,
        available: account.balances.available || account.balances.current || 0,
      };
    } catch (error: any) {
      console.error('Plaid balance fetch failed:', error.response?.data || error.message);
      throw new Error(`Failed to fetch balance from Plaid: ${error.message}`);
    }
  }

  /**
   * Get transactions for a date range
   */
  async getTransactions(
    accessToken: string,
    accountId: string,
    from: Date,
    to: Date
  ): Promise<BankTransaction[]> {
    try {
      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: this.formatDate(from),
        end_date: this.formatDate(to),
        options: {
          account_ids: [accountId],
          count: 500,
          offset: 0,
        },
      });

      return response.data.transactions.map((tx) => ({
        id: tx.transaction_id,
        amount: Math.abs(tx.amount), // Plaid uses negative for debits
        currency: tx.iso_currency_code || 'USD',
        description: tx.name,
        merchantName: tx.merchant_name || undefined,
        category: tx.category?.[0] || 'Other',
        type: tx.amount < 0 ? 'debit' : 'credit',
        transactionDate: new Date(tx.date),
        postedDate: new Date(tx.date),
        pending: tx.pending,
      }));
    } catch (error: any) {
      console.error('Plaid transactions fetch failed:', error.response?.data || error.message);
      throw new Error(`Failed to fetch transactions from Plaid: ${error.message}`);
    }
  }

  /**
   * Remove an item (disconnect account)
   */
  async disconnect(accessToken: string): Promise<void> {
    try {
      await this.client.itemRemove({
        access_token: accessToken,
      });
    } catch (error: any) {
      console.error('Plaid disconnect failed:', error.response?.data || error.message);
      throw new Error(`Failed to disconnect from Plaid: ${error.message}`);
    }
  }

  /**
   * Map Plaid account types to our standard types
   */
  private mapAccountType(type: string, subtype: string): 'checking' | 'savings' | 'credit_card' {
    if (type === 'credit') {
      return 'credit_card';
    }

    if (type === 'depository') {
      if (subtype === 'savings' || subtype === 'money market') {
        return 'savings';
      }
      return 'checking'; // checking, CD, etc.
    }

    // Default to checking for other types
    return 'checking';
  }

  /**
   * Format date to YYYY-MM-DD for Plaid API
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
