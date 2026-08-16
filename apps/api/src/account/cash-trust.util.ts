export enum CashTrustTier {
  FULL = "full",
  CAP = "cap",
  PREPAY = "prepay",
  ONLINE_ONLY = "online_only",
  BANNED = "banned",
}

export const CASH_TRUST_FAILED_PENALTY = 25;
export const CASH_TRUST_RESTORE_SCORE = 60;

export function tierFromScore(
  score: number,
  cashBanned = false,
): CashTrustTier {
  if (cashBanned || score <= 0) return CashTrustTier.BANNED;
  if (score < 20) return CashTrustTier.ONLINE_ONLY;
  if (score < 40) return CashTrustTier.PREPAY;
  if (score < 60) return CashTrustTier.CAP;
  if (score < 80) return CashTrustTier.CAP;
  return CashTrustTier.FULL;
}

export function applyFailedCashPenalty(currentScore: number): number {
  return Math.max(0, currentScore - CASH_TRUST_FAILED_PENALTY);
}

export function applyCashRestoreScore(): number {
  return CASH_TRUST_RESTORE_SCORE;
}

export type CashTrustAvailability = {
  available: boolean;
  effectiveCapCents: number;
  tier: CashTrustTier;
  reasonCode?: string;
};

/** Light ladder enforcement for cashAvailability — score below 40 blocks cash. */
export function cashAvailabilityFromTrust(
  score: number,
  cashBanned: boolean,
  hardCapCents: number,
): CashTrustAvailability {
  const tier = tierFromScore(score, cashBanned);

  if (
    cashBanned ||
    tier === CashTrustTier.BANNED ||
    tier === CashTrustTier.ONLINE_ONLY
  ) {
    return {
      available: false,
      effectiveCapCents: 0,
      tier,
      reasonCode: "cash_trust_restricted",
    };
  }

  if (score < 40) {
    return {
      available: false,
      effectiveCapCents: 0,
      tier,
      reasonCode: "cash_trust_low",
    };
  }

  if (score < 60) {
    return {
      available: true,
      effectiveCapCents: Math.floor(hardCapCents * 0.25),
      tier,
    };
  }

  if (score < 80) {
    return {
      available: true,
      effectiveCapCents: Math.floor(hardCapCents * 0.5),
      tier,
    };
  }

  return {
    available: true,
    effectiveCapCents: hardCapCents,
    tier,
  };
}
