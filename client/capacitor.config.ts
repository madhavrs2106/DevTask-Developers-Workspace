import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devtask.app",
  appName: "DevTask",
  webDir: "../client/dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
