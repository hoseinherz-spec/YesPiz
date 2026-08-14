'use client';

import { Button, Card, Typography } from '@heroui/react';
import { ordersClient, paymentsClient, type PaymentMethod } from '@repo/api';
import { Banknote, CreditCard, Plus } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatPrice } from '@/constants/pizzas';
import { mapCustomerOrder, useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const METHODS = [
  { id: 'visa', icon: CreditCard, titleKey: 'payment.visa', detailKey: 'payment.visaDetail', api: 'card' as PaymentMethod },
  { id: 'cash', icon: Banknote, titleKey: 'payment.cash', detailKey: 'payment.cashDetail', api: 'cash' as PaymentMethod },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const {
    t,
    addOrder,
    accessToken,
    selectedAddressId,
    authed,
    refreshOrders,
  } = useApp();
  const { items, total, clear, menuVersion } = useCart();
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('visa');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);

    if (!authed || !accessToken) {
      setError(t('payment.needAuth'));
      router.push('/login/');
      return;
    }
    if (!selectedAddressId) {
      setError(t('payment.needAddress'));
      return;
    }
    if (items.length === 0) return;

    // Offline / static cart without API menu version → local demo order
    if (!menuVersion) {
      addOrder({
        id: 'o-' + Math.floor(1002 + Math.random() * 900),
        items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
        total,
        placedAt: Date.now(),
        status: 'active',
        stepIndex: 0,
        eta: 32,
      });
      clear();
      router.replace('/tracking/');
      return;
    }

    setBusy(true);
    try {
      const paymentMethod = METHODS.find((m) => m.id === method)?.api ?? 'card';
      const order = await ordersClient.create(
        {
          menuVersion,
          addressId: selectedAddressId,
          paymentMethod,
          lines: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        },
        { accessToken },
      );

      await paymentsClient.initiate(
        { orderId: order.id, method: paymentMethod },
        { accessToken },
      );

      addOrder(mapCustomerOrder(order));
      await refreshOrders().catch(() => undefined);
      clear();
      router.replace('/tracking/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppFrame className="!pb-28">
      <ScreenHeader
        title={t('payment.title')}
        subtitle={t('payment.subtitle')}
      />

      <div className="flex flex-col gap-2">
        {METHODS.map((m) => {
          const active = method === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                'flex items-center gap-3 rounded-[18px] border px-3 py-3.5 text-left bg-card',
                active ? 'border-accent' : 'border-border',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-accent',
                  active
                    ? 'bg-[color-mix(in_oklab,var(--accent)_15%,transparent)]'
                    : 'bg-surface',
                )}
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <Typography type="h6" className={hx.title}>
                  {t(m.titleKey)}
                </Typography>
                <Typography type="body-xs" className={hx.caption}>
                  {t(m.detailKey)}
                </Typography>
              </div>
              <span
                className={cn(
                  'h-5 w-5 rounded-full border-2',
                  active ? 'border-accent bg-accent' : 'border-border bg-transparent',
                )}
              />
            </button>
          );
        })}

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-[18px] border border-dashed border-border px-3 py-3.5 text-muted"
        >
          <Plus size={16} />
          <span className="text-[14px] font-semibold">{t('payment.addCard')}</span>
        </button>
      </div>

      {error ? (
        <Typography type="body-sm" className={cn(hx.bodySm, 'mt-3 text-danger')}>
          {error}
        </Typography>
      ) : null}

      <Card className={cn(hx.card, 'mt-5')}>
        <Card.Content className="p-0">
          <Typography type="h6" className={cn(hx.title, 'mb-3')}>
            {t('payment.summary')}
          </Typography>
          <div className="flex items-center justify-between">
            <Typography type="body" className={hx.body}>
              {t('common.total')}
            </Typography>
            <Typography type="h3" className={cn(hx.h3, 'text-accent')}>
              {formatPrice(total)}
            </Typography>
          </div>
        </Card.Content>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] border-t border-border bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <Button
          variant="primary"
          onPress={() => void pay()}
          isDisabled={items.length === 0 || busy}
          className={hx.btnPrimary}
        >
          {busy ? t('payment.processing') : t('payment.pay', { amount: formatPrice(total) })}
        </Button>
      </div>
    </AppFrame>
  );
}
