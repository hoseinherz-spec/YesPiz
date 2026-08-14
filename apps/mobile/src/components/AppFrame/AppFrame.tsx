'use client';

import { APP_MAX_WIDTH } from '@/constants/theme';
import { cn } from '@/lib/cn';

import { TabBar } from '@/components/TabBar';

import { appFrame } from './AppFrame.styles';
import type { AppFrameProps } from './AppFrame.types';

export function AppFrame({
  children,
  withTabs = false,
  className,
  padded = true,
}: AppFrameProps) {
  const styles = appFrame({ padded, withTabs });

  return (
    <div className={styles.root()}>
      <div className={styles.shell()} style={{ maxWidth: APP_MAX_WIDTH }}>
        <main className={cn(styles.main(), className)}>{children}</main>
        {withTabs ? <TabBar /> : null}
      </div>
    </div>
  );
}
