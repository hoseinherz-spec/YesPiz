'use client';

import { Button, Card, Separator, Switch, Typography } from '@heroui/react';
import { Banknote, Briefcase, CreditCard, Home, MapPin, ShoppingBag } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { MobileActionBar } from '@/components/MobileActionBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { formatPrice } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { PartnerBadge } from '@/features/partner/components/PartnerBadge';
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
  const { subtotal, discount, total, count } = useCart();
  const [time, setTime] = useState(0);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [payment, setPayment] = useState<'card' | 'cash'>('card');

  const continueToPayment = () => {
    if (!authed) {
      router.push('/login/');
      return;
    }
    try {
      sessionStorage.setItem('yespizz_payment_method', payment);
    } catch {
      // The payment screen will use its default when storage is unavailable.
    }
    router.push('/payment/');
  };

  return (
    <AppFrame className="!pb-36">
      <ScreenHeader title={t('checkout.title')} subtitle={t('checkout.subtitle')} backHref="/cart/" />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <Typography type="h3" className={hx.h3}>{t('checkout.address')}</Typography>
          <Button
            variant="ghost"
            onPress={() => router.push('/addresses/new/?from=checkout')}
            className="h-auto min-w-0 px-0 text-[13px] font-semibold text-foreground"
          >
            {t('settings.addAddress')}
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          {addresses.map((addr) => {
            const active = selectedAddressId === addr.id;
            const Icon = addr.label.toLowerCase() === 'work' ? Briefcase : Home;
            return (
              <Button
                key={addr.id}
                variant="secondary"
                onPress={() => setSelectedAddressId(addr.id)}
                className={cn(
                  'h-auto min-h-[74px] w-full justify-start gap-3 rounded-[24px] border px-3 py-3 text-left shadow-none',
                  active ? 'border-foreground bg-surface-secondary' : 'border-border bg-card',
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-bold text-foreground">
                    {addressTitle(t, addr.label)}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-medium text-muted">{addr.detail}</span>
                </span>
                <span className={cn('size-6 shrink-0 rounded-full border-2 p-1', active ? 'border-foreground' : 'border-border')}>
                  <span className={cn('block size-full rounded-full', active && 'bg-foreground')} />
                </span>
              </Button>
            );
          })}
          {addresses.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-card p-4">
              <Typography type="body-sm" className={hx.bodySm}>{t('checkout.noAddress')}</Typography>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Typography type="h3" className={hx.h3}>{t('checkout.payment')}</Typography>
          <Button
            variant="ghost"
            onPress={() => router.push('/payment/new/')}
            className="h-auto min-w-0 px-0 text-[13px] font-semibold text-foreground"
          >
            {t('payment.addCard')}
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          {([
            ['card', CreditCard, t('payment.visa'), t('payment.visaDetail')],
            ['cash', Banknote, t('payment.cash'), t('payment.cashDetail')],
          ] as const).map(([id, Icon, title, detail]) => {
            const active = payment === id;
            return (
              <Button
                key={id}
                variant="secondary"
                onPress={() => setPayment(id)}
                className={cn(
                  'h-auto min-h-[74px] w-full justify-start gap-3 rounded-[24px] border px-3 py-3 text-left shadow-none',
                  active ? 'border-foreground bg-surface-secondary' : 'border-border bg-card',
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-card text-foreground">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-foreground">{title}</span>
                  <span className="block text-[12px] font-medium text-muted">{detail}</span>
                </span>
                <span className={cn('size-6 shrink-0 rounded-full border-2 p-1', active ? 'border-foreground' : 'border-border')}>
                  <span className={cn('block size-full rounded-full', active && 'bg-foreground')} />
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <Typography type="h3" className={cn(hx.h3, 'mb-3')}>{t('checkout.time')}</Typography>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TIMES.map((key, index) => (
            <Button
              key={key}
              variant={time === index ? 'primary' : 'secondary'}
              className={hx.filterChip(time === index)}
              onPress={() => setTime(index)}
            >
              {t(`time.${key}`)}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[24px] bg-surface-secondary px-4 py-3.5">
          <span className="flex items-center gap-2">
            <MapPin size={18} />
            <span className="text-[14px] font-semibold text-foreground">{t('checkout.leaveAtDoor')}</span>
          </span>
          <Switch aria-label={t('checkout.leaveAtDoor')} isSelected={leaveAtDoor} onChange={setLeaveAtDoor} />
        </div>
      </section>

      <Card className="mt-7 rounded-[28px] border-0 bg-surface-secondary p-5 shadow-none">
        <Card.Content className="p-0">
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
          <div className="flex items-end justify-between">
            <span className="text-[16px] font-semibold text-muted">{t('common.total')}</span>
            <span className="text-[21px] font-bold text-foreground">{formatPrice(total)}</span>
          </div>
          <Typography type="body-xs" className={cn(hx.caption, 'mt-1 text-right')}>
            {count} {count === 1 ? t('common.item') : t('common.items')}
          </Typography>
        </Card.Content>
      </Card>

      <div className="mt-5 flex items-start gap-2 pb-4">
        <PartnerBadge compact />
        <Typography type="body-xs" className={hx.caption}>{t('checkout.partnerNote')}</Typography>
      </div>

      <MobileActionBar
        onPress={continueToPayment}
        icon={<ShoppingBag size={20} />}
        isDisabled={count === 0 || (authed && !selectedAddressId)}
        label={<span>{t('checkout.continuePayment')} · {formatPrice(total)}</span>}
      />
    </AppFrame>
  );
}
