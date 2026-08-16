'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { PizzaDetail } from '@/features/catalog/components/PizzaDetail';

function PizzaPageInner() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  return <PizzaDetail id={id} />;
}

export default function PizzaPage() {
  return (
    <Suspense
      fallback={
        <AppFrame padded={false}>
          <div className="h-dvh animate-pulse bg-card" aria-label="Loading pizza details" />
        </AppFrame>
      }
    >
      <PizzaPageInner />
    </Suspense>
  );
}
