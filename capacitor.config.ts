import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flikkt.app',      // ← your bundle ID
  appName: 'Flikkt',
  webDir: 'dist',
  ios: {
    scheme: 'flikkt',           // ← enables flikkt:// deep links
  },
};

export default config;
