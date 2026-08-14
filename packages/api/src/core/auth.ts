import type { ApiRequestOptions } from './api-helper';

export type AuthRequestOptions = ApiRequestOptions & {
  accessToken?: string;
};

export function withAuth(
  options: AuthRequestOptions = {},
): ApiRequestOptions {
  const { accessToken, headers, ...rest } = options;
  return {
    ...rest,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  };
}
