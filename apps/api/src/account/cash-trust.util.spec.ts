import {
  applyCashRestoreScore,
  applyFailedCashPenalty,
  cashAvailabilityFromTrust,
  CashTrustTier,
  tierFromScore,
} from "./cash-trust.util";

describe("cash-trust.util", () => {
  it("maps score bands to tiers", () => {
    expect(tierFromScore(100)).toBe(CashTrustTier.FULL);
    expect(tierFromScore(79)).toBe(CashTrustTier.CAP);
    expect(tierFromScore(39)).toBe(CashTrustTier.PREPAY);
    expect(tierFromScore(15)).toBe(CashTrustTier.ONLINE_ONLY);
    expect(tierFromScore(0, true)).toBe(CashTrustTier.BANNED);
  });

  it("penalizes failed cash and restores partially on admin restore", () => {
    expect(applyFailedCashPenalty(100)).toBe(75);
    expect(applyFailedCashPenalty(10)).toBe(0);
    expect(applyCashRestoreScore()).toBe(60);
  });

  it("blocks cash below score 40 with reason code", () => {
    const blocked = cashAvailabilityFromTrust(35, false, 50_000);
    expect(blocked.available).toBe(false);
    expect(blocked.reasonCode).toBe("cash_trust_low");
    expect(blocked.tier).toBe(CashTrustTier.PREPAY);
  });

  it("reduces cap for mid trust scores", () => {
    const mid = cashAvailabilityFromTrust(55, false, 50_000);
    expect(mid.available).toBe(true);
    expect(mid.effectiveCapCents).toBe(12_500);

    const high = cashAvailabilityFromTrust(85, false, 50_000);
    expect(high.effectiveCapCents).toBe(50_000);
  });
});
