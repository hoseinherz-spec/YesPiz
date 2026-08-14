'use client';

import { Badge, Button, buttonVariants } from '@heroui/react';
import Link from 'next/link';

import { cn } from '@/lib/cn';

import { iconBadgeButton } from './IconBadgeButton.styles';
import type { IconBadgeButtonProps } from './IconBadgeButton.types';

export function IconBadgeButton({
  children,
  href,
  onPress,
  badge,
  'aria-label': ariaLabel,
  className,
  style,
}: IconBadgeButtonProps) {
  const styles = iconBadgeButton();
  const cls = cn(styles.control(), className);

  const control = href ? (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(buttonVariants({ variant: 'secondary', isIconOnly: true }), cls)}
      style={style}
    >
      {children}
    </Link>
  ) : (
    <Button
      isIconOnly
      variant="secondary"
      aria-label={ariaLabel}
      onPress={onPress}
      className={cls}
      style={style}
    >
      {children}
    </Button>
  );

  if (badge && badge > 0) {
    return (
      <Badge.Anchor>
        {control}
        <Badge color="accent" size="sm" className={styles.badge()}>
          {badge > 9 ? '9+' : badge}
        </Badge>
      </Badge.Anchor>
    );
  }

  return control;
}
