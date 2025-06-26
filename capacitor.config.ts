
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5fa6528419a4404da981c7dddafce4b7',
  appName: 'Diet Shopping App',
  webDir: 'dist',
  server: {
    url: 'https://5fa65284-19a4-404d-a981-c7dddafce4b7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#22c55e',
      showSpinner: false
    }
  }
};

export default config;
