'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Region } from '@/lib/types';

interface NetWorthSnapshot {
  date: string;
  assets: number;
  debts: number;
  netWorth: number;
}

interface NetWorthDashboardProps {
  region: Region;
}

export function NetWorthDashboard({ region }: NetWorthDashboardProps) {
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [isAddingSnapshot, setIsAddingSnapshot] = useState(false);
  const [newSnapshot, setNewSnapshot] = useState({
    assets: '',
    debts: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('netWorthSnapshots');
    if (saved) {
      setSnapshots(JSON.parse(saved));
    } else {
      // Create initial snapshot
      const initial: NetWorthSnapshot = {
        date: new Date().toISOString(),
        assets: 0,
        debts: 0,
        netWorth: 0,
      };
      setSnapshots([initial]);
    }
  }, []);

  const saveSnapshots = (updatedSnapshots: NetWorthSnapshot[]) => {
    // Sort by date
    const sorted = [...updatedSnapshots].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setSnapshots(sorted);
    localStorage.setItem('netWorthSnapshots', JSON.stringify(sorted));
  };

  const addSnapshot = () => {
    const assets = parseFloat(newSnapshot.assets) || 0;
    const debts = parseFloat(newSnapshot.debts) || 0;

    const snapshot: NetWorthSnapshot = {
      date: new Date().toISOString(),
      assets,
      debts,
      netWorth: assets - debts,
    };

    saveSnapshots([...snapshots, snapshot]);
    setIsAddingSnapshot(false);
    setNewSnapshot({ assets: '', debts: '' });
  };

  const deleteSnapshot = (date: string) => {
    saveSnapshots(snapshots.filter(s => s.date !== date));
  };

  const currentNetWorth = snapshots.length > 0 ? snapshots[snapshots.length - 1].netWorth : 0;
  const previousNetWorth = snapshots.length > 1 ? snapshots[snapshots.length - 2].netWorth : currentNetWorth;
  const netWorthChange = currentNetWorth - previousNetWorth;
  const netWorthChangePercent = previousNetWorth !== 0
    ? ((netWorthChange / Math.abs(previousNetWorth)) * 100)
    : 0;

  const currentAssets = snapshots.length > 0 ? snapshots[snapshots.length - 1].assets : 0;
  const currentDebts = snapshots.length > 0 ? snapshots[snapshots.length - 1].debts : 0;

  // Calculate chart dimensions and path
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 40;

  const getChartPath = () => {
    if (snapshots.length === 0) return '';

    const values = snapshots.map(s => s.netWorth);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const range = maxValue - minValue || 1;

    const points = snapshots.map((snapshot, index) => {
      const x = padding + (index / (snapshots.length - 1 || 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((snapshot.netWorth - minValue) / range) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const getGradientPath = () => {
    if (snapshots.length === 0) return '';

    const values = snapshots.map(s => s.netWorth);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 0);
    const range = maxValue - minValue || 1;

    const points = snapshots.map((snapshot, index) => {
      const x = padding + (index / (snapshots.length - 1 || 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((snapshot.netWorth - minValue) / range) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    });

    const lastX = padding + (chartWidth - 2 * padding);
    const bottomY = chartHeight - padding;

    return `M ${points.join(' L ')} L ${lastX},${bottomY} L ${padding},${bottomY} Z`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Net Worth Tracker</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your wealth over time
          </p>
        </div>
        <button
          onClick={() => setIsAddingSnapshot(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          + Update Net Worth
        </button>
      </div>

      {/* Current Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium">Current Net Worth</p>
          <p className={`text-3xl font-bold ${currentNetWorth >= 0 ? 'text-gray-900' : 'text-gray-900'}`}>
            {formatCurrency(currentNetWorth, region)}
          </p>
          {snapshots.length > 1 && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-sm font-semibold ${netWorthChange >= 0 ? 'text-gray-700' : 'text-gray-700'}`}>
                {netWorthChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(netWorthChange), region)}
              </span>
              <span className="text-xs text-gray-600">
                ({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium">Total Assets</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentAssets, region)}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-700 font-medium">Total Debts</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentDebts, region)}</p>
        </div>
      </div>

      {/* Chart */}
      {snapshots.length > 1 ? (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Over Time</h3>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto"
            style={{ maxHeight: '300px' }}
          >
            {/* Gradient fill */}
            <defs>
              <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(0, 0, 0)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="rgb(0, 0, 0)" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1={padding}
                y1={padding + (i * (chartHeight - 2 * padding) / 4)}
                x2={chartWidth - padding}
                y2={padding + (i * (chartHeight - 2 * padding) / 4)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Zero line */}
            {snapshots.some(s => s.netWorth < 0) && (
              <line
                x1={padding}
                y1={chartHeight / 2}
                x2={chartWidth - padding}
                y2={chartHeight / 2}
                stroke="#6b7280"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            {/* Area under curve */}
            <path
              d={getGradientPath()}
              fill="url(#netWorthGradient)"
            />

            {/* Line */}
            <path
              d={getChartPath()}
              fill="none"
              stroke="rgb(0, 0, 0)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {snapshots.map((snapshot, index) => {
              const values = snapshots.map(s => s.netWorth);
              const minValue = Math.min(...values, 0);
              const maxValue = Math.max(...values, 0);
              const range = maxValue - minValue || 1;

              const x = padding + (index / (snapshots.length - 1 || 1)) * (chartWidth - 2 * padding);
              const y = chartHeight - padding - ((snapshot.netWorth - minValue) / range) * (chartHeight - 2 * padding);

              return (
                <g key={snapshot.date}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="white"
                    stroke="rgb(0, 0, 0)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="transparent"
                    className="cursor-pointer"
                  >
                    <title>{formatDate(snapshot.date)}: {formatCurrency(snapshot.netWorth, region)}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-12 text-center mb-6">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add more data points</h3>
          <p className="text-gray-600">Update your net worth regularly to see your progress over time</p>
        </div>
      )}

      {/* History Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
        <div className="space-y-2">
          {[...snapshots].reverse().map((snapshot, index) => {
            const isLatest = index === 0;
            return (
              <div
                key={snapshot.date}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isLatest ? 'bg-gray-100 border-2 border-gray-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {formatDate(snapshot.date)}
                    </p>
                    {isLatest && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-black text-white rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Assets: {formatCurrency(snapshot.assets, region)} • Debts: {formatCurrency(snapshot.debts, region)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${snapshot.netWorth >= 0 ? 'text-gray-900' : 'text-gray-900'}`}>
                      {formatCurrency(snapshot.netWorth, region)}
                    </p>
                  </div>
                  {!isLatest && (
                    <button
                      onClick={() => deleteSnapshot(snapshot.date)}
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Snapshot Modal */}
      {isAddingSnapshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Net Worth</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your current total assets and debts
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Assets
                  <span className="text-xs text-gray-500 ml-2">(savings, investments, property value, etc.)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSnapshot.assets}
                  onChange={(e) => setNewSnapshot({ ...newSnapshot, assets: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Debts
                  <span className="text-xs text-gray-500 ml-2">(loans, credit cards, etc.)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSnapshot.debts}
                  onChange={(e) => setNewSnapshot({ ...newSnapshot, debts: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Preview */}
              {(newSnapshot.assets || newSnapshot.debts) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Your Net Worth</p>
                  <p className={`text-2xl font-bold ${
                    (parseFloat(newSnapshot.assets) || 0) - (parseFloat(newSnapshot.debts) || 0) >= 0
                      ? 'text-gray-900'
                      : 'text-gray-900'
                  }`}>
                    {formatCurrency(
                      (parseFloat(newSnapshot.assets) || 0) - (parseFloat(newSnapshot.debts) || 0),
                      region
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingSnapshot(false);
                  setNewSnapshot({ assets: '', debts: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSnapshot}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
