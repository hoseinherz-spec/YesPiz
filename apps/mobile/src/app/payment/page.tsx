"use client";

import { Button, Card, Separator, Typography } from "@heroui/react";
import {
  ordersClient,
  paymentsClient,
  type PaymentMethod,
  type CreateOrderRequest,
  type CustomerOrderView,
  type OrderQuote,
} from "@repo/api";
import { Banknote, CreditCard, ShoppingBag } from "@repo/icons";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { AppFrame } from "@/components/AppFrame";
import { MobileActionBar } from "@/components/MobileActionBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StripePaymentSheet } from "@/components/StripePaymentSheet";
import { formatPrice } from "@/constants/pizzas";
import { mapCustomerOrder, useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { cashBlockedReason } from "@/lib/cash-policy";
import {
  clearCheckoutPrefs,
  readCheckoutPrefs,
  readPaymentMethod,
} from "@/lib/checkout-storage";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const METHODS = [
  {
    id: "card",
    icon: CreditCard,
    titleKey: "payment.card",
    detailKey: "payment.cardDetail",
    api: "card" as PaymentMethod,
  },
  {
    id: "cash",
    icon: Banknote,
    titleKey: "payment.cash",
    detailKey: "payment.cashDetail",
    api: "cash" as PaymentMethod,
  },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const {
    t,
    addOrder,
    accessToken,
    selectedAddressId,
    authed,
    user,
    refreshOrders,
    setActiveOrderId,
  } = useApp();
  const { items, total: cartTotal, clear, menuVersion } = useCart();
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>(() =>
    typeof window === "undefined" ? "card" : readPaymentMethod(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashAvail, setCashAvail] = useState<Awaited<
    ReturnType<typeof paymentsClient.cashAvailability>
  > | null>(null);
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<CustomerOrderView | null>(
    null,
  );
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(true);
  const inFlight = useRef(false);
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => "",
  );
  const resumeId = new URLSearchParams(search).get("orderId");
  const total =
    (pendingOrder?.totalCents ??
      quote?.totalCents ??
      Math.round(cartTotal * 100)) / 100;
  const subtotal =
    (pendingOrder?.subtotalCents ?? quote?.subtotalCents ?? 0) / 100;
  const deliveryFee =
    (pendingOrder?.deliveryFeeCents ?? quote?.deliveryFeeCents ?? 0) / 100;
  const discount = 0;
  const checkoutRequest = useMemo<CreateOrderRequest>(
    () => ({
      menuVersion,
      addressId: selectedAddressId,
      paymentMethod: method,
      lines: items.map(({ menuItemId, quantity, size, extras }) => ({
        menuItemId,
        quantity,
        size,
        extras,
      })),
      ...(() => {
        const prefs = readCheckoutPrefs();
        return {
          leaveAtDoor: prefs.leaveAtDoor,
          deliveryEntrance: prefs.deliveryEntrance,
          deliveryFloor: prefs.deliveryFloor,
          deliveryUnit: prefs.deliveryUnit,
          deliveryDoorCode: prefs.deliveryDoorCode,
          deliveryInstructions: prefs.deliveryInstructions,
        };
      })(),
    }),
    [items, menuVersion, selectedAddressId, method],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!accessToken) {
        setQuoteBusy(false);
        return;
      }
      setQuoteBusy(true);
      setQuote(null);
      setError(null);
      try {
        if (resumeId) {
          const order = await ordersClient.get(resumeId, { accessToken });
          if (!cancelled) {
            setPendingOrder(order);
            setMethod(order.paymentMethod === "cash" ? "cash" : "card");
          }
        } else if (
          checkoutRequest.addressId &&
          checkoutRequest.lines.length &&
          checkoutRequest.menuVersion
        ) {
          const next = await ordersClient.quote(checkoutRequest, {
            accessToken,
          });
          if (!cancelled) setQuote(next);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Unable to check this order.",
          );
      } finally {
        if (!cancelled) setQuoteBusy(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, checkoutRequest, resumeId]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void paymentsClient
      .cashAvailability({ accessToken })
      .then((avail) => {
        if (!cancelled) setCashAvail(avail);
      })
      .catch(() => {
        if (!cancelled) setCashAvail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, total]);

  const cashReason = useMemo(() => {
    if (!accessToken || !cashAvail) return null;
    return cashBlockedReason(cashAvail, Math.round(total * 100));
  }, [accessToken, cashAvail, total]);

  const cashDisabled = cashReason != null;
  const selectedMethod = cashDisabled && method === "cash" ? "card" : method;

  const cashReasonLabel = useMemo(() => {
    if (cashReason === "over_cap") return t("payment.cashOverCap");
    if (cashReason === "banned") return t("payment.cashUnavailable");
    return null;
  }, [cashReason, t]);

  const finishOrder = async (orderId: string) => {
    if (!accessToken) return;
    const confirmed = await ordersClient.get(orderId, { accessToken });
    if (confirmed.orderState === "awaiting_payment")
      throw new Error("Payment is not confirmed yet. Please retry.");
    if (confirmed.orderState === "cancelled")
      throw new Error("This order was cancelled. Please return to your cart.");
    addOrder(mapCustomerOrder(confirmed));
    await refreshOrders().catch(() => undefined);
    setActiveOrderId(orderId);
    clear();
    clearCheckoutPrefs();
    try {
      sessionStorage.removeItem(`yespizz_attempt_${user?.id}`);
    } catch {
      /* optional storage */
    }
    router.replace("/order-success/");
  };

  const pay = async () => {
    if (inFlight.current) return;
    setError(null);
    if (!authed || !accessToken) {
      router.push("/login/?next=/payment/");
      return;
    }
    if (
      !pendingOrder &&
      (!selectedAddressId || !items.length || !menuVersion || !quote)
    ) {
      setError("Return to checkout and check your cart and delivery address.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const paymentMethod = pendingOrder?.paymentMethod ?? selectedMethod;
      if (paymentMethod === "cash") {
        const avail = await paymentsClient.cashAvailability({ accessToken });
        if (cashBlockedReason(avail, Math.round(total * 100)))
          throw new Error(t("payment.cashUnavailable"));
      }
      let order = pendingOrder;
      if (!order) {
        const request = { ...checkoutRequest, paymentMethod };
        const fingerprint = JSON.stringify(request);
        const storageKey = `yespizz_attempt_${user?.id}`;
        let attempt: { fingerprint: string; key: string } | null = null;
        try {
          attempt = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        } catch {
          /* optional storage */
        }
        if (attempt?.fingerprint !== fingerprint)
          attempt = { fingerprint, key: crypto.randomUUID() };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(attempt));
        } catch {
          /* optional storage */
        }
        order = await ordersClient.create(
          { ...request, idempotencyKey: attempt!.key },
          { accessToken },
        );
        setPendingOrder(order);
        addOrder(mapCustomerOrder(order));
        // Keep the persisted order in the URL before opening a payment provider.
        window.history.replaceState(
          null,
          "",
          `/payment/?orderId=${encodeURIComponent(order.id)}`,
        );
        if (order.totalCents !== quote?.totalCents) {
          throw new Error(
            "The price changed. Review the updated total, then submit again.",
          );
        }
      }
      if (order.orderState === "cancelled")
        throw new Error(
          "This order was cancelled. Please return to your cart.",
        );
      if (order.orderState !== "awaiting_payment") {
        await finishOrder(order.id);
        return;
      }
      const result = await paymentsClient.initiate(
        { orderId: order.id, method: paymentMethod },
        { accessToken },
      );
      if (result.clientSecret) {
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
          throw new Error(
            "Card payment is temporarily unavailable. Your order has not been submitted.",
          );
        setStripeSecret(result.clientSecret);
        return;
      }
      await finishOrder(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payment.error"));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };

  const onStripeSuccess = async () => {
    if (!pendingOrder || !accessToken) return;
    setBusy(true);
    try {
      await paymentsClient.confirm(pendingOrder.id, { accessToken });
      await finishOrder(pendingOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("payment.error"));
    } finally {
      setBusy(false);
      setStripeSecret(null);
    }
  };

  return (
    <AppFrame className="!pb-36">
      <ScreenHeader
        title={t("payment.title")}
        subtitle={t("payment.subtitle")}
        backHref="/checkout/"
      />

      {stripeSecret ? (
        <StripePaymentSheet
          clientSecret={stripeSecret}
          amountLabel={formatPrice(total)}
          processingLabel={t("payment.processing")}
          payLabel={t("payment.pay", { amount: "{amount}" })}
          cancelLabel={t("payment.cancelStripe")}
          errorFallback={t("payment.error")}
          onCancel={() => {
            setStripeSecret(null);
            setError(t("payment.stripeCancelled"));
          }}
          onSuccess={onStripeSuccess}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {METHODS.map((item) => {
            const active =
              (pendingOrder?.paymentMethod ?? selectedMethod) === item.id;
            const Icon = item.icon;
            const disabled =
              busy ||
              Boolean(pendingOrder) ||
              (item.id === "cash" && cashDisabled);
            return (
              <Button
                key={item.id}
                variant="secondary"
                isDisabled={disabled}
                onPress={() => setMethod(item.id)}
                className={cn(
                  "h-auto min-h-[82px] w-full justify-start gap-3 rounded-[24px] border px-3 py-3 text-left shadow-none",
                  active
                    ? "border-foreground bg-surface-secondary"
                    : "border-border bg-card",
                  disabled && "opacity-50",
                )}
              >
                <span className="flex size-13 shrink-0 items-center justify-center rounded-[17px] bg-card text-foreground">
                  <Icon size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold text-foreground">
                    {t(item.titleKey)}
                  </span>
                  <span className="block text-[12px] font-medium text-muted">
                    {t(item.detailKey)}
                  </span>
                  {item.id === "cash" && cashReasonLabel ? (
                    <span className="mt-1 block text-[11px] font-semibold text-warning">
                      {cashReasonLabel}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "size-6 shrink-0 rounded-full border-2 p-1",
                    active ? "border-foreground" : "border-border",
                  )}
                >
                  <span
                    className={cn(
                      "block size-full rounded-full",
                      active && "bg-foreground",
                    )}
                  />
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {!stripeSecret ? (
        <Typography type="body-xs" className={cn(hx.caption, "mt-3")}>
          {t("payment.stripeDisclosure")}
        </Typography>
      ) : null}

      {quoteBusy ? (
        <p role="status" className="mt-4 text-sm text-muted">
          Checking your order…
        </p>
      ) : null}
      {!authed ? (
        <Button
          className="mt-4"
          onPress={() => router.push("/login/?next=/payment/")}
        >
          Sign in to order
        </Button>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-[20px] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-4 py-3"
        >
          <Typography type="body-sm" className="text-danger">
            {error}
          </Typography>
        </div>
      ) : null}

      {!stripeSecret ? (
        <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
          <Card.Content className="p-0">
            <Typography type="h3" className={cn(hx.h3, "mb-4")}>
              {t("payment.summary")}
            </Typography>
            <div className="flex items-center justify-between text-[14px] text-muted">
              <span>{t("common.subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="mt-3 flex items-center justify-between text-[14px] text-success">
                <span>{t("common.discount")}</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-[14px] text-muted">
              <span>{t("common.delivery")}</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <Separator className="my-4 bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-muted">
                {t("common.total")}
              </span>
              <span className="text-[23px] font-bold text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </Card.Content>
        </Card>
      ) : null}

      {!stripeSecret ? (
        <MobileActionBar
          onPress={() => void pay()}
          icon={<ShoppingBag size={20} />}
          isDisabled={busy || quoteBusy || (!pendingOrder && !quote)}
          isPending={busy || quoteBusy}
          label={
            busy || quoteBusy
              ? t("payment.processing")
              : t("payment.pay", { amount: formatPrice(total) })
          }
        />
      ) : null}
    </AppFrame>
  );
}
