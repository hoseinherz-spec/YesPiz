'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersClient } from './orders.client';
import { ordersKeys } from './orders.keys';

export function useOrdersQuery(accessToken?: string) {
  return useQuery({
    queryKey: [...ordersKeys.list(), accessToken ?? ''],
    queryFn: () => ordersClient.list({ accessToken }),
    enabled: Boolean(accessToken),
  });
}

export function useOrderQuery(orderId?: string, accessToken?: string) {
  return useQuery({
    queryKey: [...ordersKeys.detail(orderId ?? ''), accessToken ?? ''],
    queryFn: () => ordersClient.get(orderId!, { accessToken }),
    enabled: Boolean(accessToken && orderId),
  });
}

export function useAddressesQuery(accessToken?: string) {
  return useQuery({
    queryKey: [...ordersKeys.addresses(), accessToken ?? ''],
    queryFn: () => ordersClient.listAddresses({ accessToken }),
    enabled: Boolean(accessToken),
  });
}
