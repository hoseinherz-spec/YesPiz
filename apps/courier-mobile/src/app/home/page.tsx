"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import { useLiveRefresh } from "@/lib/use-live-refresh";
import { VehicleProfile } from "@/components/VehicleProfile";
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
import {
  ArrowRight,
  Boxes,
  Clock3,
  LogOut,
  QrCode,
  RefreshCw,
  Route,
  WalletCards,
  UserRound,
} from "lucide-react";

import { AppFrame } from "@/components/AppFrame";
import { CourierBrand } from "@/components/CourierBrand";
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

  useLiveRefresh(getCourierToken(), profile?.userId ? `courier:${profile.userId}` : undefined, load);

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
    <FormScope>
      <AppFrame className="courier-screen">
        <header className="mb-6 flex items-center justify-between gap-3">
          <CourierBrand />
          <Link href="/profile/" className="courier-icon-button ms-auto" aria-label="Profile and settings"><UserRound size={19} /></Link>
          <Button
            isIconOnly
            variant="secondary"
            aria-label="Log out"
            className="courier-icon-button border-0"
            onPress={() => {
              clearCourierToken();
              router.replace("/login/");
            }}
          >
            <LogOut size={19} />
          </Button>
        </header>

        <section className="courier-hero mb-4">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface-tertiary px-3 py-2 text-xs font-semibold">
                <span
                  className="courier-status-dot"
                  data-active={profile?.onDuty ? "true" : "false"}
                />
                {profile?.onDuty ? "On duty" : "Off duty"}
              </span>
              <Typography type="h1" className={hx.h2}>
                {profile?.onDuty ? "Keep moving." : "Ready for your shift?"}
              </Typography>
              <p className={cn(hx.bodySm, "mt-2 max-w-[260px]")}>
                {profile?.onDuty
                  ? "Your assigned routes and proof steps are ready below."
                  : "Scan the dispatch code to start receiving deliveries."}
              </p>
            </div>
            <Route className="mt-2 shrink-0 text-accent" size={34} />
          </div>
        </section>

        <div className="courier-stat-grid mb-5">
          <div className="courier-stat">
            <Boxes size={18} className="text-accent" />
            <strong>{batches.length}</strong>
            <span>Batches</span>
          </div>
          <div className="courier-stat">
            <Route size={18} className="text-info" />
            <strong>
              {batches.reduce((sum, batch) => sum + (batch.orderIds?.length ?? 0), 0)}
            </strong>
            <span>Stops</span>
          </div>
          <Link href="/earnings/" className="courier-stat courier-card--interactive">
            <WalletCards size={18} className="text-success" />
            <strong>€</strong>
            <span>Earnings</span>
          </Link>
        </div>

        <Notifications accessToken={getCourierToken()} />
        {error ? <ErrorBanner message={error} className="mb-4" /> : null}

        <section className="courier-card mb-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-tertiary text-accent">
              <QrCode size={21} />
            </span>
            <div>
              <Typography type="h3" className={hx.title}>
                Shift session
              </Typography>
              <p className={cn(hx.bodySm, "mt-1")}>
                {profile?.onDuty
                  ? "Enter the end code from dispatch when your run is complete."
                  : "Scan the depot QR or enter the OTP from dispatch."}
              </p>
            </div>
          </div>

          {profile && <VehicleProfile profile={profile} onSaved={setProfile} />}
          {!profile?.onDuty ? (
            <>
              <ScanCode onScan={setCode} />
              <Input
                label={<>Start QR / OTP</>}
                wrapperClassName="flex flex-col gap-2 text-sm font-medium text-muted"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={hx.field}
                placeholder="Code from dispatch"
              />
              <FormAction
                variant="primary"
                fullWidth
                isDisabled={busy || !code.trim()}
                onPress={startSession}
                className={hx.btnPrimary}
              >
                Start shift
              </FormAction>
            </>
          ) : (
            <>
              {session?.endCode || endCode ? (
                <p className="rounded-2xl bg-surface-tertiary px-4 py-3 text-sm text-foreground">
                  End code:{" "}
                  <span className="font-mono font-semibold">
                    {session?.endCode || endCode}
                  </span>
                </p>
              ) : null}
              <ScanCode onScan={setEndCode} />
              <Input
                label={<>End OTP</>}
                wrapperClassName="flex flex-col gap-2 text-sm font-medium text-muted"
                value={endCode}
                onChange={(event) => setEndCode(event.target.value)}
                className={hx.field}
                placeholder="Session end code"
              />
              <FormAction
                variant="secondary"
                fullWidth
                isDisabled={busy || !endCode.trim()}
                onPress={endSession}
                className={hx.btnSecondary}
              >
                End shift
              </FormAction>
            </>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="courier-section-heading">
            <div>
              <Typography type="h2" className={hx.h3}>
                Assigned batches
              </Typography>
              <p className={cn(hx.caption, "mt-1")}>Updated automatically</p>
            </div>
            <Button
              isIconOnly
              variant="secondary"
              aria-label="Refresh assigned batches"
              className="courier-icon-button border-0"
              onPress={() => void load().catch((err) => setError(formatApiError(err, "Unable to refresh deliveries")))}
            >
              <RefreshCw size={18} />
            </Button>
          </div>

          {!profile?.onDuty ? (
            <div className="courier-card courier-empty">
              <Clock3 size={26} className="text-muted" />
              <strong className={hx.title}>You are currently off duty</strong>
              <p className={cn(hx.bodySm, "max-w-[280px]")}>
                Start your shift to see assigned batches and delivery stops.
              </p>
            </div>
          ) : null}

          {profile?.onDuty && !batches.length ? (
            <div className="courier-card courier-empty">
              <Boxes size={26} className="text-muted" />
              <strong className={hx.title}>No batches yet</strong>
              <p className={cn(hx.bodySm, "max-w-[280px]")}>
                You are online. New work from dispatch will appear here.
              </p>
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
                  "courier-card courier-card--interactive block",
                  active && "courier-card--active",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="mb-3 inline-flex rounded-full bg-surface-tertiary px-3 py-1 text-[10px] font-bold tracking-wide uppercase text-muted">
                      {batch.status.replaceAll("_", " ")}
                    </span>
                    <Typography type="h3" className={hx.title}>
                      {batch.orderIds?.length ?? 0} delivery stops
                    </Typography>
                    <p className={cn(hx.caption, "mt-1 truncate font-mono")}>{id}</p>
                  </div>
                  <span className="courier-icon-button size-10 min-w-10 bg-accent text-accent-foreground">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      </AppFrame>
    </FormScope>
  );
}
