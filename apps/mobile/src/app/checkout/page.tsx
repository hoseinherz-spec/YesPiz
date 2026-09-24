"use client";
import { DeliverySlotPicker } from "@/components/DeliverySlotPicker";
import { CheckoutDisclosure } from "@/features/checkout/CheckoutDisclosure";
import Link from "next/link";
import { CheckoutSteps } from "@/features/checkout/CheckoutSteps";
import { OrderSummary, OrderTotal } from "@/features/checkout/OrderSummary";
import styles from "@/features/checkout/checkout.module.css";

import { AppText } from "@/components/Text";

import { FormScope, RadioField, Input, SwitchField } from "@repo/ui/forms";

import { Button, Typography } from "@heroui/react";
import {
  MapPin,
  ShoppingBag,
  ChevronLeft,
} from "@/components/animated-icon/icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { MobileActionBar } from "@/components/MobileActionBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { PartnerBadge } from "@/features/partner/components/PartnerBadge";
import {
  readCheckoutPrefs,
  scheduledAtFromChoice,
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
  } = useApp();
  const { subtotal, discount, total, count, deliveryFee } = useCart();
  const [editingAddress, setEditingAddress] = useState(false);
  const addressHeading = useRef<HTMLHeadingElement>(null);
  const addressTrigger = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (editingAddress) addressHeading.current?.focus();
    else if (wasEditing.current) addressTrigger.current?.focus();
    wasEditing.current = editingAddress;
  }, [editingAddress]);
  const [deliverySlotId, setDeliverySlotId] = useState<string | undefined>();
  const [scheduledAt, setScheduledAt] = useState<string | undefined>();
  const [draftReady, setDraftReady] = useState(false);
  const [scheduleExpired, setScheduleExpired] = useState(false);
  const [time, setTime] = useState<CheckoutSchedule>(() => "asap");
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
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

  useEffect(() => {
    if (!draftReady) return;
    writeCheckoutPrefs({
      deliverySlotId,
      schedule: time,
      scheduledAt,
      leaveAtDoor,
      deliveryEntrance: entrance.trim() || undefined,
      deliveryFloor: floor.trim() || undefined,
      deliveryUnit: unit.trim() || undefined,
      deliveryDoorCode: doorCode.trim() || undefined,
      deliveryInstructions: instructions.trim() || undefined,
    });
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
  ]);

  const saveDraft = () => {
    writeCheckoutPrefs({
      deliverySlotId,
      schedule: time,
      scheduledAt,
      leaveAtDoor,
      deliveryEntrance: entrance.trim() || undefined,
      deliveryFloor: floor.trim() || undefined,
      deliveryUnit: unit.trim() || undefined,
      deliveryDoorCode: doorCode.trim() || undefined,
      deliveryInstructions: instructions.trim() || undefined,
    });
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
      router.push("/auth/sign-in/?next=/checkout/");
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
      <AppFrame className={`checkout-screen ${styles.screen}`}>
        {editingAddress ? (
          <div className="mb-5 flex items-center gap-3">
            <Button
              isIconOnly
              variant="secondary"
              className="rounded-full"
              aria-label={language === "de" ? "Zurück" : "Back"}
              onPress={() => setEditingAddress(false)}
            >
              <ChevronLeft size={20} />
            </Button>
            <h1
              ref={addressHeading}
              tabIndex={-1}
              className="text-lg font-bold"
            >
              {language === "de" ? "Adresse bearbeiten" : "Edit address"}
            </h1>
          </div>
        ) : (
          <>
            <ScreenHeader
              title={language === "de" ? "Bestellen" : "Checkout"}
              backHref="/cart/"
            />
            <CheckoutSteps step="delivery" />
            <div className={styles.intro}>
              <h1>
                {language === "de"
                  ? "Wie darf’s zu dir kommen?"
                  : "Let’s get it to you."}
              </h1>
              <p>
                {language === "de"
                  ? "Adresse und Lieferzeit prüfen. Danach geht’s zur Zahlung."
                  : "Confirm your delivery details, then choose how to pay."}
              </p>
            </div>
          </>
        )}
        {draftReady && count === 0 && !editingAddress && (
          <div className={styles.emptyCart} role="status">
            <p>
              {language === "de"
                ? "Dein Warenkorb ist noch leer."
                : "Your cart is empty."}
            </p>
            <Link href="/menu/">
              {language === "de" ? "Pizza auswählen" : "Find your pizza"} →
            </Link>
          </div>
        )}
        {!editingAddress && (
          <section className={styles.offer}>
            <div className={styles.offerHeader}>
              <span>
                <MapPin size={18} aria-hidden="true" />
                {t("checkout.address")}
              </span>
              <Button
                variant="secondary"
                ref={addressTrigger}
                aria-label={
                  language === "de"
                    ? "Adresse und Lieferhinweise bearbeiten"
                    : "Edit address and delivery instructions"
                }
                onPress={() => setEditingAddress(true)}
              >
                {t("checkout.edit")}
              </Button>
            </div>
            <div className="mt-3 rounded-2xl bg-surface-secondary p-4">
              {selectedAddress && (
                <strong className="mb-2 block text-xs">
                  {addressTitle(t, selectedAddress.label)}
                </strong>
              )}
              <p className="text-sm font-semibold">
                {selectedAddress?.detail || t("checkout.noAddress")}
              </p>
            </div>
          </section>
        )}
        <div hidden={!editingAddress}>
          <details className="checkout-section" open>
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

          <CheckoutDisclosure
            title={
              <>
                {t("checkout.dropoffDetails")}{" "}
                <span className="text-sm font-normal text-muted">
                  {entrance || floor || unit || doorCode || instructions
                    ? language === "de"
                      ? "· Hinzugefügt"
                      : "· Added"
                    : language === "de"
                      ? "· Optional"
                      : "· Optional"}
                </span>
              </>
            }
          >
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
          </CheckoutDisclosure>
        </div>
        <div hidden={editingAddress}>
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

          <OrderSummary
            subtotal={subtotal}
            discount={discount}
            deliveryFee={deliveryFee}
            total={total}
            count={count}
          />

          <div className="mt-5 flex items-start gap-2 pb-4">
            <PartnerBadge compact />
            <Typography type="body-xs" className={hx.caption}>
              {t("checkout.partnerNote")}
            </Typography>
          </div>
        </div>
        <MobileActionBar
          className={styles.action}
          leading={editingAddress ? undefined : <OrderTotal total={total} />}
          onPress={
            editingAddress
              ? () => {
                  saveDraft();
                  setEditingAddress(false);
                }
              : continueToPayment
          }
          icon={<ShoppingBag size={20} />}
          isDisabled={
            !draftReady || (!editingAddress && (count === 0 || scheduleExpired))
          }
          label={
            <AppText as="span">
              {editingAddress
                ? language === "de"
                  ? "Adresse bestätigen"
                  : "Save delivery details"
                : !authed
                  ? t("checkout.signInContinue")
                  : !selectedAddressId
                    ? t("settings.addAddress")
                    : t("checkout.continuePayment")}
            </AppText>
          }
        />
      </AppFrame>
    </FormScope>
  );
}
