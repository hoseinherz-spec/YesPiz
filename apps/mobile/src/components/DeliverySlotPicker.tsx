"use client";
import { useCallback, useEffect, useState } from "react";
import { slotsClient, type DeliverySlot } from "@repo/api";
import { useApp } from "@/context/AppContext";
export function DeliverySlotPicker({
  value,
  onChange,
  count,
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
  count: number;
}) {
  const { language } = useApp(),
    de = language === "de";
  const [slots, setSlots] = useState<DeliverySlot[]>([]),
    [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      setSlots(await slotsClient.list());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  return (
    <section className="checkout-section mt-4 p-5">
      <label className="block text-sm font-semibold" htmlFor="delivery-slot">
        {de ? "Lieferfenster reservieren" : "Reserve a delivery window"}
      </label>
      <p className="my-2 text-xs leading-5 text-muted">
        {de
          ? "Verfügbare Fenster richten sich nach der bestätigten Kapazität. 15 Minuten zum Bezahlen."
          : "Windows use confirmed delivery capacity. Pay within 15 minutes to keep your reservation."}
      </p>
      <select
        id="delivery-slot"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="min-h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm"
      >
        <option value="">
          {de
            ? "Keine Reservierung — Startzeit wählen"
            : "No reservation — choose order start"}
        </option>
        {value && !slots.some((s) => s.id === value) && (
          <option value={value}>
            {de
              ? "Auswahl nicht mehr verfügbar"
              : "Selected window unavailable"}
          </option>
        )}
        {slots.map((s) => (
          <option
            key={s.id}
            value={s.id}
            disabled={s.remainingOrders < 1 || s.remainingUnits < count}
          >
            {new Date(s.startsAt).toLocaleString(de ? "de-DE" : "en-GB", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(s.endsAt).toLocaleTimeString(de ? "de-DE" : "en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {s.remainingOrders < 1 || s.remainingUnits < count
              ? de
                ? " · Voll"
                : " · Full"
              : ""}
          </option>
        ))}
      </select>
      {error ? (
        <button
          type="button"
          onClick={() => void load()}
          className="mt-2 min-h-11 text-sm underline"
        >
          {de ? "Fenster erneut laden" : "Retry loading windows"}
        </button>
      ) : (
        !slots.length && (
          <p className="mt-2 text-xs text-muted">
            {de
              ? "Aktuell sind keine reservierbaren Fenster geöffnet."
              : "No reservable windows are open right now."}
          </p>
        )
      )}
    </section>
  );
}
