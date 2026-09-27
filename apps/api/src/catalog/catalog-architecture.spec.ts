import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "reflect-metadata";
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Connection, createConnection, Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import {
  Menu,
  MenuSchema,
  MenuDocument,
  MenuItem,
  MenuItemSchema,
  MenuItemDocument,
  Category,
  CategorySchema,
  CategoryDocument,
  MenuVersion,
  MenuVersionSchema,
  MenuVersionDocument,
} from "./schemas/menu.schema";
import {
  Product,
  ProductSchema,
  ProductDocument,
  ProductRevision,
  ProductRevisionSchema,
  ProductRevisionDocument,
} from "./products/product.schema";
import {
  Ingredient,
  IngredientSchema,
  IngredientDocument,
} from "./schemas/ingredient.schema";
import {
  Provider,
  ProviderSchema,
  ProviderDocument,
} from "../providers/schemas/provider.schema";
import { IngredientsService } from "./ingredients.service";
import { ProductsService } from "./products/products.service";
import { CatalogService } from "./catalog.service";
import { MenuManagementService } from "./menu-management.service";
import { CatalogController } from "./catalog.controller";
import { ProductsController } from "./products/products.controller";
import { MenusController } from "./menus.controller";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RedisService } from "../redis/redis.service";
import { validateAttributes } from "./products/product-types";
import { productLinePrice } from "../orders/pricing";

jest.setTimeout(60000);
describe("Extensible product catalog HTTP and persistence", () => {
  let mongo: MongoMemoryServer, db: Connection, app: INestApplication;
  let products: ProductsService,
    catalog: CatalogService,
    management: MenuManagementService;
  let items: Model<MenuItemDocument>, versions: Model<MenuVersionDocument>;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: "7.0.24" } });
    db = await createConnection(mongo.getUri()).asPromise();
    const menus = db.model<Menu, Model<MenuDocument>>(Menu.name, MenuSchema);
    items = db.model<MenuItem, Model<MenuItemDocument>>(
      MenuItem.name,
      MenuItemSchema,
    );
    versions = db.model<MenuVersion, Model<MenuVersionDocument>>(
      MenuVersion.name,
      MenuVersionSchema,
    );
    const categories = db.model<Category, Model<CategoryDocument>>(
      Category.name,
      CategorySchema,
    );
    const ingredients = new IngredientsService(
      db.model<Ingredient, Model<IngredientDocument>>(
        Ingredient.name,
        IngredientSchema,
      ),
      items,
      db.model<ProductRevision, Model<ProductRevisionDocument>>(
        ProductRevision.name,
        ProductRevisionSchema,
      ),
    );
    products = new ProductsService(
      db.model<Product, Model<ProductDocument>>(Product.name, ProductSchema),
      db.model<ProductRevision, Model<ProductRevisionDocument>>(
        ProductRevision.name,
        ProductRevisionSchema,
      ),
      ingredients,
    );
    catalog = new CatalogService(
      new RedisService(new ConfigService()),
      ingredients,
      db.model<Provider, Model<ProviderDocument>>(
        Provider.name,
        ProviderSchema,
      ),
      versions,
      categories,
      items,
      products,
      menus,
    );
    management = new MenuManagementService(
      menus,
      versions,
      categories,
      items,
      catalog,
    );
    await Promise.all(Object.values(db.models).map((m) => m.init()));
    const module = await Test.createTestingModule({
      controllers: [CatalogController, ProductsController, MenusController],
      providers: [
        { provide: ProductsService, useValue: products },
        { provide: CatalogService, useValue: catalog },
        { provide: MenuManagementService, useValue: management },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: import("@nestjs/common").ExecutionContext) {
          const req = context.switchToHttp().getRequest();
          const role = req.headers.authorization;
          if (!role) throw new UnauthorizedException();
          req.user = { roles: [role] };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await db?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await Promise.all(Object.values(db.models).map((m) => m.deleteMany({})));
  });
  const post = (url: string, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1${url}`)
      .set("Authorization", "admin")
      .send(body);
  const patch = (url: string, body: object) =>
    request(app.getHttpServer())
      .patch(`/api/v1${url}`)
      .set("Authorization", "admin")
      .send(body);
  const get = (url: string) =>
    request(app.getHttpServer())
      .get(`/api/v1${url}`)
      .set("Authorization", "admin");
  const del = (url: string) =>
    request(app.getHttpServer())
      .delete(`/api/v1${url}`)
      .set("Authorization", "admin");
  async function setup() {
    const menu = await management.create({ name: "Dinner" });
    const version = await catalog.createVersion({ menuId: menu.id });
    const category = await catalog.addCategory(version.id, { name: "Food" });
    return { menu, version, category };
  }
  it("persists combo contents, remaps cloned selections and hides unavailable combos", async () => {
    const { menu, version, category } = await setup();
    const pizza = await catalog.addItem(version.id, { categoryId: category.id, name: "Combo pizza", priceCents: 1200 });
    const combo = await catalog.addItem(version.id, { categoryId: category.id, name: "Dinner for two", productType: "combo", priceCents: 1900, comboComponents: [{ menuItemId: pizza.id, size: "large", quantity: 2 }] });
    await catalog.publish(version.id);
    expect(((await catalog.getPublishedMenu(menu.id)).items as Array<{ id: string; comboComponents?: import("./combo").ComboComponent[] }>).find(i => i.id === combo.id)?.comboComponents?.[0]).toMatchObject({ name: "Combo pizza", sizeName: "large", quantity: 2 });
    await request(app.getHttpServer())
      .get(`/api/v1/catalog/combos/${combo.id}?menuId=${menu.id}`)
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({
          version: { version: version.version },
          item: {
            id: combo.id,
            productType: "combo",
            comboComponents: [{ name: "Combo pizza", quantity: 2 }],
          },
        }),
      );
    await request(app.getHttpServer())
      .get(`/api/v1/catalog/combos/${pizza.id}?menuId=${menu.id}`)
      .expect(404);
    const copied = await catalog.cloneVersion(version.id);
    const detail = await catalog.getVersionDetail(copied.id);
    const copiedCombo = detail.items.find(i => i.productType === "combo")!;
    expect(copiedCombo.comboComponents?.[0].menuItemId).toBe(detail.items.find(i => i.name === "Combo pizza")!.id);
    expect(copiedCombo.comboComponents?.[0].menuItemId).not.toBe(pizza.id);
    await catalog.updateItem(combo.id, { priceCents: 1800 });
    expect((await catalog.getActiveItemsByIds([combo.id], version.version)).items[0].priceCents).toBe(1800);
    await catalog.updateItem(pizza.id, { isActive: false });
    expect((await catalog.getPublishedMenu(menu.id)).items).toHaveLength(0);
    expect((await catalog.getActiveItemsByIds([combo.id], version.version)).items).toHaveLength(0);
    await expect(catalog.addItem(version.id, { categoryId: category.id, name: "Invalid", productType: "combo", priceCents: 1000, comboComponents: [{ menuItemId: pizza.id, quantity: 2 }] })).rejects.toThrow();
  });
  it("validates food-specific fields and rejects unknown types, nulls and unauthorized writes", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/products")
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", "customer")
      .send({})
      .expect(403);
    await post("/products", {
      type: "pizza",
      name: "Pepperoni",
      attributes: { volumeMl: 330 },
    }).expect(400);
    await post("/products", { type: "unknown", name: "Test" }).expect(400);
    await post("/products", {
      type: "drink",
      name: "Cola",
      attributes: { carbonated: "yes" },
    }).expect(400);
    await post("/products", {
      type: "pizza",
      name: "Test",
      preparation: { mode: "cook" },
    }).expect(400);
    await post("/products", {
      type: "pizza",
      name: "Test",
      attributes: null,
    }).expect(400);
    await get("/products/not-an-id").expect(400);
    await get("/products?page=0").expect(400);
  });
  it("pins product revisions, keeps prices per menu, and explicitly adopts an updated revision", async () => {
    const a = await setup(),
      b = await setup();
    const created = await post("/products", {
      type: "pizza",
      name: "Pepperoni",
      status: "active",
      attributes: { shape: "round", baseCrispiness: "crispy" },
    }).expect(201);
    const productId = created.body.product._id;
    const firstRevision = created.body.revision._id;
    const one = await catalog.attachProduct(a.version.id, {
      productId,
      categoryId: a.category.id,
      priceCents: 1000,
    });
    const two = await catalog.attachProduct(b.version.id, {
      productId,
      categoryId: b.category.id,
      priceCents: 1200,
    });
    await catalog.publish(a.version.id);
    await catalog.publish(b.version.id);
    const updated = await patch(`/products/${productId}`, {
      expectedRevisionId: firstRevision,
      name: "New Pepperoni",
      attributes: { shape: "square" },
    }).expect(200);
    expect((await catalog.getPublishedMenu(a.menu.id)).items[0]).toMatchObject({
      name: "Pepperoni",
      priceCents: 1000,
    });
    expect((await catalog.getPublishedMenu(b.menu.id)).items[0]).toMatchObject({
      name: "Pepperoni",
      priceCents: 1200,
    });
    expect(
      (await products.getRevision(productId, firstRevision)).revision.content
        .name,
    ).toBe("Pepperoni");
    await catalog.updateItem(one.id, {
      productRevisionId: updated.body.revision._id,
    });
    expect((await catalog.getPublishedMenu(a.menu.id)).items[0].name).toBe(
      "New Pepperoni",
    );
    expect((await items.findById(two.id))!.name).toBe("Pepperoni");
    await patch(`/products/${productId}`, {
      expectedRevisionId: firstRevision,
      name: "Stale",
    }).expect(409);
    await patch(`/products/${productId}/status`, { status: "inactive" }).expect(
      200,
    );
    expect((await catalog.getPublishedMenu(a.menu.id)).items).toHaveLength(0);
    expect(
      (await catalog.getActiveItemsByIds([two.id], b.version.version)).items,
    ).toHaveLength(0);
  });
  it("creates a drink through add-to-menu and serves/orders it without pizza pricing", async () => {
    const { menu, version, category } = await setup();
    const result = await post(`/catalog/versions/${version.id}/products`, {
      product: {
        type: "drink",
        name: "Cola",
        status: "active",
        attributes: { volumeMl: 330, carbonated: true },
      },
      categoryId: category.id,
      priceCents: 250,
    }).expect(201);
    const itemId = result.body._id;
    await catalog.publish(version.id);
    const available = await catalog.getActiveItemsByIds(
      [itemId],
      version.version,
    );
    expect(available.items[0]).toMatchObject({
      productType: "drink",
      preparation: { mode: "pack", cookTimeSeconds: 0, handoffTempC: 0 },
    });
    expect(
      (await catalog.getPublishedMenu(menu.id)).items[0].attributes,
    ).toEqual({ volumeMl: 330, carbonated: true });
    expect(
      productLinePrice("drink", 250, "large", [], { largeSizeDeltaCents: 999 }),
    ).toBe(250);
    expect(
      productLinePrice("pizza", 1000, "large", [], {
        largeSizeDeltaCents: 300,
      }),
    ).toBe(1300);
    await get(`/catalog/versions/${version.id}/items?type=drink&q=Cola&limit=1`)
      .expect(200)
      .expect((res) => expect(res.body.total).toBe(1));
  });
  it("enforces membership, supports multiple categories and retains deleted records for historical orders", async () => {
    const { menu, version, category } = await setup();
    const extra = await catalog.addCategory(version.id, { name: "Popular" });
    const wrong = await setup();
    const item = await catalog.addItem(version.id, {
      name: "Pizza",
      priceCents: 1000,
      categoryId: category.id,
      additionalCategoryIds: [extra.id],
    });
    await catalog.publish(version.id);
    await patch(`/catalog/items/${item.id}`, {
      categoryId: wrong.category.id,
    }).expect(400);
    await patch(`/catalog/categories/${category.id}/status`, {
      isActive: false,
    }).expect(200);
    expect((await catalog.getPublishedMenu(menu.id)).items).toHaveLength(1);
    await del(`/catalog/categories/${extra.id}`).expect(409);
    await patch(`/menus/${menu.id}/status`, { isActive: false }).expect(200);
    expect((await catalog.getPublishedMenu(menu.id)).items).toHaveLength(0);
    await expect(
      catalog.getActiveItemsByIds([item.id], version.version),
    ).rejects.toThrow("menu has changed");
    await patch(`/menus/${menu.id}/status`, { isActive: true }).expect(200);
    await del(`/catalog/items/${item.id}`).expect(200);
    await patch(`/catalog/items/${item.id}/status`, { isActive: true }).expect(
      404,
    );
    await del(`/catalog/categories/${extra.id}`).expect(200);
    expect(
      (await catalog.getItemsByIds([item.id], version.version)).items,
    ).toHaveLength(1);
    await del(`/menus/${menu.id}`).expect(200);
    await get(`/menus/${menu.id}`).expect(404);
    expect(
      (await catalog.getItemsByIds([item.id], version.version)).items,
    ).toHaveLength(1);
  });
  it("clones menus without duplicating products and migrates legacy identities and historical content resumably", async () => {
    const version = await versions.create({ version: 1, published: true });
    const category = await catalog.addCategory(version.id, { name: "Pizza" });
    const legacy = await items.create({
      menuVersionId: version._id,
      categoryId: category._id,
      pizzaId: "legacy-stable",
      productType: "pizza",
      name: "Original",
      priceCents: 900,
    });
    const report = await management.migrateLegacy();
    expect(report.migrated).toBe(1);
    expect((await management.migrateLegacy()).migrated).toBe(0);
    const migrated = (await items.findById(legacy._id))!;
    expect(migrated.pizzaId).toBe("legacy-stable");
    expect(migrated.productId).toBeDefined();
    const clone = await catalog.cloneVersion(version.id);
    const copied = (await items.findOne({ menuVersionId: clone._id }))!;
    expect(String(copied.productId)).toBe(String(migrated.productId));
    expect(String(copied.productRevisionId)).toBe(
      String(migrated.productRevisionId),
    );
    await catalog.updateItem(copied.id, { name: "Updated copy" });
    expect((await items.findById(legacy._id))!.name).toBe("Original");
    expect(
      (await products.get(String(migrated.productId))).revision.content.name,
    ).toBe("Updated copy");
  });
  it("switches the published pointer within one menu and keeps reorder on its original menu", async () => {
    const a = await setup(),
      b = await setup();
    const first = await catalog.addItem(a.version.id, {
      categoryId: a.category.id,
      name: "Old A",
      priceCents: 100,
    });
    await catalog.addItem(b.version.id, {
      categoryId: b.category.id,
      name: "B",
      priceCents: 200,
    });
    await catalog.publish(a.version.id);
    await catalog.publish(b.version.id);
    const next = await catalog.cloneVersion(a.version.id);
    await catalog.publish(next.id);
    await expect(
      catalog.getActiveItemsByIds([first.id], a.version.version),
    ).rejects.toThrow("menu has changed");
    expect(
      (await catalog.getPublishedMenu(undefined, a.version.version)).version!
        .version,
    ).toBe(next.version);
    expect((await catalog.getPublishedMenu(b.menu.id)).version!.version).toBe(
      b.version.version,
    );
    await patch(`/menus/${a.menu.id}/status`, { isActive: "false" }).expect(
      400,
    );
    await del(`/catalog/versions/${next.id}`).expect(409);
  });
  it("exposes product schemas in OpenAPI and retains archived product revision history", async () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    expect(document.paths["/api/v1/products"]).toBeDefined();
    expect(document.components!.schemas!.CreateProductDto).toMatchObject({
      properties: { type: { type: "string" }, name: { type: "string" } },
    });
    const created = await products.create({ type: "drink", name: "Tea" });
    await products.setStatus(created.product.id, "archived");
    await get(
      `/products/${created.product.id}/revisions/${created.revision.id}`,
    ).expect(200);
    await get(`/products/${created.product.id}/revisions`)
      .expect(200)
      .expect((res) => expect(res.body.total).toBe(1));
    const { version, category } = await setup();
    await post(`/catalog/versions/${version.id}/products`, {
      productId: created.product.id,
      categoryId: category.id,
      priceCents: 100,
    }).expect(409);
  });
  it("persists admin ingredient permissions and publishes only server-resolved topping details", async () => {
    const { menu, version, category } = await setup();
    const olive = await db
      .model(Ingredient.name)
      .create({
        name: "Black olives",
        slug: "black-olives",
        isTopping: true,
        image: "/olive.png",
      });
    const cheese = await db
      .model(Ingredient.name)
      .create({ name: "Cheese", slug: "cheese", image: "/cheese.png" });
    const created = await post(`/catalog/versions/${version.id}/items`, {
      name: "Pepperoni",
      categoryId: category.id,
      priceCents: 1000,
      ingredientIds: [String(cheese._id)],
      ingredientOptions: [
        { ingredientId: String(olive._id), priceCents: 100, portionGrams: 15 },
      ],
      toppingBaseImageUrl: "/pizza-base.png",
    }).expect(201);
    await patch(`/catalog/items/${created.body.id}`, {
      ingredientOptions: [{ ingredientId: String(cheese._id), priceCents: 150, portionGrams: 30 }],
    }).expect(400);
    await catalog.publish(version.id);
    const item = (await catalog.getPublishedMenu(menu.id)).items[0];
    expect(item.ingredientOptions).toMatchObject([
      { name: "Black olives", includedByDefault: false },
    ]);
    expect(
      (await catalog.getVersionDetail(version.id)).items[0].ingredientOptions,
    ).toHaveLength(1);
    await patch(`/catalog/items/${created.body.id}`, {
      ingredientOptions: [
        { ingredientId: String(olive._id), priceCents: -1, portionGrams: 15 },
      ],
    }).expect(400);
    await patch(`/catalog/items/${created.body.id}`, {
      ingredientOptions: [],
    }).expect(200);
    expect(
      (await catalog.getPublishedMenu(menu.id)).items[0].ingredientOptions,
    ).toEqual([]);
  });
  it("accepts one of two concurrent product edits and retains a consistent current revision", async () => {
    const created = await products.create({ type: "pizza", name: "Original" });
    const results = await Promise.allSettled(
      ["A", "B"].map((name) =>
        products.update(created.product.id, {
          expectedRevisionId: created.revision.id,
          name,
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const current = await products.get(created.product.id);
    expect(["A", "B"]).toContain(current.revision.content.name);
    expect(current.revision.revision).toBe(2);
  });
});

describe("Product type extension rules", () => {
  it("rejects inherited properties and unsupported attribute schema versions", () => {
    expect(() => validateAttributes("constructor", {})).toThrow();
    expect(() => validateAttributes("pizza", { toString: "bad" })).toThrow();
    expect(() => validateAttributes("pizza", {}, 2)).toThrow();
    expect(validateAttributes("burger", { pattyCount: 2 })).toEqual({
      pattyCount: 2,
    });
  });
});
