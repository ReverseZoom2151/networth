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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-2xl animate-scale-in">
        {/* Header */}
        <div className={`${colors.bg} p-6 text-white`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{intervention.icon || '⚠️'}</span>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-background/25 px-2 py-1 text-xs font-bold uppercase tracking-wide text-background">
                    {intervention.severity}
                  </span>
                  <span className="text-xs capitalize opacity-75">
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
        <div className="space-y-6 p-6">
          {/* Message */}
          <div>
            <p className="text-lg leading-relaxed text-foreground">{intervention.message}</p>
          </div>

          {/* Impact Calculation */}
          {intervention.calculatedImpact !== null && (
            <div className={`rounded-lg border ${colors.border} ${colors.light} p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="mb-1 text-sm text-muted">Potential Impact</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    ${Math.abs(intervention.calculatedImpact).toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-muted">
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
              <h3 className="mb-3 font-bold text-foreground">Recommended Action</h3>
              <div className={`rounded-lg border ${colors.border} ${colors.light} p-4`}>
                <p className="text-muted">{intervention.suggestedAction}</p>
              </div>
            </div>
          )}

          {/* Alternative Options */}
          {intervention.alternativeOptions.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold text-foreground">Other Options</h3>
              <div className="space-y-2">
                {intervention.alternativeOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      selectedOption === index
                        ? `${colors.border} ${colors.light}`
                        : 'border-border/60 bg-surface-muted hover:border-border hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedOption === index ? `${colors.border} ${colors.bg}` : 'border-border/60'
                        }`}
                      >
                        {selectedOption === index && (
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-muted">{option}</p>
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
              className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-accent"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-border/60 p-6">
          <button
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-surface-muted px-6 py-3 font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Dismiss'}
          </button>
          <button
            onClick={handleTakeAction}
            disabled={isSubmitting}
            className={`flex-1 rounded-lg px-6 py-3 font-semibold text-white transition-all disabled:opacity-50 ${colors.bg} hover:opacity-90`}
          >
            {isSubmitting ? 'Processing...' : 'Take Action'}
          </button>
        </div>
      </div>
    </div>
  );
}
