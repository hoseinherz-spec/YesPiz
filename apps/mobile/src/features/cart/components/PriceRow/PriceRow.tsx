'use client';

import { Typography } from '@heroui/react';

import { cn } from '@/lib/cn';

import type { PriceRowProps } from './PriceRow.types';

export function PriceRow({ label, value, bold, accent, success }: PriceRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <Typography
        type="body"
        className={cn(
          bold ? 'text-[15px] font-bold' : 'text-[14px]',
          'text-text-secondary',
        )}
      >
        {label}
      </Typography>
      <Typography
        type="body"
        className={cn(
          bold ? 'text-[16px] font-extrabold' : 'text-[14px] font-semibold',
          success ? 'text-success' : accent ? 'text-accent' : 'text-foreground',
        )}
      >
        {value}
      </Typography>
    </div>
  );
}
