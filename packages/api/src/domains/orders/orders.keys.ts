export const ordersKeys = {
  all: ['orders'] as const,
  list: () => [...ordersKeys.all, 'list'] as const,
  detail: (id: string) => [...ordersKeys.all, 'detail', id] as const,
  addresses: () => [...ordersKeys.all, 'addresses'] as const,
};
