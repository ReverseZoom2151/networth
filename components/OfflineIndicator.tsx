'use client';

import { useEffect, useState } from 'react';
import { network } from '@/lib/mobile';

/**
 * Offline indicator that shows when user loses connection
 * Monitors network status and displays banner when offline
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status
    network.getStatus().then((status) => {
      setIsOnline(status.connected);
      setShowBanner(!status.connected);
    });

    // Listen for network changes
    network.addListener((connected) => {
      setIsOnline(connected);

      if (!connected) {
        // Show offline banner
        setShowBanner(true);
      } else {
        // Hide banner after short delay when back online
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      }
    });
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOnline ? 'bg-green-600' : 'bg-red-600'
        } text-white px-4 py-3 text-center text-sm font-medium shadow-lg`}
      >
        {isOnline ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Back online</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>No internet connection</span>
          </div>
        )}
      </div>
    </div>
  );
}
