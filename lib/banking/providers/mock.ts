// Mock Banking Provider
// For development and testing without real banking API

import {
  BankingProvider,
  BankAccount,
  BankTransaction,
  BankConnectionAuth,
  BankConnectionResult,
} from '../types';

export class MockBankingProvider implements BankingProvider {
  name = 'mock';

  async getAuthUrl(userId: string, redirectUri: string): Promise<BankConnectionAuth> {
    // Generate mock auth URL
    const state = `mock_${userId}_${Date.now()}`;
    const authUrl = `${redirectUri}?code=mock_code_${userId}&state=${state}`;

    return { authUrl, state };
  }

  async exchangeCode(code: string, state: string): Promise<BankConnectionResult> {
    // Mock token exchange
    return {
      accessToken: `mock_access_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      accountId: `mock_account_${Date.now()}`,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
    return {
      accessToken: `mock_access_refreshed_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    // Return mock accounts
    return [
      {
        id: 'mock_checking_1',
        accountName: 'Current Account',
        accountType: 'checking',
        currency: 'GBP',
        currentBalance: 2547.83,
        availableBalance: 2547.83,
        accountNumber: '1234',
        sortCode: '12-34-56',
      },
      {
        id: 'mock_savings_1',
        accountName: 'Savings Account',
        accountType: 'savings',
        currency: 'GBP',
        currentBalance: 10250.0,
        availableBalance: 10250.0,
        accountNumber: '5678',
        sortCode: '12-34-56',
      },
    ];
  }

  async getBalance(
    accessToken: string,
    accountId: string
  ): Promise<{ current: number; available: number }> {
    // Return mock balance
    if (accountId.includes('checking')) {
      return { current: 2547.83, available: 2547.83 };
    }
    return { current: 10250.0, available: 10250.0 };
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    from: Date,
    to: Date
  ): Promise<BankTransaction[]> {
    // Generate mock transactions
    const transactions: BankTransaction[] = [];
    const categories = [
      'Food & Dining',
      'Shopping',
      'Transport',
      'Bills',
      'Entertainment',
      'Groceries',
    ];
    const merchants = [
      'Tesco',
      'Sainsburys',
      'Amazon',
      'Starbucks',
      'Uber',
      'Netflix',
      'Spotify',
      'Costa Coffee',
      'Pret A Manger',
      'Transport for London',
    ];

    // Generate 30 days of transactions
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // 2-4 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < transactionsPerDay; j++) {
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        const amount = -(Math.random() * 50 + 5); // £5 - £55

        transactions.push({
          id: `mock_tx_${i}_${j}`,
          amount,
          currency: 'GBP',
          description: `Payment to ${merchant}`,
          merchantName: merchant,
          category: categories[Math.floor(Math.random() * categories.length)],
          type: 'debit',
          transactionDate: date,
          postedDate: date,
          pending: false,
        });
      }
    }

    // Add some income
    transactions.push({
      id: 'mock_tx_salary',
      amount: 2000,
      currency: 'GBP',
      description: 'Salary Payment',
      merchantName: 'Employer Ltd',
      category: 'Income',
      type: 'credit',
      transactionDate: new Date(new Date().setDate(1)), // First of month
      postedDate: new Date(new Date().setDate(1)),
      pending: false,
    });

    return transactions.filter(
      (tx) => tx.transactionDate >= from && tx.transactionDate <= to
    );
  }

  async disconnect(accessToken: string): Promise<void> {
    // Mock disconnect
    return Promise.resolve();
  }
}
