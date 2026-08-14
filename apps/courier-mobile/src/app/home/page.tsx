'use client';

import {
  ApiError,
  batchesClient,
  couriersClient,
  type Batch,
  type CourierProfile,
  type CourierSession,
} from '@repo/api';
import { Button, Card, Spinner, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  clearCourierToken,
  getCourierToken,
  requireCourierToken,
} from '@/lib/auth';
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
      // Demo coords near Munich when geolocation unavailable
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
    // Defer so the effect only schedules work (location is an external system).
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
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-4 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Typography type="h1" className="text-2xl font-semibold">
            On the road
          </Typography>
          <p className="text-muted text-sm">
            {profile?.onDuty ? 'On duty' : 'Off duty'}
            {profile?.vehicleType ? ` · ${profile.vehicleType.split('|')[0]}` : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            clearCourierToken();
            router.replace('/login/');
          }}
        >
          Log out
        </Button>
      </header>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3 p-0">
          <Typography type="h3" className="font-medium">
            Session
          </Typography>
          <p className="text-muted text-sm">
            Scan QR / enter OTP to start. End with the session end code (or
            000000 in demo).
          </p>
          {!profile?.onDuty ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Start QR / OTP
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2"
                />
              </label>
              <Button
                variant="primary"
                fullWidth
                isDisabled={busy || !code.trim()}
                onPress={startSession}
              >
                Start session
              </Button>
            </>
          ) : (
            <>
              {session?.endCode || endCode ? (
                <p className="text-sm">
                  End code hint:{' '}
                  <span className="font-mono">{session?.endCode || endCode}</span>
                </p>
              ) : null}
              <label className="flex flex-col gap-1 text-sm">
                End OTP
                <input
                  value={endCode}
                  onChange={(e) => setEndCode(e.target.value)}
                  className="border-border bg-background rounded-md border px-3 py-2"
                  placeholder="000000"
                />
              </label>
              <Button
                variant="secondary"
                fullWidth
                isDisabled={busy}
                onPress={endSession}
              >
                End session
              </Button>
              <Button
                size="sm"
                variant={shareLocation ? 'primary' : 'secondary'}
                fullWidth
                onPress={() => setShareLocation((v) => !v)}
              >
                {shareLocation ? 'Stop sharing location' : 'Share live location'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                fullWidth
                onPress={() => void postLocation()}
              >
                Post location once
              </Button>
              {lastLocation ? (
                <p className="text-muted text-xs">Last: {lastLocation}</p>
              ) : null}
            </>
          )}
        </Card.Content>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Typography type="h3" className="font-medium">
            Assigned batches
          </Typography>
          <Button size="sm" variant="secondary" onPress={load}>
            Refresh
          </Button>
        </div>

        {!batches.length ? (
          <Card className="p-4">
            <Card.Content className="text-muted p-0 text-sm">
              No assigned batches. Pickup marking lands when Phase 4 delivery
              endpoints ship — for now open batch details by id via API.
            </Card.Content>
          </Card>
        ) : null}

        {batches.map((batch) => {
          const id = entityId(batch);
          return (
            <Card key={id} className="p-4">
              <Card.Content className="flex flex-col gap-1 p-0">
                <div className="flex justify-between gap-2">
                  <Typography type="h3" className="font-medium">
                    {batch.status}
                  </Typography>
                  <span className="text-muted text-xs">
                    {batch.orderIds?.length ?? 0} orders
                  </span>
                </div>
                <p className="text-muted text-xs">Batch {id}</p>
                <ul className="mt-1 text-sm">
                  {(batch.orderIds ?? []).map((oid) => (
                    <li key={String(oid)}>{String(oid)}</li>
                  ))}
                </ul>
                <p className="text-muted mt-2 text-xs">
                  Pickup flow: show this batch at the kitchen counter. Status
                  updates arrive when courier pickup endpoints are enabled.
                </p>
              </Card.Content>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
