// Biometric Authentication
// Face ID, Touch ID, and Fingerprint authentication

import { isMobile } from './platform';

/**
 * Check if biometric authentication is available on device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!isMobile()) return false;

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch (error) {
    console.error('Failed to check biometric availability:', error);
    return false;
  }
};

/**
 * Get the type of biometric authentication available
 * Returns: 'face', 'fingerprint', 'iris', or null
 */
export const getBiometricType = async (): Promise<string | null> => {
  if (!isMobile()) return null;

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();

    if (!result.isAvailable) return null;

    // Return biometry type (faceId, touchId, fingerprint, etc.)
    return result.biometryType ? String(result.biometryType) : null;
  } catch (error) {
    console.error('Failed to get biometric type:', error);
    return null;
  }
};

/**
 * Authenticate user with biometrics
 * Returns true if authentication successful
 */
export const authenticateWithBiometric = async (
  reason: string = 'Authenticate to access your financial data'
): Promise<boolean> => {
  if (!isMobile()) {
    console.log('Biometric auth only available on mobile');
    return false;
  }

  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');

    // Check if biometric is available
    const checkResult = await BiometricAuth.checkBiometry();
    if (!checkResult.isAvailable) {
      console.log('Biometric authentication not available');
      return false;
    }

    // Authenticate
    const result = await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true, // Allow PIN/password fallback
      iosFallbackTitle: 'Use Passcode',
      androidTitle: 'Biometric Authentication',
      androidSubtitle: 'Authenticate with your biometric credential',
      androidConfirmationRequired: false,
    });

    return true;
  } catch (error: any) {
    // User cancelled or authentication failed
    if (error.code === 'userCancel' || error.code === 'biometryNotAvailable') {
      console.log('Biometric authentication cancelled or not available');
    } else {
      console.error('Biometric authentication error:', error);
    }
    return false;
  }
};

/**
 * Store secure data with biometric protection
 */
export const storeSecureData = async (key: string, value: string): Promise<boolean> => {
  if (!isMobile()) return false;

  try {
    const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    await SecureStoragePlugin.set({ key, value });
    return true;
  } catch (error) {
    console.error('Failed to store secure data:', error);
    return false;
  }
};

/**
 * Retrieve secure data with biometric authentication
 */
export const getSecureData = async (key: string): Promise<string | null> => {
  if (!isMobile()) return null;

  try {
    // First authenticate with biometric
    const authenticated = await authenticateWithBiometric('Authenticate to access secure data');

    if (!authenticated) {
      return null;
    }

    // Retrieve data
    const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    const result = await SecureStoragePlugin.get({ key });
    return result.value;
  } catch (error) {
    console.error('Failed to get secure data:', error);
    return null;
  }
};

/**
 * Remove secure data
 */
export const removeSecureData = async (key: string): Promise<boolean> => {
  if (!isMobile()) return false;

  try {
    const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    await SecureStoragePlugin.remove({ key });
    return true;
  } catch (error) {
    console.error('Failed to remove secure data:', error);
    return false;
  }
};

/**
 * Enable biometric authentication for app
 */
export const enableBiometricAuth = async (): Promise<boolean> => {
  const available = await isBiometricAvailable();

  if (!available) {
    alert('Biometric authentication is not available on this device');
    return false;
  }

  // Test authentication
  const authenticated = await authenticateWithBiometric('Enable biometric authentication');

  if (authenticated) {
    // Store preference
    await storeSecureData('biometric_enabled', 'true');
    return true;
  }

  return false;
};

/**
 * Check if biometric auth is enabled
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  if (!isMobile()) return false;

  try {
    const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
    const result = await SecureStoragePlugin.get({ key: 'biometric_enabled' });
    return result.value === 'true';
  } catch (error) {
    return false;
  }
};
