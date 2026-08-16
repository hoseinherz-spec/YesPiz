'use client';

import { Typography } from '@heroui/react';
import { FileText, Home, User } from '@repo/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useApp } from '@/context/AppContext';

import { tabBar } from './TabBar.styles';

const TABS = [
  { href: '/home/', navKey: 'nav.home', icon: Home },
  { href: '/orders/', navKey: 'nav.orders', icon: FileText },
  { href: '/profile/', navKey: 'nav.profile', icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { t } = useApp();
  const styles = tabBar();

  return (
    <>
      <div className={styles.fade()} />
      <nav className={styles.nav()}>
        <div
          className={styles.pill()}
          style={{
            backgroundColor: 'color-mix(in oklab, var(--card) 88%, transparent)',
            backdropFilter: 'blur(28px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
          }}
        >
          {TABS.map((tab) => {
            const focused =
              pathname === tab.href ||
              pathname.startsWith(tab.href.replace(/\/$/, ''));
            const Icon = tab.icon;
            const tabStyles = tabBar({ focused });

            return (
              <Link key={tab.href} href={tab.href} className={tabStyles.tab()}>
                <Icon size={20} color={focused ? 'var(--foreground)' : 'var(--muted)'} />
                <Typography type="body-xs" className={tabStyles.label()}>
                  {t(tab.navKey)}
                </Typography>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
