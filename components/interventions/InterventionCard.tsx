'use client';

interface Intervention {
  id: string;
  triggerType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  suggestedAction: string | null;
  icon: string | null;
  calculatedImpact: number | null;
}

interface InterventionCardProps {
  intervention: Intervention;
  onViewDetails: () => void;
  onDismiss: () => void;
}

export default function InterventionCard({
  intervention,
  onViewDetails,
  onDismiss,
}: InterventionCardProps) {
  const getSeverityStyle = () => {
    switch (intervention.severity) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const style = getSeverityStyle();

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-5 shadow-sm animate-slide-up`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <span className="text-4xl flex-shrink-0">{intervention.icon || '💡'}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className={`text-xs uppercase tracking-wide font-bold ${style.text}`}>
                {intervention.severity}
              </span>
              <h3 className="font-bold text-gray-900 text-lg mt-1">{intervention.title}</h3>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-700 text-sm mb-3">{intervention.message}</p>

          {/* Impact Badge */}
          {intervention.calculatedImpact !== null && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full mb-3">
              <span className="text-sm">💰</span>
              <span className="text-sm font-semibold text-gray-900">
                ${Math.abs(intervention.calculatedImpact).toLocaleString()}/month impact
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className={`${style.button} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
            >
              View Details
            </button>
            {intervention.suggestedAction && (
              <button
                onClick={onViewDetails}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Take Action
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
