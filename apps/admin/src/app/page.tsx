'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAdminToken } from '@/lib/auth';

export default function AdminHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAdminToken() ? '/menu' : '/login');
  }, [router]);

  return null;
}
