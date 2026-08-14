'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { PizzaDetail } from '@/features/catalog/components/PizzaDetail';

function PizzaPageInner() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  return <PizzaDetail id={id} />;
}

export default function PizzaPage() {
  return (
    <Suspense fallback={null}>
      <PizzaPageInner />
    </Suspense>
  );
}
