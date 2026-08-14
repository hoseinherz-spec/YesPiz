'use client';

import { Button, Card, Chip, Typography } from '@heroui/react';
import {
  Bell,
  ChevronDown,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from '@repo/icons';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { IconBadgeButton } from '@/components/IconBadgeButton';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { pizzaTagline } from '@/constants/i18n';
import { formatPrice, PROMOS } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { useMenuCatalog, type CatalogPizza } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const CATEGORIES = ['All', 'Popular', 'Classic', 'Spicy', 'Veggie', 'Premium'] as const;

const STATIC_CATEGORY_MAP: Record<(typeof CATEGORIES)[number], string[] | null> = {
  All: null,
  Popular: ['pepperoni', 'yespiz-special', 'diavola', 'bbq-chicken'],
  Classic: ['margherita', 'salami', 'funghi'],
  Spicy: ['diavola', 'pepperoni'],
  Veggie: ['vegetariana', 'funghi', 'quattro-formaggi'],
  Premium: ['yespiz-special', 'quattro-formaggi', 'bbq-chicken'],
};

function filterByCategory(
  items: CatalogPizza[],
  cat: (typeof CATEGORIES)[number],
  fromApi: boolean,
): CatalogPizza[] {
  if (cat === 'All') return items;
  if (!fromApi) {
    const ids = STATIC_CATEGORY_MAP[cat];
    if (!ids) return items;
    return items.filter((p) => ids.includes(p.id));
  }
  switch (cat) {
    case 'Spicy':
      return items.filter((p) => p.tags.some((tag) => tag.toLowerCase().includes('spicy')));
    case 'Veggie':
      return items.filter((p) =>
        p.tags.some((tag) => {
          const n = tag.toLowerCase();
          return n.includes('veg') || n.includes('vegetarian');
        }),
      );
    case 'Premium':
      return [...items].sort((a, b) => b.price - a.price).slice(0, Math.max(3, items.length));
    case 'Popular':
      return items.slice(0, Math.min(4, items.length));
    case 'Classic':
      return items.filter(
        (p) => !p.tags.some((tag) => tag.toLowerCase().includes('spicy')),
      );
    default:
      return items;
  }
}

export default function HomePage() {
  const { t, userName, unreadCount, language } = useApp();
  const { count } = useCart();
  const { items, fromApi, isOffline, isLoading } = useMenuCatalog();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');

  const featured = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort((a, b) => b.price - a.price)[0] ?? items[0];
  }, [items]);

  const list = useMemo(
    () => filterByCategory(items, cat, fromApi),
    [items, cat, fromApi],
  );

  return (
    <AppFrame withTabs>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" className="mb-1 flex items-center gap-1 text-left">
            <MapPin size={14} color="var(--accent)" />
            <span className="text-[12px] font-medium text-muted">{t('home.deliverTo')}</span>
            <ChevronDown size={14} color="var(--muted)" />
          </button>
          <Typography type="h2" className={hx.h2}>
            {t('home.greeting', { name: userName })}
          </Typography>
        </div>
        <div className="flex gap-2">
          <IconBadgeButton href="/notifications/" aria-label="Notifications" badge={unreadCount}>
            <Bell size={18} />
          </IconBadgeButton>
          <IconBadgeButton href="/cart/" aria-label="Cart" badge={count}>
            <ShoppingBag size={18} />
          </IconBadgeButton>
        </div>
      </div>

      {isOffline ? (
        <div className="mt-3 rounded-[14px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-3 py-2">
          <Typography type="body-xs" className={cn(hx.caption, 'text-warning')}>
            {t('login.offlineBanner')}
          </Typography>
        </div>
      ) : null}

      <Link
        href="/menu/"
        className="mt-5 flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(216,255,0,0.12)]">
          <Search size={16} color="var(--accent)" />
        </span>
        <span className="flex-1 text-[14px] text-muted">{t('home.search')}</span>
        <SlidersHorizontal size={16} color="var(--muted)" />
      </Link>

      <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
        {PROMOS.map((promo, i) => {
          const neon = i === 0;
          return (
            <Card
              key={promo.id}
              className={cn(
                neon ? hx.cardElevated : hx.card,
                'relative min-w-[240px] overflow-hidden',
                neon && 'border-accent bg-accent',
              )}
            >
              <Card.Content className="p-0">
                {!neon && items[i + 1] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={items[i + 1].image}
                    alt=""
                    className="pointer-events-none absolute -right-4 -bottom-6 h-28 w-28 opacity-30"
                  />
                ) : null}
                <Chip
                  variant="soft"
                  className={cn(
                    'mb-2 rounded-full px-2 py-0.5',
                    neon
                      ? 'bg-[rgba(8,17,31,0.15)] text-accent-foreground'
                      : 'bg-[rgba(216,255,0,0.15)] text-accent',
                  )}
                >
                  <Chip.Label className="text-[10px] font-bold tracking-wide">
                    {t(`promo.${promo.key}.badge`)}
                  </Chip.Label>
                </Chip>
                <Typography
                  type="h3"
                  className={cn(hx.h3, neon && 'text-accent-foreground')}
                >
                  {t(`promo.${promo.key}.title`)}
                </Typography>
                <Typography
                  type="body-sm"
                  className={cn(
                    hx.bodySm,
                    'mt-1',
                    neon ? 'text-[rgba(8,17,31,0.7)]' : 'text-text-secondary',
                  )}
                >
                  {t(`promo.${promo.key}.subtitle`)}
                </Typography>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {featured ? (
        <div className="mt-6">
          <Typography type="h3" className={cn(hx.h3, 'mb-3')}>
            {t('home.chefsPick')}
          </Typography>
          <Link
            href={`/pizza/?id=${encodeURIComponent(featured.id)}`}
            className="relative block overflow-hidden rounded-[24px] border border-[color-mix(in_oklab,var(--accent)_18%,transparent)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.imageUrl || featured.image}
              alt={featured.name}
              className="h-48 w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(8,17,31,0.95), rgba(8,17,31,0.2))',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <PartnerBadge compact />
              <Typography type="h3" className={cn(hx.h3, 'mt-2 text-white')}>
                {featured.name}
              </Typography>
              <Typography type="body-sm" className="text-[13px] text-[rgba(255,255,255,0.75)]">
                {pizzaTagline(featured, language)}
              </Typography>
              <Chip
                variant="soft"
                className="mt-3 rounded-full bg-accent px-3 py-1 text-accent-foreground"
              >
                <Chip.Label className="text-[13px] font-extrabold">
                  {formatPrice(featured.price)}
                </Chip.Label>
              </Chip>
            </div>
          </Link>
        </div>
      ) : isLoading ? (
        <Typography type="body-sm" className={cn(hx.bodySm, 'mt-6')}>
          …
        </Typography>
      ) : null}

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={cat === c ? 'primary' : 'secondary'}
            className={hx.filterChip(cat === c)}
            onPress={() => setCat(c)}
          >
            {t(`category.${c}`)}
          </Button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
        {list.map((pizza) => (
          <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
        ))}
      </div>
    </AppFrame>
  );
}
