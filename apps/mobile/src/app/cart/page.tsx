'use client';

import { Button, Card, Separator, Typography } from '@heroui/react';
import { ShoppingBag, Trash2 } from '@repo/icons';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stepper } from '@/components/Stepper';
import { formatPrice } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { PriceRow } from '@/features/cart/components/PriceRow';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
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

  return (
    <AppFrame>
      <ScreenHeader
        title={t('cart.title')}
        subtitle={
          count
            ? `${count} ${count === 1 ? t('common.item') : t('common.items')}`
            : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title={t('cart.empty')}
          body={t('cart.emptyBody')}
          actionLabel={t('common.browseMenu')}
          actionHref="/menu/"
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.lineId} className={cn(hx.card, '!p-3')}>
                <Card.Content className="p-0">
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-[16px] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Typography type="h6" className={hx.title}>
                          {item.name}
                        </Typography>
                        <Button
                          isIconOnly
                          variant="ghost"
                          aria-label="Remove"
                          onPress={() => removeItem(item.lineId)}
                          className="h-8 w-8 min-w-8 text-danger"
                        >
                          <Trash2 size={16} color="var(--danger)" />
                        </Button>
                      </div>
                      <Typography type="body-xs" className={cn(hx.caption, 'mt-0.5')}>
                        {t(`size.${item.size}`)}
                        {item.extras.length
                          ? ` · ${item.extras.map((e) => t(`extra.${e}`)).join(', ')}`
                          : ''}
                      </Typography>
                      <div className="mt-3 flex items-center justify-between">
                        <Typography type="h6" className={cn(hx.title, 'text-accent')}>
                          {formatPrice(item.unitPrice * item.quantity)}
                        </Typography>
                        <Stepper
                          value={item.quantity}
                          onChange={(next) =>
                            updateQty(item.lineId, next - item.quantity)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <PartnerBadge />
          </div>

          <Button
            variant="secondary"
            fullWidth
            onPress={applyPromo}
            isDisabled={promoApplied}
            className={cn(
              'mt-4 h-auto justify-start rounded-[18px] border border-dashed px-4 py-3.5 text-left',
              promoApplied
                ? 'border-success bg-[rgba(46,234,123,0.08)]'
                : 'border-border bg-card',
            )}
          >
            <div>
              <Typography
                type="h6"
                className={cn(hx.title, promoApplied && 'text-success')}
              >
                {promoApplied ? t('cart.promoApplied') : t('cart.promoApply')}
              </Typography>
              {promoApplied ? (
                <Typography type="body-xs" className={cn(hx.caption, 'mt-0.5 text-success')}>
                  WELCOME30 · {t('cart.discountLabel')}
                </Typography>
              ) : null}
            </div>
          </Button>

          <Card className={cn(hx.card, 'mt-4')}>
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
              <Separator className="my-3 bg-border" />
              <PriceRow label={t('common.total')} value={formatPrice(total)} bold />
            </Card.Content>
          </Card>

          <div className="mt-5 pb-6">
            <Button
              variant="primary"
              fullWidth
              className={hx.btnPrimary}
              onPress={() => router.push('/checkout/')}
            >
              {t('cart.checkout')}
            </Button>
          </div>
        </>
      )}
    </AppFrame>
  );
}
