"use client";
import { OffersRail } from "@/components/OffersRail";
import { PageIntro } from "@/components/PageIntro";
import { useCallback, useEffect, useState } from "react";
import { openHostedCheckout } from "@/lib/hosted-checkout";
import Link from "next/link";
import {
  Gift,
  ArrowRight,
  Wallet,
  Check,
} from "@/components/animated-icon/icons";
import { Button } from "@heroui/react";
import { rewardsClient, type RewardsSummary } from "@repo/api";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { useApp } from "@/context/AppContext";
import { formatPrice } from "@/constants/pizzas";
import { pizzaCraftAsset } from "@/constants/media";

export default function RewardsPage() {
  const { accessToken } = useApp();
  // Account changes must never reuse another customer's balance or rewards.
  return <RewardsScreen key={accessToken ?? "guest"} />;
}

function RewardsScreen() {
  const { accessToken, language } = useApp();
  const de = language === "de";
  const [data, setData] = useState<RewardsSummary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setData(await rewardsClient.refresh({ accessToken }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load rewards.");
    }
  }, [accessToken]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function act(action: "claim" | "cancel" | "portal") {
    if (!accessToken || busy) return;
    setBusy(true);
    setError("");
    try {
      if (action === "portal") {
        const result = await rewardsClient.portal({ accessToken });
        await openHostedCheckout(result.checkoutUrl, load);
      } else {
        setData(
          action === "claim"
            ? await rewardsClient.claim({ accessToken })
            : await rewardsClient.cancel({ accessToken }),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppFrame withTabs className="reference-screen">
      <ScreenHeader title={de ? "Prämien" : "Rewards"} />
      <PageIntro
        icon={<Gift />}
        title={de ? "Deine Extras" : "A little extra, for you"}
        description={
          de
            ? "Gute Pizza. Gute Gründe wiederzukommen."
            : "Good pizza deserves another round."
        }
      />
      <OffersRail title={de ? "Deine Angebote" : "Available offers"} showRewardsLink={false} />
      {!accessToken ? (
        <EmptyState
          icon={<Gift size={28} />}
          image={pizzaCraftAsset("Pizza Shop")}
          title={de ? "Jede Bestellung zählt" : "Make every order count"}
          body={
            de
              ? "Melde dich an und entdecke deine Prämien."
              : "Sign in to collect rewards and see your credit."
          }
          actionHref="/auth/sign-in/?next=/rewards/"
          actionLabel={de ? "Anmelden" : "Sign in"}
        />
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="my-4 rounded-2xl border border-danger p-4"
            >
              <p>{error}</p>
              <Button variant="ghost" onPress={() => void load()}>
                {de ? "Erneut versuchen" : "Try again"}
              </Button>
            </div>
          )}
          {!data && !error && (
            <div role="status" className="data-surface mt-6 rounded-3xl p-8">
              {de ? "Prämien werden geladen…" : "Loading your rewards…"}
            </div>
          )}
          {data && (
            <>
              {data.mock && <p className="mt-4 rounded-2xl bg-surface-secondary p-4 text-sm text-muted">{de ? "Demo-Prämien · Beispieldaten für dieses Testkonto" : "Demo rewards · sample progress for this test account"}</p>}
              <section className="data-surface mt-6 overflow-hidden rounded-[28px] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Yespiz rewards
                  </span>
                  <Gift size={24} />
                </div>
                <h2 className="mt-5 text-3xl font-bold tracking-tight">
                  {data.available
                    ? de
                      ? "Deine Prämie ist bereit"
                      : "Your next treat is ready"
                    : (de ? "Noch " : "Just ") +
                      (data.rules.ordersPerReward - data.progress) +
                      (de ? " Bestellungen" : " orders to go")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {de
                    ? `Sammle ${data.rules.ordersPerReward} abgeschlossene Bestellungen und erhalte `
                    : `Complete ${data.rules.ordersPerReward} qualifying orders and enjoy `}
                  {formatPrice(data.rules.rewardCents / 100)}{" "}
                  {de ? "Guthaben." : "in pizza credit."}
                </p>
                <div
                  className="my-6 flex gap-2"
                  role="progressbar"
                  aria-label={de ? "Fortschritt" : "Reward progress"}
                  aria-valuenow={
                    data.available > 0
                      ? data.rules.ordersPerReward
                      : data.progress
                  }
                  aria-valuemin={0}
                  aria-valuemax={data.rules.ordersPerReward}
                >
                  {Array.from(
                    { length: data.rules.ordersPerReward },
                    (_, i) => (
                      <span
                        key={i}
                        className={`flex h-12 flex-1 items-center justify-center rounded-2xl ${i < (data.available > 0 ? data.rules.ordersPerReward : data.progress) ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-muted"}`}
                      >
                        {i <
                        (data.available > 0
                          ? data.rules.ordersPerReward
                          : data.progress) ? (
                          <Check size={18} />
                        ) : (
                          i + 1
                        )}
                      </span>
                    ),
                  )}
                </div>
                {data.available > 0 ? (
                  <Button
                    className="min-h-12 w-full"
                    isDisabled={busy}
                    onPress={() => void act("claim")}
                  >
                    {de ? "Guthaben einlösen" : "Claim your credit"} ·{" "}
                    {formatPrice(data.nextRewardCents / 100)}
                  </Button>
                ) : (
                  <Link
                    href="/menu/"
                    className="flex min-h-12 items-center justify-between font-semibold"
                  >
                    {de
                      ? "Finde deine nächste Pizza"
                      : "Find your next favourite"}
                    <ArrowRight size={18} />
                  </Link>
                )}
                <p className="mt-4 text-xs leading-5 text-muted">
                  {de ? "Ab " : "Orders of "}
                  {formatPrice(data.rules.minimumOrderCents / 100)}
                  {de
                    ? ". Stornierte Bestellungen zählen nicht. Guthaben verfällt nicht."
                    : " or more. Cancelled orders do not count. Credit does not expire."}
                </p>
              </section>
              <Link
                href="/credit/"
                className="data-surface mt-4 flex items-center gap-4 rounded-3xl p-5"
              >
                <Wallet size={24} />
                <span className="flex-1">
                  <span className="block text-xs text-muted">
                    {de ? "Dein Guthaben" : "Ready to spend"}
                  </span>
                  <strong className="text-xl">
                    {formatPrice(data.balanceCents / 100)}
                  </strong>
                </span>
                <ArrowRight size={20} />
              </Link>
              {(data.membership.active || data.membership.canManage) && <section className="data-surface mt-6 rounded-[28px] p-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Yespiz Plus
                </span>
                <h2 className="mt-3 text-2xl font-bold">
                  {de
                    ? "Deine Mitgliedschaft verwalten"
                    : "Manage your membership"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {formatPrice(data.membership.priceCents / 100)} /{" "}
                  {data.membership.days}{" "}
                  {de ? "Tage" : "days"}.
                </p>
                {data.membership.active ? (
                  <>
                    <p className="my-4 text-sm">
                      {de ? "Aktiv bis " : "Active until "}
                      {new Date(data.membership.until!).toLocaleDateString(
                        de ? "de-DE" : "en-GB",
                      )}
                    </p>
                    <Button
                      variant="secondary"
                      isDisabled={busy || data.membership.cancelled}
                      onPress={() => void act("cancel")}
                    >
                      {data.membership.cancelled
                        ? de
                          ? "Gekündigt — bis Laufzeitende aktiv"
                          : "Cancelled — active until period ends"
                        : de
                          ? "Mitgliedschaft kündigen"
                          : "Cancel membership"}
                    </Button>
                  </>
                ) : null}
                {data.membership.canManage && (
                  <Button
                    className="mt-4"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() => void act("portal")}
                  >
                    {de
                      ? "Zahlungen und Rechnungen verwalten"
                      : "Manage payments and invoices"}
                  </Button>
                )}
                {data.membership.status === "past_due" && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {de
                      ? "Die Verlängerung ist fehlgeschlagen. Bitte aktualisiere deine Zahlungsmethode."
                      : "Renewal payment failed. Please update your payment method."}
                  </p>
                )}
              </section>}
              <Link
                href="/referrals/"
                className="mt-6 flex min-h-14 items-center justify-between text-sm font-semibold"
              >
                {de
                  ? "Freunde einladen"
                  : "Share great pizza. Invite a friend."}
                <ArrowRight size={18} />
              </Link>
            </>
          )}
        </>
      )}
      {data?.campaigns
        .filter((c) => c.version !== data.rules.version)
        .map((c) => (
          <div
            key={c.version}
            className="data-surface mt-4 rounded-2xl p-4 text-sm"
          >
            <strong>
              {de ? "Frühere Prämienregeln" : "Previous reward terms"} · v
              {c.version}
            </strong>
            <p className="mt-2 text-muted">
              {c.progress}/{c.ordersPerReward} · {c.available}{" "}
              {de ? "Prämien verfügbar" : "rewards available"} ·{" "}
              {formatPrice(c.rewardCents / 100)}
            </p>
          </div>
        ))}
    </AppFrame>
  );
}
