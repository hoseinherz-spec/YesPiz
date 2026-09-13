import {
  priceCustomization,
  validateCustomization,
  type PizzaCustomization,
} from "./customization";

const menu = (): PizzaCustomization => ({
  variants: [
    { id: "regular", name: "26 cm", priceCents: 1000, isActive: true },
    { id: "large", name: "40 cm", priceCents: 1600, isActive: true },
  ],
  groups: [
    {
      id: "dough",
      name: "Dough",
      min: 1,
      max: 1,
      options: [
        {
          id: "thin",
          name: "Thin",
          priceCents: 0,
          isActive: true,
          variantIds: [],
        },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      min: 0,
      max: 2,
      options: [
        {
          id: "cheese",
          name: "Cheese",
          priceCents: 250,
          isActive: true,
          variantIds: ["large"],
        },
        {
          id: "olives",
          name: "Olives",
          priceCents: 100,
          isActive: false,
          variantIds: [],
        },
      ],
    },
  ],
});
describe("Dynamic pizza choices", () => {
  it("prices only server-defined variant and selected options and snapshots their names", () => {
    expect(
      priceCustomization(menu(), "large", [
        { groupId: "dough", optionIds: ["thin"] },
        { groupId: "extras", optionIds: ["cheese"] },
      ]),
    ).toMatchObject({
      unitPriceCents: 1850,
      selectionLabels: ["40 cm", "Dough: Thin", "Extras: Cheese"],
    });
  });
  it.each([
    ["missing required group", []],
    ["unknown group", [{ groupId: "hacked", optionIds: [] }]],
    ["duplicate options", [{ groupId: "dough", optionIds: ["thin", "thin"] }]],
    [
      "disabled option",
      [
        { groupId: "dough", optionIds: ["thin"] },
        { groupId: "extras", optionIds: ["olives"] },
      ],
    ],
    [
      "duplicate group",
      [
        { groupId: "dough", optionIds: ["thin"] },
        { groupId: "dough", optionIds: ["thin"] },
      ],
    ],
  ])("rejects %s", (_, selections) => {
    expect(() =>
      priceCustomization(
        menu(),
        "large",
        selections as { groupId: string; optionIds: string[] }[],
      ),
    ).toThrow();
  });
  it("uses a size-specific extra price override", () => {
    const config = menu();
    config.groups[1].options[0].priceOverrides = [
      { variantId: "large", priceCents: 400 },
    ];
    expect(
      priceCustomization(validateCustomization(config), "large", [
        { groupId: "dough", optionIds: ["thin"] },
        { groupId: "extras", optionIds: ["cheese"] },
      ]).unitPriceCents,
    ).toBe(2000);
  });
  it("rejects size-incompatible choices and disabled variants", () => {
    expect(() =>
      priceCustomization(menu(), "regular", [
        { groupId: "dough", optionIds: ["thin"] },
        { groupId: "extras", optionIds: ["cheese"] },
      ]),
    ).toThrow();
    const config = menu();
    config.variants[0].isActive = false;
    expect(() => priceCustomization(config, "regular", [])).toThrow();
  });
  it("prevents publishing an impossible required selection for any active size", () => {
    const config = menu();
    config.groups[0].options[0].variantIds = ["large"];
    expect(() => validateCustomization(config)).toThrow("cannot be met");
  });
  it("strips extra nested fields before persisting public configuration", () => {
    const config = menu();
    Object.assign(config.variants[0], { providerId: "private" });
    expect(validateCustomization(config).variants[0]).not.toHaveProperty(
      "providerId",
    );
  });
  it("rejects malformed configuration as a client error", () => {
    for (const config of [
      { variants: [null], groups: [] },
      {
        variants: menu().variants,
        groups: [{ id: "x", name: "x", min: 0, max: 1, options: [null] }],
      },
    ]) {
      try {
        validateCustomization(config as unknown as PizzaCustomization);
        throw new Error("accepted");
      } catch (error) {
        expect((error as { getStatus(): number }).getStatus()).toBe(400);
      }
    }
  });
});
