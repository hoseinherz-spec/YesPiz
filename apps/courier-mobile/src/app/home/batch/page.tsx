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
import { ArrowRight, Boxes, RefreshCw } from 'lucide-react';

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

      <p className={cn(hx.caption, 'mb-4 truncate font-mono')}>{id || batchId}</p>

      {batch ? (
        <div className="courier-hero mb-5">
          <div className="relative z-10 flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Boxes size={21} />
            </span>
            <div>
              <Typography type="h2" className={hx.title}>
                {batch.orderIds?.length ?? 0} delivery stops
              </Typography>
              <p className={cn(hx.bodySm, 'mt-1')}>
                Prep weight {batch.totalPrepWeight}
              </p>
            </div>
          </div>
          <p className={cn(hx.caption, 'relative z-10 mt-4 max-w-[300px]')}>
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
          <div className="courier-card courier-empty">
            <Boxes size={26} className="text-muted" />
            <p className={hx.bodySm}>No orders in this batch.</p>
          </div>
        ) : null}

        {orders.map((o, index) => (
          <Link
            key={o.orderId}
            href={`/home/order/?id=${encodeURIComponent(o.orderId)}&batch=${encodeURIComponent(batchId)}`}
            className="courier-card courier-card--interactive block"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {formatOrderStatus(o.status)}
                </span>
                <p className={cn(hx.title, 'mt-3')}>Stop {index + 1}</p>
                <p className={cn(hx.caption, 'mt-1 truncate font-mono')}>{o.orderId}</p>
              </div>
              <span className="courier-icon-button size-10 min-w-10 bg-surface-tertiary">
                <ArrowRight size={18} />
              </span>
            </div>
          </Link>
        ))}

        <Button
          size="sm"
          variant="secondary"
          className={cn(hx.btnSecondary, 'mt-2')}
          onPress={() => void load()}
        >
          <RefreshCw size={17} /> Refresh batch
        </Button>
      </section>
    </>
  );
}

export default function CourierBatchPage() {
  return (
    <AppFrame className="courier-screen">
      <Suspense fallback={<p className="text-sm text-muted">Loading batch…</p>}>
        <BatchDetailInner />
      </Suspense>
    </AppFrame>
  );
}
