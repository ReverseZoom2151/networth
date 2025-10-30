// Custom hook for automatic data persistence
// Replaces localStorage with database persistence

import { useEffect, useCallback, useRef } from 'react';

interface PersistenceOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Hook to automatically persist data to database instead of localStorage
 */
export function useDataPersistence<T>(
  key: string,
  data: T | null,
  userId: string,
  options: PersistenceOptions = {}
) {
  const { debounceMs = 1000, onError, onSuccess } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string | null>(null);

  const persistData = useCallback(async () => {
    if (!data || !userId) return;

    try {
      // Convert data to JSON string for comparison
      const dataStr = JSON.stringify(data);

      // Skip if data hasn't changed
      if (dataStr === previousDataRef.current) return;

      previousDataRef.current = dataStr;

      // Persist based on data type
      const endpoint = getEndpointForKey(key);
      if (!endpoint) {
        console.warn(`No persistence endpoint for key: ${key}`);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (!response.ok) {
        throw new Error(`Failed to persist ${key}: ${response.statusText}`);
      }

      onSuccess?.();
    } catch (error) {
      console.error(`Error persisting ${key}:`, error);
      onError?.(error as Error);
    }
  }, [data, userId, key, onError, onSuccess]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced persistence
    timeoutRef.current = setTimeout(() => {
      persistData();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [persistData, debounceMs]);
}

/**
 * Get API endpoint for a given data key
 */
function getEndpointForKey(key: string): string | null {
  const endpointMap: Record<string, string> = {
    preferences: '/api/user/preferences',
    budgets: '/api/budgets',
    goals: '/api/goals',
    transactions: '/api/transactions',
    guilty_pleasures: '/api/guilty-pleasures',
    widgets: '/api/widgets',
    streaks: '/api/streaks',
  };

  return endpointMap[key] || null;
}

/**
 * Hook to load data from database (replaces localStorage.getItem)
 */
export function useLoadData<T>(key: string, userId: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint = getEndpointForKey(key);
      if (!endpoint) {
        throw new Error(`No endpoint for key: ${key}`);
      }

      const response = await fetch(`${endpoint}?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to load ${key}: ${response.statusText}`);
      }

      const loadedData = await response.json();
      setData(loadedData);
    } catch (err) {
      setError(err as Error);
      console.error(`Error loading ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, reload: loadData };
}

// Add missing import
import { useState } from 'react';

/**
 * Hook for syncing specific field to database
 */
export function useSyncField(
  endpoint: string,
  userId: string,
  fieldName: string,
  debounceMs: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncField = useCallback(
    async (value: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              [fieldName]: value,
            }),
          });
        } catch (error) {
          console.error(`Failed to sync ${fieldName}:`, error);
        }
      }, debounceMs);
    },
    [endpoint, userId, fieldName, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return syncField;
}

/**
 * Hook to check if localStorage migration is needed
 */
export function useMigrationCheck(): {
  needsMigration: boolean;
  localStorageKeys: string[];
} {
  const [needsMigration, setNeedsMigration] = useState(false);
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    const keysToCheck = [
      'networth_preferences',
      'networth_budgets',
      'networth_goals',
      'networth_transactions',
      'networth_guilty_pleasures',
    ];

    const foundKeys = keysToCheck.filter((key) => {
      const value = localStorage.getItem(key);
      return value !== null && value !== 'null' && value !== '[]' && value !== '{}';
    });

    setLocalStorageKeys(foundKeys);
    setNeedsMigration(foundKeys.length > 0);
  }, []);

  return { needsMigration, localStorageKeys };
}
