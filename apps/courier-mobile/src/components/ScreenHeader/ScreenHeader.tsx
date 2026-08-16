'use client';

import { Button, Typography } from '@heroui/react';
import { ArrowLeft } from '@repo/icons';
import { useRouter } from 'next/navigation';

import { screenHeader } from './ScreenHeader.styles';
import type { ScreenHeaderProps } from './ScreenHeader.types';

export function ScreenHeader({
  title,
  subtitle,
  right,
  backHref,
  onBack,
}: ScreenHeaderProps) {
  const router = useRouter();
  const styles = screenHeader();

  return (
    <div className={styles.root()}>
      <Button
        isIconOnly
        variant="secondary"
        aria-label="Back"
        onPress={() => {
          if (onBack) onBack();
          else if (backHref) router.push(backHref);
          else router.back();
        }}
        className={styles.back()}
      >
        <ArrowLeft size={20} />
      </Button>
      <div className={styles.content()}>
        <Typography type="h2" className={styles.title()}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography type="body-sm" className={styles.subtitle()}>
            {subtitle}
          </Typography>
        ) : null}
      </div>
      <div className="flex size-16 items-center justify-center">{right}</div>
    </div>
  );
}
