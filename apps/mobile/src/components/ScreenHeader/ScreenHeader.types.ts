import type { ReactNode } from 'react';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  backHref?: string;
};
