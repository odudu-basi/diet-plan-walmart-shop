
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5fa6528419a4404da981c7dddafce4b7',
  appName: 'Preppi',
  webDir: 'dist',
  server: {
    url: 'https://5fa65284-19a4-404d-a981-c7dddafce4b7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#10b981',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#10b981'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#10b981',
    allowsLinkPreview: false
  },
  android: {
    backgroundColor: '#10b981',
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
