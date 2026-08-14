'use client';

import { buttonVariants, Typography } from '@heroui/react';
import { ArrowRight } from '@repo/icons';
import Link from 'next/link';

import { cn } from '@/lib/cn';

import { emptyState } from './EmptyState.styles';
import type { EmptyStateProps } from './EmptyState.types';

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const styles = emptyState();

  return (
    <div className={styles.root()}>
      <div className={styles.iconWrap()}>{icon}</div>
      <Typography type="h3" className={styles.title()}>
        {title}
      </Typography>
      <Typography type="body-sm" className={styles.body()}>
        {body}
      </Typography>
      {actionLabel && actionHref ? (
        <div className={styles.actionWrap()}>
          <Link
            href={actionHref}
            className={cn(buttonVariants({ variant: 'primary', fullWidth: true }), styles.action())}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
