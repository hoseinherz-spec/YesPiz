'use client';
import { AnimatedNumber } from "@/components/AnimatedNumber";


import { Typography } from '@heroui/react';
import { Star } from '@/components/animated-icon/icons';

import { rating } from './Rating.styles';
import type { RatingProps } from './Rating.types';

export function Rating({ value, reviews }: RatingProps) {
  const styles = rating();

  return (
    <div className={styles.root()}>
      <Star size={14} fill="var(--accent)" color="var(--accent)" />
      <Typography type="body-xs" className={styles.value()}>
        {value.toFixed(1)}
      </Typography>
      {typeof reviews === 'number' ? (
        <Typography type="body-xs" className={styles.reviews()}>
          (<AnimatedNumber value={reviews} />)
        </Typography>
      ) : null}
    </div>
  );
}
