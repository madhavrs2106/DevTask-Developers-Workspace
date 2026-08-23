import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devtask.app",
  appName: "DevTask",
  webDir: "dist",
  server: {
    // For development: point to Vite dev server
    // For production builds: comment out to load from bundled dist/
    url: "http://10.0.2.2:5173",
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0F172A",
      showSpinner: true,
      spinnerColor: "#06B6D4",
    },
  },
};

export default config;
