'use client';

import { accountClient, ApiError } from '@repo/api';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getCourierToken, setCourierToken } from '@/lib/auth';

export default function CourierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (getCourierToken()) router.replace('/home/');
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
  }

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-[470px] flex-col bg-black px-[38px] pt-[max(50px,env(safe-area-inset-top))] pb-[max(38px,env(safe-area-inset-bottom))]">
        <header className="relative flex h-16 shrink-0 items-center justify-center">
          <Button
            type="button"
            isIconOnly
            aria-label="Go back"
            variant="secondary"
            className="absolute left-0 size-16 min-w-0 rounded-full bg-[#1d1d23] text-white shadow-none"
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
          <span className="text-xl font-semibold">Log In</span>
        </header>

        <section className="mt-[72px] text-center">
          <h1 className="text-[2.55rem] leading-none font-extrabold tracking-[-0.035em]">
            Log In
          </h1>
          <p className="mt-3 text-[1.05rem] font-medium text-[#92909d]">
            Enter details to log in
          </p>
        </section>

        <form className="mt-12 flex flex-col" onSubmit={onSubmit}>
          <div className="flex h-[74px] gap-3">
            <div
              className="flex w-[73px] shrink-0 items-center justify-center rounded-[18px] bg-[#1d1d23] text-[2rem]"
              aria-hidden="true"
            >
              🇺🇸
            </div>
            <label htmlFor="courier-email" className="sr-only">
              Email address
            </label>
            <input
              id="courier-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 rounded-[18px] bg-[#1d1d23] px-6 text-lg font-semibold text-white outline-none placeholder:text-[#92909d] focus-visible:ring-2 focus-visible:ring-[#fff0dc]"
              placeholder="Email Address"
              autoComplete="username"
              enterKeyHint="next"
            />
          </div>

          <div className="relative mt-6 h-[74px]">
            <label htmlFor="courier-password" className="sr-only">
              Password
            </label>
            <input
              id="courier-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-full w-full rounded-[18px] bg-[#1d1d23] pr-16 pl-6 text-lg font-semibold text-white outline-none placeholder:text-[#92909d] focus-visible:ring-2 focus-visible:ring-[#fff0dc]"
              placeholder="Password"
              autoComplete="current-password"
              enterKeyHint="done"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 flex w-12 items-center justify-center rounded-full text-[#92909d] outline-none focus-visible:ring-2 focus-visible:ring-[#fff0dc]"
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

          <button
            type="button"
            className="mt-5 self-end rounded px-1 py-1 text-base font-semibold text-[#ff4d57] outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d57]"
            onClick={() => setNotice('Contact dispatch to reset your courier password.')}
          >
            Forget Password?
          </button>

          {error ? (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
          <p
            aria-live="polite"
            className={`mt-2 text-sm text-[#92909d] ${notice ? '' : 'sr-only'}`}
          >
            {notice}
          </p>

          <Button
            type="submit"
            fullWidth
            isPending={loading}
            className="mt-10 h-[76px] rounded-full bg-[#fff0dc] text-xl font-extrabold text-[#171416] shadow-none"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[0.98rem] font-medium text-[#92909d]">
          Don&apos;t Have Account?{' '}
          <button
            type="button"
            className="font-bold text-white outline-none focus-visible:underline"
            onClick={() =>
              setNotice('Courier accounts are created by your dispatch manager.')
            }
          >
            Sign Up
          </button>
        </p>

        <section className="mt-auto pt-14">
          <div className="flex items-center gap-3 text-[#92909d]">
            <span className="h-px flex-1 bg-[#2a2a31]" />
            <span className="text-base font-semibold">Or Use</span>
            <span className="h-px flex-1 bg-[#2a2a31]" />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="secondary"
              className="h-16 rounded-xl bg-[#f4f4f6] text-base font-bold text-[#171416] shadow-none"
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
              className="h-16 rounded-xl bg-[#1d1d23] text-base font-bold text-white shadow-none"
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
      </div>
    </main>
  );
}
