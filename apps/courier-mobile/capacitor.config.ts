import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

const nativePlugins = [
  "@capacitor/app",
  "@capacitor/splash-screen",
  "@capacitor/status-bar",
  "@capacitor-community/background-geolocation",
  "@capacitor/barcode-scanner",
];
const messaging = "@capacitor-firebase/messaging";
const config: CapacitorConfig = {
  appId: "com.yespizz.courier",
  appName: "Yespizz Courier",
  webDir: "out",
  android: {
    useLegacyBridge: true,
    includePlugins: [
      ...nativePlugins,
      ...(existsSync(join(__dirname, "android/app/google-services.json"))
        ? [messaging]
        : []),
    ],
  },
  ios: {
    includePlugins: [
      ...nativePlugins,
      ...(existsSync(join(__dirname, "ios/App/App/GoogleService-Info.plist"))
        ? [messaging]
        : []),
    ],
  },
  experimental: {
    ios: { spm: { packageOptions: { [messaging]: { symlink: true } } } },
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#ffffff",
    },
    StatusBar: {
      style: "DARK",
    },
  },
};

export default config;
