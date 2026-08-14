export const catalogKeys = {
  all: ['catalog'] as const,
  menu: () => [...catalogKeys.all, 'menu'] as const,
  versions: () => [...catalogKeys.all, 'versions'] as const,
};
