"use client";
import { ReferenceHeader } from "@/components/ReferenceHeader";
import { ReferenceSheet } from "@/components/ReferenceSheet";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { FormAction, FormScope, Input } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import {
  ordersClient,
  paymentsClient,
  type ReorderPreviewResponse,
  type CustomerOrderView,
} from "@repo/api";
import { useCart } from "@/context/CartContext";
import { PizzaLoader } from "@/components/PizzaLoader";
import { Button, Card, Typography } from "@heroui/react";
import { MapPin, Pizza, ShoppingBag } from "@/components/animated-icon/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ArrowRepeatClockwise1 } from "@repo/icons";
import "./orders.css";
import { AppFrame } from "@/components/AppFrame";
import { useMenuCatalog } from "@/lib/catalog";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { ORDER_STEPS, useApp } from "@/context/AppContext";
import { pizzaCraftAsset } from "@/constants/media";

export default function OrdersPage() {
  const router = useRouter();
  const { items: catalog } = useMenuCatalog();
  const { clear: clearCart, addItem } = useCart();
  const [preview, setPreview] = useState<ReorderPreviewResponse | null>(null);
  const [cancelOrder, setCancelOrder] = useState<CustomerOrderView | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const {
    t,
    language,
    orders,
    accessToken,
    hydrated,
    refreshOrders,
    setActiveOrderId,
  } = useApp();
  const [tab, setTab] = useState<"active" | "completed" | "cancelled">(
    "active",
  );
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);

  async function reviewReorder(id: string) {
    if (!accessToken) {
      router.push("/auth/sign-in/");
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      setPreview(await ordersClient.reorder(id, { accessToken }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reorder.");
    } finally {
      setActionBusy(false);
    }
  }
  async function reviewCancel(id: string) {
    if (!accessToken) {
      router.push("/auth/sign-in/");
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      setCancelOrder(await ordersClient.get(id, { accessToken }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order.");
    } finally {
      setActionBusy(false);
    }
  }
  async function confirmCancel() {
    if (!accessToken || !cancelOrder) return;
    setActionBusy(true);
    setError(null);
    try {
      await paymentsClient.cancel(cancelOrder.id, reason.trim(), {
        accessToken,
      });
      setCancelOrder(null);
      setReason("");
      await refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel.");
    } finally {
      setActionBusy(false);
    }
  }
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    const load = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        await refreshOrders();
      } catch {
        if (!cancelled) setError(t("orders.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshOrders, t]);

  const list = useMemo(() => {
    if (!accessToken) return [];
    if (tab === "active") return orders.filter((o) => o.status === "active");
    return orders.filter((o) => o.status === tab);
  }, [accessToken, orders, tab]);
  const emptyArtwork =
    tab === "active"
      ? pizzaCraftAsset("Pizza Delivery")
      : tab === "completed"
        ? pizzaCraftAsset("Pizza Box")
        : pizzaCraftAsset("Digital Food Receipt");

  return (
    <FormScope>
      {
        <FormScope>
          <AppFrame withTabs className="reference-screen orders-screen">
            <ReferenceHeader />
            <h1 className="sr-only">{t("orders.title")}</h1>
            {preview && (
              <ReferenceSheet
                open
                onClose={() => setPreview(null)}
                title={
                  language === "de" ? "Erneut bestellen" : "Review reorder"
                }
              >
                <AppText as="p">
                  This replaces your current cart. Prices use today’s menu.
                </AppText>
                {preview.cartLines.map((line, i) => (
                  <AppText as="p" key={i}>
                    <AnimatedNumber value={line.quantity} /> × {line.name} ·{" "}
                    {line.size} {line.extras.join(", ")} · €
                    {(line.unitPriceCents / 100).toFixed(2)}
                  </AppText>
                ))}
                {preview.unavailable.map((line, i) => (
                  <AppText as="p" key={i}>
                    {line.name}:{" "}
                    {line.reason === "not_on_menu"
                      ? "No longer on the menu."
                      : line.reason}
                    {line.reason !== "not_on_menu" && (
                      <FormButton
                        variant="ghost"
                        type="button"
                        className="ml-2 underline"
                        onPress={() =>
                          router.push(
                            `/menu/${encodeURIComponent(line.menuItemId)}/`,
                          )
                        }
                      >
                        Choose options
                      </FormButton>
                    )}
                  </AppText>
                ))}
                {preview.changed.length > 0 && (
                  <AppText as="p">
                    <AnimatedNumber value={preview.changed.length} /> item
                    price(s) changed.
                  </AppText>
                )}
                <FormAction
                  isDisabled={!preview.cartLines.length}
                  onPress={() => {
                    clearCart();
                    preview.cartLines.forEach((line) =>
                      addItem({
                        menuItemId: line.menuItemId,
                        menuVersion: preview.menuVersion,
                        name: line.name,
                        size: line.size,
                        extras: line.extras,
                        quantity: line.quantity,
                        unitPrice: line.unitPriceCents / 100,
                        image: "/images/pizza-margherita.png",
                      }),
                    );
                    router.push("/cart/");
                  }}
                >
                  Replace cart and review
                </FormAction>
                <Button variant="secondary" onPress={() => setPreview(null)}>
                  Keep current cart
                </Button>
              </ReferenceSheet>
            )}
            {cancelOrder && (
              <FormScope>
                <ReferenceSheet
                  open
                  onClose={() => setCancelOrder(null)}
                  title={
                    language === "de" ? "Bestellung stornieren" : "Cancel order"
                  }
                >
                  {cancelOrder.canCancel ? (
                    <>
                      <AppText as="p">
                        Cancel this order? Card payments will be refunded; your
                        bank may take several days.
                      </AppText>
                      <Input
                        label={<>Reason</>}
                        className="block w-full rounded border p-2"
                        value={reason}
                        maxLength={500}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <FormAction
                        isDisabled={actionBusy || reason.trim().length < 3}
                        onPress={() => void confirmCancel()}
                      >
                        Confirm cancellation
                      </FormAction>
                    </>
                  ) : (
                    <AppText as="p">
                      Cancellation is unavailable after preparation starts.
                      Contact support for help.{" "}
                      {cancelOrder.refundStatus &&
                        `Refund: ${cancelOrder.refundStatus}`}
                    </AppText>
                  )}
                  <Button
                    variant="secondary"
                    onPress={() => setCancelOrder(null)}
                  >
                    Close
                  </Button>
                </ReferenceSheet>
              </FormScope>
            )}
            <div
              className="reference-segments orders-tabs"
              role="group"
              aria-label={t("orders.title")}
            >
              {(["active", "completed", "cancelled"] as const).map((key) => (
                <Button
                  key={key}
                  variant={tab === key ? "primary" : "secondary"}
                  aria-pressed={tab === key}
                  onPress={() => setTab(key)}
                >
                  {key === "active"
                    ? t("orders.active")
                    : key === "completed"
                      ? language === "de"
                        ? "Geliefert"
                        : "Completed"
                      : t("orders.cancelled")}
                </Button>
              ))}
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-[24px] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] p-4"
              >
                <Typography type="body-sm" className="text-danger">
                  {error}
                </Typography>
                <Button
                  variant="ghost"
                  onPress={() => {
                    setLoading(true);
                    setError(null);
                    void refreshOrders()
                      .catch(() => setError(t("orders.loadError")))
                      .finally(() => setLoading(false));
                  }}
                  className="mt-2 h-auto px-0 text-[13px] font-bold text-danger"
                >
                  {t("orders.retry")}
                </Button>
              </div>
            ) : null}

            {!hydrated || (Boolean(accessToken) && loading) ? (
              <div
                className="flex flex-1 items-center justify-center py-20"
                aria-label={t("orders.loading")}
              >
                <PizzaLoader size="lg" label={t("orders.loading")} />
              </div>
            ) : error && list.length === 0 ? null : list.length === 0 ? (
              <div className="orders-empty" role="status">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={emptyArtwork}
                  alt=""
                  width={240}
                  height={240}
                />
                <h2>
                  {language === "de" ? "Noch keine Bestellungen" : "Empty"}
                </h2>
                <p>
                  {language === "de"
                    ? tab === "active"
                      ? "Du hast gerade keine aktive Bestellung."
                      : tab === "completed"
                        ? "Deine abgeschlossenen Bestellungen erscheinen hier."
                        : "Du hast keine stornierten Bestellungen."
                    : tab === "active"
                      ? "You do not have an active order at this time"
                      : tab === "completed"
                        ? "Your completed orders will appear here"
                        : "You do not have any cancelled orders"}
                </p>
              </div>
            ) : (
              <div className="orders-list">
                {list.map((order) => {
                  const statusLabel =
                    order.status === "cancelled"
                      ? t("orders.cancelled")
                      : order.status === "completed"
                        ? language === "de"
                          ? "Abgeschlossen"
                          : "Completed"
                        : order.awaitingPayment
                          ? language === "de"
                            ? "Zahlung offen"
                            : "Payment needed"
                          : t(
                              `step.${ORDER_STEPS[order.stepIndex]?.key ?? "received"}.label`,
                            );
                  const step = Math.max(
                    0,
                    Math.min(order.stepIndex, ORDER_STEPS.length - 1),
                  );
                  const quantity = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );
                  const shortId =
                    order.id.length > 8
                      ? order.id.slice(-6)
                      : order.id.replace(/^o-/, "");

                  const track = () => {
                    setActiveOrderId(order.id);
                    router.push(
                      order.awaitingPayment
                        ? `/payment/?orderId=${encodeURIComponent(order.id)}`
                        : "/tracking/",
                    );
                  };

                  const pizza = catalog.find(
                    (p) => p.name === order.items[0]?.name,
                  );
                  const image =
                    order.thumbnail ||
                    pizza?.imageUrl ||
                    pizza?.image ||
                    "/images/pizza-margherita.png";
                  return (
                    <Card key={order.id} className="data-surface orders-card">
                      <Card.Content className="p-0">
                        <div className="reference-order-top">
                          <div className="reference-order-image">
                            {image ? (
                              <ProductImage
                                src={image}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ShoppingBag size={32} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2
                              className="orders-name"
                              title={order.items
                                .map((item) => item.name)
                                .join(", ")}
                            >
                              {order.items[0]?.name ||
                                t("orders.orderNum", { id: shortId })}
                            </h2>
                            <p className="orders-details">
                              {quantity}{" "}
                              {language === "de"
                                ? "Artikel"
                                : quantity === 1
                                  ? "item"
                                  : "items"}
                              <span aria-hidden="true"> | </span>
                              <time
                                dateTime={new Date(
                                  order.placedAt,
                                ).toISOString()}
                              >
                                {new Date(order.placedAt).toLocaleDateString(
                                  language === "de" ? "de-DE" : "en-IE",
                                  { day: "numeric", month: "short" },
                                )}
                              </time>
                            </p>
                            <span className="sr-only">
                              {t("orders.orderNum", { id: shortId })}
                            </span>
                            <div className="reference-order-meta">
                              <strong>
                                <AnimatedNumber currency value={order.total} />
                              </strong>
                              <span
                                className={`reference-order-status orders-status-${order.status}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        {order.status === "active" &&
                          !order.awaitingPayment && (
                            <div
                              className="orders-progress"
                              role="progressbar"
                              aria-label={statusLabel}
                              aria-valuemin={0}
                              aria-valuemax={ORDER_STEPS.length - 1}
                              aria-valuenow={step}
                              aria-valuetext={statusLabel}
                            >
                              <div
                                className="orders-progress-fill"
                                style={{
                                  width: `${((step + 0.5) / ORDER_STEPS.length) * 100}%`,
                                }}
                              />
                              <span
                                className="orders-progress-marker"
                                style={{
                                  left: `${((step + 0.5) / ORDER_STEPS.length) * 100}%`,
                                }}
                              >
                                <Pizza size={22} />
                              </span>
                            </div>
                          )}
                        {Boolean(order.compensationCents) && (
                          <p className="mt-3 text-sm">
                            <AnimatedNumber
                              currency
                              value={(order.compensationCents ?? 0) / 100}
                            />{" "}
                            {language === "de"
                              ? "Guthaben hinzugefügt."
                              : "delivery credit added."}
                          </p>
                        )}
                        {order.refundStatus && (
                          <p className="mt-3 text-xs text-muted">
                            Refund:{" "}
                            {order.refundStatus === "succeeded"
                              ? "sent to your original payment method"
                              : order.refundStatus === "retry_pending"
                                ? "being processed"
                                : order.refundStatus}
                          </p>
                        )}
                        {order.status !== "cancelled" && (
                          <div className="reference-order-actions">
                            {order.status === "active" ? (
                              <>
                                <Button
                                  variant="secondary"
                                  isDisabled={actionBusy}
                                  onPress={() => {
                                    setReason("");
                                    void reviewCancel(order.id);
                                  }}
                                >
                                  {language === "de"
                                    ? "Stornieren"
                                    : "Cancel Order"}
                                </Button>
                                <Button
                                  className="orders-track"
                                  variant="secondary"
                                  onPress={track}
                                >
                                  {order.awaitingPayment
                                    ? language === "de"
                                      ? "Jetzt bezahlen"
                                      : "Resume payment"
                                    : language === "de"
                                      ? "Verfolgen"
                                      : "Track Driver"}
                                  <MapPin size={22} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="secondary"
                                  onPress={() =>
                                    router.push(
                                      `/feedback/?order=${encodeURIComponent(order.id)}`,
                                    )
                                  }
                                >
                                  {language === "de"
                                    ? "Bewerten"
                                    : "Leave a Review"}
                                </Button>
                                <Button
                                  className="orders-reorder"
                                  variant="primary"
                                  isDisabled={actionBusy}
                                  onPress={() => void reviewReorder(order.id)}
                                >
                                  {language === "de"
                                    ? "Nochmal bestellen"
                                    : "Order Again"}
                                  <ArrowRepeatClockwise1 size={22} />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  );
                })}
              </div>
            )}
          </AppFrame>
        </FormScope>
      }
    </FormScope>
  );
}
