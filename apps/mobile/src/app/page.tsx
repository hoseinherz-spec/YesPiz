'use client';

import { Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useApp } from '@/context/AppContext';
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="absolute top-[-12vh] right-[-35vw] size-[78vw] max-h-[370px] max-w-[370px] rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col items-center">
        <div className="mb-5 flex size-24 items-center justify-center rounded-full border border-border bg-card">
          <span className="text-[48px]" aria-hidden="true">
            🍕
          </span>
        </div>
        <Typography
          type="h1"
          className="text-[44px] leading-none font-extrabold tracking-[-0.045em] text-foreground"
        >
          YesPizz
        </Typography>
        <Typography
          type="body-sm"
          className="mt-3 text-center font-semibold tracking-[0.2em] text-muted uppercase"
        >
          {t('splash.tagline')}
        </Typography>
      </div>
      <div className="absolute bottom-[max(36px,env(safe-area-inset-bottom))] flex gap-2" aria-hidden="true">
        <span className="size-2 rounded-full bg-accent" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
      </div>
    </div>
  );
}
