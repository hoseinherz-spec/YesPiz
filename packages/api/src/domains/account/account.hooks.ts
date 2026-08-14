'use client';

import { useQuery } from '@tanstack/react-query';
import { accountClient } from './account.client';
import { accountKeys } from './account.keys';

export function useMeQuery(accessToken?: string) {
  return useQuery({
    queryKey: [...accountKeys.me(), accessToken ?? ''],
    queryFn: () => accountClient.getMe({ accessToken }),
    enabled: Boolean(accessToken),
  });
}
