'use client';

import { Button, Card, Typography } from '@heroui/react';
import { ShoppingBag } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { EmptyState } from '@/components/EmptyState';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { formatPrice } from '@/constants/pizzas';
import { ORDER_STEPS, useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function OrdersPage() {
  const router = useRouter();
  const { t, orders, accessToken, refreshOrders, setActiveOrderId } = useApp();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (!accessToken) return;
    void refreshOrders().catch(() => undefined);
  }, [accessToken, refreshOrders]);

  const list = useMemo(() => {
    if (tab === 'active') return orders.filter((o) => o.status === 'active');
    return orders.filter((o) => o.status !== 'active');
  }, [orders, tab]);

  return (
    <AppFrame withTabs>
      <Typography type="h2" className={hx.h2}>
        {t('orders.title')}
      </Typography>

      <div className="mt-4 inline-flex rounded-full border border-border bg-card p-1">
        {(['active', 'history'] as const).map((key) => (
          <Button
            key={key}
            variant={tab === key ? 'primary' : 'secondary'}
            className={cn(hx.filterChip(tab === key), '!border-0')}
            onPress={() => setTab(key)}
          >
            {t(`orders.${key}`)}
          </Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title={tab === 'active' ? t('orders.noActive') : t('orders.noPast')}
          body={t('orders.emptyBody')}
          actionLabel={t('common.browseMenu')}
          actionHref="/menu/"
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3 pb-4">
          {list.map((order) => {
            const statusClass =
              order.status === 'cancelled'
                ? 'bg-[color-mix(in_oklab,var(--danger)_13%,transparent)] text-danger'
                : order.status === 'completed'
                  ? 'bg-[color-mix(in_oklab,var(--success)_13%,transparent)] text-success'
                  : 'bg-[color-mix(in_oklab,var(--warning)_13%,transparent)] text-warning';
            const statusLabel =
              order.status === 'cancelled'
                ? t('orders.cancelled')
                : order.status === 'completed'
                  ? t('orders.delivered')
                  : t(`step.${ORDER_STEPS[order.stepIndex]?.key ?? 'received'}.label`);

            const shortId =
              order.id.length > 8 ? order.id.slice(-6) : order.id.replace(/^o-/, '');

            const track = () => {
              setActiveOrderId(order.id);
              router.push('/tracking/');
            };

            return (
              <Card key={order.id} className={cn(hx.card, 'relative')}>
                {order.status === 'active' ? (
                  <Button
                    variant="ghost"
                    aria-label={t('orders.track')}
                    onPress={track}
                    className="absolute inset-0 z-0 h-full w-full rounded-[24px] bg-transparent p-0 shadow-none"
                  />
                ) : null}
                <Card.Content className="relative z-[1] p-0">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <Typography type="h6" className={hx.title}>
                        {t('orders.orderNum', { id: shortId })}
                      </Typography>
                      <Typography type="body-xs" className={cn(hx.caption, 'mt-0.5')}>
                        {new Date(order.placedAt).toLocaleDateString()}
                      </Typography>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        statusClass,
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <Typography type="body-sm" className={hx.bodySm}>
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                  </Typography>
                  <div className="mt-3">
                    <PartnerBadge compact />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Typography type="h6" className={cn(hx.title, 'text-accent')}>
                      {formatPrice(order.total)}
                    </Typography>
                    {order.status === 'active' ? (
                      <div className="relative z-[2] w-32">
                        <Button
                          variant="primary"
                          onPress={track}
                          className={cn(hx.btnPrimary, '!h-10 !text-[12px]')}
                        >
                          {t('orders.track')}
                        </Button>
                      </div>
                    ) : (
                      <div className="relative z-[2] w-32">
                        <Button
                          variant="secondary"
                          onPress={() => router.push('/menu/')}
                          className={cn(hx.btnSecondary, '!h-10 !text-[12px]')}
                        >
                          {t('orders.reorder')}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </AppFrame>
  );
}
