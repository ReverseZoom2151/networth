// Banking API Types
// Common interfaces for all banking providers (TrueLayer, Plaid, Mock)

export interface BankAccount {
  id: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit_card';
  currency: string;
  currentBalance: number;
  availableBalance: number;
  accountNumber?: string; // Last 4 digits
  sortCode?: string;
}

export interface BankTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  category: string;
  type: 'debit' | 'credit';
  transactionDate: Date;
  postedDate?: Date;
  pending?: boolean;
}

export interface BankConnectionAuth {
  authUrl: string;
  state: string;
}

export interface BankConnectionResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  accountId: string;
}

export interface BankingProvider {
  name: string;

  // Authentication
  getAuthUrl(userId: string, redirectUri: string): Promise<BankConnectionAuth>;
  exchangeCode(code: string, state: string): Promise<BankConnectionResult>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }>;

  // Account data
  getAccounts(accessToken: string): Promise<BankAccount[]>;
  getBalance(accessToken: string, accountId: string): Promise<{ current: number; available: number }>;
  getTransactions(
    accessToken: string,
    accountId: string,
    from: Date,
    to: Date
  ): Promise<BankTransaction[]>;

  // Utilities
  disconnect(accessToken: string): Promise<void>;
}

export type BankingProviderType = 'truelayer' | 'plaid' | 'mock';

export interface BankingConfig {
  provider: BankingProviderType;
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}
