'use client';

import { Button, Switch, Typography } from '@heroui/react';
import { Briefcase, Home, MapPin } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
import { formatPrice } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const TIMES = ['asap', '45', '1hour', 'later'] as const;

function addressTitle(t: (key: string) => string, label: string) {
  const key = `address.${label.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? label : translated;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t, addresses, selectedAddressId, setSelectedAddressId, authed } = useApp();
  const { total, count } = useCart();
  const [time, setTime] = useState(0);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);

  return (
    <AppFrame className="!pb-28">
      <ScreenHeader
        title={t('checkout.title')}
        subtitle={t('checkout.subtitle')}
      />

      <Typography type="h6" className={cn(hx.title, 'mb-2')}>
        {t('checkout.address')}
      </Typography>
      <div className="flex flex-col gap-2">
        {addresses.map((addr) => {
          const active = selectedAddressId === addr.id;
          const Icon = addr.label.toLowerCase() === 'work' ? Briefcase : Home;
          return (
            <Button
              key={addr.id}
              variant="secondary"
              onPress={() => setSelectedAddressId(addr.id)}
              className={cn(
                'h-auto w-full items-start justify-start gap-3 rounded-[18px] border px-3 py-3.5 text-left',
                active ? 'border-accent bg-card' : 'border-border bg-card',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent',
                  active ? 'bg-[rgba(216,255,0,0.15)]' : 'bg-surface',
                )}
              >
                <Icon size={16} color="var(--accent)" />
              </span>
              <div className="min-w-0 flex-1">
                <Typography type="h6" className={hx.title}>
                  {addressTitle(t, addr.label)}
                </Typography>
                <Typography type="body-sm" className={cn(hx.bodySm, 'mt-0.5')}>
                  {addr.detail}
                </Typography>
              </div>
              <span
                className={cn(
                  'mt-1 h-5 w-5 shrink-0 rounded-full border-2',
                  active
                    ? 'border-accent bg-accent'
                    : 'border-border bg-transparent',
                )}
              />
            </Button>
          );
        })}
      </div>

      <Typography type="h6" className={cn(hx.title, 'mt-6 mb-2')}>
        {t('checkout.time')}
      </Typography>
      <div className="flex flex-wrap gap-2">
        {TIMES.map((key, i) => {
          const active = time === i;
          return (
            <Button
              key={key}
              variant={active ? 'primary' : 'secondary'}
              className={hx.filterChip(active)}
              onPress={() => setTime(i)}
            >
              {t(`time.${key}`)}
            </Button>
          );
        })}
      </div>

      <div className="mt-4 flex w-full items-center justify-between rounded-[18px] border border-border bg-card px-4 py-3.5">
        <div className="flex items-center gap-2">
          <MapPin size={16} color="var(--accent)" />
          <Typography type="h6" className={hx.title}>
            {t('checkout.leaveAtDoor')}
          </Typography>
        </div>
        <Switch isSelected={leaveAtDoor} onChange={setLeaveAtDoor} />
      </div>

      <div className="mt-5 flex flex-col items-start gap-2">
        <PartnerBadge />
        <Typography type="body-sm" className={hx.bodySm}>
          {t('checkout.partnerNote')}
        </Typography>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] items-center gap-3 border-t border-border bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div>
          <Typography type="body-xs" className={hx.caption}>
            {count} {count === 1 ? t('common.item') : t('common.items')}
          </Typography>
          <Typography type="h3" className={hx.h3}>
            {formatPrice(total)}
          </Typography>
        </div>
        <div className="flex-1">
          <Button
            variant="primary"
            fullWidth
            className={hx.btnPrimary}
            onPress={() => {
              if (!authed) {
                router.push('/login/');
                return;
              }
              router.push('/payment/');
            }}
          >
            {t('checkout.continuePayment')}
          </Button>
        </div>
      </div>
    </AppFrame>
  );
}
