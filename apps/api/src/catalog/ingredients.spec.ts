import {
  Product,
  ProductDocument,
  ProductSchema,
  ProductRevision,
  ProductRevisionDocument,
  ProductRevisionSchema,
} from "./products/product.schema";
import { ProductsService } from "./products/products.service";
import { Menu, MenuDocument, MenuSchema } from "./schemas/menu.schema";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { RolesGuard } from "../common/guards/roles.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Connection, createConnection, Model, Types } from "mongoose";
import { IngredientsService } from "./ingredients.service";
import {
  Ingredient,
  IngredientDocument,
  IngredientSchema,
} from "./schemas/ingredient.schema";
import {
  Category,
  CategoryDocument,
  CategorySchema,
  MenuItem,
  MenuItemDocument,
  MenuItemSchema,
  MenuVersion,
  MenuVersionDocument,
  MenuVersionSchema,
} from "./schemas/menu.schema";
import { CreateIngredientDto, UpdateIngredientDto } from "./dto/ingredient.dto";
import { CatalogService } from "./catalog.service";
import { RedisService } from "../redis/redis.service";
import {
  Provider,
  ProviderDocument,
  ProviderSchema,
} from "../providers/schemas/provider.schema";
import { IngredientsController } from "./ingredients.controller";
import { ROLES_KEY } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";

jest.setTimeout(60000);
describe("Ingredient library and pizza references", () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let service: IngredientsService;
  let catalog: CatalogService;
  let ingredients: Model<IngredientDocument>;
  let items: Model<MenuItemDocument>;
  let versions: Model<MenuVersionDocument>;
  let categories: Model<CategoryDocument>;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: "7.0.24" } });
    connection = await createConnection(mongo.getUri()).asPromise();
    ingredients = connection.model<Ingredient, Model<IngredientDocument>>(
      Ingredient.name,
      IngredientSchema,
    );
    items = connection.model<MenuItem, Model<MenuItemDocument>>(
      MenuItem.name,
      MenuItemSchema,
    );
    versions = connection.model<MenuVersion, Model<MenuVersionDocument>>(
      MenuVersion.name,
      MenuVersionSchema,
    );
    categories = connection.model<Category, Model<CategoryDocument>>(
      Category.name,
      CategorySchema,
    );
    const providers = connection.model<Provider, Model<ProviderDocument>>(
      Provider.name,
      ProviderSchema,
    );
    await ingredients.init();
    service = new IngredientsService(
      ingredients,
      items,
      connection.model<ProductRevision, Model<ProductRevisionDocument>>(
        ProductRevision.name,
        ProductRevisionSchema,
      ),
    );
    catalog = new CatalogService(
      {} as RedisService,
      service,
      providers,
      versions,
      categories,
      items,
      new ProductsService(
        connection.model<Product, Model<ProductDocument>>(
          Product.name,
          ProductSchema,
        ),
        connection.model<ProductRevision, Model<ProductRevisionDocument>>(
          ProductRevision.name,
          ProductRevisionSchema,
        ),
        service,
      ),
      connection.model<Menu, Model<MenuDocument>>(Menu.name, MenuSchema),
    );
  });
  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await Promise.all([
      ingredients.deleteMany({}),
      items.deleteMany({}),
      versions.deleteMany({}),
      categories.deleteMany({}),
    ]);
  });
  const onion = {
    name: "Onion",
    description: "Fresh red onion",
    slug: "red-onion",
    image: "https://example.com/onion.png",
  };
  it("creates, reads, updates, lists, and deletes ingredient records", async () => {
    const created = await service.create(onion);
    expect(created).toMatchObject(onion);
    expect(await service.get(created.id)).toEqual(created);
    expect(
      await service.update(created.id, { name: "Red onion" }),
    ).toMatchObject({ ...onion, name: "Red onion" });
    expect(await service.list()).toHaveLength(1);
    await service.remove(created.id);
    expect(await service.list()).toEqual([]);
    await expect(service.create(onion)).resolves.toMatchObject(onion);
    await expect(service.get(created.id)).rejects.toThrow("not found");
    await expect(service.validateIds([created.id])).rejects.toThrow(
      "no longer exist",
    );
  });
  it("rejects duplicate slugs and invalid or missing IDs", async () => {
    const created = await service.create(onion);
    await expect(service.create(onion)).rejects.toThrow("slug");
    const second = await service.create({ ...onion, slug: "cheese" });
    await expect(
      service.update(second.id, { slug: created.slug }),
    ).rejects.toThrow("slug");
    await expect(service.get("bad")).rejects.toThrow("Invalid ingredient ID");
    await expect(
      service.update(new Types.ObjectId().toString(), { name: "Missing" }),
    ).rejects.toThrow("not found");
    await expect(
      service.validateIds([new Types.ObjectId().toString()]),
    ).rejects.toThrow("no longer exist");
  });
  it("links pizzas, preserves selection order, resolves edits publicly, and protects in-use ingredients", async () => {
    const first = await service.create(onion);
    const second = await service.create({
      ...onion,
      name: "Cheese",
      slug: "cheese",
    });
    const version = await versions.create({ version: 1, published: true });
    const category = await categories.create({
      name: "Pizza",
      menuVersionId: version._id,
    });
    const pizza = await catalog.addItem(version.id, {
      name: "Classic",
      categoryId: category.id,
      priceCents: 1000,
      ingredientIds: [second.id, first.id, first.id],
    });
    expect(pizza.ingredientIds.map(String)).toEqual([second.id, first.id]);
    await service.update(first.id, {
      name: "Red onion",
      image: "https://example.com/red.png",
    });
    const publicMenu = await catalog.getPublishedMenu();
    expect(publicMenu.items[0].ingredients).toEqual(["Cheese", "Red onion"]);
    expect(publicMenu.items[0].ingredientDetails[1]).toMatchObject({
      image: "https://example.com/red.png",
      slug: "red-onion",
    });
    expect(
      (await catalog.getVersionDetail(version.id)).items[0].ingredientIds,
    ).toEqual([second.id, first.id]);
    await expect(service.remove(first.id)).rejects.toThrow(
      "referenced by a product or menu item",
    );
    await catalog.updateItem(pizza.id, { ingredientIds: [] });
    await expect(service.remove(first.id)).resolves.toEqual({ deleted: true });
  });
  it("preserves legacy names and ingredient references when cloning a menu", async () => {
    const ingredient = await service.create(onion);
    const version = await versions.create({ version: 1, published: true });
    const category = await categories.create({
      name: "Pizza",
      menuVersionId: version._id,
    });
    await catalog.addItem(version.id, {
      name: "Legacy",
      categoryId: category.id,
      priceCents: 1000,
      ingredients: ["Basil"],
    });
    await catalog.addItem(version.id, {
      name: "Linked",
      categoryId: category.id,
      priceCents: 1000,
      ingredientIds: [ingredient.id],
    });
    const copy = await catalog.cloneVersion(version.id);
    const detail = await catalog.getVersionDetail(copy.id);
    expect(detail.items.find((i) => i.name === "Legacy")?.ingredients).toEqual([
      "Basil",
    ]);
    expect(
      detail.items.find((i) => i.name === "Linked")?.ingredientIds,
    ).toEqual([ingredient.id]);
  });
  it("restricts all ingredient endpoints to admins", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, IngredientsController)).toEqual(
      [JwtAuthGuard, RolesGuard],
    );
    expect(Reflect.getMetadata(ROLES_KEY, IngredientsController)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});

describe("Ingredient input validation", () => {
  it.each([
    { name: " ", slug: "onion" },
    { name: "Onion", slug: "Bad Slug" },
    { name: "Onion", slug: "onion", image: "javascript:alert(1)" },
    { name: "Onion", slug: "onion", image: null },
    { name: "Onion", slug: "onion", deleted: true },
  ])("rejects invalid input %j", async (body) => {
    expect(
      (
        await validate(plainToInstance(CreateIngredientDto, body), {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).length,
    ).toBeGreaterThan(0);
  });
  it("allows partial updates and trims required text", async () => {
    const dto = plainToInstance(CreateIngredientDto, {
      name: " Onion ",
      slug: " onion ",
      image: "",
    });
    expect(await validate(dto)).toEqual([]);
    expect(dto.name).toBe("Onion");
    expect(
      await validate(
        plainToInstance(UpdateIngredientDto, {
          description: "New description",
        }),
      ),
    ).toEqual([]);
  });
});

describe("Ingredient permissions", () => {
  const guard = new RolesGuard(new Reflector());
  const context = (user: unknown, method = "POST") =>
    ({
      getHandler: () => IngredientsController.prototype.create,
      getClass: () => IngredientsController,
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          method,
          originalUrl: "/api/v1/catalog/ingredients",
        }),
      }),
    }) as unknown as ExecutionContext;
  it("rejects customers and read-only staff on writes", () => {
    expect(() =>
      guard.canActivate(context({ roles: [UserRole.CUSTOMER] })),
    ).toThrow();
    expect(() =>
      guard.canActivate(
        context({
          roles: [UserRole.ADMIN],
          adminPermissions: ["catalog:read"],
        }),
      ),
    ).toThrow();
    expect(
      guard.canActivate(
        context({
          roles: [UserRole.ADMIN],
          adminPermissions: ["catalog:write"],
        }),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        context(
          { roles: [UserRole.ADMIN], adminPermissions: ["catalog:read"] },
          "GET",
        ),
      ),
    ).toBe(true);
  });
});
