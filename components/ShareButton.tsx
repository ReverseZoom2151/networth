'use client';

import { share, haptics } from '@/lib/mobile';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

/**
 * Share button component with native share functionality
 * Falls back to clipboard on unsupported platforms
 */
export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await haptics.light();

    try {
      await share(title, text, url);
    } catch (error) {
      // If share fails, copy to clipboard as fallback
      console.warn('Share failed, falling back to clipboard:', error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className || 'p-2 hover:bg-gray-100 rounded-lg transition-colors'}
      title={copied ? 'Copied!' : 'Share'}
    >
      {copied ? (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
}
