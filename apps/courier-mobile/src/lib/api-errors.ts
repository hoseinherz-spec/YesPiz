import { ApiError } from '@repo/api';

const MESSAGE_BY_KEY: Record<string, string> = {
  'errors.otpInvalid': 'Invalid code or PIN. Check the value and try again.',
  'errors.forbidden': 'You are not assigned to this order.',
  'errors.notFound': 'Order or batch not found.',
  'errors.badRequest':
    'Action rejected — wrong order state, seal mismatch, or you are too far from the location.',
};

export function formatApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) {
    return MESSAGE_BY_KEY[err.message] ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
