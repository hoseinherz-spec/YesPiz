'use client';

import { Button, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { heroImage, PIZZAS } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const SLIDES = [
  { image: heroImage, titleKey: 'onboarding.slide1.title', bodyKey: 'onboarding.slide1.body' },
  {
    image: PIZZAS[3].image,
    titleKey: 'onboarding.slide2.title',
    bodyKey: 'onboarding.slide2.body',
  },
  {
    image: PIZZAS[9].image,
    titleKey: 'onboarding.slide3.title',
    bodyKey: 'onboarding.slide3.body',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { t, completeOnboarding } = useApp();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/login/');
  };

  return (
    <AppFrame padded={false}>
      <div className="relative flex min-h-dvh flex-col">
        <div className="relative h-[52vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklab,var(--background)_15%,transparent)] to-[color-mix(in_oklab,var(--background)_95%,transparent)]" />
          <Button
            variant="ghost"
            onPress={finish}
            className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 h-auto rounded-full bg-[color-mix(in_oklab,var(--background)_55%,transparent)] px-4 py-2 text-[13px] font-semibold text-text-secondary"
          >
            {t('onboarding.skip')}
          </Button>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-8 pt-2">
          <Typography type="h1" className={cn(hx.h1, 'whitespace-pre-line')}>
            {t(slide.titleKey)}
          </Typography>
          <Typography type="body" className={cn(hx.body, 'mt-3 text-text-secondary')}>
            {t(slide.bodyKey)}
          </Typography>

          <div className="mt-auto flex items-center justify-between gap-4 pt-8">
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-[22px] bg-accent' : 'w-2 bg-border',
                  )}
                />
              ))}
            </div>
            <Button
              variant="primary"
              onPress={() => {
                if (last) finish();
                else setIndex((i) => i + 1);
              }}
              className={cn(hx.btnPrimary, 'w-44')}
            >
              {last ? t('onboarding.getStarted') : t('onboarding.continue')}
            </Button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
