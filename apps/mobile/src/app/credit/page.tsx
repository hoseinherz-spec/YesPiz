"use client";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { AppText } from "@/components/Text";

import { walletClient, type CreditStatement } from "@repo/api";
import { Button } from "@heroui/react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Wallet } from "@/components/animated-icon/icons";
import { EmptyState } from "@/components/EmptyState";
import { AnimatedBackground } from "@repo/ui/animated-background";
import { useCallback, useEffect, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { formatPrice } from "@/constants/pizzas";
import { pizzaCraftAsset } from "@/constants/media";
export default function CreditPage() {
  const { accessToken, language } = useApp();
  const de = language === "de";
  const [data, setData] = useState<CreditStatement | null>(null);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setData(await walletClient.statement({ accessToken }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load credit.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  const credits =
    data?.entries
      .filter((entry) => entry.amountCents > 0)
      .reduce((sum, entry) => sum + entry.amountCents, 0) ?? 0;
  const spent =
    data?.entries
      .filter((entry) => entry.amountCents < 0)
      .reduce((sum, entry) => sum - entry.amountCents, 0) ?? 0;
  const entries =
    data?.entries.filter(
      (entry) =>
        filter === "all" ||
        (filter === "in" ? entry.amountCents > 0 : entry.amountCents < 0),
    ) ?? [];
  return (
    <AppFrame className="reference-screen">
      <ScreenHeader
        title={de ? "Dein Yespizz-Guthaben" : "Your Yespizz credit"}
      />
      {error && (
        <AppText as="p" role="alert" className="my-4 text-danger">
          {error}
        </AppText>
      )}
      {!accessToken ? (
        <EmptyState
          icon={<Wallet size={28} />}
          image={pizzaCraftAsset("Digital Food Receipt")}
          title={
            de ? "Dein Guthaben, an einem Ort" : "Your credit, in one place"
          }
          body={
            de
              ? "Melde dich an, um Guthaben und Bestellungen zu sehen."
              : "Sign in to see your available balance and credit activity."
          }
          actionLabel={de ? "Anmelden" : "Sign in"}
          actionHref="/auth/sign-in/?next=/credit/"
        />
      ) : (
        <>
          <section className="data-surface relative mt-7 overflow-hidden rounded-[32px] p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full border-[24px] border-accent/5"
            />
            <AppText as="p" className="relative text-sm text-muted">
              {de ? "Verfügbares Guthaben" : "Available credit"}
            </AppText>
            <AppText
              as="p"
              className="relative mt-3 break-words text-[clamp(32px,10vw,48px)] font-semibold tracking-tight text-accent tabular-nums"
            >
              {data ? formatPrice(data.balanceCents / 100) : "—"}
            </AppText>
            <AppText
              as="p"
              className="relative mt-5 max-w-[32ch] text-sm leading-6 text-text-secondary"
            >
              {de
                ? "Nutze dein Guthaben beim Bezahlen und zahle den Rest mit Karte."
                : "Use your credit at checkout. Pay the rest by card, or cover the whole order with your balance."}
            </AppText>
            <Link
              href="/menu/"
              className="relative mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4"
            >
              {de ? "Menü entdecken" : "Explore the menu"}{" "}
              <AppText as="span" aria-hidden="true">
                ↗
              </AppText>
            </Link>
          </section>
          {data && data.entries.length > 0 && (
            <section
              className="mt-5"
              aria-label={de ? "Aktivitätsübersicht" : "Activity summary"}
            >
              <AppText as="p" className="mb-3 text-xs text-muted">
                {de
                  ? "Summe der angezeigten Buchungen"
                  : "Totals from recorded activity"}
              </AppText>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      key: "in",
                      label: de ? "Gutschriften" : "Credits in",
                      amount: credits,
                      icon: <ArrowDown size={16} />,
                    },
                    {
                      key: "out",
                      label: de ? "Ausgegeben" : "Spent",
                      amount: spent,
                      icon: <ArrowUp size={16} />,
                    },
                  ] as const
                ).map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    aria-pressed={filter === metric.key}
                    onClick={() =>
                      setFilter(filter === metric.key ? "all" : metric.key)
                    }
                    className="data-surface rounded-[22px] p-4 text-left outline-none transition-colors hover:border-accent/40 focus-visible:ring-2 focus-visible:ring-focus aria-pressed:border-accent/60"
                  >
                    <AppText
                      as="span"
                      className="mb-3 flex items-center gap-2 text-xs text-muted"
                    >
                      {metric.icon}
                      {metric.label}
                    </AppText>
                    <AppText
                      as="strong"
                      className="block break-words text-xl font-semibold tracking-tight tabular-nums"
                    >
                      <AnimatedNumber currency value={metric.amount / 100} />
                    </AppText>
                    <span
                      aria-hidden="true"
                      className="mt-3 block h-1 overflow-hidden rounded-full bg-muted/15"
                    >
                      <span
                        className="app-progress block h-full w-full rounded-full bg-accent"
                        style={{
                          transform: `scaleX(${credits + spent > 0 ? metric.amount / (credits + spent) : 0})`,
                        }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="mt-7 flex items-center justify-between">
            <AppText as="h2" className="text-xl font-bold">
              {de ? "Verlauf" : "Activity"}
            </AppText>
            <Button
              variant="ghost"
              isDisabled={loading}
              onPress={() => void load()}
            >
              {loading
                ? de
                  ? "Lädt…"
                  : "Refreshing…"
                : de
                  ? "Aktualisieren"
                  : "Refresh"}
            </Button>
          </div>
          {data && data.entries.length > 0 && (
            <div
              className="mt-4 flex gap-1 rounded-full bg-surface-secondary p-1"
              aria-label={de ? "Aktivität filtern" : "Filter activity"}
            >
              <AnimatedBackground value={filter}>
                {(["all", "in", "out"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    data-id={key}
                    aria-pressed={filter === key}
                    onClick={() => setFilter(key)}
                    className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-focus ${filter === key ? "text-accent-foreground" : "text-muted"}`}
                  >
                    {key === "all"
                      ? de
                        ? "Alle"
                        : "All"
                      : key === "in"
                        ? de
                          ? "Gutschriften"
                          : "Credits"
                        : de
                          ? "Ausgaben"
                          : "Spent"}
                  </button>
                ))}
              </AnimatedBackground>
            </div>
          )}
          {!data && !error && (
            <div
              className="mt-4 space-y-3"
              role="status"
              aria-label={de ? "Guthaben wird geladen" : "Loading credit"}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl bg-surface-secondary"
                />
              ))}
            </div>
          )}
          {data?.entries.length === 0 && (
            <EmptyState
              icon={<Wallet size={28} />}
              image={pizzaCraftAsset("Digital Food Receipt")}
              title={de ? "Noch keine Buchungen" : "A fresh start"}
              body={
                de
                  ? "Gutschriften und Käufe erscheinen hier."
                  : "Credits and purchases will appear here, with every amount easy to follow."
              }
              actionLabel={de ? "Menü entdecken" : "Explore the menu"}
              actionHref="/menu/"
            />
          )}
          {data && data.entries.length > 0 && entries.length === 0 && (
            <div className="py-8 text-center">
              <AppText as="p" className="text-sm text-muted">
                {de ? "Keine passenden Buchungen" : "No activity in this view"}
              </AppText>
              <Button variant="ghost" onPress={() => setFilter("all")}>
                {de ? "Alle anzeigen" : "Show all activity"}
              </Button>
            </div>
          )}
          {entries.map((entry, i) => (
            <article
              key={`${entry.orderId}-${entry.kind}-${i}`}
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border-b border-border px-1 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <AppText
                  as="span"
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-surface-secondary text-text-secondary"
                >
                  {entry.amountCents > 0 ? (
                    <ArrowDown size={17} />
                  ) : (
                    <ArrowUp size={17} />
                  )}
                </AppText>
                <div>
                  <AppText as="p" className="text-sm font-semibold">
                    {entry.kind === "loyalty"
                      ? de
                        ? "Treueprämie"
                        : "Loyalty reward"
                      : entry.kind === "referral"
                        ? "Referral reward"
                        : entry.kind === "compensation"
                          ? "Delivery credit"
                          : entry.kind === "refund"
                            ? "Order refund"
                            : "Pizza order"}
                  </AppText>
                  <AppText as="p" className="mt-1 text-xs text-muted">
                    {entry.orderId ? `#${entry.orderId.slice(-6)} · ` : ""}
                    {new Date(entry.at).toLocaleDateString()}
                  </AppText>
                </div>
              </div>
              <AppText
                as="strong"
                className={`shrink-0 text-sm tabular-nums ${entry.amountCents > 0 ? "text-success" : "text-foreground"}`}
              >
                {entry.amountCents > 0 ? "+" : ""}
                <AnimatedNumber currency value={entry.amountCents / 100} />
              </AppText>
            </article>
          ))}
        </>
      )}
    </AppFrame>
  );
}
