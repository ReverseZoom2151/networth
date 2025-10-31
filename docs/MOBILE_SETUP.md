# Mobile App Setup (iOS & Android)

This document explains how to build and run the Networth app as a native iOS and Android application using **Capacitor**.

## Why Capacitor?

- ✅ **100% code reuse** - Same Next.js codebase for web + mobile
- ✅ **ONE codebase** - No separate React Native project
- ✅ **App Store presence** - Deploy to Apple App Store and Google Play Store
- ✅ **Native features** - Access camera, notifications, haptics, etc.
- ✅ **Fast development** - No migration needed

## Architecture

```
Your Next.js App (Web)
       ↓
   Runs on localhost:3000 (dev) or deployed URL (production)
       ↓
Capacitor wraps it in a native WebView
       ↓
├── iOS App (Swift/Xcode)
└── Android App (Kotlin/Android Studio)
```

## Prerequisites

### For iOS Development:
- Mac computer (required for iOS development)
- [Xcode](https://developer.apple.com/xcode/) (latest version)
- Xcode Command Line Tools: `xcode-select --install`
- [CocoaPods](https://cocoapods.org/): `sudo gem install cocoapods`
- Apple Developer Account (for app store deployment)

### For Android Development:
- [Android Studio](https://developer.android.com/studio) (latest version)
- Android SDK (installed via Android Studio)
- Java JDK 17 or higher
- Google Play Developer Account (for app store deployment)

## Initial Setup

### 1. Install Capacitor (Already Done)

```bash
cd networth-mvp
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. Initialize iOS and Android Projects

```bash
# Add both platforms
npm run mobile:init

# Or add individually
npm run mobile:add:ios      # Adds iOS project
npm run mobile:add:android  # Adds Android project
```

This creates:
- `ios/` folder with Xcode project
- `android/` folder with Android Studio project

## Development Workflow

### Option 1: Development Mode (Recommended for Testing)

1. **Start your Next.js dev server:**
```bash
npm run dev
```

2. **Update Capacitor config to point to localhost:**

Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://localhost:3000',
  cleartext: true, // Required for localhost
}
```

3. **Sync and run on device:**
```bash
# iOS
npm run mobile:sync
npm run mobile:dev

# Android
npm run mobile:sync
npm run mobile:dev:android
```

**Benefits:**
- ✅ Hot reload works
- ✅ Instant changes
- ✅ Full Next.js features (API routes, server components)

### Option 2: Production Mode (For App Store Builds)

1. **Update Capacitor config for production:**

Edit `capacitor.config.ts`:
```typescript
server: {
  // Comment out or remove URL - uses bundled assets
  // url: 'http://localhost:3000',
  androidScheme: 'https',
  iosScheme: 'https',
}
```

2. **Deploy your Next.js app** (Vercel recommended):
```bash
vercel --prod
```

3. **Update API base URL in your mobile app** to point to production server

4. **Build and run:**
```bash
npm run mobile:sync
npm run mobile:open:ios      # Opens Xcode
npm run mobile:open:android  # Opens Android Studio
```

## Platform Detection

Use the platform utilities to detect where your app is running:

```typescript
import { isMobile, isIOS, isAndroid, isWeb } from '@/lib/platform';

// Check if running in mobile app
if (isMobile()) {
  console.log('Running in native app');
}

// Platform-specific logic
if (isIOS()) {
  console.log('Running on iOS');
} else if (isAndroid()) {
  console.log('Running on Android');
} else if (isWeb()) {
  console.log('Running in browser');
}
```

## Using Mobile Features

### Haptic Feedback

```typescript
import { haptics } from '@/lib/mobile';

// Light tap
await haptics.light();

// Success notification
await haptics.success();

// Error notification
await haptics.error();
```

### Status Bar

```typescript
import { statusBar } from '@/lib/mobile';

// Hide status bar
await statusBar.hide();

// Set dark style
await statusBar.setStyle('dark');

// Set background color (Android only)
await statusBar.setBackgroundColor('#000000');
```

### Share

```typescript
import { share } from '@/lib/mobile';

await share(
  'Check out Networth!',
  'Manage your finances with AI',
  'https://networth.app'
);
```

### Clipboard

```typescript
import { clipboard } from '@/lib/mobile';

// Copy to clipboard
await clipboard.write('Text to copy');

// Read from clipboard
const text = await clipboard.read();
```

### Network Status

```typescript
import { network } from '@/lib/mobile';

// Get status
const status = await network.getStatus();
console.log('Connected:', status.connected);

// Listen for changes
await network.addListener((connected) => {
  if (!connected) {
    alert('No internet connection');
  }
});
```

### App State

```typescript
import { appState } from '@/lib/mobile';

// Listen for app going to background/foreground
await appState.addListener((state) => {
  if (state === 'active') {
    console.log('App came to foreground');
  } else if (state === 'background') {
    console.log('App went to background');
  }
});
```

## Example: Adding Haptic Feedback to Buttons

```typescript
// components/Button.tsx
'use client';

import { haptics } from '@/lib/mobile';

export function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const handleClick = async () => {
    await haptics.light(); // Add haptic feedback
    onClick();
  };

  return (
    <button onClick={handleClick} className="...">
      {children}
    </button>
  );
}
```

## Building for App Stores

### iOS (App Store)

1. **Open Xcode:**
```bash
npm run mobile:open:ios
```

2. **Configure signing:**
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Select your team
   - Xcode will automatically manage signing

3. **Set version and build number:**
   - Update in `Info.plist` or Xcode General tab
   - Version: `1.0.0`
   - Build: `1`

4. **Archive for App Store:**
   - Product → Archive
   - Upload to App Store Connect
   - Submit for review

### Android (Google Play)

1. **Open Android Studio:**
```bash
npm run mobile:open:android
```

2. **Generate signing key:**
```bash
keytool -genkey -v -keystore networth-release.keystore -alias networth -keyalg RSA -keysize 2048 -validity 10000
```

3. **Update `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../networth-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'networth'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

4. **Build APK or AAB:**
```bash
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB (recommended for Play Store)
```

5. **Upload to Google Play Console**

## Troubleshooting

### iOS Build Issues

**Problem:** Xcode can't find project
```bash
cd ios/App
pod install
```

**Problem:** Signing issues
- Ensure you have a valid Apple Developer account
- Check signing settings in Xcode

### Android Build Issues

**Problem:** Gradle sync failed
- Update Android Studio
- File → Invalidate Caches → Invalidate and Restart

**Problem:** SDK not found
- Open Android Studio → SDK Manager
- Install latest Android SDK

### Common Issues

**Problem:** White screen on app launch
- Check Capacitor config `webDir` is set correctly
- Ensure `npm run mobile:sync` was run after changes

**Problem:** API calls not working
- Update API base URL for production builds
- Check CORS settings on your server

## Project Structure

```
networth-mvp/
├── app/                      # ✅ Next.js app (works on web + mobile)
├── components/               # ✅ React components (shared)
├── lib/
│   ├── platform.ts          # 🆕 Platform detection utilities
│   └── mobile.ts            # 🆕 Mobile-specific features
├── capacitor.config.ts      # 🆕 Capacitor configuration
├── ios/                     # 🆕 iOS native project (generated)
│   └── App/
│       └── App.xcodeproj
├── android/                 # 🆕 Android native project (generated)
│   └── app/
│       └── build.gradle
└── package.json             # Updated with mobile scripts
```

## Next Steps

1. **Add iOS and Android platforms:**
   ```bash
   npm run mobile:init
   ```

2. **Test on device:**
   ```bash
   npm run dev                # Start Next.js
   npm run mobile:dev         # Run on iOS
   npm run mobile:dev:android # Run on Android
   ```

3. **Add native features as needed:**
   - Push notifications
   - Camera for receipt scanning
   - Biometric authentication
   - Secure storage

4. **Deploy to app stores** (see Building for App Stores section)

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Need Help?

- Check [Capacitor Community](https://forum.ionicframework.com/c/capacitor/)
- Review existing mobile features in `lib/mobile.ts`
- Test on real devices (simulators have limitations)
