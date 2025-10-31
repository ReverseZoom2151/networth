// Platform Detection Utilities for Capacitor
// Use these to detect if running in mobile app vs web browser

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a Capacitor mobile app
 */
export const isMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get the current platform name
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Check if a specific Capacitor plugin is available
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Get platform-specific configuration
 */
export const getPlatformConfig = () => {
  return {
    platform: getPlatform(),
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isWeb: isWeb(),
  };
};
