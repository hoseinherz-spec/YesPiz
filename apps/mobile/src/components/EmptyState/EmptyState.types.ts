import type { ReactNode } from 'react';

export type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
};
