'use client';

import {
  ApiError,
  batchesClient,
  couriersClient,
  type Batch,
  type CourierProfile,
  type CourierSession,
} from '@repo/api';
import { Button, Spinner, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import {
  clearCourierToken,
  getCourierToken,
  requireCourierToken,
} from '@/lib/auth';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';
import { entityId } from '@/lib/ids';

export default function CourierHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [session, setSession] = useState<CourierSession | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [code, setCode] = useState('DEMO-QR');
  const [endCode, setEndCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastLocation, setLastLocation] = useState<string | null>(null);
  const [shareLocation, setShareLocation] = useState(false);

  const load = useCallback(async () => {
    const token = requireCourierToken();
    const [me, assigned] = await Promise.all([
      couriersClient.getMe({ accessToken: token }),
      batchesClient.listAssigned({ accessToken: token }),
    ]);
    setProfile(me);
    setBatches(assigned);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getCourierToken()) {
        router.replace('/login/');
        return;
      }
      load()
        .then(() => setReady(true))
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : 'Failed to load');
          setReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, router]);

  const postLocation = useCallback(async () => {
    try {
      const token = requireCourierToken();
      let longitude = 11.5755;
      let latitude = 48.1374;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 15_000,
            });
          });
          longitude = pos.coords.longitude;
          latitude = pos.coords.latitude;
        } catch {
          // keep demo coords
        }
      }
      const res = await couriersClient.updateLocation(
        { longitude, latitude },
        { accessToken: token },
      );
      setLastLocation(
        `${res.latitude.toFixed(5)}, ${res.longitude.toFixed(5)} @ ${res.updatedAt}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Location update failed');
    }
  }, []);

  useEffect(() => {
    if (!shareLocation || !profile?.onDuty) return;
    const immediate = window.setTimeout(() => {
      void postLocation();
    }, 0);
    const id = window.setInterval(() => {
      void postLocation();
    }, 15_000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(id);
    };
  }, [shareLocation, profile?.onDuty, postLocation]);

  async function startSession() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      const started = await couriersClient.startSession(
        { code },
        { accessToken: token },
      );
      setSession(started);
      if (started.endCode) setEndCode(started.endCode);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Start failed');
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
        { code: endCode || '000000' },
        { accessToken: token },
      );
      setSession(ended);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'End failed');
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
          <p className={cn(hx.bodySm, 'mt-1')}>
            {profile?.onDuty ? 'On duty' : 'Off duty'}
            {profile?.vehicleType ? ` · ${profile.vehicleType.split('|')[0]}` : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full border border-border bg-card"
          onPress={() => {
            clearCourierToken();
            router.replace('/login/');
          }}
        >
          Log out
        </Button>
      </header>

      {error ? (
        <p role="alert" className="mb-4 rounded-[18px] border border-border bg-card px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className={cn(hx.card, 'mb-4 flex flex-col gap-3')}>
        <Typography type="h3" className={hx.title}>
          Session
        </Typography>
        <p className={hx.bodySm}>
          Scan QR / enter OTP to start. End with the session end code (or 000000
          in demo).
        </p>
        {!profile?.onDuty ? (
          <>
            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              Start QR / OTP
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={cn(hx.field, 'h-14 bg-field-background')}
              />
            </label>
            <Button
              variant="primary"
              fullWidth
              isDisabled={busy || !code.trim()}
              onPress={startSession}
              className={cn(hx.btnPrimary, 'h-14 text-base')}
            >
              Start session
            </Button>
          </>
        ) : (
          <>
            {session?.endCode || endCode ? (
              <p className="text-sm text-foreground">
                End code hint:{' '}
                <span className="font-mono">{session?.endCode || endCode}</span>
              </p>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium text-muted">
              End OTP
              <input
                value={endCode}
                onChange={(e) => setEndCode(e.target.value)}
                className={cn(hx.field, 'h-14 bg-field-background')}
                placeholder="000000"
              />
            </label>
            <Button
              variant="secondary"
              fullWidth
              isDisabled={busy}
              onPress={endSession}
              className={cn(hx.btnSecondary, 'h-14 text-base')}
            >
              End session
            </Button>
            <Button
              size="sm"
              variant={shareLocation ? 'primary' : 'secondary'}
              fullWidth
              className="h-12 rounded-full"
              onPress={() => setShareLocation((v) => !v)}
            >
              {shareLocation ? 'Stop sharing location' : 'Share live location'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              fullWidth
              className="h-12 rounded-full border border-border bg-card"
              onPress={() => void postLocation()}
            >
              Post location once
            </Button>
            {lastLocation ? (
              <p className={hx.caption}>Last: {lastLocation}</p>
            ) : null}
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
            onPress={load}
          >
            Refresh
          </Button>
        </div>

        {!batches.length ? (
          <div className={cn(hx.card, hx.bodySm)}>
            No assigned batches. Pickup marking lands when Phase 4 delivery
            endpoints ship — for now open batch details by id via API.
          </div>
        ) : null}

        {batches.map((batch) => {
          const id = entityId(batch);
          return (
            <div key={id} className={cn(hx.card, 'flex flex-col gap-1')}>
              <div className="flex justify-between gap-2">
                <Typography type="h3" className={hx.title}>
                  {batch.status}
                </Typography>
                <span className={hx.caption}>
                  {batch.orderIds?.length ?? 0} orders
                </span>
              </div>
              <p className={hx.caption}>Batch {id}</p>
              <ul className="mt-1 text-sm text-foreground">
                {(batch.orderIds ?? []).map((oid) => (
                  <li key={String(oid)}>{String(oid)}</li>
                ))}
              </ul>
              <p className={cn(hx.caption, 'mt-2')}>
                Pickup flow: show this batch at the kitchen counter. Status
                updates arrive when courier pickup endpoints are enabled.
              </p>
            </div>
          );
        })}
      </section>
    </AppFrame>
  );
}
