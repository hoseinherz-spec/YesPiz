'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getProviderToken } from '@/lib/auth';

export default function ProviderHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getProviderToken() ? '/offers' : '/login');
  }, [router]);

  return null;
}
