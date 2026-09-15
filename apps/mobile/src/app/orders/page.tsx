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
import { Button, Card, Spinner, Typography } from "@heroui/react";
import { Clock, ShoppingBag } from "@repo/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { OrderProgress } from "@/components/OrderProgress";
import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import { useMenuCatalog } from "@/lib/catalog";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { ORDER_STEPS, useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";

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
    if (!accessToken) return;
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
    if (!accessToken) return;
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
    if (tab === "active") return orders.filter((o) => o.status === "active");
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  return (
    <FormScope>
      {
        <FormScope>
          <AppFrame withTabs className="reference-screen">
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
                          router.push(`/pizza/?id=${line.menuItemId}`)
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
            <div className="reference-segments mt-3">
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
                <Spinner />
              </div>
            ) : list.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag size={28} />}
                image="/images/pizza-margherita.png"
                title={
                  tab === "active" ? t("orders.noActive") : t("orders.noPast")
                }
                body={t("orders.emptyBody")}
                actionLabel={t("common.browseMenu")}
                actionHref="/menu/"
              />
            ) : (
              <div className="mt-5 flex flex-col gap-3 pb-4">
                {list.map((order) => {
                  const statusClass =
                    order.status === "cancelled"
                      ? "bg-[color-mix(in_oklab,var(--danger)_13%,transparent)] text-danger"
                      : order.status === "completed"
                        ? "bg-[color-mix(in_oklab,var(--success)_13%,transparent)] text-success"
                        : "bg-[color-mix(in_oklab,var(--warning)_13%,transparent)] text-warning";
                  const statusLabel =
                    order.status === "cancelled"
                      ? t("orders.cancelled")
                      : order.status === "completed"
                        ? t("orders.delivered")
                        : order.awaitingPayment
                          ? "Payment needed"
                          : t(
                              `step.${ORDER_STEPS[order.stepIndex]?.key ?? "received"}.label`,
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
                    order.thumbnail || pizza?.imageUrl || pizza?.image;
                  return (
                    <Card
                      key={order.id}
                      className="data-surface rounded-[28px] p-4"
                    >
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
                            <h2 className="text-[16px] font-bold">
                              {t("orders.orderNum", { id: shortId })}
                            </h2>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                              {order.items
                                .map((i) => `${i.quantity} × ${i.name}`)
                                .join(" · ")}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                              <Clock size={12} />
                              {new Date(order.placedAt).toLocaleDateString(
                                language === "de" ? "de-DE" : "en-IE",
                              )}
                            </p>
                            <div className="reference-order-meta">
                              <strong>
                                <AnimatedNumber currency value={order.total} />
                              </strong>
                              <span
                                className={cn(
                                  "reference-order-status",
                                  statusClass,
                                )}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        {order.status === "active" &&
                          !order.awaitingPayment && (
                            <div className="mt-4">
                              <OrderProgress
                                stepIndex={order.stepIndex}
                                compact
                              />
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
                        <div className="reference-order-actions">
                          {order.status === "active" ? (
                            <>
                              <Button
                                variant="secondary"
                                isDisabled={actionBusy}
                                onPress={() => void reviewCancel(order.id)}
                              >
                                {language === "de"
                                  ? "Optionen"
                                  : "Order options"}
                              </Button>
                              <Button variant="primary" onPress={track}>
                                {order.awaitingPayment
                                  ? "Resume payment"
                                  : t("orders.track")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                onPress={() =>
                                  router.push(
                                    order.status === "completed"
                                      ? `/feedback/?order=${encodeURIComponent(order.id)}`
                                      : `/help/?order=${encodeURIComponent(order.id)}`,
                                  )
                                }
                              >
                                {order.status === "completed"
                                  ? language === "de"
                                    ? "Feedback"
                                    : "Leave feedback"
                                  : language === "de"
                                    ? "Hilfe"
                                    : "Get help"}
                              </Button>
                              <Button
                                variant="primary"
                                isDisabled={actionBusy}
                                onPress={() => void reviewReorder(order.id)}
                              >
                                {t("orders.reorder")}
                              </Button>
                            </>
                          )}
                        </div>
                        {order.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            className="mt-2 h-10 w-full text-xs text-muted"
                            onPress={() =>
                              router.push(
                                `/help/?order=${encodeURIComponent(order.id)}`,
                              )
                            }
                          >
                            {language === "de"
                              ? "Hilfe zur Bestellung"
                              : "Help with this order"}
                          </Button>
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
