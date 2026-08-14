'use client';

import { useQuery } from '@tanstack/react-query';
import { catalogClient } from './catalog.client';
import { catalogKeys } from './catalog.keys';

export function usePublishedMenuQuery(locale?: string) {
  return useQuery({
    queryKey: [...catalogKeys.menu(), locale ?? 'en'],
    queryFn: () => catalogClient.getPublishedMenu({ locale }),
  });
}

export function useMenuVersionsQuery(accessToken?: string) {
  return useQuery({
    queryKey: [...catalogKeys.versions(), accessToken ?? ''],
    queryFn: () => catalogClient.listVersions({ accessToken }),
    enabled: Boolean(accessToken),
  });
}
