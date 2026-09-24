export const catalogKeys = {
  all: ['catalog'] as const,
  menu: () => [...catalogKeys.all, 'menu'] as const,
  combo: (id: string) => [...catalogKeys.all, 'combo', id] as const,
  versions: () => [...catalogKeys.all, 'versions'] as const,
};
