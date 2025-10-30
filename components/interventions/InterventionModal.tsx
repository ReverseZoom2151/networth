'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Intervention {
  id: string;
  triggerType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  suggestedAction: string | null;
  alternativeOptions: string[];
  icon: string | null;
  color: string | null;
  calculatedImpact: number | null;
  contextData: any;
}

interface InterventionModalProps {
  intervention: Intervention;
  userId: string;
  onClose: () => void;
  onTakeAction: () => void;
  onDismiss: () => void;
}

export default function InterventionModal({
  intervention,
  userId,
  onClose,
  onTakeAction,
  onDismiss,
}: InterventionModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSeverityColor = () => {
    switch (intervention.severity) {
      case 'urgent':
        return {
          bg: 'bg-red-600',
          text: 'text-red-600',
          light: 'bg-red-50',
          border: 'border-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-orange-600',
          text: 'text-orange-600',
          light: 'bg-orange-50',
          border: 'border-orange-200',
        };
      default:
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-600',
          light: 'bg-blue-50',
          border: 'border-blue-200',
        };
    }
  };

  const handleTakeAction = async () => {
    setIsSubmitting(true);
    await onTakeAction();
    setIsSubmitting(false);
  };

  const handleDismiss = async () => {
    setIsSubmitting(true);

    try {
      await fetch('/api/interventions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          interventionId: intervention.id,
          feedback,
        }),
      });

      await onDismiss();
    } catch (error) {
      console.error('Failed to dismiss intervention:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = getSeverityColor();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className={`${colors.bg} text-white p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{intervention.icon || '⚠️'}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wide font-bold bg-white/20 px-2 py-1 rounded">
                    {intervention.severity}
                  </span>
                  <span className="text-xs opacity-75 capitalize">
                    {intervention.triggerType.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{intervention.title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div>
            <p className="text-gray-700 text-lg leading-relaxed">{intervention.message}</p>
          </div>

          {/* Impact Calculation */}
          {intervention.calculatedImpact !== null && (
            <div className={`p-4 rounded-lg ${colors.light} ${colors.border} border`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Potential Impact</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    ${Math.abs(intervention.calculatedImpact).toLocaleString()}
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      {intervention.calculatedImpact > 0 ? 'saved per month' : 'over budget'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Action */}
          {intervention.suggestedAction && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Recommended Action</h3>
              <div className={`p-4 rounded-lg ${colors.light} border ${colors.border}`}>
                <p className="text-gray-700">{intervention.suggestedAction}</p>
              </div>
            </div>
          )}

          {/* Alternative Options */}
          {intervention.alternativeOptions.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Other Options</h3>
              <div className="space-y-2">
                {intervention.alternativeOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOption === index
                        ? `${colors.border} ${colors.light}`
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === index
                            ? `${colors.border} ${colors.bg}`
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedOption === index && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{option}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any thoughts? (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Let us know if this was helpful or how we can improve..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Dismiss'}
          </button>
          <button
            onClick={handleTakeAction}
            disabled={isSubmitting}
            className={`flex-1 ${colors.bg} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50`}
          >
            {isSubmitting ? 'Processing...' : 'Take Action'}
          </button>
        </div>
      </div>
    </div>
  );
}
