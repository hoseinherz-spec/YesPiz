"use client";
import { presentNativePayment } from "@/lib/native-payment";
import { ReferenceSheet } from "@/components/ReferenceSheet";
import { OrderReceipt } from "@/features/checkout/OrderReceipt";
import { CheckoutSteps } from "@/features/checkout/CheckoutSteps";
import { OrderTotal } from "@/features/checkout/OrderSummary";
import styles from "@/features/checkout/checkout.module.css";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { FormScope, RadioField } from "@repo/ui/forms";
import { Form, Input } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { Button, Card, Separator, Typography } from "@heroui/react";
import {
  ApiError,
  walletClient,
  ordersClient,
  paymentsClient,
  type PaymentMethod,
  type CreateOrderRequest,
  type CustomerOrderView,
  type OrderQuote,
} from "@repo/api";
import {
  Banknote,
  CreditCard,
  ShoppingBag,
  Check,
} from "@/components/animated-icon/icons";
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
  writePaymentMethod,
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
  {
    id: "wallet",
    icon: CreditCard,
    titleKey: "payment.wallet",
    detailKey: "payment.walletDetail",
    api: "wallet" as PaymentMethod,
  },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const {
    t,
    language,
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
  const [walletCents, setWalletCents] = useState(0);
  const [creditCents, setCreditCents] = useState<number | null>(null);
  useEffect(() => {
    if (accessToken)
      void walletClient
        .statement({ accessToken })
        .then((value) => setCreditCents(value.balanceCents))
        .catch(() => setCreditCents(null));
  }, [accessToken]);
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
  const [quoteRevision, setQuoteRevision] = useState(0);
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
  const discount =
    (pendingOrder?.discountCents ?? quote?.discountCents ?? 0) / 100;
  const [offersOpen, setOffersOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const checkoutRequest = useMemo<CreateOrderRequest>(
    () => ({
      menuVersion,
      couponCode: couponCode || undefined,
      campaignCode: (() => {
        try {
          return typeof window === "undefined"
            ? undefined
            : sessionStorage.getItem("yespizz_campaign") || undefined;
        } catch {
          return undefined;
        }
      })(),
      addressId: selectedAddressId,
      paymentMethod: method,
      walletCents: method === "card" ? walletCents : 0,
      lines: items.map(
        ({
          menuItemId,
          quantity,
          size,
          extras,
          variantId,
          selections,
          ingredientChanges,
          secondHalfItemId,
        }) => ({
          menuItemId,
          secondHalfItemId,
          variantId,
          selections,
          ingredientChanges,
          quantity,
          size,
          extras,
        }),
      ),
      ...(() => {
        const prefs = readCheckoutPrefs();
        return {
          scheduledAt: prefs.scheduledAt,
          deliverySlotId: prefs.deliverySlotId,
          leaveAtDoor: prefs.leaveAtDoor,
          deliveryEntrance: prefs.deliveryEntrance,
          deliveryFloor: prefs.deliveryFloor,
          deliveryUnit: prefs.deliveryUnit,
          deliveryDoorCode: prefs.deliveryDoorCode,
          deliveryInstructions: prefs.deliveryInstructions,
        };
      })(),
    }),
    [items, menuVersion, selectedAddressId, method, couponCode, walletCents],
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
            setMethod(
              order.paymentMethod === "cash"
                ? "cash"
                : order.paymentMethod === "wallet"
                  ? "wallet"
                  : "card",
            );
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
        } else if (!cancelled) {
          setError(t("payment.checkDetails"));
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof TypeError
              ? t("payment.connectionError")
              : err instanceof Error
                ? err.message
                : t("payment.error"),
          );
      } finally {
        if (!cancelled) setQuoteBusy(false);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, checkoutRequest, resumeId, quoteRevision, t]);

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
    router.replace(`/order-success/?orderId=${encodeURIComponent(orderId)}`);
  };

  const pay = async () => {
    if (inFlight.current) return;
    setError(null);
    if (!authed || !accessToken) {
      router.push("/auth/sign-in/?next=/payment/");
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
        const freshQuote = await ordersClient.quote(
          { ...checkoutRequest, paymentMethod },
          { accessToken },
        );
        setQuote(freshQuote);
        if (freshQuote.totalCents !== quote?.totalCents) {
          throw new Error(t("payment.priceChanged"));
        }
        const request = {
          ...checkoutRequest,
          paymentMethod,
          expectedTotalCents: freshQuote.totalCents,
        };
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
        if (await presentNativePayment(result.clientSecret)) {
          const verified = await paymentsClient.confirm(order.id, {
            accessToken,
          });
          if (!verified.ok)
            throw new Error(
              "Payment is being verified. Refresh this order shortly.",
            );
          await finishOrder(order.id);
          return;
        }
        setStripeSecret(result.clientSecret);
        return;
      }
      await finishOrder(order.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !pendingOrder) {
        await ordersClient
          .quote(checkoutRequest, { accessToken })
          .then(setQuote)
          .catch(() => setQuote(null));
      }
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

  // Redirect-based methods return to the saved order; only the API can confirm payment.
  const confirmedReturn = useRef<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (
      !resumeId ||
      !accessToken ||
      !pendingOrder ||
      !params.has("payment_intent") ||
      confirmedReturn.current === resumeId
    )
      return;
    confirmedReturn.current = resumeId;
    void onStripeSuccess();
    // The persisted order must be loaded before processing a provider redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, accessToken, pendingOrder, search]);

  if (error && pendingOrder && !stripeSecret) {
    return (
      <FormScope>
        <AppFrame className={styles.screen}>
          <ScreenHeader
            title={language === "de" ? "Zahlungsdetails" : "Payment details"}
            backHref="/orders/"
          />
          <OrderReceipt order={pendingOrder} failed message={error} />
          <div className="mt-4 flex flex-wrap gap-3">
            {pendingOrder.orderState !== "cancelled" && (
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => void onStripeSuccess()}
              >
                {t("payment.checkStatus")}
              </Button>
            )}
            <Button variant="ghost" onPress={() => router.push("/cart/")}>
              {t("payment.reviewCart")}
            </Button>
          </div>
          {pendingOrder.orderState !== "cancelled" && (
            <MobileActionBar
              className={styles.action}
              leading={<OrderTotal total={total} />}
              isDisabled={busy}
              isPending={busy}
              onPress={() => void pay()}
              label={t("payment.pay", { amount: formatPrice(total) })}
            />
          )}
        </AppFrame>
      </FormScope>
    );
  }

  return (
    <FormScope>
      <AppFrame className={styles.screen}>
        <ScreenHeader title={t("payment.title")} backHref="/checkout/" />
        <CheckoutSteps step="payment" />
        <div className={styles.intro}>
          <h1>{language === "de" ? "Fast geschafft." : "One last thing."}</h1>
          <p>
            {language === "de"
              ? "Zahlungsart wählen und den Gesamtbetrag prüfen."
              : "Choose how to pay and review your total."}
          </p>
        </div>

        <ReferenceSheet
          open={offersOpen}
          onClose={() => {
            if (!couponBusy) setOffersOpen(false);
          }}
          title={language === "de" ? "Angebote" : "Offers"}
        >
          <Form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!accessToken || couponBusy) return;
              const code = couponInput.trim().toUpperCase();
              setCouponBusy(true);
              setCouponError(null);
              try {
                const checked = await ordersClient.quote(
                  { ...checkoutRequest, couponCode: code || undefined },
                  { accessToken },
                );
                setCouponCode(code);
                setQuote(checked);
                setOffersOpen(false);
              } catch (cause) {
                setCouponError(
                  cause instanceof Error ? cause.message : t("payment.error"),
                );
              } finally {
                setCouponBusy(false);
              }
            }}
          >
            <Input
              label={<>{language === "de" ? "Rabattcode" : "Discount code"}</>}
              autoComplete="off"
              maxLength={32}
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-surface-secondary p-4"
            />
            {couponError && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {couponError}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <FormButton
                type="button"
                variant="secondary"
                className="flex-1 rounded-full"
                isDisabled={couponBusy}
                onPress={() => setOffersOpen(false)}
              >
                {language === "de" ? "Abbrechen" : "Cancel"}
              </FormButton>
              <FormButton
                type="submit"
                className="flex-1 rounded-full"
                isPending={couponBusy}
                isDisabled={couponBusy || !accessToken}
              >
                {language === "de" ? "Speichern" : "Save"}
              </FormButton>
            </div>
            {couponCode && (
              <FormButton
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                isDisabled={couponBusy}
                onPress={() => {
                  setCouponCode("");
                  setCouponInput("");
                  setOffersOpen(false);
                }}
              >
                {language === "de" ? "Code entfernen" : "Remove code"}
              </FormButton>
            )}
          </Form>
        </ReferenceSheet>

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
          <div className={`${styles.offer} ${styles.paymentOptions}`}>
            <RadioField
              name="paymentMethod"
              label={t("checkout.payment")}
              required
              disabled={busy || Boolean(pendingOrder)}
              value={pendingOrder?.paymentMethod ?? selectedMethod}
              onChange={(v) => {
                const next = v as typeof selectedMethod;
                setMethod(next);
                writePaymentMethod(next);
              }}
              options={METHODS.map((item) => ({
                id: item.id,
                disabled:
                  (item.id === "cash" && cashDisabled) ||
                  (item.id === "wallet" &&
                    (creditCents === null ||
                      creditCents < Math.round(total * 100))),
                label: (
                  <AppText as="span">
                    <AppText as="strong">
                      {item.id === "wallet"
                        ? "Yespizz credit"
                        : t(item.titleKey)}
                    </AppText>
                    <AppText as="span" className="block text-xs text-muted">
                      {item.id === "wallet"
                        ? `${creditCents === null ? "—" : formatPrice(creditCents / 100)} available · full-order payment`
                        : t(item.detailKey)}
                    </AppText>
                    {item.id === "cash" && cashReasonLabel && (
                      <AppText as="span" className="text-xs text-warning">
                        {cashReasonLabel}
                      </AppText>
                    )}
                  </AppText>
                ),
              }))}
            />
          </div>
        )}

        {!pendingOrder && !resumeId && !stripeSecret && (
          <section className={styles.offer}>
            <div className={styles.offerHeader}>
              <span>
                <ShoppingBag size={18} />
                {language === "de" ? "Angebote" : "Offers"}
              </span>
              <Button
                variant="secondary"
                onPress={() => {
                  setCouponInput(couponCode);
                  setCouponError(null);
                  setOffersOpen(true);
                }}
              >
                {couponCode
                  ? t("checkout.edit")
                  : language === "de"
                    ? "Hinzufügen +"
                    : "Add +"}
              </Button>
            </div>
            {couponCode && quote && (
              <div className={styles.applied}>
                {couponCode}
                <Check size={18} />
              </div>
            )}
          </section>
        )}

        {!stripeSecret &&
          !pendingOrder &&
          selectedMethod === "card" &&
          (creditCents ?? 0) > 0 && (
            <label className="data-surface mt-4 flex min-h-16 items-center justify-between gap-4 rounded-2xl p-4">
              <span>
                <strong>{t("payment.walletLabel")}</strong>
                <span className="mt-1 block text-xs text-muted">
                  {formatPrice((creditCents ?? 0) / 100)}{" "}
                  {t("payment.walletFirst")}
                </span>
              </span>
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={walletCents > 0}
                disabled={busy || quoteBusy}
                onChange={(e) =>
                  setWalletCents(
                    e.target.checked
                      ? Math.min(creditCents ?? 0, Math.round(total * 100))
                      : 0,
                  )
                }
              />
            </label>
          )}
        {!stripeSecret ? (
          <Typography type="body-xs" className={cn(hx.caption, "mt-3")}>
            {t("payment.stripeDisclosure")}
          </Typography>
        ) : null}

        {quoteBusy ? (
          <AppText as="p" role="status" className="mt-4 text-sm text-muted">
            Checking your order…
          </AppText>
        ) : null}
        {!authed ? (
          <Button
            className="mt-4"
            onPress={() => router.push("/auth/sign-in/?next=/payment/")}
          >
            Sign in to order
          </Button>
        ) : null}
        {quote?.outsideDeliveryArea ? (
          <div
            role="status"
            className="mt-4 rounded-[20px] bg-surface-secondary px-4 py-3"
          >
            <Typography type="body-sm" className="text-muted">
              This address is outside our usual delivery range. You can still
              place your order, but delivery may take a little longer.
            </Typography>
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-[20px] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-4 py-3"
          >
            <Typography type="body-sm" className="text-danger">
              {error}
            </Typography>
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingOrder ? (
                pendingOrder.orderState !== "cancelled" && (
                  <Button
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() => void onStripeSuccess()}
                  >
                    {t("payment.checkStatus")}
                  </Button>
                )
              ) : (
                <Button
                  variant="secondary"
                  isDisabled={busy || quoteBusy}
                  onPress={() => setQuoteRevision((v) => v + 1)}
                >
                  {t("payment.retryQuote")}
                </Button>
              )}
              <Button variant="ghost" onPress={() => router.push("/checkout/")}>
                {t("payment.editCheckout")}
              </Button>
              <Button variant="ghost" onPress={() => router.push("/cart/")}>
                {t("payment.reviewCart")}
              </Button>
            </div>
          </div>
        ) : null}

        {!stripeSecret && (pendingOrder || quote) ? (
          <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
            <Card.Content className="p-0">
              <Typography type="h3" className={cn(hx.h3, "mb-4")}>
                {t("payment.summary")}
              </Typography>
              {(pendingOrder?.deliveryWindowStart ??
                quote?.deliveryWindowStart) && (
                <p className="mb-4 rounded-2xl border border-border p-3 text-sm">
                  {t("payment.arrivalWindow")}
                  <br />
                  <strong>
                    {new Date(
                      (pendingOrder?.deliveryWindowStart ??
                        quote?.deliveryWindowStart)!,
                    ).toLocaleString()}{" "}
                    –{" "}
                    {new Date(
                      (pendingOrder?.deliveryWindowEnd ??
                        quote?.deliveryWindowEnd)!,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </p>
              )}
              <div className="flex items-center justify-between text-[14px] text-muted">
                <AppText as="span">{t("common.subtotal")}</AppText>
                <AppText as="span">
                  <AnimatedNumber currency value={subtotal} />
                </AppText>
              </div>
              {discount > 0 ? (
                <div className="mt-3 flex items-center justify-between text-[14px] text-success">
                  <AppText as="span">{t("common.discount")}</AppText>
                  <AppText as="span">
                    −<AnimatedNumber currency value={discount} />
                  </AppText>
                </div>
              ) : null}
{deliveryFee > 0 && (              <div className="mt-3 flex items-center justify-between text-[14px] text-muted">
                <AppText as="span">{t("common.delivery")}</AppText>
                <AppText as="span">
                  <AnimatedNumber currency value={deliveryFee} />
                </AppText>
              </div>)}
              {(pendingOrder?.walletCents ?? walletCents) > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between">
                    <span>{t("payment.walletLabel")}</span>
                    <strong>
                      −
                      {formatPrice(
                        (pendingOrder?.walletCents ?? walletCents) / 100,
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("payment.cardRemainder")}</span>
                    <strong>
                      {formatPrice(
                        Math.max(
                          0,
                          total -
                            (pendingOrder?.walletCents ?? walletCents) / 100,
                        ),
                      )}
                    </strong>
                  </div>
                </div>
              )}
              <Separator className="my-4 bg-border" />
              <div className="flex items-center justify-between">
                <AppText
                  as="span"
                  className="text-[16px] font-semibold text-muted"
                >
                  {t("common.total")}
                </AppText>
                <AppText
                  as="span"
                  className="text-[23px] font-bold text-foreground"
                >
                  <AnimatedNumber currency value={total} />
                </AppText>
              </div>
            </Card.Content>
          </Card>
        ) : null}

        {!stripeSecret ? (
          <MobileActionBar
            className={styles.action}
            leading={<OrderTotal total={total} />}
            onPress={() => void pay()}
            icon={<ShoppingBag size={20} />}
            isDisabled={
              busy ||
              quoteBusy ||
              pendingOrder?.orderState === "cancelled" ||
              (!pendingOrder && !quote)
            }
            isPending={busy || quoteBusy}
            label={
              busy || quoteBusy
                ? t("payment.processing")
                : (pendingOrder?.paymentMethod ?? selectedMethod) === "cash"
                  ? language === "de"
                    ? "Bestellung aufgeben"
                    : "Place order · pay on delivery"
                  : t("payment.pay", { amount: formatPrice(total) })
            }
          />
        ) : null}
      </AppFrame>
    </FormScope>
  );
}
