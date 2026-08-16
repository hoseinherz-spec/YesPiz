'use client';

import { Button, Card, Separator, Typography } from '@heroui/react';
import { ShoppingBag, Trash2 } from '@repo/icons';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/EmptyState';
import { MobileActionBar } from '@/components/MobileActionBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stepper } from '@/components/Stepper';
import { formatPrice } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { PriceRow } from '@/features/cart/components/PriceRow';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { ProductImage } from '@/features/catalog/components/ProductImage/ProductImage';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function CartPage() {
  const router = useRouter();
  const { t } = useApp();
  const {
    items,
    count,
    subtotal,
    discount,
    total,
    promoApplied,
    applyPromo,
    updateQty,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <AppFrame>
        <ScreenHeader title={t('cart.title')} backHref="/home/" />
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actionLabel={t('common.browseMenu')}
          actionHref="/menu/"
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame padded={false} className="!pb-32">
      <div className="h-[max(38px,env(safe-area-inset-top))] bg-background" />
      <div className="min-h-[calc(100dvh-38px)] flex-1 rounded-t-[44px] bg-surface px-[clamp(20px,8vw,38px)] pt-4 pb-10 text-surface-foreground">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-surface-tertiary" />
        <ScreenHeader
          title={t('cart.title')}
          subtitle={`${count} ${count === 1 ? t('common.item') : t('common.items')}`}
          backHref="/home/"
        />

        <div className="mt-5 flex flex-col gap-3">
          {items.map((item) => (
            <Card
              key={item.lineId}
              className="rounded-[28px] border-0 bg-surface-secondary p-3 shadow-none"
            >
              <Card.Content className="p-0">
                <div className="flex gap-3">
                  <div className="size-[96px] shrink-0 overflow-hidden rounded-[22px] bg-card">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                      fallbackClassName="[&>svg]:size-12"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <Typography type="h6" className={cn(hx.title, 'truncate')}>
                          {item.name}
                        </Typography>
                        <Typography type="body-xs" className={cn(hx.caption, 'mt-1 line-clamp-2')}>
                          {t(`size.${item.size}`)}
                          {item.extras.length
                            ? ` · ${item.extras.map((extra) => t(`extra.${extra}`)).join(', ')}`
                            : ''}
                        </Typography>
                      </div>
                      <Button
                        isIconOnly
                        variant="ghost"
                        aria-label={`Remove ${item.name}`}
                        onPress={() => removeItem(item.lineId)}
                        className="size-8 min-w-8 rounded-full text-danger"
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Typography type="h6" className={hx.title}>
                        {formatPrice(item.unitPrice * item.quantity)}
                      </Typography>
                      <Stepper
                        value={item.quantity}
                        onChange={(next) => updateQty(item.lineId, next - item.quantity)}
                      />
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <PartnerBadge />
        </div>

        <Button
          variant="secondary"
          fullWidth
          onPress={applyPromo}
          isDisabled={promoApplied}
          className={cn(
            'mt-5 h-16 justify-between rounded-full border-0 px-5 text-left shadow-none',
            promoApplied ? 'bg-[color-mix(in_oklab,var(--success)_12%,var(--surface-secondary))]' : 'bg-surface-secondary',
          )}
        >
          <span>
            <span className={cn('block text-[14px] font-semibold', promoApplied ? 'text-success' : 'text-muted')}>
              {promoApplied ? t('cart.promoApplied') : t('cart.promoApply')}
            </span>
            {promoApplied ? (
              <span className="block text-[10px] font-semibold text-success">
                WELCOME30 · {t('cart.discountLabel')}
              </span>
            ) : null}
          </span>
          <span className="rounded-full bg-accent px-5 py-2 text-[14px] font-bold text-accent-foreground">
            {promoApplied ? 'Added' : 'Apply'}
          </span>
        </Button>

        <Card className="mt-5 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
          <Card.Content className="p-0">
            <PriceRow label={t('common.subtotal')} value={formatPrice(subtotal)} />
            {discount > 0 ? (
              <PriceRow
                label={t('common.discount')}
                value={`−${formatPrice(discount)}`}
                accent
              />
            ) : null}
            <PriceRow label={t('common.delivery')} value={t('common.free')} success />
            <Separator className="my-4 bg-border" />
            <PriceRow label={t('common.total')} value={formatPrice(total)} bold />
          </Card.Content>
        </Card>
      </div>

      <MobileActionBar
        onPress={() => router.push('/checkout/')}
        icon={<ShoppingBag size={20} />}
        label={
          <span className="flex items-center justify-center gap-2">
            <span>{t('cart.checkout')}</span>
            <span className="text-[13px] font-semibold text-muted">{formatPrice(total)}</span>
          </span>
        }
      />
    </AppFrame>
  );
}
