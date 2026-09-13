import {
  pizzaAvailable,
  publicPresentation,
  validatePresentation,
  type PizzaPresentation,
} from "./presentation";
const presentation = (): PizzaPresentation => ({
  gallery: ["/pizza.png"],
  fields: [
    { name: "Calories", type: "number", value: "700", visibility: "public" },
    { name: "Cost", type: "number", value: "3", visibility: "internal" },
  ],
  availability: {
    enabled: true,
    timezone: "UTC",
    periods: [{ day: 1, opens: "11:00", closes: "22:00" }],
    closedDates: [],
  },
});
describe("Pizza presentation and availability", () => {
  it("projects only public fields and keeps internal metadata out", () => {
    expect(publicPresentation(presentation())).toEqual({
      gallery: ["/pizza.png"],
      fields: [{ name: "Calories", type: "number", value: "700" }],
    });
  });
  it("checks local opening, closing boundary and closure dates", () => {
    const p = presentation();
    expect(pizzaAvailable(p, new Date("2026-09-14T11:00:00Z"))).toBe(true);
    expect(pizzaAvailable(p, new Date("2026-09-14T22:00:00Z"))).toBe(false);
    p.availability.closedDates = ["2026-09-14"];
    expect(pizzaAvailable(p, new Date("2026-09-14T12:00:00Z"))).toBe(false);
  });
  it("rejects invalid hours, field values and unsafe image URLs", () => {
    const p = presentation();
    p.gallery = ["javascript:alert(1)"];
    expect(() => validatePresentation(p)).toThrow();
    p.gallery = [];
    p.fields[0].value = "oops";
    expect(() => validatePresentation(p)).toThrow();
    p.fields = [];
    p.availability.periods[0].opens = "33:00";
    expect(() => validatePresentation(p)).toThrow();
  });
});
