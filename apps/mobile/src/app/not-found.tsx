'use client';

import { Typography, buttonVariants } from '@heroui/react';
import { ArrowRight } from '@repo/icons';
import Link from 'next/link';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function NotFound() {
  const { t } = useApp();

  return (
    <AppFrame>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <Typography type="h1" className={hx.h1}>
          {t('notFound.title')}
        </Typography>
        <Typography type="body" className={cn(hx.body, 'mt-3 text-text-secondary')}>
          {t('notFound.message')}
        </Typography>
        <div className="mt-8 w-full max-w-xs">
          <Link
            href="/home/"
            className={cn(buttonVariants({ variant: 'primary', fullWidth: true }), hx.btnPrimary)}
          >
            <span>{t('notFound.goHome')}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </AppFrame>
  );
}
