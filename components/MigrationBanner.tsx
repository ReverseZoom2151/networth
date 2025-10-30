'use client';

import { useState } from 'react';
import { useMigrationCheck } from '@/hooks/useDataPersistence';
import { Card } from '@/components/ui';

export default function MigrationBanner({ userId }: { userId: string }) {
  const { needsMigration, localStorageKeys } = useMigrationCheck();
  const [dismissed, setDismissed] = useState(false);
  const [migrating, setMigrating] = useState(false);

  if (!needsMigration || dismissed) {
    return null;
  }

  const handleMigrate = async () => {
    setMigrating(true);

    try {
      // Collect data from localStorage
      const data: any = {};

      for (const key of localStorageKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const cleanKey = key.replace('networth_', '');
            data[cleanKey] = JSON.parse(value);
          } catch (e) {
            console.error(`Failed to parse ${key}:`, e);
          }
        }
      }

      // Call migration API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      if (response.ok) {
        // Clear localStorage on success
        localStorageKeys.forEach((key) => localStorage.removeItem(key));
        setDismissed(true);

        // Show success message
        alert('Data migrated successfully! Your data is now safely stored in our database.');

        // Reload page to reflect changes
        window.location.reload();
      } else {
        alert('Migration failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed. Please try again or contact support.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-500 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Data Migration Available</h3>
          <p className="text-sm text-gray-700 mb-3">
            We found {localStorageKeys.length} data {localStorageKeys.length === 1 ? 'item' : 'items'} in your browser storage.
            Migrate them to our secure database for better reliability and to access your data across devices.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {migrating ? 'Migrating...' : 'Migrate Now'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg border hover:bg-gray-50"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
