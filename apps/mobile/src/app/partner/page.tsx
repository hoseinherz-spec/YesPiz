'use client';
import { AppText } from "@/components/Text";


import { Button, Card, Typography } from '@heroui/react';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const INCOMING = [
  { id: '1', items: '2× Margherita · 1× Diavola', ago: 'justNow', total: '€34.20' },
  { id: '2', items: '1× YesPiz Special', ago: 'oneMinAgo', total: '€15.90' },
];

const PREPARING = [
  { id: '3', items: '1× Pepperoni · 1× Funghi', left: 8 },
  { id: '4', items: '2× BBQ Chicken', left: 14 },
];

export default function PartnerPage() {
  const { t } = useApp();
  const [tab, setTab] = useState<'incoming' | 'preparing'>('incoming');

  const stats = [
    { label: t('partner.stat.orders'), value: '48' },
    { label: t('partner.stat.revenue'), value: '€642' },
    { label: t('partner.stat.prep'), value: '17m' },
    { label: t('partner.stat.acceptance'), value: '96%' },
  ];

  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title={t('partner.title')} subtitle={t('partner.subtitle')} />

      <div className="mb-4">
        <PartnerBadge />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <Card key={s.label} className={cn(hx.card, '!p-3')}>
            <Typography type="h2" className={cn(hx.h2, 'text-accent')}>
              {s.value}
            </Typography>
            <Typography type="body-xs" className={cn(hx.caption, 'mt-1')}>
              {s.label}
            </Typography>
          </Card>
        ))}
      </div>

      <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1">
        <Button
          variant="ghost"
          onPress={() => setTab('incoming')}
          className={hx.filterChip(tab === 'incoming')}
        >
          {t('partner.incoming')}
        </Button>
        <Button
          variant="ghost"
          onPress={() => setTab('preparing')}
          className={hx.filterChip(tab === 'preparing')}
        >
          {t('partner.preparing')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        {tab === 'incoming'
          ? INCOMING.map((order) => (
              <Card key={order.id} className={hx.card}>
                <div className="mb-1 flex items-center justify-between">
                  <Typography type="h6" className={hx.title}>
                    {t('partner.orderNum', { id: order.id })}
                  </Typography>
                  <Typography type="body-xs" className={hx.caption}>
                    {t(`partner.${order.ago}`)}
                  </Typography>
                </div>
                <Typography type="body-sm" className="text-[13px] text-text-secondary">
                  {order.items}
                </Typography>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Typography type="h6" className={cn(hx.title, 'text-accent')}>
                    {order.total}
                  </Typography>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className={cn(hx.btnSecondary, 'h-10 w-24 !text-[12px]')}
                    >
                      ✕
                    </Button>
                    <Button
                      variant="primary"
                      className={cn(hx.btnPrimary, 'h-10 w-28 !text-[12px]')}
                    >
                      {t('partner.accept', { total: order.total })}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          : PREPARING.map((order) => (
              <Card key={order.id} className={hx.card}>
                <div className="mb-1 flex items-center justify-between">
                  <Typography type="h6" className={hx.title}>
                    {t('partner.orderNum', { id: order.id })}
                  </Typography>
                  <AppText as="span" className="rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-2.5 py-1 text-[11px] font-bold text-accent">
                    {t('partner.minLeft', { n: order.left })}
                  </AppText>
                </div>
                <Typography type="body-sm" className="text-[13px] text-text-secondary">
                  {order.items}
                </Typography>
              </Card>
            ))}
      </div>
    </AppFrame>
  );
}
