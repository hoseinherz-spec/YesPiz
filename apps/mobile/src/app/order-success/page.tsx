"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";


import { Button, Typography } from "@heroui/react";
import { Check, MapPin, ShoppingBag } from "@repo/icons";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { AppFrame } from "@/components/AppFrame";
import { MobileActionBar } from "@/components/MobileActionBar";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { t, orders, activeOrderId } = useApp();
  const order = useMemo(
    () =>
      orders.find((item) => item.id === activeOrderId) ??
      orders.find((item) => item.status === "active"),
    [activeOrderId, orders],
  );

  if (!order || order.awaitingPayment || order.status === "cancelled") {
    return (
      <AppFrame>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <span className="flex size-24 items-center justify-center rounded-full bg-surface-secondary text-muted">
            <ShoppingBag size={38} />
          </span>
          <Typography type="h2" className={cn(hx.h2, "mt-6")}>
            {t("success.missingTitle")}
          </Typography>
          <Typography type="body-sm" className={cn(hx.bodySm, "mt-2 max-w-xs")}>
            {t("success.missingBody")}
          </Typography>
          <Button
            variant="primary"
            onPress={() => router.replace("/orders/")}
            className={cn(hx.btnPrimary, "mt-8")}
          >
            {t("tracking.viewOrders")}
          </Button>
        </div>
      </AppFrame>
    );
  }

  const shortId =
    order.id.length > 8 ? order.id.slice(-6) : order.id.replace(/^o-/, "");

  return (
    <AppFrame className="!pb-36">
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="relative flex size-64 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <span className="absolute left-7 bottom-12 flex size-20 -rotate-6 items-center justify-center rounded-[24px] bg-warning text-warning-foreground shadow-lg">
            <ShoppingBag size={34} />
          </span>
          <span className="relative ml-14 flex h-36 w-28 rotate-6 flex-col items-center rounded-[22px] bg-card px-4 py-5 text-foreground shadow-xl">
            <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check size={25} />
            </span>
            <span className="h-2 w-14 rounded-full bg-border" />
            <span className="mt-3 h-2 w-10 rounded-full bg-border" />
          </span>
          <span className="absolute top-12 left-9 text-danger">
            <MapPin size={38} />
          </span>
        </div>

        <Typography type="h1" className={cn(hx.h1, "mt-10")}>
          {t("success.title")}
        </Typography>
        <Typography
          type="body"
          className={cn(hx.body, "mt-3 max-w-[330px] text-muted")}
        >
          {t("success.body")}
        </Typography>
        <div className="mt-6 rounded-full bg-surface-secondary px-5 py-2.5 text-[13px] font-semibold text-muted">
          {t("orders.orderNum", { id: shortId })} · <AnimatedNumber currency value={order.total} />
        </div>
      </div>

      <MobileActionBar
        onPress={() => router.replace("/tracking/")}
        icon={<MapPin size={20} />}
        label={t("success.track")}
      />
    </AppFrame>
  );
}
