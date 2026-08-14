'use client';

import { Button, Card, Typography, buttonVariants } from '@heroui/react';
import { ordersClient, type CourierLocationView } from '@repo/api';
import { ArrowRight, Check, Circle, Loader2, Phone, Truck } from '@repo/icons';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { mapCustomerOrder, ORDER_STEPS, useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function TrackingPage() {
  const {
    t,
    orders,
    activeOrderId,
    advanceActiveOrder,
    accessToken,
    addOrder,
  } = useApp();

  const [courierLoc, setCourierLoc] = useState<CourierLocationView | null>(null);

  const order = useMemo(() => {
    if (activeOrderId) return orders.find((o) => o.id === activeOrderId);
    return orders.find((o) => o.status === 'active');
  }, [orders, activeOrderId]);

  const orderId = order?.id;
  const orderStatus = order?.status;
  const orderStep = order?.stepIndex;

  // API orders: poll customerStatus every ~3s (primary; socket is server-ready)
  useEffect(() => {
    if (!accessToken || !orderId || orderStatus !== 'active') return;
    if ((orderStep ?? 0) >= ORDER_STEPS.length - 1) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const view = await ordersClient.get(orderId, { accessToken });
        if (cancelled) return;
        addOrder(mapCustomerOrder(view));
      } catch {
        // keep last known state
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, orderId, orderStatus, orderStep, addOrder]);

  // Blind courier coords when driver step is active
  useEffect(() => {
    if (!accessToken || !orderId) return;
    if ((orderStep ?? 0) < 3) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const loc = await ordersClient.getCourierLocation(orderId, {
          accessToken,
        });
        if (!cancelled) setCourierLoc(loc);
      } catch {
        // ignore
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, orderId, orderStep]);

  // Local demo fallback when not authenticated
  useEffect(() => {
    if (accessToken) return;
    if (!order || order.status !== 'active') return;
    if (order.stepIndex >= ORDER_STEPS.length - 1) return;
    const timer = setInterval(() => advanceActiveOrder(), 3500);
    return () => clearInterval(timer);
  }, [accessToken, order, advanceActiveOrder]);

  if (!order) {
    return (
      <AppFrame>
        <ScreenHeader title={t('tracking.title')} />
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <Typography type="h3" className={hx.h3}>
            {t('tracking.noActive')}
          </Typography>
          <div className="mt-6 w-full max-w-xs">
            <Link
              href="/orders/"
              className={cn(buttonVariants({ variant: 'primary', fullWidth: true }), hx.btnPrimary)}
            >
              <span>{t('tracking.viewOrders')}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </AppFrame>
    );
  }

  const delivered = order.stepIndex >= ORDER_STEPS.length - 1;
  const progress = ((order.stepIndex + 1) / ORDER_STEPS.length) * 100;
  const showDriver = order.stepIndex >= 3 && !delivered;

  return (
    <AppFrame>
      <ScreenHeader title={t('tracking.title')} />

      <Card
        className={cn(
          hx.cardElevated,
          'overflow-hidden border-accent bg-gradient-to-br from-accent to-[#b8d900]',
        )}
      >
        <Typography type="body-xs" className="text-[12px] font-medium text-accent-foreground opacity-70">
          {delivered ? t('step.delivered.label') : t('tracking.onWayToYou')}
        </Typography>
        <Typography type="h1" className={cn(hx.display, 'mt-1 text-accent-foreground')}>
          {delivered ? (
            <Check size={40} color="var(--accent-foreground)" />
          ) : (
            <>
              {order.eta}
              <span className="ml-1 text-[20px] font-bold">
                {t('tracking.minSuffix')}
              </span>
            </>
          )}
        </Typography>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--accent-foreground)_20%,transparent)]">
          <div
            className="h-full rounded-full bg-accent-foreground transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {showDriver ? (
        <Card className={cn(hx.card, 'mt-4')}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent">
              <Truck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <Typography type="h6" className={hx.title}>
                {t('partner.driver')}
              </Typography>
              <Typography type="body-xs" className={hx.caption}>
                {t(`step.${ORDER_STEPS[order.stepIndex].key}.hint`)}
              </Typography>
              {courierLoc?.latitude != null && courierLoc?.longitude != null ? (
                <Typography type="body-xs" className={cn(hx.caption, 'mt-1')}>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${courierLoc.latitude}&mlon=${courierLoc.longitude}#map=15/${courierLoc.latitude}/${courierLoc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {courierLoc.latitude.toFixed(4)}, {courierLoc.longitude.toFixed(4)}
                  </a>
                </Typography>
              ) : null}
            </div>
            <Button
              isIconOnly
              variant="primary"
              aria-label="Call"
              className="h-11 w-11 min-w-11 rounded-full bg-accent text-accent-foreground"
            >
              <Phone size={18} />
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col gap-0">
        {ORDER_STEPS.map((step, i) => {
          const done = i < order.stepIndex;
          const current = i === order.stepIndex;
          const upcoming = i > order.stepIndex;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    done || current
                      ? 'bg-accent text-accent-foreground'
                      : 'border border-border bg-card text-muted',
                  )}
                >
                  {done ? (
                    <Check size={16} />
                  ) : current && !delivered ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Circle size={12} />
                  )}
                </span>
                {i < ORDER_STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'my-1 min-h-6 w-0.5 flex-1',
                      done ? 'bg-accent' : 'bg-border',
                    )}
                  />
                ) : null}
              </div>
              <div className="pb-5 pt-1">
                <Typography
                  type="h6"
                  className={cn(hx.title, upcoming && 'text-muted')}
                >
                  {t(`step.${step.key}.label`)}
                </Typography>
                <Typography type="body-xs" className={hx.caption}>
                  {t(`step.${step.key}.hint`)}
                </Typography>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pb-6">
        <Link
          href={delivered ? '/home/' : '/orders/'}
          className={cn(buttonVariants({ variant: 'primary', fullWidth: true }), hx.btnPrimary)}
        >
          <span>{delivered ? t('common.backToHome') : t('tracking.viewOrders')}</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </AppFrame>
  );
}
