import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.networth.app',
  appName: 'Networth',
  webDir: 'out',

  server: {
    // For development: can point to your local dev server
    // url: 'http://localhost:3000',
    // cleartext: true,

    // For production: uses the bundled web assets
    androidScheme: 'https',
    iosScheme: 'https',
  },

  plugins: {
    // Push Notifications configuration
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },

    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },

  // iOS specific configuration
  ios: {
    contentInset: 'always',
  },

  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
};

export default config;
