"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackProductEvent, type FunnelEvent } from "@/lib/product-events";
const events: Record<string, FunnelEvent> = {
  "/menu": "menu_view",
  "/pizza": "product_view",
  "/cart": "cart_view",
  "/checkout": "checkout_view",
  "/payment": "payment_view",
};
export function ProductTelemetry() {
  const path = usePathname();
  useEffect(() => {
    const event = events[path.replace(/\/$/, "")];
    if (event) trackProductEvent(event);
  }, [path]);
  return null;
}
