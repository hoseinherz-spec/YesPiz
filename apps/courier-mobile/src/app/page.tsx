'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getCourierToken } from '@/lib/auth';

export default function CourierIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getCourierToken() ? '/home/' : '/login/');
  }, [router]);

  return null;
}
