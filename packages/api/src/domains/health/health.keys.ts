export const healthKeys = {
  all: ['health'] as const,
  hello: () => [...healthKeys.all, 'hello'] as const,
};
