'use client';

import { Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function SplashPage() {
  const router = useRouter();
  const { hydrated, authed, onboarded, t } = useApp();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (!onboarded) router.replace('/onboarding/');
      else if (!authed) router.replace('/login/');
      else router.replace('/home/');
    }, 2100);
    return () => clearTimeout(timer);
  }, [hydrated, authed, onboarded, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/yespizz-wordmark.png"
        alt="YesPizz"
        className="mb-7 h-[60px] w-[180px] object-contain"
        style={{
          filter:
            'brightness(0) saturate(100%) invert(94%) sepia(58%) saturate(749%) hue-rotate(18deg) brightness(104%) contrast(106%)',
        }}
      />
      <Typography type="h1" className={cn(hx.display, 'uppercase text-foreground')}>
        HOT
      </Typography>
      <Typography
        type="h2"
        className="mt-1 text-[24px] font-extrabold tracking-[4px] text-accent"
      >
        YESPIZZ
      </Typography>
      <Typography type="body-xs" className="mt-2.5 tracking-[2px] text-muted">
        {t('splash.tagline')}
      </Typography>
    </div>
  );
}
