"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
export function AnalyticsPreference() {
  const [enabled, setEnabled] = useState(false);
  const { language } = useApp();
  const de = language === "de";
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setEnabled(
          localStorage.getItem("yespizz_analytics_consent") === "true",
        );
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <label className="data-surface my-5 flex items-start gap-3 rounded-2xl p-5">
      <input
        type="checkbox"
        checked={enabled}
        className="mt-1 size-5 shrink-0"
        onChange={(e) => {
          try {
            localStorage.setItem(
              "yespizz_analytics_consent",
              String(e.target.checked),
            );
            setEnabled(e.target.checked);
          } catch {}
        }}
      />
      <span className="text-sm font-semibold">
        {de ? "Anonyme Nutzungsstatistik" : "Anonymous usage measurement"}
        <small className="mt-1 block font-normal leading-5 text-muted">
          {de
            ? "Hilf uns, den Bestellablauf zu verbessern. Keine Kontodaten, Adressen oder Warenkorbinhalte. Speicherung für 30 Tage."
            : "Help improve ordering. No account details, addresses or cart contents. Events are kept for 30 days."}
        </small>
      </span>
    </label>
  );
}
