'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { OrderProofFlow } from '@/components/OrderProofFlow';
import { getCourierToken } from '@/lib/auth';

function OrderProofPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('id')?.trim() ?? '';
  const batchId = params.get('batch')?.trim() || undefined;
  const backHref = batchId ? `/home/batch/?id=${encodeURIComponent(batchId)}` : '/home/';

  useEffect(() => {
    if (!getCourierToken()) router.replace('/login/');
  }, [router]);

  if (!orderId) {
    return (
      <p className="text-sm text-muted">
        Missing order id. Open an order from your assigned batch.
      </p>
    );
  }

  return <OrderProofFlow orderId={orderId} batchId={batchId} backHref={backHref} />;
}

export default function CourierOrderPage() {
  return (
    <AppFrame>
      <Suspense fallback={<p className="text-sm text-muted">Loading order…</p>}>
        <OrderProofPageInner />
      </Suspense>
    </AppFrame>
  );
}
