'use client';

import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui';

interface PlaidLinkProps {
  userId: string;
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
}

export function PlaidLink({ userId, onSuccess, onExit }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch link token from backend
   */
  const fetchLinkToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/banking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider: 'plaid',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch link token');
      }

      const data = await response.json();

      // For Plaid, authUrl is actually the link token
      setLinkToken(data.authUrl);
    } catch (err) {
      console.error('Error fetching link token:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Plaid Link');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful connection
   */
  const handleOnSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        // Exchange public token for access token
        const response = await fetch('/api/banking/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: publicToken,
            state: `plaid_${userId}_${Date.now()}`,
            userId,
            provider: 'plaid',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to connect bank account');
        }

        const data = await response.json();
        console.log('Bank account connected:', data);

        // Call success callback
        if (onSuccess) {
          onSuccess(publicToken, metadata);
        }

        // Reload the page or trigger a refresh
        window.location.reload();
      } catch (err) {
        console.error('Error exchanging token:', err);
        setError('Failed to complete bank connection');
      }
    },
    [userId, onSuccess]
  );

  /**
   * Handle Link exit/error
   */
  const handleOnExit = useCallback(
    (error: any, metadata: any) => {
      if (error) {
        console.error('Plaid Link error:', error);
        setError(error.display_message || 'Connection cancelled');
      }

      if (onExit) {
        onExit(error, metadata);
      }
    },
    [onExit]
  );

  /**
   * Initialize Plaid Link
   */
  const config = linkToken
    ? {
        token: linkToken,
        onSuccess: handleOnSuccess,
        onExit: handleOnExit,
      }
    : null;

  const { open, ready } = usePlaidLink(config || { token: '', onSuccess: () => {}, onExit: () => {} });

  /**
   * Handle button click
   */
  const handleClick = async () => {
    if (!linkToken) {
      await fetchLinkToken();
      // Link will open automatically once ready
    } else {
      open();
    }
  };

  // Auto-open Link when ready
  if (ready && linkToken && !error) {
    open();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        onClick={handleClick}
        disabled={loading || (linkToken !== null && !ready)}
        variant="primary"
        className="w-full"
      >
        {loading ? (
          'Initializing...'
        ) : linkToken ? (
          ready ? 'Connect Bank Account' : 'Loading...'
        ) : (
          'Connect Bank Account'
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Your banking data is encrypted and secure
        <br />
        We use bank-level security to protect your information
      </p>
    </div>
  );
}
