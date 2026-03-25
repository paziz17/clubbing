import type { CapacitorConfig } from "@capacitor/cli";

/**
 * אפליקציות iOS / Android — טוענות את אתר ה-Next.js החי (Vercel).
 * אין כאן build סטטי של Next; רק מעטפת WebView.
 *
 * פיתוח מקומי: הרץ `npm run dev`, גלה את ה-IP של המחשב ברשת, והרץ:
 *   CAP_SERVER_URL=http://192.168.x.x:3000 npx cap sync
 */
const serverUrl =
  process.env.CAP_SERVER_URL?.trim() || "https://clubbing-two.vercel.app";

const config: CapacitorConfig = {
  appId: "app.clubing.mobile",
  appName: "Clubing",
  webDir: "www",
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: process.env.CAP_ALLOW_CLEARTEXT === "true",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#06040c",
    },
  },
};

export default config;
