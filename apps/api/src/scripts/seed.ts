import { Coupon } from "../growth/coupon";
import { NestFactory } from "@nestjs/core";
import type { INestApplicationContext } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { AppModule } from "../app.module";
import { AccountService } from "../account/account.service";
import { User, UserDocument } from "../account/schemas/user.schema";
import { UserRole } from "../common/enums";
import { CatalogService } from "../catalog/catalog.service";
import { CouriersService } from "../couriers/couriers.service";
import { OrdersService } from "../orders/orders.service";
import { ProvidersService } from "../providers/providers.service";
import {
  Provider,
  ProviderDocument,
} from "../providers/schemas/provider.schema";
import {
  Category,
  CategoryDocument,
  MenuItem,
  MenuItemDocument,
} from "../catalog/schemas/menu.schema";

export async function seedApplication(app: INestApplicationContext) {
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const providersModel = app.get<Model<ProviderDocument>>(
    getModelToken(Provider.name),
  );
  const categories = app.get<Model<CategoryDocument>>(
    getModelToken(Category.name),
  );
  const menuItems = app.get<Model<MenuItemDocument>>(
    getModelToken(MenuItem.name),
  );
  const catalog = app.get(CatalogService);
  const providers = app.get(ProvidersService);
  const couriers = app.get(CouriersService);
  const orders = app.get(OrdersService);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@yespizz.local";
  const password = (name: string, localDefault: string) => {
    const value = process.env[name];
    if (process.env.NODE_ENV === "production" && !value) {
      throw new Error(`${name} must be set before seeding production demo accounts.`);
    }
    return value || localDefault;
  };
  const adminPassword = password("SEED_ADMIN_PASSWORD", "Admin123!");
  const account = app.get(AccountService);

  let admin = await users.findOne({ email: adminEmail }).exec();
  if (!admin) {
    admin = await account.provisionUser({
      firstName: "Admin",
      lastName: "Yespizz",
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
    });
    console.log(`Created admin ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  let providerUser = await users
    .findOne({ email: "provider.munich@yespizz.local" })
    .exec();
  if (!providerUser) {
    providerUser = await account.provisionUser({
      firstName: "Demo",
      lastName: "Kitchen",
      email: "provider.munich@yespizz.local",
      password: password("SEED_PROVIDER_PASSWORD", "Provider123!"),
      role: UserRole.PROVIDER,
    });
  }

  let existingProvider = await providersModel
    .findOne({ userId: providerUser._id })
    .exec();
  if (!existingProvider) {
    // Near Marienplatz, Munich
    existingProvider = await providers.create({
      userId: providerUser.id,
      name: "Munich Demo Kitchen",
      address: "Marienplatz 1, 80331 München",
      longitude: 11.5755,
      latitude: 48.1374,
      rating: 4.8,
      logoUrl: "https://cdn.yespizz.local/demo-kitchen.png",
    });
    console.log("Created demo provider near Munich");
  }

  const courierEmail = "courier@yespizz.local";
  let courierUser = await users.findOne({ email: courierEmail }).exec();
  if (!courierUser) {
    courierUser = await account.provisionUser({
      firstName: "Demo",
      lastName: "Courier",
      email: courierEmail,
      password: password("SEED_COURIER_PASSWORD", "Courier123!"),
      role: UserRole.COURIER,
    });
    console.log(`Created courier ${courierEmail}`);
  } else {
    console.log(`Courier already exists: ${courierEmail}`);
  }

  const customerEmail = "customer@yespizz.local";
  let customerUser = await users.findOne({ email: customerEmail }).exec();
  if (!customerUser) {
    customerUser = await users.create({
      firstName: "Demo",
      lastName: "Customer",
      email: customerEmail,
      passwordHash: await bcrypt.hash(
        password("SEED_CUSTOMER_PASSWORD", "Customer123!"),
        10,
      ),
      roles: [UserRole.CUSTOMER],
      activeRole: UserRole.CUSTOMER,
    });
    console.log(`Created customer ${customerEmail}`);
  }

  console.log("Demo logins:");
  console.log(`  admin     ${adminEmail}`);
  console.log("  provider  provider.munich@yespizz.local");
  console.log("  courier   courier@yespizz.local");
  console.log(`  customer  ${customerEmail}`);

  const courierProfile = await couriers.getOrCreateProfile(courierUser.id);
  if (!courierProfile.vehicleType || courierProfile.vehicleType.includes("demo-provider:")) {
    await couriers.updateProfile(courierUser.id, { vehicleType: "scooter", vehicleModel: "Black city scooter" });
  }

  const customer = await users.findOne({ email: customerEmail }).exec();
  if (!customer) {
    throw new Error("Demo customer missing after seed create");
  }

  const customerAddresses = await orders.listAddresses(customer.id);
  if (!customerAddresses.length) {
    await orders.createAddress(customer.id, {
      label: "Home",
      street: "Maximilianstrasse 12",
      city: "Munich",
      zipcode: "80539",
      country: "DE",
      longitude: 11.5755,
      latitude: 48.1374,
      isDefault: true,
    });
    console.log("Created default Munich address for demo customer");
  }

  const published = await catalog.getPublishedMenu();
  if (!published.version) {
    const version = await catalog.createVersion({ notes: "Seed menu v1" });
    const categoryEntries = await Promise.all(
      [
        ["classic", "Classics"],
        ["meat", "Meat lovers"],
        ["veggie", "Veggie"],
        ["spicy", "Spicy"],
        ["premium", "Premium"],
      ].map(async ([key, name], sortOrder) => {
        const category = await catalog.addCategory(version.id, {
          name,
          sortOrder: sortOrder + 1,
        });
        return [key, category.id] as const;
      }),
    );
    const categoryIds = Object.fromEntries(categoryEntries);

    const seedPizzas = [
      {
        category: "classic",
        name: "Margherita",
        description: "San Marzano tomato, fior di latte and fresh basil.",
        priceCents: 990,
        tags: ["vegetarian", "classic"],
        ingredients: [
          "San Marzano tomato",
          "Fior di latte",
          "Fresh basil",
          "Olive oil",
        ],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-margherita.png",
      },
      {
        category: "classic",
        name: "Pepperoni",
        description: "Crispy pepperoni cups, mozzarella and chili honey.",
        priceCents: 1190,
        tags: ["popular", "meat"],
        ingredients: ["Tomato", "Mozzarella", "Pepperoni", "Chili honey"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-pepperoni.png",
      },
      {
        category: "meat",
        name: "Salami",
        description: "Italian salami, mozzarella and fragrant oregano.",
        priceCents: 1150,
        tags: ["meat", "classic"],
        ingredients: ["Tomato", "Mozzarella", "Italian salami", "Oregano"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-salami.png",
      },
      {
        category: "meat",
        name: "BBQ Chicken",
        description: "Grilled chicken, red onion and smoky BBQ sauce.",
        priceCents: 1390,
        tags: ["popular", "meat"],
        ingredients: ["BBQ sauce", "Mozzarella", "Chicken", "Red onion"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-bbq-chicken.png",
      },
      {
        category: "veggie",
        name: "Quattro Formaggi",
        description: "Mozzarella, gorgonzola, parmesan and fontina.",
        priceCents: 1350,
        tags: ["vegetarian", "premium"],
        ingredients: ["Mozzarella", "Gorgonzola", "Parmesan", "Fontina"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-quattro-formaggi.png",
      },
      {
        category: "spicy",
        name: "Diavola",
        description: "Spicy salami, chili flakes and creamy mozzarella.",
        priceCents: 1290,
        tags: ["spicy", "meat"],
        ingredients: ["Tomato", "Mozzarella", "Spicy salami", "Chili flakes"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-diavola.png",
      },
      {
        category: "classic",
        name: "Tonno",
        description: "Tuna, red onion and capers on a bright tomato base.",
        priceCents: 1250,
        tags: ["seafood"],
        ingredients: ["Tomato", "Mozzarella", "Tuna", "Red onion", "Capers"],
        allergens: ["gluten", "milk", "fish"],
        imageUrl: "/images/pizza-tonno.png",
      },
      {
        category: "veggie",
        name: "Vegetariana",
        description: "Roasted peppers, zucchini, eggplant and cherry tomatoes.",
        priceCents: 1190,
        tags: ["vegetarian"],
        ingredients: [
          "Tomato",
          "Mozzarella",
          "Peppers",
          "Zucchini",
          "Eggplant",
        ],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-vegetariana.png",
      },
      {
        category: "veggie",
        name: "Funghi",
        description: "Sautéed mushrooms, mozzarella, parsley and garlic.",
        priceCents: 1150,
        tags: ["vegetarian", "classic"],
        ingredients: ["Tomato", "Mozzarella", "Mushrooms", "Parsley", "Garlic"],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-funghi.png",
      },
      {
        category: "premium",
        name: "YesPiz Special",
        description: "Burrata, prosciutto, arugula and shaved truffle.",
        priceCents: 1590,
        tags: ["premium", "popular", "meat"],
        ingredients: [
          "San Marzano tomato",
          "Burrata",
          "Prosciutto",
          "Arugula",
          "Truffle",
        ],
        allergens: ["gluten", "milk"],
        imageUrl: "/images/pizza-yespiz-special.png",
      },
    ];

    for (const [sortOrder, pizza] of seedPizzas.entries()) {
      await catalog.addItem(version.id, {
        categoryId: categoryIds[pizza.category],
        name: pizza.name,
        description: pizza.description,
        priceCents: pizza.priceCents,
        prepWeight: pizza.tags.includes("premium") ? 1.3 : 1,
        sortOrder: sortOrder + 1,
        tags: pizza.tags,
        ingredients: pizza.ingredients,
        allergens: pizza.allergens,
        imageUrl: pizza.imageUrl,
        cookTimeSeconds: 480,
        handoffTempC: 65,
        requiresNumberedSeal: true,
        requiresReadyPhoto: pizza.tags.includes("premium"),
      });
    }

    await catalog.publish(version.id);
    console.log(`Published seed menu with ${seedPizzas.length} pizzas`);
  } else {
    console.log(`Published menu already at v${published.version.version}`);
  }

  // The production mobile export requires at least one concrete combo route.
  // Keep a fresh demo seed useful for the bundles/combo journey as well as
  // ordinary pizza ordering. Clone the published menu so published data is
  // never edited in place.
  const currentMenu = await catalog.getPublishedMenu();
  if (
    currentMenu.version &&
    !currentMenu.items.some((item) => item.productType === "combo")
  ) {
    const draft = await catalog.cloneVersion(currentMenu.version.id);
    const [draftCategories, draftItems] = await Promise.all([
      categories
        .find({ menuVersionId: draft._id, isActive: true, deletedAt: null })
        .exec(),
      menuItems
        .find({
          menuVersionId: draft._id,
          isActive: true,
          deletedAt: null,
          productType: "pizza",
        })
        .exec(),
    ]);
    const byName = new Map<string, MenuItemDocument>();
    for (const item of draftItems) byName.set(item.name, item);
    const preferred = [
      "Margherita",
      "Pepperoni",
      "Diavola",
      "BBQ Chicken",
      "Vegetariana",
      "Funghi",
      "Quattro Formaggi",
    ];
    const pizzas: MenuItemDocument[] = [];
    for (const name of preferred) {
      const item = byName.get(name);
      if (item) pizzas.push(item);
    }
    if (pizzas.length < 2 || !draftCategories.length) {
      throw new Error(
        "Cannot seed demo combos: the published menu needs at least two active pizzas and a category.",
      );
    }
    const first = pizzas[0];
    const second = pizzas[1];
    if (!first || !second)
      throw new Error("Cannot seed demo combos without two pizzas.");
    const premium =
      draftCategories.find((category) => /premium/i.test(category.name)) ??
      draftCategories[0];
    const component = (item: MenuItemDocument, quantity = 1) => ({
      menuItemId: item.id,
      quantity,
      size: "medium" as const,
    });
    const combos = [
      {
        name: "Pizza Night Duo",
        description: "Two crowd favorites for an easy night in.",
        priceCents: 1990,
        components: [first, second],
      },
      {
        name: "Spicy Sharing Box",
        description: "A bold trio for friends who like a little heat.",
        priceCents: 3190,
        components:
          pizzas.length >= 5 ? pizzas.slice(2, 5) : [first, second, first],
      },
      {
        name: "Veggie Table",
        description: "A garden-forward trio made for sharing.",
        priceCents: 2990,
        components:
          pizzas.length >= 3 ? pizzas.slice(-3) : [first, second, first],
      },
    ];
    for (const [index, combo] of combos.entries()) {
      await catalog.addItem(draft.id, {
        categoryId: String(premium._id),
        name: combo.name,
        description: combo.description,
        priceCents: combo.priceCents,
        sortOrder: 101 + index,
        productType: "combo",
        tags: ["combo", "sharing"],
        ingredients: [],
        allergens: [],
        imageUrl: combo.components[0].imageUrl,
        comboComponents: combo.components.map((item) => component(item)),
      });
    }
    await catalog.publish(draft.id);
    console.log(
      `Published demo menu v${draft.version} with ${combos.length} combo cards`,
    );
  }

  // Idempotent, database-backed offers; existing campaign edits are preserved.
  const coupons = app.get<Model<Coupon>>(getModelToken(Coupon.name));
  for (const offer of [
    { code: "PIZZA10", name: "A little pizza love", kind: "percent", value: 10, minSubtotalCents: 1500, maxDiscountCents: 500 },
    { code: "NIGHT5", name: "Your next pizza night", kind: "fixed", value: 500, minSubtotalCents: 3000, maxDiscountCents: 500 },
    { code: "TOGETHER15", name: "Better together", kind: "percent", value: 15, minSubtotalCents: 4500, maxDiscountCents: 1000 },
  ]) await coupons.updateOne({ code: offer.code }, { $setOnInsert: { ...offer, active: true,
    userScope: "all", productScope: "all", minimumEligibleQuantity: 1, createdBy: admin.id,
    startAt: new Date(), endAt: new Date(Date.now() + 90 * 86400000),
  } }, { upsert: true });
  console.log("Seed complete");
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await seedApplication(app);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
