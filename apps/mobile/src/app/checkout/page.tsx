"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { FormScope, RadioField, Input, SwitchField } from "@repo/ui/forms";

import { Button, Card, Separator, Typography } from "@heroui/react";
import { MapPin, ShoppingBag } from "@repo/icons";
import { paymentsClient } from "@repo/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { MobileActionBar } from "@/components/MobileActionBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { PartnerBadge } from "@/features/partner/components/PartnerBadge";
import { cashBlockedReason } from "@/lib/cash-policy";
import {
  readCheckoutPrefs,
  scheduledAtFromChoice,
  readPaymentMethod,
  writeCheckoutPrefs,
  type CheckoutSchedule,
} from "@/lib/checkout-storage";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const TIMES: CheckoutSchedule[] = ["asap", "45", "1hour", "later"];

function addressTitle(t: (key: string) => string, label: string) {
  const key = `address.${label.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? label : translated;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    t,
    language,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    authed,
    accessToken,
  } = useApp();
  const { subtotal, discount, total, count, deliveryFee } = useCart();
  const [time, setTime] = useState<CheckoutSchedule>(() => "asap");
  const [leaveAtDoor, setLeaveAtDoor] = useState(() =>
    typeof window === "undefined" ? false : readCheckoutPrefs().leaveAtDoor,
  );
  const [payment, setPayment] = useState<"card" | "cash">(() =>
    typeof window === "undefined" ? "card" : readPaymentMethod(),
  );
  const [entrance, setEntrance] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (readCheckoutPrefs().deliveryEntrance ?? ""),
  );
  const [floor, setFloor] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (readCheckoutPrefs().deliveryFloor ?? ""),
  );
  const [unit, setUnit] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (readCheckoutPrefs().deliveryUnit ?? ""),
  );
  const [doorCode, setDoorCode] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (readCheckoutPrefs().deliveryDoorCode ?? ""),
  );
  const [instructions, setInstructions] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (readCheckoutPrefs().deliveryInstructions ?? ""),
  );
  const [cashAvail, setCashAvail] = useState<Awaited<
    ReturnType<typeof paymentsClient.cashAvailability>
  > | null>(null);

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
  const selectedPayment = cashDisabled && payment === "cash" ? "card" : payment;

  const cashReasonLabel = useMemo(() => {
    if (cashReason === "over_cap") return t("payment.cashOverCap");
    if (cashReason === "banned") return t("payment.cashUnavailable");
    return null;
  }, [cashReason, t]);

  const continueToPayment = () => {
    if (!authed) {
      router.push("/login/?next=/checkout/");
      return;
    }
    writeCheckoutPrefs(
      {
        schedule: time,
        scheduledAt: scheduledAtFromChoice(time),
        leaveAtDoor,
        deliveryEntrance: entrance.trim() || undefined,
        deliveryFloor: floor.trim() || undefined,
        deliveryUnit: unit.trim() || undefined,
        deliveryDoorCode: doorCode.trim() || undefined,
        deliveryInstructions: instructions.trim() || undefined,
      },
      selectedPayment,
    );
    router.push("/payment/");
  };
  const fieldClass = "w-full";
  const inputClass = cn(hx.field, "!h-[56px] !rounded-[18px]");

  return (
    <FormScope>
      <AppFrame className="!pb-36">
        <ScreenHeader
          title={t("checkout.title")}
          subtitle={t("checkout.subtitle")}
          backHref="/cart/"
        />

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography type="h3" className={hx.h3}>
              {t("checkout.address")}
            </Typography>
            <Button
              variant="ghost"
              onPress={() => router.push("/addresses/new/?from=checkout")}
              className="h-auto min-w-0 px-0 text-[13px] font-semibold text-foreground"
            >
              {t("settings.addAddress")}
            </Button>
          </div>
          {addresses.length > 0 ? (
            <RadioField
              name="deliveryAddress"
              label={t("checkout.address")}
              required={authed}
              value={selectedAddressId ?? ""}
              onChange={setSelectedAddressId}
              options={addresses.map((addr) => ({
                id: addr.id,
                label: (
                  <span>
                    <AppText as="strong">{addressTitle(t, addr.label)}</AppText>
                    <AppText as="span" className="block text-xs text-muted">
                      {addr.detail}
                    </AppText>
                  </span>
                ),
              }))}
            />
          ) : (
            <AppText as="p" className="rounded-3xl border border-dashed border-border p-4">
              {t("checkout.noAddress")}
            </AppText>
          )}
        </section>

        <section className="mt-7">
          <Typography type="h3" className={cn(hx.h3, "mb-3")}>
            {t("checkout.dropoffDetails")}
          </Typography>
          <div className="grid grid-cols-2 gap-3">
            <Input
              wrapperClassName={fieldClass}
              name="entrance"
              label={<>{t("checkout.entrance")}</>}
              maxLength={500}
              value={entrance}
              onChange={(e) => setEntrance(e.target.value)}
              className={inputClass}
            />
            <Input
              wrapperClassName={fieldClass}
              name="floor"
              label={<>{t("checkout.floor")}</>}
              maxLength={500}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className={inputClass}
            />
            <Input
              wrapperClassName={fieldClass}
              name="unit"
              label={<>{t("checkout.unit")}</>}
              maxLength={500}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputClass}
            />
            <Input
              wrapperClassName={fieldClass}
              name="doorCode"
              label={<>{t("checkout.doorCode")}</>}
              maxLength={500}
              value={doorCode}
              onChange={(e) => setDoorCode(e.target.value)}
              className={inputClass}
            />
          </div>
          <Input
            wrapperClassName={cn(fieldClass, "mt-3")}
            name="instructions"
            label={<>{t("checkout.instructions")}</>}
            maxLength={500}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className={inputClass}
          />
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography type="h3" className={hx.h3}>
              {t("checkout.payment")}
            </Typography>
          </div>
          <RadioField
            name="paymentMethod"
            label={t("checkout.payment")}
            required
            value={selectedPayment}
            onChange={(v) => setPayment(v as typeof selectedPayment)}
            options={[
              { id: "card", label: t("payment.card") },
              {
                id: "cash",
                label: (
                  <>
                    {t("payment.cash")}{" "}
                    {cashReasonLabel && (
                      <AppText as="span" className="text-xs text-warning">
                        {cashReasonLabel}
                      </AppText>
                    )}
                  </>
                ),
                disabled: cashDisabled,
              },
            ]}
          />
        </section>

        <section className="mt-7">
          <Typography type="h3" className={cn(hx.h3, "mb-3")}>
            {language === "de" ? "Bestellung starten" : "Start this order"}
          </Typography>
          <AppText as="p" className="mb-4 text-sm leading-6 text-muted">
            {language === "de"
              ? "Die gewählte Zeit ist der Bestellstart, nicht die Ankunft. Zubereitung und Lieferung folgen danach."
              : "This is the order start time, not arrival. Preparation and delivery follow afterwards."}
          </AppText>
          <RadioField
            name="startTime"
            label={
              language === "de" ? "Bestellung starten" : "Start this order"
            }
            required
            value={time}
            onChange={(v) => setTime(v as CheckoutSchedule)}
            options={TIMES.map((key) => ({
              id: key,
              label:
                key === "later"
                  ? language === "de"
                    ? "In 2 Stunden"
                    : "In 2 hours"
                  : t(`time.${key}`),
            }))}
          />
          <div className="mt-3 flex items-center justify-between rounded-[24px] bg-surface-secondary px-4 py-3.5">
            <span className="flex items-center gap-2">
              <MapPin size={18} />
              <AppText as="span" className="text-[14px] font-semibold text-foreground">
                {t("checkout.leaveAtDoor")}
              </AppText>
            </span>
            <SwitchField
              label={
                <AppText as="span" className="sr-only">{t("checkout.leaveAtDoor")}</AppText>
              }
              value={leaveAtDoor}
              onChange={setLeaveAtDoor}
            />
          </div>
        </section>

        <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
          <Card.Content className="p-0">
            <div className="flex items-center justify-between text-[14px] text-muted">
              <AppText as="span">{t("common.subtotal")}</AppText>
              <AppText as="span"><AnimatedNumber currency value={subtotal} /></AppText>
            </div>
            {discount > 0 ? (
              <div className="mt-3 flex items-center justify-between text-[14px] text-success">
                <AppText as="span">{t("common.discount")}</AppText>
                <AppText as="span">−<AnimatedNumber currency value={discount} /></AppText>
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-[14px] text-muted">
              <AppText as="span">{t("common.delivery")}</AppText>
              <AppText as="span"><AnimatedNumber currency value={deliveryFee} /></AppText>
            </div>
            <Separator className="my-4 bg-border" />
            <div className="flex items-end justify-between">
              <AppText as="span" className="text-[16px] font-semibold text-muted">
                {t("common.total")}
              </AppText>
              <AppText as="span" className="text-[21px] font-bold text-foreground">
                <AnimatedNumber currency value={total} />
              </AppText>
            </div>
            <Typography
              type="body-xs"
              className={cn(hx.caption, "mt-1 text-right")}
            >
              <AnimatedNumber value={count} /> {count === 1 ? t("common.item") : t("common.items")}
            </Typography>
          </Card.Content>
        </Card>

        <div className="mt-5 flex items-start gap-2 pb-4">
          <PartnerBadge compact />
          <Typography type="body-xs" className={hx.caption}>
            {t("checkout.partnerNote")}
          </Typography>
        </div>

        <MobileActionBar
          onPress={continueToPayment}
          icon={<ShoppingBag size={20} />}
          isDisabled={count === 0 || (authed && !selectedAddressId)}
          label={
            <AppText as="span">
              {t("checkout.continuePayment")} · <AnimatedNumber currency value={total} />
            </AppText>
          }
        />
      </AppFrame>
    </FormScope>
  );
}
