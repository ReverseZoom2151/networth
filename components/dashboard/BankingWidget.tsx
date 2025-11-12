'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from '@/components/ui';
import { PlaidLink } from '@/components/banking/PlaidLink';

interface BankAccount {
  id: string;
  accountName: string;
  accountType: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  provider: string;
  lastSynced: string | null;
  isActive: boolean;
}

interface BankingWidgetProps {
  userId: string;
}

export function BankingWidget({ userId }: BankingWidgetProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  const loadAccounts = async () => {
    try {
      const response = await fetch(`/api/banking/accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/banking/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, days: 30 }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Synced ${data.transactions} transactions from ${data.accounts} accounts`);
        await loadAccounts(); // Reload accounts to show updated lastSynced
      }
    } catch (error) {
      console.error('Failed to sync transactions:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatAccountType = (type: string) => {
    switch (type) {
      case 'checking':
        return '💳 Checking';
      case 'savings':
        return '💰 Savings';
      case 'credit_card':
        return '💳 Credit Card';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatLastSynced = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card id="connect-bank-widget">
      <CardBody className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🏦 Connected Accounts</h3>
              <p className="text-sm text-gray-600 mt-1">
                {accounts.length === 0
                  ? 'Connect your bank for automatic tracking'
                  : `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`}
              </p>
            </div>
            {accounts.length > 0 && (
              <Button
                onClick={syncTransactions}
                disabled={syncing}
                variant="secondary"
                size="sm"
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync'}
              </Button>
            )}
          </div>

          {/* Connected Accounts List */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatAccountType(account.accountType)}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm text-gray-700">{account.accountName}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(account.currentBalance, account.currency)}
                        </p>
                        {account.availableBalance !== account.currentBalance && (
                          <p className="text-xs text-gray-600">
                            Available: {formatCurrency(account.availableBalance, account.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.isActive ? '✓ Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        Synced {formatLastSynced(account.lastSynced)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connect Button */}
          {!showConnectModal ? (
            <Button
              onClick={() => setShowConnectModal(true)}
              variant="primary"
              className="w-full"
            >
              {accounts.length === 0 ? '+ Connect Bank Account' : '+ Add Another Account'}
            </Button>
          ) : (
            <div className="space-y-3">
              <PlaidLink
                userId={userId}
                onSuccess={() => {
                  setShowConnectModal(false);
                  loadAccounts();
                }}
                onExit={() => setShowConnectModal(false)}
              />
              <Button
                onClick={() => setShowConnectModal(false)}
                variant="secondary"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Benefits */}
          {accounts.length === 0 && (
            <div className="mt-4 rounded-lg border border-border/60 bg-surface px-4 py-3">
              <p className="mb-2 text-sm font-semibold text-foreground">Why connect your bank?</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>✓ Automatic transaction tracking</li>
                <li>✓ Real-time balance updates</li>
                <li>✓ AI-powered spending insights</li>
                <li>✓ Personalized savings recommendations</li>
              </ul>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
