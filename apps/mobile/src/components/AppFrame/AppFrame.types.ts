import type { ReactNode } from 'react';

export type AppFrameProps = {
  children: ReactNode;
  withTabs?: boolean;
  className?: string;
  padded?: boolean;
};
