'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui';

interface Intervention {
  id: string;
  triggerId: string;
  title: string;
  message: string;
  severity: string;
  suggestedAction?: string;
  calculatedImpact?: number;
  contextData?: any;
}

interface Props {
  userId?: string | null;
}

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: '🚨' };
    case 'warning':
      return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', icon: '⚠️' };
    case 'info':
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'ℹ️' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', icon: '💡' };
  }
};

export function InterventionsWidget({ userId }: Props) {
  const router = useRouter();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    checkInterventions();
  }, [userId]);

  const checkInterventions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interventions/check?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInterventions(data.interventions?.slice(0, 2) || []); // Show top 2
      }
    } catch (error) {
      console.error('Failed to fetch interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userId) {
    return null;
  }

  if (interventions.length === 0) {
    return null;
  }

  const hasCritical = interventions.some((i) => i.severity === 'critical');

  return (
    <Card hover className="cursor-pointer" onClick={() => router.push('/dashboard')}>
      <CardBody>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{hasCritical ? '🚨' : '⚠️'}</span>
            <div>
              <h3 className="font-bold text-gray-900">Alerts</h3>
              <p className="text-sm text-gray-600">
                {interventions.length} {interventions.length === 1 ? 'item' : 'items'} need your attention
              </p>
            </div>
          </div>
          {hasCritical && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-300">
              Action Required
            </span>
          )}
        </div>

        <div className="space-y-3">
          {interventions.map((intervention) => {
            const style = getSeverityStyle(intervention.severity);
            return (
              <div
                key={intervention.id}
                className={`p-4 rounded-lg border-2 ${style.bg} ${style.border}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm ${style.text} mb-1`}>
                      {intervention.title}
                    </h4>
                    <p className="text-xs text-gray-700 mb-2">{intervention.message}</p>
                    {intervention.suggestedAction && (
                      <p className="text-xs font-medium text-purple-700">
                        💡 {intervention.suggestedAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center text-sm text-purple-600 font-semibold">
          View All Insights →
        </div>
      </CardBody>
    </Card>
  );
}
