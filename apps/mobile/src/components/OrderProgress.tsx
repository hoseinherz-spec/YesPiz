"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";


import { ORDER_STEPS, useApp } from "@/context/AppContext";

/** Milestones, not a percentage or an estimate of time remaining. */
export function OrderProgress({
  stepIndex,
  compact = false,
}: {
  stepIndex: number;
  compact?: boolean;
}) {
  const { t, language } = useApp();
  const current = Math.max(
    0,
    Math.min(
      Number.isFinite(stepIndex) ? stepIndex : 0,
      ORDER_STEPS.length - 1,
    ),
  );
  const label = t(`step.${ORDER_STEPS[current]!.key}.label`);
  return (
    <div className="order-progress">
      <div className="mb-2.5 flex items-center justify-between gap-3 text-xs">
        <AppText as="span" className="font-semibold">{label}</AppText>
        <AppText as="span" className="shrink-0 tabular-nums text-muted">
          {language === "de" ? "Schritt" : "Step"} <AnimatedNumber value={current + 1} /> /{" "}
          <AnimatedNumber value={ORDER_STEPS.length} />
        </AppText>
      </div>
      <ol
        className="flex gap-1.5"
        aria-label={language === "de" ? "Bestellfortschritt" : "Order progress"}
      >
        {ORDER_STEPS.map((step, index) => (
          <li
            key={step.key}
            className="min-w-0 flex-1"
            aria-current={index === current ? "step" : undefined}
          >
            <span
              className={`block h-1.5 rounded-full transition-colors ${index <= current ? "bg-accent" : "bg-muted/20"}`}
              aria-hidden="true"
            />
            <AppText as="span" className="sr-only">
              {t(`step.${step.key}.label`)} —{" "}
              {index < current
                ? language === "de"
                  ? "Abgeschlossen"
                  : "Complete"
                : index === current
                  ? language === "de"
                    ? "Aktuell"
                    : "Current"
                  : language === "de"
                    ? "Als Nächstes"
                    : "Upcoming"}
            </AppText>
          </li>
        ))}
      </ol>
      {!compact && (
        <div
          className="mt-2 flex justify-between gap-4 text-[11px] text-muted"
          aria-hidden="true"
        >
          <AppText as="span">{t("step.received.label")}</AppText>
          <AppText as="span">{t("step.delivered.label")}</AppText>
        </div>
      )}
    </div>
  );
}
