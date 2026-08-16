'use client';

import { accountClient } from '@repo/api';
import { Button } from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import {
  AccountHero,
  AccountNotice,
  AccountScreen,
  PasswordField,
} from '@/components/AccountScreen';
import { useApp } from '@/context/AppContext';
import { hx } from '@/lib/heroui-classes';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useApp();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    if (!token) {
      setError(t('reset.missingToken') || 'Reset token missing');
      return;
    }
    if (password.length < 6) {
      setError(t('reset.short'));
      return;
    }
    if (password !== confirmation) {
      setError(t('reset.mismatch'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await accountClient.resetPassword({ token, password });
      setComplete(true);
      setPassword('');
      setConfirmation('');
    } catch {
      setError(t('reset.failed') || 'Reset failed or token expired');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountScreen title={t('reset.title')} backHref="/forgot-password/">
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
            void reset();
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
            type="submit"
            variant="primary"
            isDisabled={busy}
            className={hx.btnPrimary}
          >
            {t('reset.action') || 'Reset password'}
          </Button>
        </form>
      )}
    </AccountScreen>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
