'use client';

import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';

type Tab = 'otp' | 'password';

const fieldClass =
  'h-[74px] w-full rounded-[18px] border border-transparent bg-card px-6 text-base font-semibold text-foreground outline-none placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25';

export default function LoginPage() {
  const router = useRouter();
  const {
    t,
    sendOtp,
    loginWithOtp,
    loginWithPassword,
    register,
    authLoading,
    authError,
    clearAuthError,
  } = useApp();

  const [tab, setTab] = useState<Tab>('password');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const goHome = () => router.replace('/home/');

  const onSendOtp = async () => {
    clearAuthError();
    if (!phone.trim()) return;
    try {
      await sendOtp(phone.trim());
      setOtpSent(true);
    } catch {
      // authError set in context
    }
  };

  const onConfirmOtp = async () => {
    clearAuthError();
    try {
      await loginWithOtp(phone.trim(), code.trim(), {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      goHome();
    } catch {
      // authError set in context
    }
  };

  const onPasswordSubmit = async () => {
    clearAuthError();
    try {
      if (mode === 'register') {
        await register(email.trim(), password, firstName.trim(), lastName.trim());
      } else {
        await loginWithPassword(email.trim(), password);
      }
      goHome();
    } catch {
      // authError set in context
    }
  };

  return (
    <AppFrame padded={false}>
      <div className="flex min-h-dvh flex-col px-[38px] pt-[max(50px,env(safe-area-inset-top))] pb-[max(38px,env(safe-area-inset-bottom))]">
        <header className="relative flex h-16 shrink-0 items-center justify-center">
          <Button
            type="button"
            isIconOnly
            aria-label="Go back"
            variant="secondary"
            className="absolute left-0 size-16 min-w-0 rounded-full bg-card text-foreground shadow-none"
            onPress={() => router.back()}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 7 5 11l4 4" />
              <path d="M5 11h6a6 6 0 0 1 0 12" transform="translate(0 -4)" />
            </svg>
          </Button>
          <span className="text-xl font-semibold text-foreground">
            {mode === 'register' ? t('login.register') : t('login.signIn')}
          </span>
        </header>

        <section className="mt-14 text-center">
          <h1 className="text-[2.55rem] leading-none font-extrabold tracking-[-0.035em] text-foreground">
            {mode === 'register' ? t('login.register') : t('login.signIn')}
          </h1>
          <p className="mt-3 text-[1.05rem] font-medium text-muted">
            {t('login.subtitle')}
          </p>
        </section>

        <div className="mt-8 grid grid-cols-2 rounded-full bg-card p-1">
          {([
            ['otp', 'login.tabOtp'],
            ['password', 'login.tabPassword'],
          ] as const).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={tab === key ? 'primary' : 'ghost'}
              className="h-11 rounded-full shadow-none"
              onPress={() => {
                setTab(key);
                setNotice(null);
                clearAuthError();
              }}
            >
              {t(label)}
            </Button>
          ))}
        </div>

        {authError ? (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {authError}
          </p>
        ) : null}
        <p
          aria-live="polite"
          className={`mt-3 text-sm font-medium text-muted ${notice ? '' : 'sr-only'}`}
        >
          {notice}
        </p>

        {tab === 'otp' ? (
          <div className="mt-7 flex flex-col">
            <div className="flex h-[74px] gap-3">
              <div
                className="flex w-[73px] shrink-0 items-center justify-center rounded-[18px] bg-card text-[2rem]"
                aria-hidden="true"
              >
                🇺🇸
              </div>
              <label htmlFor="login-phone" className="sr-only">
                {t('login.phone')}
              </label>
              <input
                id="login-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('login.phonePlaceholder')}
                className={fieldClass}
              />
            </div>

            {otpSent ? (
              <>
                <label htmlFor="login-code" className="sr-only">
                  {t('login.code')}
                </label>
                <input
                  id="login-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={t('login.codePlaceholder')}
                  className={`${fieldClass} mt-6`}
                  maxLength={6}
                />
                <p className="mt-3 text-sm font-medium text-accent">
                  {t('login.otpHint')}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  isPending={authLoading}
                  isDisabled={authLoading || code.trim().length < 4}
                  onPress={() => void onConfirmOtp()}
                  className="mt-10 h-[76px] rounded-full text-xl font-extrabold shadow-none"
                >
                  {t('login.confirmOtp')}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                fullWidth
                isPending={authLoading}
                isDisabled={authLoading || !phone.trim()}
                onPress={() => void onSendOtp()}
                className="mt-10 h-[76px] rounded-full text-xl font-extrabold shadow-none"
              >
                {t('login.sendOtp')}
              </Button>
            )}
          </div>
        ) : (
          <form
            className="mt-7 flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void onPasswordSubmit();
            }}
          >
            {mode === 'register' ? (
              <div className="mb-6 grid grid-cols-2 gap-3">
                <label htmlFor="login-first-name" className="sr-only">
                  {t('login.firstName')}
                </label>
                <input
                  id="login-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={t('login.firstName')}
                  className={`${fieldClass} px-4`}
                />
                <label htmlFor="login-last-name" className="sr-only">
                  {t('login.lastName')}
                </label>
                <input
                  id="login-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder={t('login.lastName')}
                  className={`${fieldClass} px-4`}
                />
              </div>
            ) : null}

            <label htmlFor="login-email" className="sr-only">
              {t('login.emailLabel')}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('login.emailLabel')}
              className={fieldClass}
            />

            <div className="relative mt-6 h-[74px]">
              <label htmlFor="login-password" className="sr-only">
                {t('login.password')}
              </label>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('login.password')}
                className={`${fieldClass} pr-16`}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-3 flex w-12 items-center justify-center rounded-full text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {showPassword ? (
                    <>
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="m3 3 18 18" />
                      <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-2.1 2.8M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4.1-.8" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {mode === 'signin' ? (
              <button
                type="button"
                className="mt-5 self-end rounded px-1 py-1 text-base font-semibold text-danger outline-none focus-visible:ring-2 focus-visible:ring-danger"
                onClick={() => setNotice('Password recovery is not configured yet.')}
              >
                Forget Password?
              </button>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isPending={authLoading}
              isDisabled={
                authLoading ||
                !email.trim() ||
                !password ||
                (mode === 'register' && (!firstName.trim() || !lastName.trim()))
              }
              className="mt-10 h-[76px] rounded-full text-xl font-extrabold shadow-none"
            >
              {mode === 'register' ? t('login.register') : t('login.signIn')}
            </Button>
          </form>
        )}

        {tab === 'password' ? (
          <p className="mt-5 text-center text-[0.98rem] font-medium text-muted">
            {mode === 'signin' ? "Don't Have Account? " : 'Already Have Account? '}
            <button
              type="button"
              className="font-bold text-foreground outline-none focus-visible:underline"
              onClick={() => {
                setMode((current) => (current === 'signin' ? 'register' : 'signin'));
                setNotice(null);
                clearAuthError();
              }}
            >
              {mode === 'signin' ? t('login.register') : t('login.signIn')}
            </button>
          </p>
        ) : null}

        {tab === 'password' && mode === 'signin' ? (
          <section className="mt-auto pt-14">
            <div className="flex items-center gap-3 text-muted">
              <span className="h-px flex-1 bg-border" />
              <span className="text-base font-semibold">Or Use</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="secondary"
                className="h-16 rounded-xl bg-foreground text-base font-bold text-background shadow-none"
                onPress={() => setNotice('Google login is not configured yet.')}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6">
                  <path
                    fill="#4285F4"
                    d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.7h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 5-.9 6.7-2.5L15.5 17c-.9.6-2 1-3.5 1a5.9 5.9 0 0 1-5.5-4.1H3.2v2.6A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.5 13.9A6 6 0 0 1 6.2 12c0-.7.1-1.3.3-1.9V7.5H3.2A10 10 0 0 0 2 12c0 1.6.4 3.1 1.2 4.5l3.3-2.6Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6c1.6 0 3 .5 4.1 1.6l3-3A10 10 0 0 0 3.2 7.5l3.3 2.6A5.9 5.9 0 0 1 12 6Z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-16 rounded-xl bg-card text-base font-bold text-foreground shadow-none"
                onPress={() => setNotice('Apple login is not configured yet.')}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-6 fill-current"
                >
                  <path d="M17.1 12.5c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 1-3.7 1-.8 0-2-1-3.3-1-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.9 1.4-3-.1 0-2.7-1-2.7-4.1ZM14.6 5.3A4.5 4.5 0 0 0 15.7 2a4.7 4.7 0 0 0-3.1 1.6 4.3 4.3 0 0 0-1.1 3.2 3.9 3.9 0 0 0 3.1-1.5Z" />
                </svg>
                Apple
              </Button>
            </div>
          </section>
        ) : (
          <p className="mt-auto pt-8 text-center text-xs text-muted">{t('login.terms')}</p>
        )}
      </div>
    </AppFrame>
  );
}
