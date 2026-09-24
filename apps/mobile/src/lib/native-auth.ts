import { Capacitor } from "@capacitor/core";
export function nativeAuthAvailable(provider: "google" | "apple") {
  if (!Capacitor.isNativePlatform()) return false;
  if (provider === "apple") return Capacitor.getPlatform() === "ios";
  return (
    !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    (Capacitor.getPlatform() !== "ios" ||
      !!process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID)
  );
}
export async function nativeSignIn(provider: "google" | "apple") {
  if (!nativeAuthAvailable(provider))
    throw new Error("Native sign-in is not configured for this device.");
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize(
    provider === "google"
      ? {
          google: {
            webClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            iOSClientId: process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            iOSServerClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            mode: "online",
          },
        }
      : { apple: { clientId: "com.yespizz.mobile", redirectUrl: "" } },
  );
  const nonce = crypto.randomUUID();
  if (provider === "google") {
    const response = await SocialLogin.login({
      provider: "google",
      options: { nonce, scopes: ["email", "profile"] },
    });
    if (response.result.responseType !== "online" || !response.result.idToken)
      throw new Error("Google did not return a verified identity token.");
    return { token: response.result.idToken, nonce };
  }
  const response = await SocialLogin.login({
    provider: "apple",
    options: { nonce, scopes: ["email", "name"] },
  });
  if (!response.result.idToken)
    throw new Error("Apple did not return an identity token.");
  return { token: response.result.idToken, nonce };
}
