export type CheckoutSchedule = "asap" | "45" | "1hour" | "later";

export type CheckoutPrefs = {
  deliverySlotId?: string;
  schedule: CheckoutSchedule;
  scheduledAt?: string;
  leaveAtDoor: boolean;
  deliveryEntrance?: string;
  deliveryFloor?: string;
  deliveryUnit?: string;
  deliveryDoorCode?: string;
  deliveryInstructions?: string;
};

const KEYS = {
  deliverySlotId: "yespizz_delivery_slot",
  schedule: "yespizz_checkout_schedule",
  scheduledAt: "yespizz_checkout_scheduled_at",
  leaveAtDoor: "yespizz_checkout_leave_at_door",
  entrance: "yespizz_checkout_entrance",
  floor: "yespizz_checkout_floor",
  unit: "yespizz_checkout_unit",
  doorCode: "yespizz_checkout_door_code",
  instructions: "yespizz_checkout_instructions",
  paymentMethod: "yespizz_payment_method",
} as const;

export function readCheckoutPrefs(): CheckoutPrefs {
  try {
    const schedule = sessionStorage.getItem(KEYS.schedule);
    const leaveRaw = sessionStorage.getItem(KEYS.leaveAtDoor);
    return {
      deliverySlotId: sessionStorage.getItem(KEYS.deliverySlotId) || undefined,
      schedule:
        schedule === "45" || schedule === "1hour" || schedule === "later"
          ? schedule
          : "asap",
      scheduledAt: sessionStorage.getItem(KEYS.scheduledAt) || undefined,
      leaveAtDoor: leaveRaw === "true",
      deliveryEntrance: sessionStorage.getItem(KEYS.entrance) ?? undefined,
      deliveryFloor: sessionStorage.getItem(KEYS.floor) ?? undefined,
      deliveryUnit: sessionStorage.getItem(KEYS.unit) ?? undefined,
      deliveryDoorCode: sessionStorage.getItem(KEYS.doorCode) ?? undefined,
      deliveryInstructions:
        sessionStorage.getItem(KEYS.instructions) ?? undefined,
    };
  } catch {
    return { schedule: "asap", leaveAtDoor: false };
  }
}

export function writeCheckoutPrefs(
  prefs: CheckoutPrefs,
  paymentMethod?: "card" | "cash",
) {
  try {
    sessionStorage.setItem(KEYS.deliverySlotId, prefs.deliverySlotId ?? "");
    sessionStorage.setItem(KEYS.schedule, prefs.schedule);
    sessionStorage.setItem(KEYS.scheduledAt, prefs.scheduledAt ?? "");
    sessionStorage.setItem(KEYS.leaveAtDoor, String(prefs.leaveAtDoor));
    sessionStorage.setItem(KEYS.entrance, prefs.deliveryEntrance ?? "");
    sessionStorage.setItem(KEYS.floor, prefs.deliveryFloor ?? "");
    sessionStorage.setItem(KEYS.unit, prefs.deliveryUnit ?? "");
    sessionStorage.setItem(KEYS.doorCode, prefs.deliveryDoorCode ?? "");
    sessionStorage.setItem(KEYS.instructions, prefs.deliveryInstructions ?? "");
    if (paymentMethod)
      sessionStorage.setItem(KEYS.paymentMethod, paymentMethod);
  } catch {
    // ignore storage failures
  }
}

export function writePaymentMethod(method: "card" | "cash" | "wallet") {
  try {
    sessionStorage.setItem(KEYS.paymentMethod, method);
  } catch {
    // Payment remains usable when optional storage is unavailable.
  }
}

export function readPaymentMethod(): "card" | "cash" | "wallet" {
  try {
    const stored = sessionStorage.getItem(KEYS.paymentMethod);
    return stored === "cash" || stored === "wallet" ? stored : "card";
  } catch {
    return "card";
  }
}

export function clearCheckoutPrefs() {
  try {
    Object.values(KEYS).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function scheduledAtFromChoice(
  choice: CheckoutSchedule,
): string | undefined {
  const now = Date.now();
  switch (choice) {
    case "45":
      return new Date(now + 45 * 60_000).toISOString();
    case "1hour":
      return new Date(now + 60 * 60_000).toISOString();
    case "later":
      return new Date(now + 120 * 60_000).toISOString();
    default:
      return undefined;
  }
}
