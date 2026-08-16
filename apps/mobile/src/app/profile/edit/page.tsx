'use client';

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AccountField,
  AccountNotice,
  AccountScreen,
} from '@/components/AccountScreen';
import type { Translator } from '@/constants/i18n';
import { type AppUser, useApp } from '@/context/AppContext';
import { hx } from '@/lib/heroui-classes';

type EditableProfile = Pick<AppUser, 'firstName' | 'lastName' | 'email' | 'phone'>;

function EditProfileForm({
  user,
  t,
  updateLocalUser,
}: {
  user: AppUser;
  t: Translator;
  updateLocalUser: (patch: Partial<EditableProfile>) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    setError(null);
    setStatus(null);
    if (!firstName.trim() || !lastName.trim() || (email && !email.includes('@'))) {
      setError(t('login.errorGeneric'));
      return;
    }
    updateLocalUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setStatus(t('editProfile.saved'));
  };

  return (
    <>
      <div className="mb-8 flex flex-col items-center">
        <div className="flex size-32 items-center justify-center rounded-full border-8 border-card bg-accent text-[44px] font-extrabold text-accent-foreground">
          {(firstName || 'Y').slice(0, 1).toUpperCase()}
        </div>
        <h1 className="mt-4 text-[28px] font-bold text-foreground">
          {[firstName, lastName].filter(Boolean).join(' ') || 'YesPizz'}
        </h1>
        <p className="text-sm text-muted">{email}</p>
      </div>

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
      {status ? <AccountNotice tone="success">{status}</AccountNotice> : null}

      <form
        className="mt-4 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <AccountField
            label={t('login.firstName')}
            name="firstName"
            autoComplete="given-name"
            placeholder={t('login.firstName')}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="px-4"
          />
          <AccountField
            label={t('login.lastName')}
            name="lastName"
            autoComplete="family-name"
            placeholder={t('login.lastName')}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="px-4"
          />
        </div>
        <AccountField
          label={t('login.emailLabel')}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('login.emailLabel')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AccountField
          label={t('editProfile.phone')}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('login.phonePlaceholder')}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <p className="text-center text-xs text-muted">{t('common.localOnly')}</p>
        <Button
          type="button"
          variant="primary"
          onPress={save}
          className={hx.btnPrimary}
        >
          {t('common.save')}
        </Button>
      </form>
    </>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { t, hydrated, authed, user, updateLocalUser } = useApp();

  useEffect(() => {
    if (hydrated && !authed) {
      router.replace('/login/?next=/profile/edit/');
    }
  }, [authed, hydrated, router]);

  return (
    <AccountScreen
      title={t('editProfile.title')}
      subtitle={t('editProfile.subtitle')}
      backHref="/profile/"
    >
      {user ? (
        <EditProfileForm user={user} t={t} updateLocalUser={updateLocalUser} />
      ) : (
        <p className="text-center text-sm text-muted">{t('profile.signInPrompt')}</p>
      )}
    </AccountScreen>
  );
}
