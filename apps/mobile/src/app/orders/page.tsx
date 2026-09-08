"use client";
import { Notifications } from "@repo/api/components/notifications";

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

import { AppFrame } from "@/components/AppFrame";
import { EmptyState } from "@/components/EmptyState";
import { formatPrice } from "@/constants/pizzas";
import { ORDER_STEPS, useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

export default function OrdersPage() {
  const router = useRouter();
  const { clear: clearCart, addItem } = useCart();
  const [preview, setPreview] = useState<ReorderPreviewResponse | null>(null);
  const [cancelOrder, setCancelOrder] = useState<CustomerOrderView | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const { t, orders, accessToken, hydrated, refreshOrders, setActiveOrderId } =
    useApp();
  const [tab, setTab] = useState<"active" | "history">("active");
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
    return orders.filter((o) => o.status !== "active");
  }, [orders, tab]);

  return (
    <AppFrame withTabs>
      <Typography type="h1" className={hx.h1}>
        {t("orders.title")}
      </Typography>

      <Notifications accessToken={accessToken} />
      {preview && (
        <section
          role="dialog"
          aria-label="Review reorder"
          className="my-4 space-y-3 rounded-2xl border p-4"
        >
          <h2>Review your reorder</h2>
          <p>This replaces your current cart. Prices use today’s menu.</p>
          {preview.cartLines.map((line, i) => (
            <p key={i}>
              {line.quantity} × {line.name} · {line.size}{" "}
              {line.extras.join(", ")} · €
              {(line.unitPriceCents / 100).toFixed(2)}
            </p>
          ))}
          {preview.unavailable.map((line, i) => (
            <p key={i}>{line.name}: unavailable</p>
          ))}
          {preview.changed.length > 0 && (
            <p>{preview.changed.length} item price(s) changed.</p>
          )}
          <Button
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
          </Button>
          <Button variant="secondary" onPress={() => setPreview(null)}>
            Keep current cart
          </Button>
        </section>
      )}
      {cancelOrder && (
        <section
          role="dialog"
          aria-label="Cancel order"
          className="my-4 space-y-3 rounded-2xl border p-4"
        >
          {cancelOrder.canCancel ? (
            <>
              <p>
                Cancel this order? Card payments will be refunded; your bank may
                take several days.
              </p>
              <label>
                Reason
                <input
                  className="block w-full rounded border p-2"
                  value={reason}
                  maxLength={500}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <Button
                isDisabled={actionBusy || reason.trim().length < 3}
                onPress={() => void confirmCancel()}
              >
                Confirm cancellation
              </Button>
            </>
          ) : (
            <p>
              Cancellation is unavailable after preparation starts. Contact
              support for help.{" "}
              {cancelOrder.refundStatus &&
                `Refund: ${cancelOrder.refundStatus}`}
            </p>
          )}
          <Button variant="secondary" onPress={() => setCancelOrder(null)}>
            Close
          </Button>
        </section>
      )}
      <div className="mt-5 grid grid-cols-2 rounded-full bg-surface-secondary p-1.5">
        {(["active", "history"] as const).map((key) => (
          <Button
            key={key}
            variant={tab === key ? "primary" : "secondary"}
            className={cn(
              "h-12 rounded-full border-0 text-[14px] font-bold shadow-none",
              tab === key
                ? "bg-accent text-accent-foreground"
                : "bg-transparent text-muted",
            )}
            onPress={() => setTab(key)}
          >
            {t(`orders.${key}`)}
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
          title={tab === "active" ? t("orders.noActive") : t("orders.noPast")}
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

            return (
              <Card
                key={order.id}
                className="relative overflow-hidden rounded-[30px] border-0 bg-surface-secondary p-4 shadow-none"
              >
                {order.status === "active" ? (
                  <Button
                    variant="ghost"
                    aria-label={
                      order.awaitingPayment
                        ? "Resume payment"
                        : t("orders.track")
                    }
                    onPress={track}
                    className="absolute inset-0 z-0 h-full w-full rounded-[30px] bg-transparent p-0 shadow-none"
                  />
                ) : null}
                <Card.Content className="relative z-[1] p-0">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-foreground">
                        <ShoppingBag size={19} />
                      </span>
                      <div className="min-w-0">
                        <Typography type="h6" className={hx.title}>
                          {t("orders.orderNum", { id: shortId })}
                        </Typography>
                        <Typography
                          type="body-xs"
                          className={cn(
                            hx.caption,
                            "mt-0.5 flex items-center gap-1",
                          )}
                        >
                          <Clock size={12} />
                          {new Date(order.placedAt).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        statusClass,
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <Typography
                    type="body-sm"
                    className={cn(hx.bodySm, "line-clamp-2")}
                  >
                    {order.items
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(" · ")}
                  </Typography>
                  {order.refundStatus && (
                    <p className="mt-2 text-sm">
                      Refund:{" "}
                      {order.refundStatus === "succeeded"
                        ? "sent to your original payment method"
                        : order.refundStatus === "retry_pending"
                          ? "being processed"
                          : order.refundStatus}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Typography
                      type="h6"
                      className={cn(hx.title, "text-accent")}
                    >
                      {formatPrice(order.total)}
                    </Typography>
                    {order.status === "active" ? (
                      <div className="relative z-[2] w-36">
                        <Button
                          size="sm"
                          variant="secondary"
                          isDisabled={actionBusy}
                          onPress={() => void reviewCancel(order.id)}
                        >
                          Order options
                        </Button>
                        <Button
                          variant="primary"
                          onPress={track}
                          className="h-11 w-full rounded-full bg-accent px-4 text-[12px] font-bold text-accent-foreground shadow-none"
                        >
                          {order.awaitingPayment
                            ? "Resume payment"
                            : t("orders.track")}
                        </Button>
                      </div>
                    ) : (
                      <div className="relative z-[2] w-36">
                        <Button
                          variant="secondary"
                          isDisabled={actionBusy}
                          onPress={() => void reviewReorder(order.id)}
                          className="h-11 w-full rounded-full border border-border bg-card px-4 text-[12px] font-bold text-foreground shadow-none"
                        >
                          {t("orders.reorder")}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </AppFrame>
  );
}
