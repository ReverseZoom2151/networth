'use client';

import { haptics } from '@/lib/mobile';
import { ButtonHTMLAttributes } from 'react';

interface HapticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'error';
  disabled?: boolean;
}

/**
 * Button component with haptic feedback on mobile devices
 * Falls back gracefully on web (no haptic)
 */
export function HapticButton({
  children,
  onClick,
  hapticType = 'light',
  disabled,
  className,
  ...props
}: HapticButtonProps) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Trigger haptic feedback
    switch (hapticType) {
      case 'light':
        await haptics.light();
        break;
      case 'medium':
        await haptics.medium();
        break;
      case 'heavy':
        await haptics.heavy();
        break;
      case 'success':
        await haptics.success();
        break;
      case 'error':
        await haptics.error();
        break;
    }

    // Call original onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}
