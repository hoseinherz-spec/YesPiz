'use client';

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AccountField,
  AccountHero,
  AccountNotice,
  AccountScreen,
} from '@/components/AccountScreen';
import { useApp } from '@/context/AppContext';
import { hx } from '@/lib/heroui-classes';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const continueDemo = () => {
    if (!email.trim() || !email.includes('@')) {
      setError(t('login.emailLabel'));
      return;
    }
    router.push(`/verification/?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AccountScreen title={t('forgot.title')} backHref="/login/">
      <AccountHero
        title={t('forgot.heading')}
        description={t('forgot.subtitle')}
      />
      <AccountNotice>{t('forgot.demo')}</AccountNotice>
      <form
        className="mt-7 grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          continueDemo();
        }}
      >
        <AccountField
          label={t('login.emailLabel')}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder={t('login.emailLabel')}
          value={email}
          error={error ?? undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
        />
        <Button
          type="button"
          variant="primary"
          onPress={continueDemo}
          className={hx.btnPrimary}
        >
          {t('forgot.action')}
        </Button>
      </form>
    </AccountScreen>
  );
}
