"use client";

import { SlidingNumber } from "@/components/SlidingNumber";
import { useApp } from "@/context/AppContext";

export function AnimatedNumber({ value, currency = false, suffix, className }: { value: number; currency?: boolean; suffix?: string; className?: string }) {
  const { language } = useApp();
  return <SlidingNumber value={value} locale={language === "de" ? "de-DE" : "en-IE"}
    format={currency ? { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true } : { maximumFractionDigits: 2, useGrouping: true }}
    suffix={suffix} className={className} />;
}
