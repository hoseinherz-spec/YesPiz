'use client';

import { accountClient, ApiError } from '@repo/api';
import { Button, Card, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { getAdminToken, setAdminToken } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@yespizz.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      router.replace('/menu');
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await accountClient.loginAsRole('admin', {
        method: 'password',
        email,
        password,
      });
      setAdminToken(res.accessToken);
      router.replace('/menu');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <Card.Content className="flex flex-col gap-4 p-0">
          <div>
            <Typography type="h1" className="text-2xl font-semibold">
              Admin login
            </Typography>
            <p className="text-muted mt-1 text-sm">Yespizz operations console</p>
          </div>
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-background rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-background rounded-md border px-3 py-2"
              />
            </label>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" variant="primary" isDisabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </main>
  );
}
