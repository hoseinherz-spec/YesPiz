'use client';

import { Button, Typography } from '@heroui/react';
import {
  Bookmark,
  MapPin,
  MenuCenter,
  Search,
  ShoppingBag,
  User,
} from '@repo/icons';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { IconBadgeButton } from '@/components/IconBadgeButton';
import { formatPrice } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { ProductImage } from '@/features/catalog/components/ProductImage/ProductImage';
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
  const { t } = useApp();
  const { count, items: cartItems, total } = useCart();
  const { items, fromApi, isOffline, isLoading } = useMenuCatalog();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All');

  const list = useMemo(
    () => filterByCategory(items, cat, fromApi),
    [items, cat, fromApi],
  );
  const featured = list[0] ?? items[0] ?? null;

  return (
    <AppFrame withTabs className={count > 0 ? '!pb-52' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <IconBadgeButton href="/menu/" aria-label="Browse menu">
          <MenuCenter size={20} />
        </IconBadgeButton>
        <div className="flex items-center gap-2">
          <IconBadgeButton href="/saved/" aria-label="Saved pizzas">
            <Bookmark size={19} />
          </IconBadgeButton>
          <IconBadgeButton href="/profile/" aria-label="Profile">
            <User size={19} />
          </IconBadgeButton>
          <IconBadgeButton href="/cart/" aria-label="Cart" badge={count}>
            <ShoppingBag size={19} />
          </IconBadgeButton>
        </div>
      </div>

      <div className="mt-8">
        <span className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
          <MapPin size={14} color="var(--accent)" />
          {t('home.deliverTo')}
        </span>
        <Typography type="h1" className={cn(hx.display, 'max-w-[360px] text-[clamp(36px,11vw,50px)]')}>
          Order Your
          <br />
          Favorite Pizza
        </Typography>
      </div>

      {isOffline ? (
        <div className="mt-4 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, 'text-warning')}>
            {t('login.offlineBanner')}
          </Typography>
        </div>
      ) : null}

      <Link
        href="/menu/"
        className="mt-6 flex min-h-16 items-center gap-3 rounded-full bg-field-background px-2.5 py-2"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-tertiary">
          <Search size={19} color="var(--foreground)" />
        </span>
        <span className="flex-1 text-[14px] font-medium text-muted">{t('home.search')}</span>
        <span className="pr-3 text-[12px] font-semibold text-foreground">Browse</span>
      </Link>

      <div className="-mx-[clamp(20px,8vw,38px)] mt-6 flex gap-2 overflow-x-auto px-[clamp(20px,8vw,38px)] pb-1">
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

      {featured ? (
        <Link
          href={`/pizza/?id=${encodeURIComponent(featured.id)}`}
          className="relative mt-6 block overflow-hidden rounded-[44px] bg-card transition active:scale-[0.99]"
        >
          <div className="absolute top-5 left-5 z-10 rounded-full bg-accent px-4 py-2 text-[12px] font-bold text-accent-foreground">
            {cat === 'All' ? 'Featured pizza' : cat}
          </div>
          <div className="h-[clamp(245px,72vw,330px)]">
            <ProductImage
              src={featured.imageUrl || featured.image}
              alt={featured.name}
              className="h-full w-full object-contain p-4 pt-10"
            />
          </div>
          <div className="flex items-end justify-between gap-3 px-6 pb-6">
            <div className="min-w-0">
              <Typography type="h2" className={cn(hx.h2, 'truncate')}>
                {featured.name}
              </Typography>
              <Typography type="body-sm" className={cn(hx.bodySm, 'mt-1')}>
                {list.length || items.length} pizzas to explore
              </Typography>
            </div>
            <span className="shrink-0 rounded-full bg-accent px-4 py-2 text-[14px] font-extrabold text-accent-foreground">
              {formatPrice(featured.price)}
            </span>
          </div>
        </Link>
      ) : isLoading ? (
        <div className="mt-6 h-[390px] animate-pulse rounded-[44px] bg-card" aria-label="Loading pizzas" />
      ) : (
        <div className="mt-6 rounded-[30px] border border-border p-6 text-center">
          <Typography type="h3" className={hx.h3}>
            No pizzas available
          </Typography>
          <Link
            href="/menu/"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-[14px] font-bold text-accent-foreground"
          >
            Try the menu
          </Link>
        </div>
      )}

      {list.length > 1 ? (
        <section className="mt-8 pb-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Typography type="h3" className={hx.h3}>
              Popular pizzas
            </Typography>
            <Link href="/menu/" className="text-[13px] font-semibold text-muted">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {list.slice(1, 5).map((pizza) => (
              <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
            ))}
          </div>
        </section>
      ) : null}

      {count > 0 ? (
        <Link
          href="/cart/"
          className="fixed inset-x-3 bottom-[104px] z-50 mx-auto flex max-w-[449px] items-center gap-3 rounded-full bg-accent p-2.5 pr-5 text-accent-foreground shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
          aria-label={`Open cart with ${count} items`}
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent-foreground text-[17px] font-extrabold text-accent">
            {count}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-extrabold leading-tight">View cart</span>
            <span className="block text-[12px] opacity-60">
              {count} {count === 1 ? 'item' : 'items'} · {formatPrice(total)}
            </span>
          </span>
          <span className="flex -space-x-3">
            {cartItems.slice(0, 3).map((item) => (
              <span
                key={item.lineId}
                className="size-10 overflow-hidden rounded-full border-2 border-accent bg-surface"
              >
                <ProductImage
                  src={item.image}
                  alt=""
                  className="h-full w-full object-contain"
                  fallbackClassName="[&>svg]:size-5"
                />
              </span>
            ))}
          </span>
        </Link>
      ) : null}
    </AppFrame>
  );
}
