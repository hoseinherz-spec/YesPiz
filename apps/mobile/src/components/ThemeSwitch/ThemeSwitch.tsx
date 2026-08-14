'use client';

import { Switch } from '@heroui/react';

import type { ThemeSwitchProps } from './ThemeSwitch.types';

export function ThemeSwitch({
  isSelected,
  onChange,
  'aria-label': ariaLabel,
}: ThemeSwitchProps) {
  return (
    <Switch isSelected={isSelected} onChange={onChange} aria-label={ariaLabel}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}
