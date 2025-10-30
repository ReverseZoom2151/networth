'use client';

import { useState, useEffect } from 'react';

interface ActiveIntervention {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  icon: string | null;
}

interface InterventionBannerProps {
  userId: string;
  onViewDetails: (interventionId: string) => void;
}

export default function InterventionBanner({ userId, onViewDetails }: InterventionBannerProps) {
  const [intervention, setIntervention] = useState<ActiveIntervention | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActiveIntervention();
  }, [userId]);

  const fetchActiveIntervention = async () => {
    try {
      const response = await fetch(`/api/interventions/active?userId=${userId}&limit=1`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.length > 0) {
        setIntervention(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch active intervention:', error);
    }
  };

  const handleDismiss = async () => {
    if (!intervention) return;

    try {
      await fetch('/api/interventions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, interventionId: intervention.id }),
      });

      setDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss intervention:', error);
    }
  };

  if (!intervention || dismissed) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (intervention.severity) {
      case 'urgent':
        return 'bg-gradient-to-r from-red-600 to-rose-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-600 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
    }
  };

  return (
    <div className={`${getBackgroundColor()} text-white shadow-lg animate-slide-down`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{intervention.icon || '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{intervention.title}</p>
              <p className="text-xs opacity-90 line-clamp-1">{intervention.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onViewDetails(intervention.id)}
              className="px-4 py-1.5 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              View
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
