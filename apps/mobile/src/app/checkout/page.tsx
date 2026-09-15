"use client";
import { DeliverySlotPicker } from "@/components/DeliverySlotPicker";
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
  const [deliverySlotId, setDeliverySlotId] = useState<string | undefined>();
  const [scheduledAt, setScheduledAt] = useState<string | undefined>();
  const [draftReady, setDraftReady] = useState(false);
  const [scheduleExpired, setScheduleExpired] = useState(false);
  const [time, setTime] = useState<CheckoutSchedule>(() => "asap");
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [unit, setUnit] = useState("");
  const [doorCode, setDoorCode] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const prefs = readCheckoutPrefs();
      setDeliverySlotId(prefs.deliverySlotId);
      setTime(prefs.schedule);
      setScheduledAt(prefs.scheduledAt);
      setLeaveAtDoor(prefs.leaveAtDoor);
      setEntrance(prefs.deliveryEntrance ?? "");
      setFloor(prefs.deliveryFloor ?? "");
      setUnit(prefs.deliveryUnit ?? "");
      setDoorCode(prefs.deliveryDoorCode ?? "");
      setInstructions(prefs.deliveryInstructions ?? "");
      setPayment(readPaymentMethod());
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () =>
      setScheduleExpired(
        time !== "asap" &&
          (!scheduledAt ||
            !Number.isFinite(Date.parse(scheduledAt)) ||
            Date.parse(scheduledAt) <= Date.now()),
      );
    const timer = window.setTimeout(check, 0);
    const interval = window.setInterval(check, 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [time, scheduledAt]);

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

  useEffect(() => {
    if (!draftReady) return;
    writeCheckoutPrefs(
      {
        deliverySlotId,
        schedule: time,
        scheduledAt,
        leaveAtDoor,
        deliveryEntrance: entrance.trim() || undefined,
        deliveryFloor: floor.trim() || undefined,
        deliveryUnit: unit.trim() || undefined,
        deliveryDoorCode: doorCode.trim() || undefined,
        deliveryInstructions: instructions.trim() || undefined,
      },
      selectedPayment,
    );
  }, [
    draftReady,
    time,
    scheduledAt,
    deliverySlotId,
    leaveAtDoor,
    entrance,
    floor,
    unit,
    doorCode,
    instructions,
    selectedPayment,
  ]);

  const saveDraft = () => {
    writeCheckoutPrefs(
      {
        deliverySlotId,
        schedule: time,
        scheduledAt,
        leaveAtDoor,
        deliveryEntrance: entrance.trim() || undefined,
        deliveryFloor: floor.trim() || undefined,
        deliveryUnit: unit.trim() || undefined,
        deliveryDoorCode: doorCode.trim() || undefined,
        deliveryInstructions: instructions.trim() || undefined,
      },
      selectedPayment,
    );
  };
  const addAddress = () => {
    saveDraft();
    router.push("/addresses/new/?from=checkout");
  };
  const continueToPayment = () => {
    if (!draftReady || count === 0) return;
    if (
      time !== "asap" &&
      (!scheduledAt ||
        !Number.isFinite(Date.parse(scheduledAt)) ||
        Date.parse(scheduledAt) <= Date.now())
    ) {
      setScheduleExpired(true);
      return;
    }
    saveDraft();
    if (!authed) {
      router.push("/login/?next=/checkout/");
      return;
    }
    if (!selectedAddressId) {
      addAddress();
      return;
    }
    router.push("/payment/");
  };
  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );
  const startLabel =
    time === "asap"
      ? t("time.asap")
      : scheduledAt && Number.isFinite(Date.parse(scheduledAt))
        ? new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }).format(new Date(scheduledAt))
        : t("checkout.chooseStart");
  const fieldClass = "w-full";
  const inputClass = cn(hx.field, "!h-[56px] !rounded-[18px]");

  return (
    <FormScope>
      <AppFrame className="checkout-screen !pb-44">
        <ScreenHeader
          title={t("checkout.title")}
          subtitle={t("checkout.subtitle")}
          backHref="/cart/"
        />

        <details className="checkout-section">
          <summary>
            <span>
              {t("checkout.address")}
              <small>
                {selectedAddress?.detail || t("checkout.noAddress")}
              </small>
            </span>
            <span className="checkout-edit">{t("checkout.edit")}</span>
          </summary>
          <div className="checkout-editor">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onPress={addAddress}
                className="min-h-11 w-full rounded-full border border-border px-4 text-[13px] font-semibold text-foreground"
              >
                {t("settings.addAddress")}
              </Button>
            </div>
            {addresses.length > 0 ? (
              <RadioField
                name="deliveryAddress"
                label={t("checkout.address")}
                required={authed && Boolean(selectedAddressId)}
                value={selectedAddressId ?? ""}
                onChange={setSelectedAddressId}
                options={addresses.map((addr) => ({
                  id: addr.id,
                  label: (
                    <span>
                      <AppText as="strong">
                        {addressTitle(t, addr.label)}
                      </AppText>
                      <AppText as="span" className="block text-xs text-muted">
                        {addr.detail}
                      </AppText>
                    </span>
                  ),
                }))}
              />
            ) : null}
          </div>
        </details>

        <details className="checkout-dropoff mt-4 rounded-[18px] border border-border p-4">
          <summary className="cursor-pointer text-[16px] font-semibold text-foreground">
            {t("checkout.dropoffDetails")}{" "}
            <AppText as="span" className="ml-2 text-xs font-normal text-muted">
              {entrance || floor || unit || doorCode || instructions
                ? language === "de"
                  ? "Hinweise hinzugefügt"
                  : "Details added"
                : "Optional"}
            </AppText>
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-3">
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
        </details>

        <DeliverySlotPicker
          value={deliverySlotId}
          count={count}
          onChange={(id) => {
            setDeliverySlotId(id);
            if (id) {
              setTime("asap");
              setScheduledAt(undefined);
            }
          }}
        />
        <details
          hidden={!!deliverySlotId}
          className="checkout-section mt-4"
          open={scheduleExpired}
        >
          <summary>
            <span>
              {t("checkout.startTitle")}
              <small>{startLabel}</small>
            </span>
            <span className="checkout-edit">{t("checkout.edit")}</span>
          </summary>
          <div className="checkout-editor">
            {scheduleExpired && (
              <p role="alert" className="mb-4 text-sm text-warning">
                {t("checkout.startExpired")}
              </p>
            )}
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
              onChange={(v) => {
                const choice = v as CheckoutSchedule;
                setTime(choice);
                setScheduledAt(scheduledAtFromChoice(choice));
                setScheduleExpired(false);
              }}
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
            {scheduleExpired && (
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onPress={() => {
                  setScheduledAt(scheduledAtFromChoice(time));
                  setScheduleExpired(false);
                }}
              >
                {t("checkout.refreshStart")}
              </Button>
            )}
          </div>
        </details>
        <div className="mt-4 flex items-center justify-between rounded-[24px] bg-surface-secondary px-4 py-3.5">
          <span className="flex items-center gap-2">
            <MapPin size={18} />
            <AppText
              as="span"
              className="text-[14px] font-semibold text-foreground"
            >
              {t("checkout.leaveAtDoor")}
            </AppText>
          </span>
          <SwitchField
            label={
              <AppText as="span" className="sr-only">
                {t("checkout.leaveAtDoor")}
              </AppText>
            }
            value={leaveAtDoor}
            onChange={setLeaveAtDoor}
          />
        </div>

        <details className="checkout-section mt-4">
          <summary>
            <span>
              {t("checkout.payment")}
              <small>
                {t(
                  selectedPayment === "cash" ? "payment.cash" : "payment.card",
                )}
              </small>
            </span>
            <span className="checkout-edit">{t("checkout.edit")}</span>
          </summary>
          <div className="checkout-editor">
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
          </div>
        </details>

        <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
          <Card.Content className="p-0">
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
            <div className="mt-3 flex items-center justify-between text-[14px] text-muted">
              <AppText as="span">{t("common.delivery")}</AppText>
              <AppText as="span">
                <AnimatedNumber currency value={deliveryFee} />
              </AppText>
            </div>
            <Separator className="my-4 bg-border" />
            <div className="flex items-end justify-between">
              <AppText
                as="span"
                className="text-[16px] font-semibold text-muted"
              >
                {t("common.total")}
              </AppText>
              <AppText
                as="span"
                className="text-[21px] font-bold text-foreground"
              >
                <AnimatedNumber currency value={total} />
              </AppText>
            </div>
            <Typography
              type="body-xs"
              className={cn(hx.caption, "mt-1 text-right")}
            >
              <AnimatedNumber value={count} />{" "}
              {count === 1 ? t("common.item") : t("common.items")}
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
          isDisabled={!draftReady || count === 0 || scheduleExpired}
          label={
            <AppText as="span">
              {!authed
                ? t("checkout.signInContinue")
                : !selectedAddressId
                  ? t("settings.addAddress")
                  : t("checkout.continuePayment")}{" "}
              · <AnimatedNumber currency value={total} />
            </AppText>
          }
        />
      </AppFrame>
    </FormScope>
  );
}
