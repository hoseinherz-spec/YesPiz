import type { CSSProperties, ReactNode } from 'react';

export type IconBadgeButtonProps = {
  children: ReactNode;
  href?: string;
  onPress?: () => void;
  badge?: number;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
};
