'use client';

import { Button, Typography } from '@heroui/react';
import { CreditCard } from '@repo/icons';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function NewPaymentCardPage() {
  const router = useRouter();
  const { t } = useApp();

  return (
    <AppFrame className="pb-[max(32px,env(safe-area-inset-bottom))]">
      <ScreenHeader title={t('payment.card')} backHref="/checkout/" />

      <div className="mb-7 flex items-center gap-3 rounded-[26px] bg-accent p-4 text-accent-foreground">
        <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent-foreground)_10%,transparent)]">
          <CreditCard size={22} />
        </span>
        <div>
          <Typography type="h6" className="text-[16px] font-bold text-accent-foreground">
            {t('payment.stripeTitle')}
          </Typography>
          <Typography type="body-xs" className="text-[12px] font-medium text-[color-mix(in_oklab,var(--accent-foreground)_68%,transparent)]">
            {t('payment.stripeBody')}
          </Typography>
        </div>
      </div>

      <Typography type="body-sm" className={hx.bodySm}>
        {t('payment.stripeDisclosure')}
      </Typography>

      <Button
        variant="primary"
        fullWidth
        onPress={() => router.replace('/payment/')}
        className={cn(hx.btnPrimary, 'mt-7')}
      >
        {t('checkout.continuePayment')}
      </Button>
    </AppFrame>
  );
}
