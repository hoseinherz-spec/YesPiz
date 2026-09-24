const version = db.menu_versions.find({ published: true }).sort({ version: -1 }).limit(1).toArray()[0];
if (!version) throw new Error("No published menu version found.");

const pizzas = db.menu_items.find({ menuVersionId: version._id, productType: "pizza", isActive: true }).toArray();
const byName = new Map(pizzas.map((pizza) => [pizza.name, pizza]));
const category = db.categories.findOne({ menuVersionId: version._id, name: "Premium" }) ?? db.categories.findOne({ menuVersionId: version._id });
if (!category) throw new Error("No category found for published menu.");

const component = (name, quantity = 1) => {
  const pizza = byName.get(name);
  if (!pizza) throw new Error(`Missing combo pizza: ${name}`);
  return { menuItemId: String(pizza._id), quantity, size: "medium", name: pizza.name, sizeName: "medium", imageUrl: pizza.imageUrl };
};

const combos = [
  { name: "Pizza Night Duo", description: "Two crowd favorites for an easy night in.", priceCents: 1990, sortOrder: 101, comboComponents: [component("Margherita"), component("Pepperoni")] },
  { name: "Spicy Sharing Box", description: "A bold trio for friends who like a little heat.", priceCents: 3190, sortOrder: 102, comboComponents: [component("Diavola"), component("Pepperoni"), component("BBQ Chicken")] },
  { name: "Veggie Table", description: "Three garden-forward pizzas made for sharing.", priceCents: 2990, sortOrder: 103, comboComponents: [component("Vegetariana"), component("Funghi"), component("Quattro Formaggi")] },
];

for (const combo of combos) {
  const now = new Date();
  db.menu_items.updateOne(
    { menuVersionId: version._id, productType: "combo", name: combo.name },
    { $set: { ...combo, categoryId: category._id, isActive: true, deletedAt: null, tags: ["combo", "sharing"], ingredients: [], allergens: [], ingredientIds: [], ingredientOptions: [], recipeChoices: [], recipeRevision: 0, additionalCategoryIds: [], menuVersionId: version._id, imageUrl: combo.comboComponents[0].imageUrl, updatedAt: now }, $setOnInsert: { pizzaId: crypto.randomUUID(), createdAt: now, __v: 0 } },
    { upsert: true },
  );
}
print(`Seeded ${combos.length} combo cards into menu version ${version.version}.`);
