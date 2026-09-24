import { registerPlugin } from "@capacitor/core";
/** Native-only bridge. The web checkout uses the existing Stripe Elements integration. */
export const NativeStripe = registerPlugin<{
  initialize(options: { publishableKey: string }): Promise<void>;
  createPaymentSheet(options: {
    paymentIntentClientSecret: string;
    merchantDisplayName: string;
    enableApplePay?: boolean;
    applePayMerchantId?: string;
    enableGooglePay?: boolean;
    GooglePayIsTesting?: boolean;
    countryCode?: string;
    returnURL?: string;
  }): Promise<void>;
  presentPaymentSheet(): Promise<{
    paymentResult:
      "paymentSheetCompleted" | "paymentSheetCanceled" | "paymentSheetFailed";
  }>;
}>("Stripe");
