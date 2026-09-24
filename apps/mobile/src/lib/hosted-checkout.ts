import { Capacitor } from "@capacitor/core";
/** Hosted billing runs in a system browser. Closing it refreshes server state. */
export async function openHostedCheckout(
  url: string,
  onReturn: () => Promise<void>,
) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !["checkout.stripe.com", "billing.stripe.com"].includes(parsed.hostname)
  )
    throw new Error("Invalid payment destination.");
  if (!Capacitor.isNativePlatform()) {
    window.location.assign(url);
    return;
  }
  const { Browser } = await import("@capacitor/browser");
  const listener = await Browser.addListener("browserFinished", () => {
    void listener.remove();
    void onReturn();
  });
  try {
    await Browser.open({ url });
  } catch (error) {
    await listener.remove();
    throw error;
  }
}
