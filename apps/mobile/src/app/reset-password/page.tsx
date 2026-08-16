'use client';

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AccountHero,
  AccountNotice,
  AccountScreen,
  PasswordField,
} from '@/components/AccountScreen';
import { useApp } from '@/context/AppContext';
import { hx } from '@/lib/heroui-classes';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useApp();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const resetDemo = () => {
    if (password.length < 8) {
      setError(t('reset.short'));
      return;
    }
    if (password !== confirmation) {
      setError(t('reset.mismatch'));
      return;
    }
    setError(null);
    setComplete(true);
    setPassword('');
    setConfirmation('');
  };

  return (
    <AccountScreen title={t('reset.title')} backHref="/verification/">
      <AccountHero title={t('reset.heading')} description={t('reset.subtitle')} />

      {complete ? (
        <div className="grid gap-6">
          <AccountNotice tone="success">{t('reset.success')}</AccountNotice>
          <Button
            variant="primary"
            onPress={() => router.replace('/login/')}
            className={hx.btnPrimary}
          >
            {t('signup.loginLink')}
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            resetDemo();
          }}
        >
          <PasswordField
            label={t('login.password')}
            name="password"
            autoComplete="new-password"
            autoFocus
            placeholder={t('login.password')}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
          />
          <PasswordField
            label={t('reset.confirm')}
            name="passwordConfirmation"
            autoComplete="new-password"
            placeholder={t('reset.confirm')}
            value={confirmation}
            error={error ?? undefined}
            onChange={(event) => {
              setConfirmation(event.target.value);
              setError(null);
            }}
          />
          <Button
            type="button"
            variant="primary"
            onPress={resetDemo}
            className={hx.btnPrimary}
          >
            {t('reset.action')}
          </Button>
        </form>
      )}
    </AccountScreen>
  );
}
