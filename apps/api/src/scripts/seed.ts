import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { AppModule } from "../app.module";
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

  let admin = await users.findOne({ email: adminEmail }).exec();
  if (!admin) {
    admin = await users.create({
      firstName: "Admin",
      lastName: "Yespizz",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
    });
    console.log(`Created admin ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  let providerUser = await users
    .findOne({ email: "provider.munich@yespizz.local" })
    .exec();
  if (!providerUser) {
    providerUser = await users.create({
      firstName: "Demo",
      lastName: "Kitchen",
      email: "provider.munich@yespizz.local",
      passwordHash: await bcrypt.hash("Provider123!", 10),
      roles: [UserRole.PROVIDER],
      activeRole: UserRole.PROVIDER,
      emailVerifiedAt: new Date(),
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
    courierUser = await users.create({
      firstName: "Demo",
      lastName: "Courier",
      email: courierEmail,
      passwordHash: await bcrypt.hash("Courier123!", 10),
      roles: [UserRole.COURIER],
      activeRole: UserRole.COURIER,
      emailVerifiedAt: new Date(),
    });
    console.log(`Created courier ${courierEmail}`);
  } else {
    console.log(`Courier already exists: ${courierEmail}`);
  }

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

  let customer = await users
    .findOne({ email: "customer@yespizz.local" })
    .exec();
  if (!customer) {
    customer = await users.create({
      firstName: "Demo",
      lastName: "Customer",
      email: "customer@yespizz.local",
      passwordHash: await bcrypt.hash("Customer123!", 10),
      roles: [UserRole.CUSTOMER],
      activeRole: UserRole.CUSTOMER,
      emailVerifiedAt: new Date(),
    });
    console.log("Created demo customer customer@yespizz.local / Customer123!");
  } else {
    console.log("Demo customer already exists: customer@yespizz.local");
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
