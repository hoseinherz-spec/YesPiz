'use client';

import { Typography } from '@heroui/react';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

import type { PrefRowProps } from './PrefRow.types';

export function PrefRow({ label, control, last }: PrefRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3.5',
        !last && 'border-b border-border',
      )}
    >
      <Typography type="h6" className={hx.title}>
        {label}
      </Typography>
      {control}
    </div>
  );
}
