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

export function usePublishedComboQuery(id: string, locale?: string) {
  return useQuery({
    queryKey: [...catalogKeys.combo(id), locale ?? 'en'],
    queryFn: () => catalogClient.getPublishedCombo(id, { locale }),
    enabled: Boolean(id),
  });
}

export function useMenuVersionsQuery(accessToken?: string) {
  return useQuery({
    queryKey: [...catalogKeys.versions(), accessToken ?? ''],
    queryFn: () => catalogClient.listVersions({ accessToken }),
    enabled: Boolean(accessToken),
  });
}
