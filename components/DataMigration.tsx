'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

interface MigrationResult {
  success: boolean;
  migrated: string[];
  errors?: string[];
}

export default function DataMigration({ userId }: { userId: string }) {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [exporting, setExporting] = useState(false);

  const checkLocalStorage = () => {
    const keys = [
      'networth_preferences',
      'networth_budgets',
      'networth_goals',
      'networth_transactions',
      'networth_guilty_pleasures',
    ];

    const foundData: any = {};
    let hasData = false;

    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          foundData[key.replace('networth_', '')] = JSON.parse(data);
          hasData = true;
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      }
    }

    return { hasData, data: foundData };
  };

  const migrateData = async () => {
    setMigrating(true);
    setResult(null);

    try {
      const { hasData, data } = checkLocalStorage();

      if (!hasData) {
        setResult({
          success: false,
          migrated: [],
          errors: ['No data found in localStorage'],
        });
        return;
      }

      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data }),
      });

      const migrationResult = await response.json();
      setResult(migrationResult);

      // Clear localStorage if migration was successful
      if (migrationResult.success) {
        const keysToClear = [
          'networth_preferences',
          'networth_budgets',
          'networth_goals',
          'networth_transactions',
          'networth_guilty_pleasures',
        ];

        keysToClear.forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        migrated: [],
        errors: ['Failed to connect to migration service'],
      });
    } finally {
      setMigrating(false);
    }
  };

  const exportData = async () => {
    setExporting(true);

    try {
      const response = await fetch(`/api/migrate/export?userId=${userId}`);
      const data = await response.json();

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `networth-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const { hasData } = checkLocalStorage();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Data Management</h2>
        <p className="text-gray-600">Migrate and backup your financial data</p>
      </div>

      {/* Migration Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">📦</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Migrate from localStorage</h3>
            <p className="text-gray-600 mb-4">
              {hasData
                ? 'We found data in your browser storage. Migrate it to our secure database for better reliability and sync across devices.'
                : 'No data found in browser storage. All your data is safely stored in the database.'}
            </p>

            {hasData && (
              <button
                onClick={migrateData}
                disabled={migrating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {migrating ? 'Migrating...' : 'Migrate Data'}
              </button>
            )}

            {/* Migration Result */}
            {result && (
              <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className="font-semibold mb-2">
                  {result.success ? '✓ Migration Successful' : '⚠️ Migration Completed with Issues'}
                </p>

                {result.migrated.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Migrated:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {result.migrated.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Export Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💾</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Export Data Backup</h3>
            <p className="text-gray-600 mb-4">
              Download a complete backup of your financial data as a JSON file. Keep it safe for
              your records or to import elsewhere.
            </p>

            <button
              onClick={exportData}
              disabled={exporting}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 About Data Storage:</strong> We've moved from browser localStorage to a
          secure database for better reliability, data persistence, and future sync capabilities.
          Your data is encrypted and stored securely.
        </p>
      </Card>
    </div>
  );
}
