'use client';

import { Button, Typography } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { clearProviderToken } from '@/lib/auth';

const NAV = [
  { href: '/offers', label: 'Offers' },
  { href: '/kitchen', label: 'Kitchen' },
  { href: '/batches', label: 'Batches' },
] as const;

export function ProviderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <Typography type="h3" className="text-lg font-semibold">
            Yespizz Kitchen
          </Typography>
          <p className="text-muted text-xs">Provider panel</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-foreground text-background'
                    : 'text-foreground hover:opacity-80'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              clearProviderToken();
              router.replace('/login');
            }}
          >
            Log out
          </Button>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
