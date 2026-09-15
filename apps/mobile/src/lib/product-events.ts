import { apiRequest } from "@repo/api";
export type FunnelEvent =
  | "menu_view"
  | "product_view"
  | "cart_add"
  | "cart_view"
  | "checkout_view"
  | "payment_view";
export function trackProductEvent(event: FunnelEvent) {
  try {
    // Explicit opt-in; no account IDs, addresses, search terms or cart contents.
    if (localStorage.getItem("yespizz_analytics_consent") !== "true") return;
    let sessionId = sessionStorage.getItem("yespizz_analytics_session");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("yespizz_analytics_session", sessionId);
    }
    void apiRequest("/api/v1/insights/events", {
      method: "POST",
      body: { event, sessionId, eventId: crypto.randomUUID() },
    }).catch(() => undefined);
  } catch {
    /* Analytics never block ordering. */
  }
}
