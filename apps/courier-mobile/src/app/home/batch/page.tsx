'use client';

import {
  ApiError,
  batchesClient,
  proofClient,
  type Batch,
  type OrderStatus,
} from '@repo/api';
import { Button, Spinner, Typography } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { ErrorBanner } from '@/components/ProofUi';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatApiError } from '@/lib/api-errors';
import { requireCourierToken, getCourierToken } from '@/lib/auth';
import { formatOrderStatus, parseCourierProofView } from '@/lib/courier-proof';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';
import { entityId } from '@/lib/ids';

type OrderSummary = {
  orderId: string;
  status: OrderStatus;
};

function BatchDetailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const batchId = params.get('id')?.trim() ?? '';

  const [ready, setReady] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    const token = requireCourierToken();
    const b = await batchesClient.get(batchId, { accessToken: token });
    if (!b) throw new ApiError('errors.notFound', 404);
    setBatch(b);

    const summaries = await Promise.all(
      (b.orderIds ?? []).map(async (oid) => {
        const id = String(oid);
        try {
          const view = parseCourierProofView(
            await proofClient.get(id, { accessToken: token }),
          );
          return { orderId: id, status: view.status };
        } catch {
          return { orderId: id, status: 'ASSIGNED_TO_COURIER' as OrderStatus };
        }
      }),
    );
    setOrders(summaries);
  }, [batchId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getCourierToken()) {
        router.replace('/login/');
        return;
      }
      if (!batchId) {
        setReady(true);
        return;
      }
      load()
        .then(() => setReady(true))
        .catch((err) => {
          setError(formatApiError(err, 'Failed to load batch'));
          setReady(true);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [batchId, load, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!batchId) {
    return (
      <p className="text-sm text-muted">Missing batch id. Go back to assigned batches.</p>
    );
  }

  const id = entityId(batch);

  return (
    <>
      <ScreenHeader title="Batch" subtitle={batch?.status ?? '…'} backHref="/home/" />

      {error ? <ErrorBanner message={error} className="mb-4" /> : null}

      <p className={cn(hx.caption, 'mb-4 font-mono')}>{id || batchId}</p>

      {batch ? (
        <div className={cn(hx.card, 'mb-4')}>
          <p className={hx.bodySm}>
            {batch.orderIds?.length ?? 0} stops · prep weight {batch.totalPrepWeight}
          </p>
          <p className={cn(hx.caption, 'mt-2')}>
            Complete stops in kitchen pickup order. Server may split the batch if a stop
            becomes unsafe.
          </p>
        </div>
      ) : null}

      <section className="flex flex-col gap-3 pb-8">
        <Typography type="h3" className={hx.title}>
          Stops
        </Typography>

        {!orders.length ? (
          <div className={cn(hx.card, hx.bodySm)}>No orders in this batch.</div>
        ) : null}

        {orders.map((o, index) => (
          <Link
            key={o.orderId}
            href={`/home/order/?id=${encodeURIComponent(o.orderId)}&batch=${encodeURIComponent(batchId)}`}
            className={cn(hx.card, 'block transition-opacity hover:opacity-90')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={hx.title}>Stop {index + 1}</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold capitalize text-accent">
                {formatOrderStatus(o.status)}
              </span>
            </div>
            <p className={cn(hx.caption, 'mt-1 font-mono')}>{o.orderId}</p>
          </Link>
        ))}

        <Button
          size="sm"
          variant="secondary"
          className="mt-2 rounded-full border border-border bg-card"
          onPress={() => void load()}
        >
          Refresh
        </Button>
      </section>
    </>
  );
}

export default function CourierBatchPage() {
  return (
    <AppFrame>
      <Suspense fallback={<p className="text-sm text-muted">Loading batch…</p>}>
        <BatchDetailInner />
      </Suspense>
    </AppFrame>
  );
}
