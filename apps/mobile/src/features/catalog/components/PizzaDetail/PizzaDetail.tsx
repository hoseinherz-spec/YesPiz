'use client';

import { Button, Chip, Typography, buttonVariants } from '@heroui/react';
import { ArrowLeft, Check, Clock, Heart, ShoppingBag, Truck } from '@repo/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { IconBadgeButton } from '@/components/IconBadgeButton';
import { Rating } from '@/components/Rating';
import { Stepper } from '@/components/Stepper';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import {
  pizzaDescription,
  pizzaIngredients,
  pizzaTagline,
} from '@/constants/i18n';
import {
  EXTRAS,
  formatPrice,
  resolveProductImage,
  SIZES,
} from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { priceFor, useCart } from '@/context/CartContext';
import { useMenuCatalog } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

import type { PizzaDetailProps } from './PizzaDetail.types';

export function PizzaDetail({ id }: PizzaDetailProps) {
  const router = useRouter();
  const { t, language, isFavorite, toggleFavorite } = useApp();
  const { addItem, count } = useCart();
  const { getById, menuVersion, fromApi } = useMenuCatalog();
  const pizza = getById(id);

  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const unit = useMemo(
    () => (pizza ? priceFor(pizza.price, size, extras) : 0),
    [pizza, size, extras],
  );
  const total = unit * qty;

  if (!pizza) {
    return (
      <AppFrame>
        <Typography type="h2" className={hx.h2}>
          {t('pizza.notFound')}
        </Typography>
        <div className="mt-6">
          <Link
            href="/menu/"
            className={cn(buttonVariants({ variant: 'primary', fullWidth: true }), hx.btnPrimary)}
          >
            {t('common.browseMenu')}
          </Link>
        </div>
      </AppFrame>
    );
  }

  const fav = isFavorite(pizza.id);
  const image = resolveProductImage(pizza);

  const toggleExtra = (extraId: string) => {
    setExtras((prev) =>
      prev.includes(extraId) ? prev.filter((x) => x !== extraId) : [...prev, extraId],
    );
  };

  const add = () => {
    addItem({
      menuItemId: pizza.id,
      menuVersion: fromApi ? menuVersion : 0,
      name: pizza.name,
      size,
      extras,
      quantity: qty,
      unitPrice: unit,
      image,
    });
    router.push('/cart/');
  };

  return (
    <AppFrame padded={false} className="!pb-28">
      <div className="relative h-[360px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={pizza.name} className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(8,17,31,0.25), rgba(8,17,31,0.85))',
          }}
        />
        <div className="absolute inset-x-0 top-[max(12px,env(safe-area-inset-top))] flex items-center justify-between px-4">
          <IconBadgeButton aria-label="Back" onPress={() => router.back()}>
            <ArrowLeft size={20} />
          </IconBadgeButton>
          <div className="flex gap-2">
            <IconBadgeButton
              aria-label="Favorite"
              onPress={() => toggleFavorite(pizza.id)}
              className={fav ? 'bg-[rgba(255,95,109,0.2)]' : undefined}
            >
              <Heart
                size={18}
                fill={fav ? 'var(--danger)' : 'transparent'}
                color={fav ? 'var(--danger)' : 'var(--foreground)'}
              />
            </IconBadgeButton>
            <IconBadgeButton href="/cart/" aria-label="Cart" badge={count}>
              <ShoppingBag size={18} />
            </IconBadgeButton>
          </div>
        </div>
      </div>

      <div className="-mt-8 flex-1 rounded-t-[30px] bg-background px-4 pt-5 pb-6">
        <PartnerBadge />
        <Typography type="h1" className={cn(hx.h1, 'mt-3')}>
          {pizza.name}
        </Typography>
        <Typography type="body" className={cn(hx.body, 'mt-1 text-text-secondary')}>
          {pizzaTagline(pizza, language)}
        </Typography>
        <Typography type="h3" className={cn(hx.h3, 'mt-2 text-accent')}>
          {formatPrice(pizza.price)}
        </Typography>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Rating value={pizza.rating} reviews={pizza.reviews} />
          <span className="inline-flex items-center gap-1 text-[12px] text-muted">
            <Clock size={13} /> {pizza.prepTime} {t('common.min')}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-success">
            <Truck size={13} /> {t('pizza.freeDelivery')}
          </span>
        </div>

        <Typography type="body" className={cn(hx.body, 'mt-4 text-text-secondary')}>
          {pizzaDescription(pizza, language)}
        </Typography>

        <Typography type="h6" className={cn(hx.title, 'mt-6 mb-2')}>
          {t('pizza.ingredients')}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {pizzaIngredients(pizza, language).map((ing) => (
            <Chip
              key={ing}
              variant="soft"
              className="rounded-full border border-border bg-transparent px-3 py-1.5"
            >
              <Chip.Label className="text-[12px] font-medium text-text-secondary">
                {ing}
              </Chip.Label>
            </Chip>
          ))}
        </div>

        <Typography type="h6" className={cn(hx.title, 'mt-6 mb-2')}>
          {t('pizza.chooseSize')}
        </Typography>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((s) => {
            const active = size === s.id;
            return (
              <Button
                key={s.id}
                variant={active ? 'primary' : 'secondary'}
                onPress={() => setSize(s.id)}
                className={cn(
                  'h-auto flex-col rounded-[18px] border px-2 py-3',
                  active
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-card text-foreground',
                )}
              >
                <span className="text-[14px] font-bold">{t(`size.${s.id}`)}</span>
                <span className="mt-0.5 text-[11px] opacity-70">
                  {s.delta === 0
                    ? t('pizza.base')
                    : s.delta > 0
                      ? `+€${s.delta}`
                      : `€${s.delta}`}
                </span>
              </Button>
            );
          })}
        </div>

        <Typography type="h6" className={cn(hx.title, 'mt-6 mb-2')}>
          {t('pizza.addExtras')}
        </Typography>
        <div className="flex flex-col gap-2">
          {EXTRAS.map((extra) => {
            const on = extras.includes(extra.id);
            return (
              <Button
                key={extra.id}
                variant="secondary"
                onPress={() => toggleExtra(extra.id)}
                className={cn(
                  'h-auto w-full justify-start gap-3 rounded-[18px] border px-3 py-3 text-left',
                  on ? 'border-accent bg-card' : 'border-border bg-card',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                    on
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-transparent text-accent-foreground',
                  )}
                >
                  {on ? <Check size={14} /> : null}
                </span>
                <span className="flex-1 text-[14px] font-semibold text-foreground">
                  {t(`extra.${extra.id}`)}
                </span>
                <span className="text-[13px] font-semibold text-accent">
                  +{formatPrice(extra.price)}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Typography type="h6" className={hx.title}>
            {t('pizza.quantity')}
          </Typography>
          <Stepper value={qty} onChange={setQty} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] items-center gap-3 border-t border-border bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div>
          <Typography type="body-xs" className={hx.caption}>
            {t('common.total')}
          </Typography>
          <Typography type="h3" className={hx.h3}>
            {formatPrice(total)}
          </Typography>
        </div>
        <div className="flex-1">
          <Button variant="primary" fullWidth className={hx.btnPrimary} onPress={add}>
            {t('pizza.addToCart')}
          </Button>
        </div>
      </div>
    </AppFrame>
  );
}
