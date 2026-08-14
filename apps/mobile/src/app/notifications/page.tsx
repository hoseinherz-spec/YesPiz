'use client';

import { Button, Card, Typography } from '@heroui/react';
import { Gift, Info, Truck } from '@repo/icons';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function NotificationsPage() {
  const { t, notifications, markAllRead, unreadCount } = useApp();

  return (
    <AppFrame>
      <ScreenHeader
        title={t('notifications.title')}
        subtitle={
          unreadCount
            ? t('notifications.unread', { n: unreadCount })
            : t('notifications.caughtUp')
        }
        right={
          unreadCount ? (
            <Button
              variant="ghost"
              onPress={markAllRead}
              className="h-auto rounded-full px-3 py-2 text-[12px] font-semibold text-accent"
            >
              {t('notifications.markAll')}
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 pb-6">
        {notifications.map((n) => {
          const Icon = n.kind === 'order' ? Truck : n.kind === 'promo' ? Gift : Info;
          const neon = n.kind === 'promo';
          return (
            <Card
              key={n.id}
              className={cn(
                hx.card,
                '!p-3',
                neon &&
                  'border-[color-mix(in_oklab,var(--accent)_20%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]',
              )}
            >
              <Card.Content className="flex gap-3 p-0">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent',
                    neon
                      ? 'bg-[color-mix(in_oklab,var(--accent)_20%,transparent)]'
                      : 'bg-surface',
                  )}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Typography type="h6" className={hx.title}>
                      {t(n.title)}
                    </Typography>
                    {n.unread ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    ) : null}
                  </div>
                  <Typography type="body-sm" className={cn(hx.bodySm, 'mt-0.5')}>
                    {t(n.body)}
                  </Typography>
                  <Typography type="body-xs" className={cn(hx.caption, 'mt-1.5')}>
                    {t(n.time)}
                  </Typography>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </AppFrame>
  );
}
