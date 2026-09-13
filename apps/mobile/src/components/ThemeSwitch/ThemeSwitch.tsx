"use client";
import { AppText } from "@/components/Text";


import { SwitchField } from "@repo/ui/forms";

import type { ThemeSwitchProps } from "./ThemeSwitch.types";

export function ThemeSwitch({
  isSelected,
  onChange,
  "aria-label": ariaLabel,
}: ThemeSwitchProps) {
  return (
    <SwitchField
      value={isSelected}
      onChange={onChange}
      label={<AppText as="span" className="sr-only">{ariaLabel}</AppText>}
    />
  );
}
