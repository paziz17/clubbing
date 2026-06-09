import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — points at the AWS EC2 production server.
 *
 * To override locally (emulator/dev):
 *   CAP_SERVER_URL=http://10.0.2.2:3000 npm run android:sync
 */
const AWS_SERVER = process.env.CAP_SERVER_URL ?? "https://app.clubbing.co.il";

const config: CapacitorConfig = {
  appId: "app.clubbing.android",
  appName: "CLUBBING",
  webDir: "public",
  server: {
    url: AWS_SERVER,
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#06060A",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#06060A",
      androidSplashResourceName: "splash",
      showSpinner: false,
      launchAutoHide: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#06060A",
      overlaysWebView: false,
    },
  },
};

export default config;
