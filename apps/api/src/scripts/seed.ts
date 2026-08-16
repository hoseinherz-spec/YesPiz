import { NestFactory } from "@nestjs/core";
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

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const providersModel = app.get<Model<ProviderDocument>>(
    getModelToken(Provider.name),
  );
  const catalog = app.get(CatalogService);
  const providers = app.get(ProvidersService);
  const couriers = app.get(CouriersService);
  const orders = app.get(OrdersService);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@yespizz.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
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
      password: "Provider123!",
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
      password: "Courier123!",
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
      passwordHash: await bcrypt.hash("Customer123!", 10),
      roles: [UserRole.CUSTOMER],
      activeRole: UserRole.CUSTOMER,
    });
    console.log(`Created customer ${customerEmail} / Customer123!`);
  }

  console.log("Demo logins:");
  console.log(`  admin     ${adminEmail} / ${adminPassword}`);
  console.log("  provider  provider.munich@yespizz.local / Provider123!");
  console.log("  courier   courier@yespizz.local / Courier123!");
  console.log("  customer  customer@yespizz.local / Customer123!");

  const courierProfile = await couriers.getOrCreateProfile(courierUser.id);
  // Link courier to demo kitchen via vehicleType tag for ops demos
  if (
    !courierProfile.vehicleType ||
    !courierProfile.vehicleType.includes("demo-provider:")
  ) {
    await couriers.updateProfile(courierUser.id, {
      vehicleType: `bike|demo-provider:${existingProvider.id}`,
    });
    console.log(
      `Linked courier ${courierEmail} to provider ${existingProvider.id}`,
    );
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
    const pizzas = await catalog.addCategory(version.id, {
      name: "Pizzas",
      sortOrder: 1,
    });
    const drinks = await catalog.addCategory(version.id, {
      name: "Drinks",
      sortOrder: 2,
    });

    await catalog.addItem(version.id, {
      categoryId: pizzas.id,
      name: "Margherita",
      description: "Tomato, mozzarella, basil",
      priceCents: 899,
      prepWeight: 1,
      tags: ["vegetarian"],
    });
    await catalog.addItem(version.id, {
      categoryId: pizzas.id,
      name: "Diavola",
      description: "Spicy salami, chili, mozzarella",
      priceCents: 1099,
      prepWeight: 1.2,
      tags: ["spicy"],
    });
    await catalog.addItem(version.id, {
      categoryId: pizzas.id,
      name: "Quattro Formaggi",
      description: "Four cheese blend",
      priceCents: 1199,
      prepWeight: 1.1,
      tags: ["vegetarian"],
    });
    await catalog.addItem(version.id, {
      categoryId: drinks.id,
      name: "Cola 0.33l",
      description: "Chilled soft drink",
      priceCents: 249,
      prepWeight: 0.2,
    });

    await catalog.publish(version.id);
    console.log("Published seed menu with pizzas");
  } else {
    console.log(`Published menu already at v${published.version.version}`);
  }

  await app.close();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
