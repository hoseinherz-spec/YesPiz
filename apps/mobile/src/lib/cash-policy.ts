import type { CashAvailabilityResponse } from '@repo/api';

export function cashBlockedReason(
  avail: CashAvailabilityResponse,
  orderTotalCents: number,
): 'banned' | 'over_cap' | null {
  if (!avail.available) {
    if (avail.failedCashCount >= avail.threshold) return 'banned';
    return 'banned';
  }
  if (orderTotalCents > avail.hardCapCents) return 'over_cap';
  return null;
}
