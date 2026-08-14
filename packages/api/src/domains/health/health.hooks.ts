'use client';

import { useQuery } from '@tanstack/react-query';
import { healthClient } from './health.client';
import { healthKeys } from './health.keys';

export function useHelloQuery(locale?: string) {
  return useQuery({
    queryKey: [...healthKeys.hello(), locale ?? 'en'],
    queryFn: () => healthClient.getHello({ locale }),
  });
}
