'use client';

import { Button, Card, Separator, Typography } from '@heroui/react';
import { ordersClient, paymentsClient, type PaymentMethod } from '@repo/api';
import { Banknote, CreditCard, ShoppingBag } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { MobileActionBar } from '@/components/MobileActionBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StripePaymentSheet } from '@/components/StripePaymentSheet';
import { formatPrice } from '@/constants/pizzas';
import { mapCustomerOrder, useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { cashBlockedReason } from '@/lib/cash-policy';
import {
  clearCheckoutPrefs,
  readCheckoutPrefs,
  readPaymentMethod,
  scheduledAtFromChoice,
} from '@/lib/checkout-storage';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const METHODS = [
  { id: 'card', icon: CreditCard, titleKey: 'payment.card', detailKey: 'payment.cardDetail', api: 'card' as PaymentMethod },
  { id: 'cash', icon: Banknote, titleKey: 'payment.cash', detailKey: 'payment.cashDetail', api: 'cash' as PaymentMethod },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const { t, addOrder, accessToken, selectedAddressId, authed, refreshOrders, setActiveOrderId } = useApp();
  const { items, subtotal, discount, total, clear, menuVersion } = useCart();
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>(() =>
    typeof window === 'undefined' ? 'card' : readPaymentMethod(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashAvail, setCashAvail] = useState<Awaited<
    ReturnType<typeof paymentsClient.cashAvailability>
  > | null>(null);
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void paymentsClient
      .cashAvailability({ accessToken })
      .then((avail) => {
        if (!cancelled) setCashAvail(avail);
      })
      .catch(() => {
        if (!cancelled) setCashAvail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, total]);

  const cashReason = useMemo(() => {
    if (!accessToken || !cashAvail) return null;
    return cashBlockedReason(cashAvail, Math.round(total * 100));
  }, [accessToken, cashAvail, total]);

  const cashDisabled = cashReason != null;
  const selectedMethod = cashDisabled && method === 'cash' ? 'card' : method;

  const cashReasonLabel = useMemo(() => {
    if (cashReason === 'over_cap') return t('payment.cashOverCap');
    if (cashReason === 'banned') return t('payment.cashUnavailable');
    return null;
  }, [cashReason, t]);

  const finishOrder = async (orderId: string) => {
    await refreshOrders().catch(() => undefined);
    setActiveOrderId(orderId);
    clear();
    clearCheckoutPrefs();
    router.replace('/order-success/');
  };

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
      setError(t('payment.menuUnavailable'));
      return;
    }

    setBusy(true);
    try {
      const checkout = readCheckoutPrefs();
      const paymentMethod = METHODS.find((item) => item.id === selectedMethod)?.api ?? 'card';

      if (paymentMethod === 'cash') {
        const avail = await paymentsClient.cashAvailability({ accessToken });
        const blocked = cashBlockedReason(avail, Math.round(total * 100));
        if (blocked) {
          setError(blocked === 'over_cap' ? t('payment.cashOverCap') : t('payment.cashUnavailable'));
          return;
        }
      }

      const order = await ordersClient.create(
        {
          menuVersion,
          addressId: selectedAddressId,
          paymentMethod,
          lines: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
          leaveAtDoor: checkout.leaveAtDoor,
          scheduledAt: scheduledAtFromChoice(checkout.schedule),
          deliveryEntrance: checkout.deliveryEntrance,
          deliveryFloor: checkout.deliveryFloor,
          deliveryUnit: checkout.deliveryUnit,
          deliveryDoorCode: checkout.deliveryDoorCode,
          deliveryInstructions: checkout.deliveryInstructions,
        },
        { accessToken },
      );

      const result = await paymentsClient.initiate(
        { orderId: order.id, method: paymentMethod },
        { accessToken },
      );

      addOrder(mapCustomerOrder(order));
      setPendingOrderId(order.id);

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (result.clientSecret && publishableKey && paymentMethod === 'card') {
        setStripeSecret(result.clientSecret);
        return;
      }

      await finishOrder(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.error'));
    } finally {
      setBusy(false);
    }
  };

  const onStripeSuccess = async () => {
    if (!pendingOrderId) return;
    setBusy(true);
    try {
      await finishOrder(pendingOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('payment.error'));
    } finally {
      setBusy(false);
      setStripeSecret(null);
    }
  };

  return (
    <AppFrame className="!pb-36">
      <ScreenHeader title={t('payment.title')} subtitle={t('payment.subtitle')} backHref="/checkout/" />

      {stripeSecret ? (
        <StripePaymentSheet
          clientSecret={stripeSecret}
          amountLabel={formatPrice(total)}
          processingLabel={t('payment.processing')}
          payLabel={t('payment.pay', { amount: '{amount}' })}
          cancelLabel={t('payment.cancelStripe')}
          errorFallback={t('payment.error')}
          onCancel={() => {
            setStripeSecret(null);
            setError(t('payment.stripeCancelled'));
          }}
          onSuccess={onStripeSuccess}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {METHODS.map((item) => {
            const active = selectedMethod === item.id;
            const Icon = item.icon;
            const disabled = item.id === 'cash' && cashDisabled;
            return (
              <Button
                key={item.id}
                variant="secondary"
                isDisabled={disabled}
                onPress={() => setMethod(item.id)}
                className={cn(
                  'h-auto min-h-[82px] w-full justify-start gap-3 rounded-[24px] border px-3 py-3 text-left shadow-none',
                  active ? 'border-foreground bg-surface-secondary' : 'border-border bg-card',
                  disabled && 'opacity-50',
                )}
              >
                <span className="flex size-13 shrink-0 items-center justify-center rounded-[17px] bg-card text-foreground">
                  <Icon size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold text-foreground">{t(item.titleKey)}</span>
                  <span className="block text-[12px] font-medium text-muted">{t(item.detailKey)}</span>
                  {item.id === 'cash' && cashReasonLabel ? (
                    <span className="mt-1 block text-[11px] font-semibold text-warning">{cashReasonLabel}</span>
                  ) : null}
                </span>
                <span className={cn('size-6 shrink-0 rounded-full border-2 p-1', active ? 'border-foreground' : 'border-border')}>
                  <span className={cn('block size-full rounded-full', active && 'bg-foreground')} />
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {!stripeSecret ? (
        <Typography type="body-xs" className={cn(hx.caption, 'mt-3')}>
          {t('payment.stripeDisclosure')}
        </Typography>
      ) : null}

      {error ? (
        <div role="alert" className="mt-4 rounded-[20px] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-4 py-3">
          <Typography type="body-sm" className="text-danger">{error}</Typography>
        </div>
      ) : null}

      {!stripeSecret ? (
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
      ) : null}

      {!stripeSecret ? (
        <MobileActionBar
          onPress={() => void pay()}
          icon={<ShoppingBag size={20} />}
          isDisabled={items.length === 0 || busy}
          isPending={busy}
          label={busy ? t('payment.processing') : t('payment.pay', { amount: formatPrice(total) })}
        />
      ) : null}
    </AppFrame>
  );
}
