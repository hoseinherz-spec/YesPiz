import { canReceiveOrder, validateHours, withinHours } from "./availability";
describe("opening-hour allocation", () => {
  const provider = {
    hoursEnabled: true,
    timezone: "Europe/Vienna",
    openingHours: [{ day: 4, opens: "11:00", closes: "22:00" }],
    closedDates: [],
  };
  it("uses the kitchen timezone, including the closing boundary", () => {
    expect(withinHours(provider, new Date("2026-09-10T09:00:00Z"))).toBe(true);
    expect(withinHours(provider, new Date("2026-09-10T20:00:00Z"))).toBe(false);
    expect(withinHours(provider, new Date("2026-09-11T12:00:00Z"))).toBe(false);
  });
  it("closure dates override regular opening", () => {
    expect(
      withinHours(
        { ...provider, closedDates: ["2026-09-10"] },
        new Date("2026-09-10T12:00:00Z"),
      ),
    ).toBe(false);
  });
  it("keeps manual operations unchanged until hours are enabled", () => {
    expect(withinHours({ hoursEnabled: false, openingHours: [] })).toBe(true);
    expect(canReceiveOrder({ acceptingOrders: false })).toBe(false);
  });
  it("expiring a timed pause never overrides suspension or exhausted stock", () => {
    const base = { acceptingOrders: false, pausedUntil: new Date(0) };
    expect(canReceiveOrder(base)).toBe(true);
    expect(canReceiveOrder({ ...base, autoSuspended: true })).toBe(false);
    expect(
      canReceiveOrder({ ...base, eightySixedItemIds: ["pizza"] }, ["pizza"]),
    ).toBe(false);
  });
  it("rejects overlaps, invalid timezones and impossible closure dates", () => {
    expect(() => validateHours("No/Such", [], [])).toThrow();
    expect(() =>
      validateHours(
        "Europe/Vienna",
        [{ day: 1, opens: "18:00", closes: "11:00" }],
        [],
      ),
    ).toThrow();
    expect(() =>
      validateHours(
        "Europe/Vienna",
        [...provider.openingHours, ...provider.openingHours],
        [],
      ),
    ).toThrow();
    expect(() => validateHours("Europe/Vienna", [], ["2026-02-30"])).toThrow();
  });
});
