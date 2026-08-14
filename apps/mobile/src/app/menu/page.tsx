'use client';

import { Button, SearchField, Typography } from '@heroui/react';
import { useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { pizzaTagline } from '@/constants/i18n';
import { useApp } from '@/context/AppContext';
import { useMenuCatalog } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const SORTS = ['Recommended', 'Top Rated', 'Fastest', 'Price'] as const;

export default function MenuPage() {
  const { t, language } = useApp();
  const { items, isOffline, isLoading } = useMenuCatalog();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Recommended');

  const list = useMemo(() => {
    let next = items.filter((p) =>
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (sort === 'Top Rated') next = [...next].sort((a, b) => b.rating - a.rating);
    if (sort === 'Fastest') next = [...next].sort((a, b) => a.prepTime - b.prepTime);
    if (sort === 'Price') next = [...next].sort((a, b) => a.price - b.price);
    return next;
  }, [items, query, sort]);

  return (
    <AppFrame withTabs>
      <Typography type="h2" className={hx.h2}>
        {t('menu.title')}
      </Typography>
      <Typography type="body-sm" className={cn(hx.bodySm, 'mt-1')}>
        {t('menu.subtitle')}
      </Typography>

      {isOffline ? (
        <div className="mt-3 rounded-[14px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-3 py-2">
          <Typography type="body-xs" className={cn(hx.caption, 'text-warning')}>
            {t('login.offlineBanner')}
          </Typography>
        </div>
      ) : null}

      <SearchField
        className="mt-4 w-full"
        value={query}
        onChange={setQuery}
        aria-label={t('menu.search')}
      >
        <SearchField.Group className="h-auto rounded-full border border-border bg-card px-1 py-1 shadow-none">
          <SearchField.SearchIcon className="text-muted" />
          <SearchField.Input
            placeholder={t('menu.search')}
            className="text-[14px] text-foreground"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <Button
            key={s}
            variant={sort === s ? 'primary' : 'secondary'}
            className={hx.filterChip(sort === s)}
            onPress={() => setSort(s)}
          >
            {t(`sort.${s}`)}
          </Button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 pb-2">
        {isLoading && list.length === 0 ? (
          <Typography type="body-sm" className={hx.bodySm}>
            …
          </Typography>
        ) : (
          list.map((pizza) => (
            <ProductCard
              key={pizza.id}
              pizza={pizza}
              variant="row"
              subtitle={pizzaTagline(pizza, language)}
              meta={`${pizza.prepTime} ${t('common.min')}`}
            />
          ))
        )}
      </div>

      <div className="flex justify-center py-4">
        <PartnerBadge />
      </div>
    </AppFrame>
  );
}
