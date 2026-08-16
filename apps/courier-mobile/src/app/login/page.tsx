'use client';

import { accountClient, ApiError } from '@repo/api';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AccountField,
  AccountHero,
  AccountNotice,
  AccountScreen,
  PasswordField,
} from '@/components/AccountScreen';
import { getCourierToken, setCourierToken } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

export default function CourierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (getCourierToken()) router.replace('/home/');
  }, [router]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await accountClient.loginAsRole('courier', {
        method: 'password',
        email,
        password,
      });
      setCourierToken(res.accessToken);
      router.replace('/home/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountScreen title="Log In">
      <AccountHero title="Log In" description="Enter details to log in" />

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
      {notice ? <AccountNotice>{notice}</AccountNotice> : null}

      <form
        className="mt-4 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AccountField
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="Email Address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button
          variant="ghost"
          onPress={() => setNotice('Contact dispatch to reset your courier password.')}
          className="h-auto justify-end self-end px-1 py-1 font-semibold text-danger"
        >
          Forget Password?
        </Button>
        <Button
          type="button"
          variant="primary"
          isPending={loading}
          onPress={() => void submit()}
          className={hx.btnPrimary}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm font-medium text-muted">
        Don&apos;t Have Account?{' '}
        <button
          type="button"
          className="font-bold text-foreground outline-none focus-visible:underline"
          onClick={() =>
            setNotice('Courier accounts are created by your dispatch manager.')
          }
        >
          Sign Up
        </button>
      </p>

      <div className="mt-auto pt-10">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm font-semibold">Or Use</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {['Google', 'Apple'].map((provider) => (
            <Button
              key={provider}
              variant="secondary"
              onPress={() => {
                setNotice(`${provider} login is not configured yet.`);
              }}
              className={cn(hx.btnSecondary, 'h-16 rounded-2xl')}
            >
              {provider}
            </Button>
          ))}
        </div>
      </div>
    </AccountScreen>
  );
}
