import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

const nativePlugins = [
  "@capacitor/app",
  "@capacitor/browser",
  "@repo/native-stripe",
  "@capgo/capacitor-social-login",
  "@capacitor/splash-screen",
  "@capacitor/status-bar",
];
const messaging = "@capacitor-firebase/messaging";
const config: CapacitorConfig = {
  appId: "com.yespizz.mobile",
  appName: "Yespizz",
  webDir: "out",
  android: {
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
    SocialLogin: {
      providers: { google: true, apple: true, facebook: false, twitter: false },
      logLevel: 1,
    },
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
