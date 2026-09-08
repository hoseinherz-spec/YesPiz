"use client";
import { ScanCode } from "@/components/ScanCode";
import { Notifications } from "@repo/api/components/notifications";

import {
  batchesClient,
  couriersClient,
  type Batch,
  type CourierProfile,
  type CourierSession,
} from "@repo/api";
import { Button, Spinner, Typography } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { ErrorBanner } from "@/components/ProofUi";
import { formatApiError } from "@/lib/api-errors";
import {
  clearCourierToken,
  getCourierToken,
  requireCourierToken,
} from "@/lib/auth";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";
import { entityId } from "@/lib/ids";

export default function CourierHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [session, setSession] = useState<CourierSession | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [code, setCode] = useState("");
  const [endCode, setEndCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = requireCourierToken();
    const [me, assigned, activeSession] = await Promise.all([
      couriersClient.getMe({ accessToken: token }),
      batchesClient.listAssigned({ accessToken: token }),
      couriersClient.currentSession({ accessToken: token }),
    ]);
    setSession(activeSession);
    setProfile(me);
    setBatches(assigned);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getCourierToken()) {
        router.replace("/login/");
        return;
      }
      load()
        .then(() => setReady(true))
        .catch((err) => {
          setError(formatApiError(err, "Failed to load"));
          setReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, router]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      void load().catch((err) =>
        setError(formatApiError(err, "Unable to refresh deliveries")),
      );
    }, 5000);
    return () => window.clearInterval(timer);
  }, [load, ready]);

  async function startSession() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      const started = await couriersClient.startSession(
        { code: code.trim() },
        { accessToken: token },
      );
      setSession(started);
      window.dispatchEvent(new Event("yespizz:shift"));
      setCode("");
      await load();
    } catch (err) {
      setError(formatApiError(err, "Start failed"));
    } finally {
      setBusy(false);
    }
  }

  async function endSession() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      const ended = await couriersClient.endSession(
        { code: endCode.trim() },
        { accessToken: token },
      );
      setSession(ended);
      window.dispatchEvent(new Event("yespizz:shift"));
      await load();
    } catch (err) {
      setError(formatApiError(err, "End failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <AppFrame padded={false}>
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Typography type="h1" className={hx.h2}>
            On the road
          </Typography>
          <p className={cn(hx.bodySm, "mt-1")}>
            {profile?.onDuty ? "On duty" : "Off duty"}
            {profile?.vehicleType
              ? ` · ${profile.vehicleType.split("|")[0]}`
              : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full border border-border bg-card"
          onPress={() => {
            clearCourierToken();
            router.replace("/login/");
          }}
        >
          Log out
        </Button>
      </header>

      <Notifications accessToken={getCourierToken()} />
      {error ? <ErrorBanner message={error} className="mb-4" /> : null}

      <section className={cn(hx.card, "mb-4 flex flex-col gap-3")}>
        <Typography type="h3" className={hx.title}>
          Shift session
        </Typography>
        <p className={hx.bodySm}>
          Scan the depot QR or enter the OTP from dispatch to go on duty. End
          your shift with the session end code when finished.
        </p>
        {!profile?.onDuty ? (
          <>
            <ScanCode onScan={setCode} />
            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Start QR / OTP
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={cn(hx.field, "h-14 bg-field-background")}
                placeholder="From QR scan or dispatch"
              />
            </label>
            <Button
              variant="primary"
              fullWidth
              isDisabled={busy || !code.trim()}
              onPress={startSession}
              className={cn(hx.btnPrimary, "h-14 text-base")}
            >
              Start session
            </Button>
          </>
        ) : (
          <>
            {session?.endCode || endCode ? (
              <p className="text-sm text-foreground">
                End code:{" "}
                <span className="font-mono">{session?.endCode || endCode}</span>
              </p>
            ) : null}
            <ScanCode onScan={setEndCode} />
            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              End OTP
              <input
                value={endCode}
                onChange={(e) => setEndCode(e.target.value)}
                className={cn(hx.field, "h-14 bg-field-background")}
                placeholder="Session end code"
              />
            </label>
            <Button
              variant="secondary"
              fullWidth
              isDisabled={busy || !endCode.trim()}
              onPress={endSession}
              className={cn(hx.btnSecondary, "h-14 text-base")}
            >
              End session
            </Button>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 pb-8">
        <div className="flex items-center justify-between">
          <Typography type="h3" className={hx.title}>
            Assigned batches
          </Typography>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full border border-border bg-card"
            onPress={() => void load()}
          >
            Refresh
          </Button>
        </div>

        {!profile?.onDuty ? (
          <div className={cn(hx.card, hx.bodySm)}>
            Start your session to see assigned batches and run the pickup →
            delivery proof chain.
          </div>
        ) : null}

        {profile?.onDuty && !batches.length ? (
          <div className={cn(hx.card, hx.bodySm)}>
            No assigned batches right now. Pull to refresh when dispatch assigns
            you.
          </div>
        ) : null}

        {batches.map((batch) => {
          const id = entityId(batch);
          const active =
            batch.status === "assigned" || batch.status === "in_progress";
          return (
            <Link
              key={id}
              href={`/home/batch/?id=${encodeURIComponent(id)}`}
              className={cn(
                hx.card,
                "block transition-opacity hover:opacity-90",
                active && "ring-2 ring-accent/40",
              )}
            >
              <div className="flex justify-between gap-2">
                <Typography type="h3" className={hx.title}>
                  {batch.status.replaceAll("_", " ")}
                </Typography>
                <span className={hx.caption}>
                  {batch.orderIds?.length ?? 0} stops
                </span>
              </div>
              <p className={cn(hx.caption, "mt-1 font-mono")}>{id}</p>
              <p className={cn(hx.bodySm, "mt-2")}>
                Tap to open stops — pickup, en route, deliver, and complete each
                order.
              </p>
            </Link>
          );
        })}
      </section>
    </AppFrame>
  );
}
