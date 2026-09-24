"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ordersClient, type CustomerOrderView } from "@repo/api";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MobileActionBar } from "@/components/MobileActionBar";
import { OrderReceipt } from "@/features/checkout/OrderReceipt";
import styles from "@/features/checkout/checkout.module.css";
import { useApp } from "@/context/AppContext";
import { PageIntro } from "@/components/PageIntro";
import { ShoppingBag } from "@/components/animated-icon/icons";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { t, language, activeOrderId, accessToken, setActiveOrderId } =
    useApp();
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => "",
  );
  const orderId = new URLSearchParams(search).get("orderId") || activeOrderId;
  const [order, setOrder] = useState<CustomerOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!orderId || !accessToken) return;
    let cancelled = false;
    void ordersClient
      .get(orderId, { accessToken })
      .then((value) => {
        if (!cancelled) {
          setOrder(value);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause.message : t("payment.error"));
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, accessToken, revision, t]);
  const failed =
    order?.orderState === "awaiting_payment" ||
    order?.orderState === "cancelled";
  return (
    <AppFrame className={styles.screen}>
      <ScreenHeader
        title={language === "de" ? "Zahlungsdetails" : "Payment details"}
        backHref="/orders/"
      />
      {order ? (
        <OrderReceipt order={order} failed={failed} />
      ) : (
        <div
          className="flex flex-1 flex-col items-center justify-center py-8 text-center text-sm text-muted"
          role="status"
        >
          <PageIntro
            icon={<ShoppingBag />}
            title={
              language === "de" ? "Deine Bestelldetails" : "Your order details"
            }
            description={
              error
                ? language === "de"
                  ? "Diese Bestellung konnte nicht geladen werden. Versuche es erneut oder öffne deine Bestellungen."
                  : "We couldn’t load this order. Try again or find it in your orders."
                : !orderId || !accessToken
                  ? t("success.missingBody")
                  : t("payment.processing")
            }
          />
          {error && (
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => setRevision((v) => v + 1)}
            >
              {t("payment.checkStatus")}
            </Button>
          )}
        </div>
      )}
      <MobileActionBar
        label={order && !failed ? t("success.track") : t("tracking.viewOrders")}
        onPress={() => {
          if (order && !failed) {
            setActiveOrderId(order.id);
            router.replace("/tracking/");
          } else router.replace("/orders/");
        }}
      />
    </AppFrame>
  );
}
