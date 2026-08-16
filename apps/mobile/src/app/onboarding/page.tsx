'use client';

import { Button, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { heroImage } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function OnboardingPage() {
  const router = useRouter();
  const { t, completeOnboarding } = useApp();

  const finish = (href: string) => {
    completeOnboarding();
    router.replace(href);
  };

  return (
    <AppFrame padded={false}>
      <div className="relative flex min-h-dvh flex-col overflow-hidden px-[clamp(20px,8vw,38px)] pt-[max(20px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onPress={() => finish('/home/')}
            className="h-11 rounded-full px-4 text-sm font-semibold text-muted"
          >
            {t('onboarding.skip')}
          </Button>
        </div>

        <div className="relative mx-auto mt-2 aspect-square w-full max-w-[390px] overflow-hidden rounded-full bg-accent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent" />
        </div>

        <div className="mt-8 text-center">
          <Typography type="h1" className={cn(hx.h1, 'mx-auto max-w-sm whitespace-pre-line')}>
            {t('onboarding.slide1.title')}
          </Typography>
          <Typography
            type="body"
            className={cn(hx.body, 'mx-auto mt-3 max-w-sm text-text-secondary')}
          >
            {t('onboarding.slide1.body')}
          </Typography>
        </div>

        <div className="mt-auto grid gap-3 pt-8">
          <Button
            variant="secondary"
            onPress={() => finish('/signup/')}
            className={hx.btnSecondary}
          >
            {t('signup.title')}
          </Button>
          <Button variant="primary" onPress={() => finish('/login/')} className={hx.btnPrimary}>
            {t('login.signIn')}
          </Button>
        </div>
      </div>
    </AppFrame>
  );
}
