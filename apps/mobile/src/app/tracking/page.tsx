"use client";
import { AppText } from "@/components/Text";

import { LocationMap } from "@repo/api/components/location-map";

import { Button, Card, Typography } from "@heroui/react";
import { ordersClient, type CourierLocationView } from "@repo/api";
import {
  ArrowLeft,
  Check,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
} from "@repo/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { OrderProgress } from "@/components/OrderProgress";
import { AppFrame } from "@/components/AppFrame";
import { mapCustomerOrder, ORDER_STEPS, useApp } from "@/context/AppContext";
import { etaArrivalTimestamp, formatEtaRange, isEtaStale } from "@/lib/eta";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const MASKED_COMMS_ENABLED = true;

export default function TrackingPage() {
  const router = useRouter();
  const {
    t,
    orders,
    addresses,
    activeOrderId,
    advanceActiveOrder,
    accessToken,
    addOrder,
  } = useApp();
  const [courierLoc, setCourierLoc] = useState<CourierLocationView | null>(
    null,
  );

  const order = useMemo(() => {
    if (activeOrderId) return orders.find((item) => item.id === activeOrderId);
    return orders.find((item) => item.status === "active");
  }, [orders, activeOrderId]);
  const address = addresses.find((item) => item.id === order?.addressId);
  const orderId = order?.id;
  const orderStatus = order?.status;
  const orderStep = order?.stepIndex;
  const isLocalOrder = Boolean(orderId?.startsWith("o-"));

  useEffect(() => {
    if (!accessToken || !orderId || isLocalOrder || orderStatus !== "active")
      return;
    if ((orderStep ?? 0) >= ORDER_STEPS.length - 1) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const view = await ordersClient.get(orderId, { accessToken });
        if (!cancelled) addOrder(mapCustomerOrder(view));
      } catch {
        // Keep the last known API state and retry on the next polling interval.
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, orderId, isLocalOrder, orderStatus, orderStep, addOrder]);

  useEffect(() => {
    if (!accessToken || !orderId || isLocalOrder || (orderStep ?? 0) < 3)
      return;
    let cancelled = false;
    const tick = async () => {
      try {
        const location = await ordersClient.getCourierLocation(orderId, {
          accessToken,
        });
        if (!cancelled) setCourierLoc(location);
      } catch {
        // Courier coordinates can arrive after the order status; keep retrying.
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, orderId, isLocalOrder, orderStep]);

  useEffect(() => {
    if (!isLocalOrder || !order || order.status !== "active") return;
    if (order.stepIndex >= ORDER_STEPS.length - 1) return;
    const timer = setInterval(() => advanceActiveOrder(), 3500);
    return () => clearInterval(timer);
  }, [isLocalOrder, order, advanceActiveOrder]);

  if (!order) {
    return (
      <AppFrame>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-surface-secondary text-muted">
            <MapPin size={38} />
          </span>
          <Typography type="h2" className={cn(hx.h2, "mt-6")}>
            {t("tracking.noActive")}
          </Typography>
          <Typography type="body-sm" className={cn(hx.bodySm, "mt-2 max-w-xs")}>
            {t("tracking.noActiveBody")}
          </Typography>
          <Button
            variant="primary"
            onPress={() => router.push("/orders/")}
            className={cn(hx.btnPrimary, "mt-8")}
          >
            {t("tracking.viewOrders")}
          </Button>
        </div>
      </AppFrame>
    );
  }

  if (order.status === "cancelled" || order.awaitingPayment) {
    return (
      <AppFrame>
        <Typography type="h2" className={hx.h2}>
          {order.awaitingPayment ? "Payment needed" : t("orders.cancelled")}
        </Typography>
        <Typography type="body" className="mt-3 text-muted">
          {order.awaitingPayment
            ? "Complete payment to submit this order."
            : "This order is no longer being delivered."}
        </Typography>
        <Button
          className="mt-6"
          onPress={() =>
            router.push(
              order.awaitingPayment
                ? `/payment/?orderId=${encodeURIComponent(order.id)}`
                : "/orders/",
            )
          }
        >
          {order.awaitingPayment ? "Resume payment" : t("tracking.viewOrders")}
        </Button>
      </AppFrame>
    );
  }

  const safeStep = Math.min(order.stepIndex, ORDER_STEPS.length - 1);
  const delivered = safeStep >= ORDER_STEPS.length - 1;
  const currentStep = ORDER_STEPS[safeStep];
  const latitude = courierLoc?.latitude;
  const longitude = courierLoc?.longitude;
  const hasLiveLocation = latitude != null && longitude != null;
  const coordinateLabel = hasLiveLocation
    ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    : null;
  const osmHref = hasLiveLocation
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
    : null;

  const etaLabel = delivered
    ? t("tracking.arrived")
    : formatEtaRange(order.eta, t);
  const etaStale = !delivered && isEtaStale(order.eta.computedAt);
  const arrivalAt = etaArrivalTimestamp(order.eta.computedAt, order.eta.max);
  const showPinHandoff =
    !delivered &&
    (order.requiresDeliveryPin ||
      order.customerStatus === "onway" ||
      order.customerStatus === "driver");

  return (
    <AppFrame padded={false} className="bg-[#202126]">
      <div className="relative min-h-[58dvh] overflow-hidden bg-[#202126]">
        {hasLiveLocation ? (
          <div className="absolute inset-0">
            <LocationMap
              latitude={latitude}
              longitude={longitude}
              label="Courier location"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            Waiting for courier location
          </div>
        )}

        <Button
          isIconOnly
          variant="secondary"
          aria-label={t("common.backToHome")}
          onPress={() => router.back()}
          className="absolute top-[max(18px,env(safe-area-inset-top))] left-5 z-20 size-14 min-w-14 rounded-full border-0 bg-[#1b1b22] text-white shadow-none"
        >
          <ArrowLeft size={21} />
        </Button>
        <div className="absolute top-[max(22px,env(safe-area-inset-top))] inset-x-20 z-10 text-center">
          <AppText as="p" className="text-[12px] font-semibold text-white/60">
            {t("tracking.title")}
          </AppText>
          <AppText as="p" className="text-[16px] font-bold text-white">
            {t(`step.${currentStep.key}.label`)}
          </AppText>
        </div>

        {osmHref ? (
          <a
            href={osmHref}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-5 left-5 z-20 rounded-full bg-[#1b1b22]/90 px-4 py-2 text-[11px] font-semibold text-white"
          >
            {t("tracking.openMap")} · {coordinateLabel}
          </a>
        ) : (
          <AppText as="span" className="absolute bottom-5 left-5 z-20 rounded-full bg-[#1b1b22]/90 px-4 py-2 text-[11px] font-semibold text-white/70">
            {isLocalOrder
              ? t("tracking.demoMap")
              : t("tracking.awaitingLocation")}
          </AppText>
        )}
      </div>

      <div className="-mt-3 relative z-20 rounded-t-[42px] bg-surface px-[clamp(20px,8vw,38px)] pt-5 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-tertiary" />
        {order.scheduledAt && order.isScheduled && (
          <AppText as="p" className="mb-4 rounded-2xl bg-card p-4 text-sm">
            Order starts {new Date(order.scheduledAt).toLocaleString()}.
            Preparation and delivery follow this time.
          </AppText>
        )}
        {order.promisedDeliveryAt && (
          <AppText as="p" className="mb-4 text-sm text-muted">
            Original delivery promise: by{" "}
            {new Date(order.promisedDeliveryAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </AppText>
        )}
        <Button
          variant="ghost"
          className="mb-3"
          onPress={() =>
            router.push(`/help/?order=${encodeURIComponent(order.id)}`)
          }
        >
          Get help from Yespizz
        </Button>

        <Card className="rounded-[26px] border-0 bg-surface-secondary p-3 shadow-none">
          <Card.Content className="flex items-center gap-3 p-0">
            <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Truck size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <Typography type="body-xs" className={hx.caption}>
                {t("tracking.courier")}
              </Typography>
              <Typography type="h6" className={cn(hx.title, "truncate")}>
                {t("tracking.courierName")}
              </Typography>
            </div>
            {MASKED_COMMS_ENABLED ? (
              <>
                <Button
                  isIconOnly
                  variant="secondary"
                  aria-label={t("tracking.callCourier")}
                  onPress={() => router.push("/call/")}
                  className="size-11 min-w-11 rounded-full border-0 bg-accent text-accent-foreground shadow-none"
                >
                  <Phone size={18} />
                </Button>
                <Button
                  isIconOnly
                  variant="secondary"
                  aria-label={t("tracking.chatCourier")}
                  onPress={() => router.push("/chat/")}
                  className="size-11 min-w-11 rounded-full border border-border bg-card text-foreground shadow-none"
                >
                  <MessageCircle size={18} />
                </Button>
              </>
            ) : null}
          </Card.Content>
        </Card>

        <div className="mt-6 rounded-[30px] bg-[var(--canvas-inverse)] p-5 text-[var(--canvas-inverse-foreground)]">
          <Typography
            type="body-sm"
            className="text-[13px] font-medium opacity-60"
          >
            {t("tracking.deliveryAddress")}
          </Typography>
          <div className="mt-2 flex items-start gap-3">
            <MapPin size={21} className="mt-0.5 shrink-0" />
            <AppText as="p" className="text-[17px] font-bold">
              {order.deliveryAddress ||
                address?.detail ||
                t("tracking.savedAddress")}
            </AppText>
          </div>

          {order.deliveryInstructions ? (
            <AppText as="p" className="mt-3 text-sm opacity-80">
              {order.deliveryInstructions}
            </AppText>
          ) : null}

          {order.leaveAtDoor ? (
            <Typography
              type="body-xs"
              className="mt-3 text-[12px] font-semibold text-warning"
            >
              {t("tracking.leaveAtDoorNote")}
            </Typography>
          ) : null}

          {showPinHandoff ? (
            <div className="mt-5 rounded-[20px] bg-current/10 px-4 py-3">
              <Typography
                type="body-sm"
                className="text-[13px] font-semibold opacity-80"
              >
                {t("tracking.pinTitle")}
              </Typography>
              {order.deliveryPin ? (
                <AppText as="p"
                  data-testid="delivery-pin"
                  className="mt-2 text-2xl font-bold tracking-widest"
                >
                  {order.deliveryPin}
                </AppText>
              ) : null}
              <Typography
                type="body-xs"
                className="mt-1 text-[12px] opacity-70"
              >
                {order.deliveryPin
                  ? t("tracking.pinBodyWithCode", { pin: order.deliveryPin })
                  : t("tracking.pinBodyPending")}
              </Typography>
            </div>
          ) : null}

          <Typography
            type="body-sm"
            className="mt-6 text-[13px] font-medium opacity-60"
          >
            {delivered ? t("step.delivered.label") : t("tracking.estimate")}
          </Typography>
          <AppText as="p" className="mt-1 text-[25px] font-bold">{etaLabel}</AppText>
          {arrivalAt && !delivered ? (
            <Typography type="body-xs" className="mt-1 text-[12px] opacity-70">
              {t("tracking.arrivalBy", {
                time: arrivalAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </Typography>
          ) : null}
          {etaStale ? (
            <Typography
              type="body-xs"
              className="mt-2 text-[12px] font-semibold text-warning"
            >
              {t("tracking.etaStale")}
            </Typography>
          ) : null}
          {order.hasShortExtraStop ? (
            <Typography
              type="body-xs"
              className="mt-2 text-[12px] font-semibold text-warning"
            >
              {t("tracking.delayNotice")}
            </Typography>
          ) : null}
          <div className="mt-5 rounded-2xl bg-surface-secondary p-4 text-foreground">
            <OrderProgress stepIndex={safeStep} />
          </div>
          <AppText as="p" className="mt-3 text-[12px] font-semibold opacity-70">
            {t(`step.${currentStep.key}.hint`)}
          </AppText>
        </div>

        <Button
          variant="secondary"
          fullWidth
          onPress={() => router.push(delivered ? "/home/" : "/orders/")}
          className={cn(hx.btnSecondary, "mt-5")}
        >
          {delivered ? <Check size={19} /> : null}
          {delivered ? t("common.backToHome") : t("tracking.viewOrders")}
        </Button>
      </div>
    </AppFrame>
  );
}
