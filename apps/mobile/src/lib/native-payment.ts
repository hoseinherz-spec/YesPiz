import { Capacitor } from "@capacitor/core";
export async function presentNativePayment(clientSecret: string) {
  if (!Capacitor.isNativePlatform()) return false;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) throw new Error("Native payment is not configured.");
  const { NativeStripe } = await import("@repo/native-stripe");
  await NativeStripe.initialize({ publishableKey });
  await NativeStripe.createPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: "Yespiz",
    enableApplePay: Boolean(process.env.NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID),
    applePayMerchantId: process.env.NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID,
    enableGooglePay: process.env.NEXT_PUBLIC_GOOGLE_PAY_ENABLED === "true",
    GooglePayIsTesting: publishableKey.startsWith("pk_test_"),
    countryCode: process.env.NEXT_PUBLIC_PAYMENT_COUNTRY || "DE",
    returnURL: "com.yespizz.mobile://stripe-redirect",
  });
  const result = await NativeStripe.presentPaymentSheet();
  if (result.paymentResult === "paymentSheetCanceled")
    throw new Error("Payment cancelled. You can retry this order.");
  if (result.paymentResult !== "paymentSheetCompleted")
    throw new Error("Payment failed. Please retry.");
  return true;
}
