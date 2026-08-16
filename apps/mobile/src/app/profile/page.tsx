'use client';

import { Button } from '@heroui/react';
import { CloseX } from '@repo/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';
import { hx } from '@/lib/heroui-classes';

const MENU_ITEMS = [
  { key: 'profile.edit', href: '/profile/edit/', auth: true },
  { key: 'profile.saved', href: '/saved/' },
  { key: 'profile.settings', href: '/settings/' },
  { key: 'profile.notifications', href: '/notifications/' },
  { key: 'profile.history', href: '/orders/' },
  { key: 'profile.privacy', href: '/settings/privacy/' },
  { key: 'profile.help', href: '/help/' },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { t, authed, userName, userEmail, logout } = useApp();
  const initial = (userName || 'Y').slice(0, 1).toUpperCase();

  return (
    <AppFrame padded={false}>
      <div className="flex min-h-dvh flex-col px-[clamp(20px,8vw,38px)] pt-[max(36px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-accent-foreground">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-bold text-foreground">{userName}</h1>
            <p className="truncate text-sm text-muted">
              {userEmail || t('profile.signInPrompt')}
            </p>
          </div>
          <Button
            isIconOnly
            variant="secondary"
            aria-label={t('common.backToHome')}
            onPress={() => router.push('/home/')}
            className="size-16 min-w-0 rounded-full bg-card"
          >
            <CloseX size={24} />
          </Button>
        </header>

        <nav aria-label={t('profile.accountMenu')} className="mt-16 grid gap-1">
          {MENU_ITEMS.filter((item) => !('auth' in item) || authed).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-3 text-center text-[25px] font-bold tracking-[-0.025em] text-foreground outline-none transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-focus"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-10">
          {authed ? (
            <Button
              variant="ghost"
              onPress={() => {
                logout();
                router.replace('/login/');
              }}
              className="mx-auto h-14 px-6 text-lg font-bold text-danger"
            >
              {t('common.logout')}
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={() => router.push('/login/?next=/profile/')}
              className={hx.btnPrimary}
            >
              {t('login.signIn')}
            </Button>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
