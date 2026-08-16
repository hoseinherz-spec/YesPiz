'use client';

import { Button, Card, Separator, Typography } from '@heroui/react';
import { ordersClient, paymentsClient, type PaymentMethod } from '@repo/api';
import { Banknote, CreditCard, Plus, ShoppingBag } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { MobileActionBar } from '@/components/MobileActionBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatPrice } from '@/constants/pizzas';
import { mapCustomerOrder, useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

type DemoCard = { holder: string; last4: string };

const METHODS = [
  { id: 'card', icon: CreditCard, titleKey: 'payment.visa', detailKey: 'payment.visaDetail', api: 'card' as PaymentMethod },
  { id: 'cash', icon: Banknote, titleKey: 'payment.cash', detailKey: 'payment.cashDetail', api: 'cash' as PaymentMethod },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const { t, addOrder, accessToken, selectedAddressId, authed, refreshOrders } = useApp();
  const { items, subtotal, discount, total, clear, menuVersion } = useCart();
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('card');
  const [demoCard, setDemoCard] = useState<DemoCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedMethod = sessionStorage.getItem('yespizz_payment_method');
        if (storedMethod === 'card' || storedMethod === 'cash') setMethod(storedMethod);
        const storedCard = sessionStorage.getItem('yespizz_demo_card');
        if (storedCard) setDemoCard(JSON.parse(storedCard) as DemoCard);
      } catch {
        // Keep the safe default if local browser storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    if (items.length === 0) {
      setError(t('payment.emptyCart'));
      return;
    }

    if (!menuVersion) {
      addOrder({
        id: `o-${Math.floor(1002 + Math.random() * 900)}`,
        items: items.map((item) => ({ name: item.name, quantity: item.quantity })),
        total,
        placedAt: Date.now(),
        status: 'active',
        stepIndex: 0,
        eta: 32,
      });
      clear();
      router.replace('/order-success/');
      return;
    }

    setBusy(true);
    try {
      const paymentMethod = METHODS.find((item) => item.id === method)?.api ?? 'card';
      const order = await ordersClient.create(
        {
          menuVersion,
          addressId: selectedAddressId,
          paymentMethod,
          lines: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        },
        { accessToken },
      );
      await paymentsClient.initiate({ orderId: order.id, method: paymentMethod }, { accessToken });
      addOrder(mapCustomerOrder(order));
      await refreshOrders().catch(() => undefined);
      clear();
      router.replace('/order-success/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppFrame className="!pb-36">
      <ScreenHeader title={t('payment.title')} subtitle={t('payment.subtitle')} backHref="/checkout/" />

      <div className="flex flex-col gap-2.5">
        {METHODS.map((item) => {
          const active = method === item.id;
          const Icon = item.icon;
          const title = item.id === 'card' && demoCard ? demoCard.holder : t(item.titleKey);
          const detail = item.id === 'card' && demoCard ? `•••• ${demoCard.last4}` : t(item.detailKey);
          return (
            <Button
              key={item.id}
              variant="secondary"
              onPress={() => setMethod(item.id)}
              className={cn(
                'h-auto min-h-[82px] w-full justify-start gap-3 rounded-[24px] border px-3 py-3 text-left shadow-none',
                active ? 'border-foreground bg-surface-secondary' : 'border-border bg-card',
              )}
            >
              <span className="flex size-13 shrink-0 items-center justify-center rounded-[17px] bg-card text-foreground">
                <Icon size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold text-foreground">{title}</span>
                <span className="block text-[12px] font-medium text-muted">{detail}</span>
                {item.id === 'card' && demoCard ? (
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-warning">
                    {t('payment.demoCardBadge')}
                  </span>
                ) : null}
              </span>
              <span className={cn('size-6 shrink-0 rounded-full border-2 p-1', active ? 'border-foreground' : 'border-border')}>
                <span className={cn('block size-full rounded-full', active && 'bg-foreground')} />
              </span>
            </Button>
          );
        })}

        <Button
          variant="secondary"
          onPress={() => router.push('/payment/new/')}
          className="h-14 w-full rounded-[24px] border border-dashed border-border bg-transparent text-[14px] font-semibold text-muted shadow-none"
        >
          <Plus size={17} />
          {t('payment.addCard')}
        </Button>
      </div>

      <Typography type="body-xs" className={cn(hx.caption, 'mt-3')}>
        {t('payment.demoDisclosure')}
      </Typography>

      {error ? (
        <div role="alert" className="mt-4 rounded-[20px] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-4 py-3">
          <Typography type="body-sm" className="text-danger">{error}</Typography>
        </div>
      ) : null}

      <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
        <Card.Content className="p-0">
          <Typography type="h3" className={cn(hx.h3, 'mb-4')}>{t('payment.summary')}</Typography>
          <div className="flex items-center justify-between text-[14px] text-muted">
            <span>{t('common.subtotal')}</span><span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="mt-3 flex items-center justify-between text-[14px] text-success">
              <span>{t('common.discount')}</span><span>−{formatPrice(discount)}</span>
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-between text-[14px] text-muted">
            <span>{t('common.delivery')}</span><span className="text-success">{t('common.free')}</span>
          </div>
          <Separator className="my-4 bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold text-muted">{t('common.total')}</span>
            <span className="text-[23px] font-bold text-foreground">{formatPrice(total)}</span>
          </div>
        </Card.Content>
      </Card>

      <MobileActionBar
        onPress={() => void pay()}
        icon={<ShoppingBag size={20} />}
        isDisabled={items.length === 0 || busy}
        isPending={busy}
        label={busy ? t('payment.processing') : t('payment.pay', { amount: formatPrice(total) })}
      />
    </AppFrame>
  );
}
