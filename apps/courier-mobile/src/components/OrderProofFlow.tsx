'use client';

import {
  incidentsClient,
  proofClient,
  type Incident,
  type OrderStatus,
} from '@repo/api';
import { Button, Spinner, Typography } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';

import { IncidentActionSheet } from '@/components/IncidentActionSheet';
import { ErrorBanner, ProofField } from '@/components/ProofUi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useActiveLocationSharing } from '@/hooks/use-active-location';
import { formatApiError } from '@/lib/api-errors';
import { requireCourierToken } from '@/lib/auth';
import {
  type CourierOrderProofView,
  formatOrderStatus,
  isActiveDeliveryStatus,
  parseCourierProofView,
} from '@/lib/courier-proof';
import { cn } from '@/lib/cn';
import { getCurrentPosition, GeoError } from '@/lib/geolocation';
import { hx } from '@/lib/heroui-classes';

type OrderProofFlowProps = {
  orderId: string;
  batchId?: string;
  backHref: string;
};

export function OrderProofFlow({ orderId, batchId, backHref }: OrderProofFlowProps) {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<CourierOrderProofView | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);

  const [pickupCode, setPickupCode] = useState('');
  const [sealId, setSealId] = useState('');
  const [doorPin, setDoorPin] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [cashCents, setCashCents] = useState('');

  const shareLocation = isActiveDeliveryStatus(view?.status ?? 'DRAFT');
  const { lastPosted, error: locError, postOnce } = useActiveLocationSharing(shareLocation);

  const load = useCallback(async () => {
    const token = requireCourierToken();
    const [proofRes, mine] = await Promise.all([
      proofClient
        .get(orderId, { accessToken: token })
        .then(parseCourierProofView),
      incidentsClient.listMine({ accessToken: token }),
    ]);
    setView(proofRes);
    setIncidents(mine);
    if (proofRes.sealId && !sealId) setSealId(proofRes.sealId);
  }, [orderId, sealId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
        .then(() => setReady(true))
        .catch((err) => {
          setError(formatApiError(err, 'Failed to load order'));
          setReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function withGeo<T>(action: (coords: { longitude: number; latitude: number }) => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      const coords = await getCurrentPosition();
      const result = await action(coords);
      await load();
      return result;
    } catch (err) {
      if (err instanceof GeoError) setError(err.message);
      else setError(formatApiError(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handlePickup() {
    await withGeo(async (coords) => {
      const token = requireCourierToken();
      return proofClient.pickup(
        orderId,
        {
          code: pickupCode.trim(),
          sealId: sealId.trim() || undefined,
          ...coords,
        },
        { accessToken: token },
      );
    });
  }

  async function handleEnRoute() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      let body = {};
      try {
        body = await getCurrentPosition();
      } catch {
        // en-route allows optional coords
      }
      await proofClient.markEnRoute(orderId, body, { accessToken: token });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeliver() {
    const hasProof = doorPin.trim() || signatureUrl.trim() || photoUrl.trim();
    if (!hasProof) {
      setError('Enter door PIN, signature URL, or photo URL.');
      return;
    }
    await withGeo(async (coords) => {
      const token = requireCourierToken();
      return proofClient.deliver(
        orderId,
        {
          pin: doorPin.trim() || undefined,
          signatureUrl: signatureUrl.trim() || undefined,
          photoUrl: photoUrl.trim() || undefined,
          ...coords,
        },
        { accessToken: token },
      );
    });
  }

  async function handleCashReceipt() {
    const cents = Number.parseInt(cashCents, 10);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Enter the cash amount received in cents.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      await proofClient.cashReceipt(orderId, { amountCents: cents }, { accessToken: token });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError(null);
    try {
      const token = requireCourierToken();
      await proofClient.complete(orderId, { accessToken: token });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleIncidentReport(payload: {
    kind: Parameters<typeof incidentsClient.report>[1]['kind'];
    notes: string;
    longitude?: number;
    latitude?: number;
  }) {
    const token = requireCourierToken();
    const created = await incidentsClient.report(orderId, payload, { accessToken: token });
    setIncidents((prev) => [created, ...prev]);
    await load();
    return created;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const status = view?.status ?? 'DRAFT';
  const paymentMethod = view?.paymentMethod ?? 'card';
  const proof = view?.proof;
  const needsCashReceipt =
    paymentMethod === 'cash' && status === 'DELIVERED' && proof?.cashReceiptAt == null;
  const canComplete =
    status === 'DELIVERED' && (paymentMethod !== 'cash' || proof?.cashReceiptAt != null);

  return (
    <>
      <ScreenHeader
        title={`Order`}
        subtitle={formatOrderStatus(status)}
        backHref={backHref}
        right={
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full border border-border px-3 text-xs"
            onPress={() => setIncidentOpen(true)}
          >
            Incident
          </Button>
        }
      />

      <p className={cn(hx.caption, 'mb-4 font-mono')}>{orderId}</p>
      {batchId ? <p className={cn(hx.caption, 'mb-4')}>Batch {batchId}</p> : null}

      {error ? <ErrorBanner message={error} className="mb-4" /> : null}
      {locError ? <ErrorBanner message={locError} className="mb-4" /> : null}

      {shareLocation ? (
        <section className={cn(hx.card, 'mb-4')}>
          <Typography type="h3" className={hx.title}>
            Live location
          </Typography>
          <p className={cn(hx.bodySm, 'mt-1')}>
            Sharing every 15s while this delivery is active.
          </p>
          {lastPosted ? <p className={cn(hx.caption, 'mt-2')}>Last: {lastPosted}</p> : null}
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 h-10 rounded-full"
            onPress={() => void postOnce()}
          >
            Post now
          </Button>
        </section>
      ) : null}

      <StatusStep status={status} />

      {status === 'ASSIGNED_TO_COURIER' ? (
        <section className={cn(hx.card, 'mt-4 flex flex-col gap-3')}>
          <Typography type="h3" className={hx.title}>
            Pickup at kitchen
          </Typography>
          <p className={hx.bodySm}>
            Enter the pickup QR/OTP from the counter, confirm the numbered seal, and
            capture your location.
          </p>
          {view?.sealId ? (
            <p className={hx.caption}>Expected seal: {view.sealId}</p>
          ) : null}
          <ProofField
            label="Pickup code"
            value={pickupCode}
            onChange={setPickupCode}
            placeholder="6-digit code"
            inputMode="numeric"
            hint="Manual entry OK — Capacitor QR scanner can replace this later."
          />
          <ProofField
            label="Seal ID"
            value={sealId}
            onChange={setSealId}
            placeholder="Seal number on bag"
          />
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy || !pickupCode.trim()}
            onPress={() => void handlePickup()}
            className={cn(hx.btnPrimary, 'h-14 text-base')}
          >
            Confirm pickup
          </Button>
        </section>
      ) : null}

      {status === 'PICKED_UP' ? (
        <section className={cn(hx.card, 'mt-4 flex flex-col gap-3')}>
          <Typography type="h3" className={hx.title}>
            Start delivery
          </Typography>
          <p className={hx.bodySm}>Mark en route when leaving the provider.</p>
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy}
            onPress={() => void handleEnRoute()}
            className={cn(hx.btnPrimary, 'h-14 text-base')}
          >
            Mark en route
          </Button>
        </section>
      ) : null}

      {status === 'ON_THE_WAY' ? (
        <section className={cn(hx.card, 'mt-4 flex flex-col gap-3')}>
          <Typography type="h3" className={hx.title}>
            Deliver to customer
          </Typography>
          <p className={hx.bodySm}>
            Provide door PIN and/or signature/photo proof. Demo uses URL text fields.
          </p>
          {view?.hasDoorPin ? (
            <ProofField
              label="Door PIN"
              value={doorPin}
              onChange={setDoorPin}
              placeholder="4-digit PIN"
              inputMode="numeric"
            />
          ) : null}
          <ProofField
            label="Signature URL (demo)"
            value={signatureUrl}
            onChange={setSignatureUrl}
            placeholder="https://…"
          />
          <ProofField
            label="Photo URL (demo)"
            value={photoUrl}
            onChange={setPhotoUrl}
            placeholder="https://…"
          />
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy}
            onPress={() => void handleDeliver()}
            className={cn(hx.btnPrimary, 'h-14 text-base')}
          >
            Confirm delivery
          </Button>
        </section>
      ) : null}

      {needsCashReceipt ? (
        <section className={cn(hx.card, 'mt-4 flex flex-col gap-3')}>
          <Typography type="h3" className={hx.title}>
            Cash receipt
          </Typography>
          <p className={hx.bodySm}>
            Record cash collected before completing this order.
          </p>
          <ProofField
            label="Amount (cents)"
            value={cashCents}
            onChange={setCashCents}
            placeholder="e.g. 2499"
            inputMode="numeric"
          />
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy || !cashCents.trim()}
            onPress={() => void handleCashReceipt()}
            className={cn(hx.btnPrimary, 'h-14 text-base')}
          >
            Record cash receipt
          </Button>
        </section>
      ) : null}

      {canComplete ? (
        <section className={cn(hx.card, 'mt-4 flex flex-col gap-3')}>
          <Typography type="h3" className={hx.title}>
            Complete order
          </Typography>
          <Button
            variant="primary"
            fullWidth
            isDisabled={busy}
            onPress={() => void handleComplete()}
            className={cn(hx.btnPrimary, 'h-14 text-base')}
          >
            Mark completed
          </Button>
        </section>
      ) : null}

      {status === 'COMPLETED' ? (
        <section className={cn(hx.card, 'mt-4')}>
          <Typography type="h3" className={hx.title}>
            Delivery complete
          </Typography>
          <p className={cn(hx.bodySm, 'mt-2')}>
            Proof chain finished. Return to batch or take the next stop.
          </p>
        </section>
      ) : null}

      {status === 'EXCEPTION_REPORTED' ? (
        <section className={cn(hx.card, 'mt-4 border-danger/30 bg-danger-soft')}>
          <Typography type="h3" className="text-danger">
            Exception reported
          </Typography>
          <p className={cn(hx.bodySm, 'mt-2 text-danger')}>
            Operations is handling this order. Check incident workflows below.
          </p>
        </section>
      ) : null}

      {proof?.pickupAt ? (
        <section className={cn(hx.card, 'mt-4')}>
          <Typography type="h3" className={hx.title}>
            Custody log
          </Typography>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {(proof.custodyLog ?? []).map((ev, i) => {
              const label =
                ('event' in ev && typeof ev.event === 'string' ? ev.event : null) ??
                ev.kind ??
                'event';
              return (
                <li key={`${ev.at}-${i}`} className="text-muted">
                  {new Date(ev.at).toLocaleTimeString()} — {label.replaceAll('_', ' ')}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <IncidentActionSheet
        open={incidentOpen}
        orderId={orderId}
        onClose={() => setIncidentOpen(false)}
        onReport={handleIncidentReport}
        existing={incidents}
      />
    </>
  );
}

const STEPS: OrderStatus[] = [
  'ASSIGNED_TO_COURIER',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'COMPLETED',
];

function StatusStep({ status }: { status: OrderStatus }) {
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => {
        const done = idx >= 0 && i <= idx;
        const active = step === status;
        return (
          <li
            key={step}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold capitalize',
              done ? 'bg-accent text-accent-foreground' : 'border border-border bg-card text-muted',
              active && 'ring-2 ring-accent',
            )}
          >
            {formatOrderStatus(step)}
          </li>
        );
      })}
    </ol>
  );
}
