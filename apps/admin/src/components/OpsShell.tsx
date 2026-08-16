'use client';

import { Button, Typography } from '@heroui/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { clearAdminToken } from '@/lib/auth';

const NAV = [
  { href: '/menu', label: 'Menu' },
  { href: '/providers', label: 'Providers' },
  { href: '/quality', label: 'Quality' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/live', label: 'Live ops' },
  { href: '/config', label: 'Config' },
  { href: '/exceptions', label: 'Exceptions' },
] as const;

export function OpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-border flex w-full flex-col gap-4 border-b p-4 md:w-56 md:border-b-0 md:border-r">
        <div>
          <Typography type="h3" className="text-lg font-semibold">
            Yespizz Admin
          </Typography>
          <p className="text-muted text-sm">Operations</p>
        </div>
        <nav className="flex flex-row flex-wrap gap-2 md:flex-col">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-foreground text-background'
                    : 'text-foreground hover:opacity-80'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              clearAdminToken();
              router.replace('/login');
            }}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
