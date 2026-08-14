'use client';

import { Typography } from '@heroui/react';
import Link from 'next/link';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

import type { LinkRowProps } from './LinkRow.types';

export function LinkRow({ label, href, last }: LinkRowProps) {
  const className = cn(
    'flex w-full items-center justify-between px-4 py-3.5 text-left',
    !last && 'border-b border-border',
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        <Typography type="h6" className={hx.title}>
          {label}
        </Typography>
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      <Typography type="h6" className={hx.title}>
        {label}
      </Typography>
    </button>
  );
}
