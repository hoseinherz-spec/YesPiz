'use client';

import { Button, Card, Typography } from '@heroui/react';
import {
  CreditCard,
  HelpCircle,
  MapPin,
  Settings,
  Bell,
} from '@repo/icons';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { IconBadgeButton } from '@/components/IconBadgeButton';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { useApp } from '@/context/AppContext';
import { ProfileMenuRow } from '@/features/profile/components/ProfileMenuRow';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function ProfilePage() {
  const router = useRouter();
  const {
    t,
    userName,
    userEmail,
    mode,
    toggleMode,
    favorites,
    orders,
    logout,
  } = useApp();

  const completed = orders.filter((o) => o.status === 'completed').length;
  const initial = (userName || 'G').slice(0, 1).toUpperCase();

  return (
    <AppFrame withTabs>
      <div className="mb-5 flex items-center justify-between">
        <Typography type="h2" className={hx.h2}>
          {t('profile.title')}
        </Typography>
        <IconBadgeButton href="/settings/" aria-label="Settings">
          <Settings size={18} />
        </IconBadgeButton>
      </div>

      <Card className={hx.cardElevated}>
        <Card.Content className="p-0">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[20px] font-extrabold text-accent-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <Typography type="h6" className={hx.title}>
                {userName}
              </Typography>
              <Typography type="body-sm" className={hx.bodySm}>
                {userEmail || '—'}
              </Typography>
            </div>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-accent">
              {t('profile.tierGold')}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: t('profile.stats.orders'), value: String(completed) },
              { label: t('profile.stats.favorites'), value: String(favorites.length) },
              { label: t('profile.stats.points'), value: '1,240' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] bg-surface px-2 py-3 text-center"
              >
                <Typography type="h3" className={hx.h3}>
                  {stat.value}
                </Typography>
                <Typography type="body-xs" className={cn(hx.caption, 'mt-0.5')}>
                  {stat.label}
                </Typography>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <div className="mt-4 flex items-center justify-between rounded-[18px] border border-border bg-card px-3 py-3.5">
        <Typography type="h6" className={hx.title}>
          {t('profile.darkMode')}
        </Typography>
        <ThemeSwitch
          isSelected={mode === 'dark'}
          onChange={() => toggleMode()}
          aria-label={t('profile.darkMode')}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <ProfileMenuRow icon={<Bell size={18} />} label={t('profile.notifications')} href="/notifications/" />
        <ProfileMenuRow icon={<MapPin size={18} />} label={t('profile.addresses')} href="/settings/" />
        <ProfileMenuRow icon={<CreditCard size={18} />} label={t('profile.payment')} href="/payment/" />
        <ProfileMenuRow icon={<HelpCircle size={18} />} label={t('profile.help')} href="/help/" />
        <ProfileMenuRow icon={<Settings size={18} />} label={t('profile.settings')} href="/settings/" />
      </div>

      <div className="mt-6 pb-4">
        <Button
          variant="danger"
          onPress={() => {
            logout();
            router.replace('/login/');
          }}
          className={hx.btnDanger}
        >
          {t('common.logout')}
        </Button>
      </div>
    </AppFrame>
  );
}
