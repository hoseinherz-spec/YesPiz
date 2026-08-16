'use client';

import { Button } from '@heroui/react';
import { ChevronRight } from '@repo/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { LANGUAGES } from '@/constants/i18n';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

function SettingsRow({
  title,
  detail,
  href,
  onPress,
  control,
}: {
  title: string;
  detail: string;
  href?: string;
  onPress?: () => void;
  control?: ReactNode;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[21px] font-bold text-foreground">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{detail}</span>
      </span>
      {control ?? <ChevronRight size={24} color="var(--foreground)" />}
    </>
  );
  const className =
    'flex w-full items-center gap-4 border-b border-border py-6 text-left';

  if (control) {
    return <div className={className}>{content}</div>;
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      onPress={onPress}
      className={cn(className, 'h-auto justify-start rounded-none px-0')}
    >
      {content}
    </Button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    t,
    mode,
    toggleMode,
    language,
    setLanguage,
    authed,
    logout,
  } = useApp();
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  const clearCache = async () => {
    if ('caches' in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
    sessionStorage.clear();
    setCacheStatus(t('settings.cacheCleared'));
  };

  return (
    <AppFrame>
      <ScreenHeader title={t('settings.title')} backHref="/profile/" />

      <div className="grid">
        <SettingsRow
          title={t('settings.theme')}
          detail={t('settings.themeDetail')}
          onPress={toggleMode}
          control={
            <ThemeSwitch
              isSelected={mode === 'dark'}
              onChange={() => toggleMode()}
              aria-label={t('settings.darkMode')}
            />
          }
        />
        <SettingsRow
          title={t('notifications.title')}
          detail={t('settings.notificationsDetail')}
          href="/notifications/"
        />
        <div className="border-b border-border py-6">
          <h2 className="text-[21px] font-bold text-foreground">
            {t('settings.language')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {t('settings.languageDetail')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {LANGUAGES.map((option) => (
              <Button
                key={option.id}
                variant={language === option.id ? 'primary' : 'secondary'}
                onPress={() => setLanguage(option.id)}
                className="h-12 rounded-full font-semibold"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <SettingsRow
          title={t('settings.addresses')}
          detail={t('settings.addressDetail')}
          href="/addresses/new/?from=settings"
        />
        <SettingsRow
          title={t('settings.cache')}
          detail={cacheStatus ?? t('settings.cacheDetail')}
          onPress={() => void clearCache()}
        />
        <SettingsRow
          title={t('settings.help')}
          detail={t('settings.supportDetail')}
          href="/help/"
        />
        <SettingsRow
          title={t('settings.privacy')}
          detail={t('privacy.updated')}
          href="/settings/privacy/"
        />
        <SettingsRow
          title={t('settings.versionTitle')}
          detail={t('settings.versionDetail')}
          onPress={() => setCacheStatus(t('settings.versionDetail'))}
        />
      </div>

      {authed ? (
        <Button
          variant="danger"
          onPress={() => {
            logout();
            router.replace('/login/');
          }}
          className={cn(hx.btnDanger, 'mt-10 mb-8')}
        >
          {t('common.logout')}
        </Button>
      ) : null}
    </AppFrame>
  );
}
