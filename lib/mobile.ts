// Mobile-Specific Features for Capacitor
// This module provides mobile-native capabilities with web fallbacks

import { Capacitor } from '@capacitor/core';
import { isMobile, isIOS, isAndroid } from './platform';

/**
 * Haptic Feedback
 * Provides tactile feedback on mobile devices
 */
export const haptics = {
  /**
   * Light tap feedback
   */
  light: async () => {
    if (!isMobile()) return;

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  /**
   * Medium tap feedback
   */
  medium: async () => {
    if (!isMobile()) return;

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  /**
   * Heavy tap feedback
   */
  heavy: async () => {
    if (!isMobile()) return;

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  /**
   * Success notification
   */
  success: async () => {
    if (!isMobile()) return;

    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  /**
   * Error notification
   */
  error: async () => {
    if (!isMobile()) return;

    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },
};

/**
 * Status Bar
 * Control the native status bar appearance
 */
export const statusBar = {
  /**
   * Hide the status bar
   */
  hide: async () => {
    if (!isMobile()) return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.hide();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Show the status bar
   */
  show: async () => {
    if (!isMobile()) return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.show();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Set status bar style
   */
  setStyle: async (style: 'dark' | 'light') => {
    if (!isMobile()) return;

    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({
        style: style === 'dark' ? Style.Dark : Style.Light,
      });
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Set status bar background color (Android only)
   */
  setBackgroundColor: async (color: string) => {
    if (!isAndroid()) return;

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },
};

/**
 * App Info
 * Get information about the app
 */
export const appInfo = {
  /**
   * Get app version and build info
   */
  getInfo: async () => {
    if (!isMobile()) {
      return {
        version: '1.0.0',
        build: '1',
        platform: 'web',
      };
    }

    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return {
        version: info.version,
        build: info.build,
        platform: Capacitor.getPlatform(),
      };
    } catch (error) {
      console.warn('App info not available:', error);
      return {
        version: 'unknown',
        build: 'unknown',
        platform: Capacitor.getPlatform(),
      };
    }
  },
};

/**
 * Keyboard
 * Control the native keyboard
 */
export const keyboard = {
  /**
   * Hide the keyboard
   */
  hide: async () => {
    if (!isMobile()) return;

    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch (error) {
      console.warn('Keyboard not available:', error);
    }
  },

  /**
   * Show the keyboard
   */
  show: async () => {
    if (!isMobile()) return;

    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.show();
    } catch (error) {
      console.warn('Keyboard not available:', error);
    }
  },
};

/**
 * Share
 * Native share functionality
 */
export const share = async (title: string, text: string, url?: string) => {
  try {
    if (isMobile()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share via',
      });
    } else {
      // Web Share API fallback
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${title}\n${text}\n${url || ''}`);
        alert('Link copied to clipboard!');
      }
    }
  } catch (error) {
    console.warn('Share failed:', error);
  }
};

/**
 * Clipboard
 * Copy text to clipboard
 */
export const clipboard = {
  /**
   * Write text to clipboard
   */
  write: async (text: string) => {
    try {
      if (isMobile()) {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch (error) {
      console.warn('Clipboard write failed:', error);
    }
  },

  /**
   * Read text from clipboard
   */
  read: async (): Promise<string | null> => {
    try {
      if (isMobile()) {
        const { Clipboard } = await import('@capacitor/clipboard');
        const result = await Clipboard.read();
        return result.value;
      } else {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.warn('Clipboard read failed:', error);
      return null;
    }
  },
};

/**
 * Network Status
 * Check network connectivity
 */
export const network = {
  /**
   * Get current network status
   */
  getStatus: async () => {
    if (!isMobile()) {
      return {
        connected: navigator.onLine,
        connectionType: 'unknown',
      };
    }

    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    } catch (error) {
      console.warn('Network status not available:', error);
      return {
        connected: navigator.onLine,
        connectionType: 'unknown',
      };
    }
  },

  /**
   * Add listener for network status changes
   */
  addListener: async (callback: (connected: boolean) => void) => {
    if (!isMobile()) {
      window.addEventListener('online', () => callback(true));
      window.addEventListener('offline', () => callback(false));
      return;
    }

    try {
      const { Network } = await import('@capacitor/network');
      Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
    } catch (error) {
      console.warn('Network listener not available:', error);
    }
  },
};

/**
 * App State
 * Monitor app foreground/background state
 */
export const appState = {
  /**
   * Add listener for app state changes
   */
  addListener: async (
    callback: (state: 'active' | 'inactive' | 'background') => void
  ) => {
    if (!isMobile()) {
      document.addEventListener('visibilitychange', () => {
        callback(document.hidden ? 'background' : 'active');
      });
      return;
    }

    try {
      const { App } = await import('@capacitor/app');
      App.addListener('appStateChange', ({ isActive }) => {
        callback(isActive ? 'active' : 'background');
      });
    } catch (error) {
      console.warn('App state listener not available:', error);
    }
  },
};

/**
 * Safe Area Insets
 * Get safe area insets for notches and home indicators
 */
export const safeArea = {
  /**
   * Get safe area insets
   */
  getInsets: () => {
    if (!isMobile()) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    // Use CSS environment variables set by Capacitor
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('--ion-safe-area-top') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--ion-safe-area-bottom') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--ion-safe-area-left') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--ion-safe-area-right') || '0'),
    };
  },
};
