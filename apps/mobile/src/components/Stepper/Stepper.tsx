'use client';

import { Button, Typography } from '@heroui/react';

import { stepper } from './Stepper.styles';
import type { StepperProps } from './Stepper.types';

export function Stepper({ value, onChange, min = 1 }: StepperProps) {
  const styles = stepper();

  return (
    <div className={styles.root()}>
      <Button
        isIconOnly
        variant="secondary"
        aria-label="Decrease"
        onPress={() => onChange(Math.max(min, value - 1))}
        className={styles.decrease()}
      >
        −
      </Button>
      <Typography type="body-sm" className={styles.value()}>
        {value}
      </Typography>
      <Button
        isIconOnly
        variant="primary"
        aria-label="Increase"
        onPress={() => onChange(value + 1)}
        className={styles.increase()}
      >
        +
      </Button>
    </div>
  );
}
