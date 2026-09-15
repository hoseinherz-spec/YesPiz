"use client";
import { InviteFriends } from "@/components/InviteFriends";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { PageBanner } from "@/components/PageBanner";
import { AppText } from "@/components/Text";

import { Form, Input } from "@repo/ui/forms";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { referralsClient, type ReferralAccount } from "@repo/api";
import { AppFrame } from "@/components/AppFrame";
import { Check, Clock, Gift } from "@repo/icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { formatPrice } from "@/constants/pizzas";
export default function ReferralsPage() {
  const { accessToken, language } = useApp();
  const de = language === "de";
  const [data, setData] = useState<ReferralAccount | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!accessToken) return;
    let live = true;
    referralsClient
      .mine({ accessToken })
      .then((value) => {
        if (live) {
          setData(value);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [accessToken, reload]);
  async function apply() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError("");
    try {
      await referralsClient.apply(code.trim().toLowerCase(), { accessToken });
      setReload((value) => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to apply code.");
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(data!.code);
      setCopied(true);
    } catch {
      setError(
        de
          ? "Bitte kopiere den Code manuell."
          : "Please copy the code manually.",
      );
    }
  }
  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title={de ? "Pizza mit Freunden" : "Pizza with friends"} />
      <PageBanner sharing />
      <div className="referral-intro">
        <span className="referral-symbol" aria-hidden="true"><Gift size={44} /></span>
        <AppText as="h1">{de ? "Pizza teilen. Freude teilen." : "Good pizza is better shared."}</AppText>
      </div>
      <AppText as="p" className="mt-4 text-sm leading-6 text-muted">
        {de
          ? "Lade Freunde ein. Nach ihrer ersten abgeschlossenen, bezahlten Bestellung ab €10 und Prüfung durch Yespizz erhalten beide Guthaben."
          : "Invite a friend. After their first completed paid order of at least €10 and Yespizz review, both accounts receive credit."}
      </AppText>
      {error && (
        <AppText as="p" role="alert" className="mt-4 text-danger">
          {error}
        </AppText>
      )}
      {!accessToken ? (
        <div className="mt-8 rounded-2xl border border-border p-5">
          <AppText as="p" className="text-sm leading-6 text-text-secondary">{de ? "Melde dich an, um deinen Einladungscode zu sehen." : "Sign in to find your invite code and follow your rewards."}</AppText>
          <Link href="/login/?next=/referrals/" className="mt-5 flex min-h-14 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">{de ? "Anmelden" : "Sign in"}</Link>
        </div>
      ) : !data ? (
        <AppText as="p" className="mt-6" role="status">
          {de ? "Wird geladen…" : "Loading…"}
        </AppText>
      ) : (
        <>
          <section className="referral-ticket data-surface relative mt-6 overflow-hidden rounded-[28px] p-6">
            <AppText as="h2" className="text-lg font-semibold">
              {de ? "Dein Einladungscode" : "Your invite code"}
            </AppText>
            <AppText as="p" className="my-5 break-all rounded-2xl border border-dashed border-accent/30 bg-background/40 px-4 py-5 font-mono text-lg tracking-widest text-accent">
              {data.code}
            </AppText>
            <Button variant="primary" className="w-full h-14 rounded-full font-bold" onPress={() => void copy()}>
              {copied
                ? de
                  ? "Kopiert"
                  : "Copied"
                : de
                  ? "Code kopieren"
                  : "Copy code"}
            </Button>
            <AppText as="p" className="mt-5 border-t border-dashed border-border pt-5 text-sm text-text-secondary">
              {data.rewardCents > 0
                ? `${formatPrice(data.rewardCents / 100)} ${de ? "Guthaben pro Person" : "credit each"}`
                : de
                  ? "Neue Prämien sind derzeit pausiert."
                  : "New referral rewards are currently paused."}
            </AppText>
          </section>
          <InviteFriends code={data.code} de={de} />
          <div className="my-6 grid grid-cols-2 gap-3">
            <AppText as="p" className="data-surface rounded-[22px] p-4">
              <Clock size={18} className="mb-3 text-muted" />
              <AppText as="strong" className="block text-3xl font-semibold tabular-nums">
                <AnimatedNumber value={data.pending} />
              </AppText>
              <AppText as="span" className="mt-1 block text-xs text-muted">
                {de ? "Ausstehend" : "Pending"}
              </AppText>
            </AppText>
            <AppText as="p" className="data-surface rounded-[22px] p-4">
              <Check size={18} className="mb-3 text-accent" />
              <AppText as="strong" className="block text-3xl font-semibold tabular-nums">
                <AnimatedNumber value={data.rewarded} />
              </AppText>
              <AppText as="span" className="mt-1 block text-xs text-muted">
                {de ? "Gutgeschrieben" : "Rewarded"}
              </AppText>
            </AppText>
          </div>
          {data.applied ? (
            <AppText as="p" className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm leading-6">
              {de ? "Einladung gespeichert" : "Invitation saved"} ·{" "}
              {data.ownStatus === "rewarded"
                ? de
                  ? "Guthaben erhalten"
                  : "Credit received"
                : de
                  ? "Wartet auf Bestellung und Prüfung"
                  : "Awaiting qualifying order and review"}{" "}
              · <AnimatedNumber currency value={(data.agreedRewardCents ?? 0) / 100} />
            </AppText>
          ) : (
            data.rewardCents > 0 && (
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  void apply();
                }}
                className="space-y-4 rounded-3xl bg-card p-5"
              >
                <Input
                  label={<>{de ? "Code eines Freundes" : "A friend’s code"}</>}
                  wrapperClassName="block text-sm"
                  required
                  maxLength={16}
                  minLength={16}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-3 w-full rounded-xl bg-field-background p-3"
                />
                <Button type="submit" isDisabled={busy}>
                  {de
                    ? "Vor erster Zahlung anwenden"
                    : "Apply before first payment"}
                </Button>
              </Form>
            )
          )}
          <Link className="mt-6 block text-sm underline" href="/credit/">
            {de ? "Guthaben ansehen" : "View credit"}
          </Link>
        </>
      )}
    </AppFrame>
  );
}
