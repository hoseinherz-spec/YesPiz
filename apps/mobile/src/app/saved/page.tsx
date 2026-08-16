'use client';

import { Typography } from '@heroui/react';
import { Heart } from '@repo/icons';
import { useMemo } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { useMenuCatalog } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function SavedPage() {
  const { favorites, t } = useApp();
  const { items, isLoading, isOffline } = useMenuCatalog();

  const saved = useMemo(
    () => items.filter((pizza) => favorites.includes(pizza.id)),
    [favorites, items],
  );

  return (
    <AppFrame withTabs>
      <ScreenHeader title="Saved" subtitle={saved.length ? `${saved.length} pizzas` : undefined} backHref="/home/" />

      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, 'text-warning')}>
            {t('login.offlineBanner')}
          </Typography>
        </div>
      ) : null}

      {isLoading && items.length === 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-3" aria-label="Loading saved pizzas">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[250px] animate-pulse rounded-[28px] bg-card" />
          ))}
        </div>
      ) : saved.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 pb-4">
          {saved.map((pizza) => (
            <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={28} />}
          title="Nothing saved yet"
          body="Tap the heart on any pizza to keep it close."
          actionLabel={t('common.browseMenu')}
          actionHref="/menu/"
        />
      )}
    </AppFrame>
  );
}
