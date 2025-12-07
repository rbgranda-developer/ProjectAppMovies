import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moviesland.app',
  appName: 'Movies_Land',
  webDir: 'dist',
  server: {
    androidScheme: "http",
    cleartext: true,
    hostname: "localhost"
  }
};

export default config;
