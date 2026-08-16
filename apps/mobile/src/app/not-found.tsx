'use client';

import { Button, Typography } from '@heroui/react';
import { ArrowRight, MapPin } from '@repo/icons';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function NotFound() {
  const router = useRouter();
  const { t } = useApp();

  return (
    <AppFrame padded={false}>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-8 py-[max(40px,env(safe-area-inset-top))] text-center text-white">
        <div className="relative">
          <p aria-hidden="true" className="text-[116px] leading-none font-black tracking-[-0.12em] text-white">404</p>
          <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MapPin size={27} />
          </span>
        </div>
        <Typography type="h1" className="mt-7 text-[29px] font-extrabold text-white">
          {t('notFound.title')}
        </Typography>
        <Typography type="body" className="mt-3 max-w-[300px] text-[14px] leading-6 text-white/55">
          {t('notFound.message')}
        </Typography>
        <div className="mt-9 w-full max-w-xs">
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.replace('/home/')}
            className={cn(hx.btnPrimary, 'bg-accent text-accent-foreground')}
          >
            {t('notFound.goHome')}
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </AppFrame>
  );
}
