import type { ReactNode } from 'react';

export type ProfileMenuRowProps = {
  icon: ReactNode;
  label: string;
  href?: string;
  right?: ReactNode;
};
