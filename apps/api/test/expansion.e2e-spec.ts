import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { SchedulerRegistry } from "@nestjs/schedule";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model } from "mongoose";
import request from "supertest";
import { randomUUID } from "crypto";
import { AppModule } from "../src/app.module";
import { User, UserDocument } from "../src/account/schemas/user.schema";
import { Order, OrderDocument } from "../src/orders/schemas/order.schema";
import {
  Provider,
  ProviderDocument,
} from "../src/providers/schemas/provider.schema";
import {
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../src/common/enums";
import { CatalogService } from "../src/catalog/catalog.service";
import { DispatchService } from "../src/dispatch/dispatch.service";
import { WalletService } from "../src/wallet/wallet.module";
import {
  InventoryService,
  ingredientKey,
} from "../src/inventory/inventory.module";

describe("Expansion: rewards, mixed payments, groups and capacity", () => {
  let app: INestApplication,
    mongo: MongoMemoryServer,
    users: Model<UserDocument>,
    orders: Model<OrderDocument>,
    providers: Model<ProviderDocument>;
  let itemId: string, secondId: string, version: number, addressId: string;
  const tokens: Record<string, string> = {},
    ids: Record<string, string> = {};
  const call = (
    method: "get" | "post" | "patch" | "delete",
    path: string,
    who = "customer",
    body?: object,
  ) => {
    const q = request(app.getHttpServer())
      [method](`/api/v1/${path}`)
      .set("Authorization", `Bearer ${tokens[who]}`);
    return body ? q.send(body) : q;
  };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
    });
    Object.assign(process.env, {
      MONGODB_URI: mongo.getUri(),
      JWT_SECRET: "expansion-local-only-test-secret",
      STRIPE_SECRET_KEY: "",
      STRIPE_MODE: "mock",
      REDIS_URL: "",
      FCM_PROJECT_ID: "",
      S3_BUCKET: "",
      TWILIO_ACCOUNT_SID: "",
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DispatchService)
      .useValue({
        startDispatch: async (id: string) => {
          await orders.updateOne(
            { _id: id },
            { $set: { status: OrderStatus.PENDING_OFFERS } },
          );
          return { offerCount: 1 };
        },
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(0, "127.0.0.1");
    app
      .get(SchedulerRegistry)
      .getCronJobs()
      .forEach((job) => job.stop());
    users = app.get(getModelToken(User.name));
    orders = app.get(getModelToken(Order.name));
    providers = app.get(getModelToken(Provider.name));
    for (const name of ["customer", "friend", "admin", "provider"]) {
      const role = name === "friend" ? UserRole.CUSTOMER : (name as UserRole);
      const u = await users.create({
        firstName: name,
        lastName: "Test",
        roles: [role],
        activeRole: role,
      });
      ids[name] = u.id;
      tokens[name] = app
        .get(JwtService)
        .sign({ sub: u.id, roles: [role], activeRole: role });
    }
    await providers.create({
      userId: ids.provider,
      name: "Private Kitchen",
      address: "Private Street",
      longitude: 11.58,
      latitude: 48.14,
      location: { type: "Point", coordinates: [11.58, 48.14] },
    });
    const cat = app.get(CatalogService),
      v = await cat.createVersion({ notes: "Expansion tests" }),
      c = await cat.addCategory(v.id, { name: "Pizza" });
    const item = await cat.addItem(v.id, {
      categoryId: c.id,
      name: "Margherita",
      priceCents: 1000,
    });
    itemId = item.id;
    secondId = (
      await cat.addItem(v.id, {
        categoryId: c.id,
        name: "Funghi",
        priceCents: 1400,
      })
    ).id;
    await cat.publish(v.id);
    version = v.version;
    addressId = (
      await call("post", "orders/addresses", "customer", {
        label: "Home",
        street: "Test 1",
        longitude: 11.58,
        latitude: 48.14,
      }).expect(201)
    ).body._id;
  }, 120000);
  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });
  const checkout = (extra: object = {}) => ({
    menuVersion: version,
    addressId,
    paymentMethod: "card",
    lines: [{ menuItemId: itemId, quantity: 1 }],
    ...extra,
  });
  it("debits only the reviewed wallet share and refunds it exactly once", async () => {
    await app
      .get(WalletService)
      .change(ids.customer, "fixture:credit", 2000, "");
    const created = await call(
      "post",
      "orders",
      "customer",
      checkout({ walletCents: 400, idempotencyKey: randomUUID() }),
    ).expect(201);
    const id = created.body.id;
    expect(created.body.walletCents).toBe(400);
    await call("post", "payments/initiate", "friend", {
      orderId: id,
      method: "card",
    }).expect(403);
    await call("post", "payments/initiate", "customer", {
      orderId: id,
      method: "card",
    }).expect(201);
    await call("post", "payments/initiate", "customer", {
      orderId: id,
      method: "card",
    }).expect(201);
    expect((await users.findById(ids.customer))!.creditCents).toBe(1600);
    await call("post", "payments/cancel-order", "customer", {
      orderId: id,
      reason: "Changed plans",
    }).expect(201);
    await call("post", "payments/cancel-order", "customer", {
      orderId: id,
      reason: "Changed plans",
    }).expect(201);
    expect((await users.findById(ids.customer))!.creditCents).toBe(2000);
  });
  it("does not overdraw credit or accept a split with cash", async () => {
    await call(
      "post",
      "orders",
      "customer",
      checkout({ walletCents: 999999 }),
    ).expect(400);
    await call(
      "post",
      "orders",
      "customer",
      checkout({ walletCents: 100, paymentMethod: "cash" }),
    ).expect(400);
  });
  it("prices both pizza halves on the server", async () => {
    const q = await call(
      "post",
      "orders/quote",
      "customer",
      checkout({
        lines: [
          { menuItemId: itemId, secondHalfItemId: secondId, quantity: 2 },
        ],
      }),
    ).expect(201);
    expect(q.body.subtotalCents).toBe(2600);
    await call(
      "post",
      "orders/quote",
      "customer",
      checkout({
        lines: [{ menuItemId: itemId, secondHalfItemId: itemId, quantity: 1 }],
      }),
    ).expect(400);
  });
  it("claims each loyalty milestone once under concurrent taps", async () => {
    await orders.insertMany(
      Array.from({ length: 5 }, () => ({
        customerId: ids.customer,
        menuVersion: version,
        lines: [
          {
            menuItemId: itemId,
            name: "Pizza",
            quantity: 1,
            unitPriceCents: 1000,
          },
        ],
        subtotalCents: 1000,
        totalCents: 1299,
        addressId,
        status: OrderStatus.COMPLETED,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.CAPTURED,
      })),
    );
    const before = (await users.findById(ids.customer))!.creditCents;
    await Promise.all([
      call("post", "rewards/claim"),
      call("post", "rewards/claim"),
    ]);
    expect((await users.findById(ids.customer))!.creditCents).toBe(
      before + 500,
    );
    expect((await call("get", "rewards").expect(200)).body.available).toBe(0);
  });
  it("activates mock membership idempotently and applies its delivery threshold", async () => {
    const key = randomUUID();
    await call("post", "rewards/membership", "customer", {
      requestId: key,
    }).expect(201);
    const a = await call("post", "rewards/membership", "customer", {
      requestId: key,
    }).expect(201);
    expect(a.body.membership.active).toBe(true);
    const quote = await call(
      "post",
      "orders/quote",
      "customer",
      checkout({ lines: [{ menuItemId: itemId, quantity: 2 }] }),
    ).expect(201);
    expect(quote.body.deliveryFeeCents).toBe(0);
    const cancel = await call("post", "rewards/membership/cancel").expect(201);
    expect(cancel.body.membership.cancelled).toBe(true);
    expect(cancel.body.membership.active).toBe(true);
  });
  it("locks shared choices, rejects non-owner checkout and preserves split totals", async () => {
    let g = (
      await call("post", "groups", "customer", {
        title: "Dinner",
        menuVersion: version,
        split: true,
        deadline: new Date(Date.now() + 1800000).toISOString(),
      }).expect(201)
    ).body;
    g = (
      await call("post", `groups/${g.token}/items`, "customer", {
        revision: g.revision,
        lines: [{ menuItemId: itemId, quantity: 1 }],
      }).expect(201)
    ).body;
    await call("post", `groups/${g.token}/items`, "friend", {
      revision: 0,
      lines: [{ menuItemId: itemId, quantity: 1 }],
    }).expect(409);
    g = (
      await call("post", `groups/${g.token}/items`, "friend", {
        revision: g.revision,
        lines: [{ menuItemId: secondId, quantity: 1 }],
      }).expect(201)
    ).body;
    await call("post", `groups/${g.token}/lock`, "friend", {
      revision: g.revision,
      addressId,
    }).expect(403);
    g = (
      await call("post", `groups/${g.token}/lock`, "customer", {
        revision: g.revision,
        addressId,
      }).expect(201)
    ).body;
    expect(
      g.members.reduce(
        (n: number, m: { shareCents: number }) => n + m.shareCents,
        0,
      ),
    ).toBe(g.quote.totalCents);
    await call("post", `groups/${g.token}/items`, "friend", {
      revision: g.revision,
      lines: [],
    }).expect(400);
    await call("post", `groups/${g.token}/submit`, "customer", {
      revision: g.revision,
      expectedTotalCents: g.quote.totalCents,
    }).expect(400);
    await call("post", `groups/${g.token}/share`, "friend").expect(201);
    g = (await call("post", `groups/${g.token}/share`, "customer").expect(201))
      .body;
    g = (
      await call("post", `groups/${g.token}/submit`, "customer", {
        revision: g.revision,
        expectedTotalCents: g.quote.totalCents,
      }).expect(201)
    ).body;
    expect(g.state).toBe("ordered");
    await call("post", `groups/${g.token}/submit`, "customer", {
      revision: g.revision,
      expectedTotalCents: g.quote.totalCents,
    }).expect(201);
    expect(
      await orders.countDocuments({ idempotencyKey: `group:${g.token}` }),
    ).toBe(1);
    const guest = (await call("get", `groups/${g.token}`, "friend").expect(200))
      .body;
    expect(guest.orderId).toBeUndefined();
    expect(JSON.stringify(guest)).not.toContain(addressId);
  });
  it("enforces slot capacity under competing order creation and replays the winner", async () => {
    const body = {
      startsAt: new Date(Date.now() + 7200000).toISOString(),
      endsAt: new Date(Date.now() + 8400000).toISOString(),
      leadMinutes: 45,
      capacityUnits: 1,
      maxOrders: 1,
    };
    await call("post", "delivery-slots", "customer", body).expect(403);
    const slot = (
      await call("post", "delivery-slots", "admin", body).expect(201)
    ).body;
    const slotId = slot._id ?? slot.id;
    const key = randomUUID(),
      other = randomUUID();
    const results = await Promise.all([
      call(
        "post",
        "orders",
        "customer",
        checkout({ deliverySlotId: slotId, idempotencyKey: key }),
      ),
      call(
        "post",
        "orders",
        "customer",
        checkout({ deliverySlotId: slotId, idempotencyKey: other }),
      ),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const winningKey = results[0].status === 201 ? key : other;
    await call(
      "post",
      "orders",
      "customer",
      checkout({ deliverySlotId: slotId, idempotencyKey: winningKey }),
    ).expect(201);
  });
  it("prevents inventory overselling and stale stock writes", async () => {
    const p = (await providers.findOne({ userId: ids.provider }))!;
    const inventory = app.get(InventoryService);
    await inventory.update(p.id, {
      enabled: true,
      revision: 0,
      items: [{ name: "Flour", grams: 300 }],
    });
    const lines = [
      {
        quantity: 1,
        extras: [],
        recipeSnapshot: {
          recipeIngredients: [{ name: "Flour", weightGrams: 200 }],
        },
      },
    ] as never;
    const values = await Promise.all([
      inventory.reserve(p.id, "one", lines),
      inventory.reserve(p.id, "two", lines),
    ]);
    expect(values.filter(Boolean)).toHaveLength(1);
    const fresh = (await providers.findById(p.id))!;
    expect(fresh.ingredientStock[ingredientKey("Flour")]).toBe(100);
  });
  it("keeps insights admin-only and rejects arbitrary event data", async () => {
    await call("get", "insights", "customer").expect(403);
    await call("post", "insights/events", "customer", {
      eventId: randomUUID(),
      sessionId: randomUUID(),
      event: "menu_view",
      email: "private@example.test",
    }).expect(400);
    await call("get", "insights", "admin").expect(200);
  });
  it("restores reserved ingredients once and supports legacy stock documents", async () => {
    const p = await providers.create({
      userId: ids.friend,
      name: "Recovery kitchen",
      address: "Local",
      longitude: 11.58,
      latitude: 48.14,
      location: { type: "Point", coordinates: [11.58, 48.14] },
    });
    await providers.updateOne(
      { _id: p.id },
      { $unset: { inventoryRevision: 1 } },
    );
    const inventory = app.get(InventoryService);
    await inventory.update(p.id, {
      enabled: true,
      revision: 0,
      items: [{ name: "Flour", grams: 500 }],
    });
    const lines = [
      {
        quantity: 1,
        size: "medium",
        recipeSnapshot: {
          recipeIngredients: [{ name: "Flour", weightGrams: 200 }],
        },
      },
    ] as never;
    expect(await inventory.reserve(p.id, "recover-order", lines)).toBe(true);
    expect(await inventory.reserve(p.id, "recover-order", lines)).toBe(true);
    expect(
      (await providers.findById(p.id))!.ingredientStock[ingredientKey("Flour")],
    ).toBe(300);
    await Promise.all([
      inventory.release(p.id, "recover-order"),
      inventory.release(p.id, "recover-order"),
    ]);
    expect(
      (await providers.findById(p.id))!.ingredientStock[ingredientKey("Flour")],
    ).toBe(500);
    await expect(
      inventory.update(p.id, { enabled: true, revision: 1, items: [] }),
    ).rejects.toThrow("Stock changed");
  });
  it("reopens group selections without preserving old split confirmations", async () => {
    let g = (
      await call("post", "groups", "customer", {
        title: "Review again",
        menuVersion: version,
        split: true,
        deadline: new Date(Date.now() + 1800000).toISOString(),
      }).expect(201)
    ).body;
    g = (
      await call("post", `groups/${g.token}/items`, "customer", {
        revision: g.revision,
        lines: [{ menuItemId: itemId, quantity: 1 }],
      }).expect(201)
    ).body;
    g = (
      await call("post", `groups/${g.token}/lock`, "customer", {
        revision: g.revision,
        addressId,
      }).expect(201)
    ).body;
    g = (await call("post", `groups/${g.token}/share`).expect(201)).body;
    await call("post", `groups/${g.token}/reopen`, "friend", {
      revision: g.revision,
    }).expect(403);
    g = (
      await call("post", `groups/${g.token}/reopen`, "customer", {
        revision: g.revision,
      }).expect(201)
    ).body;
    expect(g.state).toBe("open");
    expect(g.quote).toBeNull();
    expect(g.members[0].paid).toBe(false);
  });
  it("rejects payment after a slot hold expires", async () => {
    const slot = (
      await call("post", "delivery-slots", "admin", {
        startsAt: new Date(Date.now() + 10800000).toISOString(),
        endsAt: new Date(Date.now() + 12000000).toISOString(),
        leadMinutes: 45,
        capacityUnits: 5,
        maxOrders: 5,
      }).expect(201)
    ).body;
    const created = (
      await call(
        "post",
        "orders",
        "customer",
        checkout({
          deliverySlotId: slot._id ?? slot.id,
          idempotencyKey: randomUUID(),
        }),
      ).expect(201)
    ).body;
    await orders.updateOne(
      { _id: created.id },
      { $set: { slotHoldUntil: new Date(Date.now() - 1) } },
    );
    await call("post", "payments/initiate", "customer", {
      orderId: created.id,
      method: "card",
    }).expect(400);
    expect((await orders.findById(created.id))!.paymentStatus).toBe(
      PaymentStatus.PENDING,
    );
  });
  it("enforces scoped admin access immediately for already-issued tokens", async () => {
    const staff = await users.create({
      firstName: "Read only",
      lastName: "Test",
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
    });
    tokens.staff = app.get(JwtService).sign({
      sub: staff.id,
      roles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
    });
    await call("post", `team-access/${ids.admin}`, "admin", {
      fullAccess: false,
      revision: 0,
      permissions: [],
    }).expect(400);
    await call("post", `team-access/${staff.id}`, "admin", {
      fullAccess: false,
      revision: 0,
      permissions: ["operations:read"],
    }).expect(201);
    await call("get", "insights", "staff").expect(200);
    await call("get", "finance/cash", "staff").expect(403);
    await call("get", "team-access", "staff").expect(403);
    await call("post", "delivery-slots", "staff", {
      startsAt: new Date(Date.now() + 10800000).toISOString(),
      endsAt: new Date(Date.now() + 12000000).toISOString(),
      leadMinutes: 45,
      capacityUnits: 5,
      maxOrders: 5,
    }).expect(403);
    await call("post", `team-access/${staff.id}`, "admin", {
      fullAccess: false,
      revision: 0,
      permissions: ["finance:read"],
    }).expect(409);
    await call("post", `team-access/${staff.id}`, "admin", {
      fullAccess: false,
      revision: 1,
      permissions: ["finance:read", "finance:write"],
    }).expect(201);
    await call("get", "finance/cash", "staff").expect(200);
    await call("get", "insights", "staff").expect(403);
    const audit = (await call("get", "team-access", "admin").expect(200)).body
      .events;
    expect(
      audit.filter((e: { targetId: string }) => e.targetId === staff.id),
    ).toHaveLength(2);
  });
  it("records cash receipts once and retains history when a record is voided", async () => {
    const courier = await users.create({
      firstName: "Cash courier",
      lastName: "Test",
      roles: [UserRole.COURIER],
      activeRole: UserRole.COURIER,
    });
    const body = {
      courierId: courier.id,
      requestId: randomUUID(),
      amountCents: 2300,
      reference: "SIGNED-HANDOVER-001",
    };
    await call("post", "finance/cash", "customer", body).expect(403);
    const results = await Promise.all([
      call("post", "finance/cash", "admin", body),
      call("post", "finance/cash", "admin", body),
    ]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    const receipt = results[0].body;
    await call("post", "finance/cash", "admin", {
      ...body,
      amountCents: 2500,
    }).expect(409);
    const report = (await call("get", "finance/cash", "admin").expect(200))
      .body;
    expect(
      report.rows.find((r: { courierId: string }) => r.courierId === courier.id)
        .remittedCents,
    ).toBe(2300);
    await call("post", `finance/cash/${receipt._id}/void`, "admin", {
      reason: "Entry belonged to a different test handover",
    }).expect(201);
    await call("post", `finance/cash/${receipt._id}/void`, "admin", {
      reason: "Retry",
    }).expect(201);
    const corrected = (await call("get", "finance/cash", "admin").expect(200))
      .body;
    expect(
      corrected.receipts.find((r: { _id: string }) => r._id === receipt._id)
        .voidedAt,
    ).toBeDefined();
    expect(
      corrected.rows.find(
        (r: { courierId: string }) => r.courierId === courier.id,
      )?.remittedCents ?? 0,
    ).toBe(0);
  });
  it("edits and archives windows with revision and role protection", async () => {
    const body = {
      startsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      endsAt: new Date(Date.now() + 4.5 * 3600000).toISOString(),
      capacityUnits: 10,
      maxOrders: 5,
      leadMinutes: 30,
    };
    const slot = (
      await call("post", "delivery-slots", "admin", body).expect(201)
    ).body;
    await call("patch", `delivery-slots/${slot._id}`, "customer", {
      ...body,
      revision: 0,
    }).expect(403);
    await call("patch", `delivery-slots/${slot._id}`, "admin", {
      ...body,
      capacityUnits: 12,
      revision: 0,
    }).expect(200);
    await call("delete", `delivery-slots/${slot._id}`, "admin", {
      revision: 0,
    }).expect(409);
    await call("delete", `delivery-slots/${slot._id}`, "admin", {
      revision: 1,
    }).expect(200);
    expect(
      (
        await call("get", "delivery-slots/manage", "admin").expect(200)
      ).body.some((s: { id: string }) => s.id === slot._id),
    ).toBe(false);
  });
  it("requires password enrollment and consumes authentication challenges once", async () => {
    await call("post", "account/passkeys/register/options", "customer", {
      password: "incorrect",
    }).expect(401);
    const challenge = (
      await call("post", "account/passkeys/authenticate/options").expect(201)
    ).body;
    await call("post", "account/passkeys/authenticate/verify", "customer", {
      requestId: challenge.requestId,
      response: { id: "unknown" },
    }).expect(401);
    await call("post", "account/passkeys/authenticate/verify", "customer", {
      requestId: challenge.requestId,
      response: { id: "unknown" },
    }).expect(400);
    await call("delete", "account/passkeys/not-an-id").expect(400);
  });
  it("updates measured recipes with revision protection", async () => {
    const body = {
      revision: 0,
      choices: [
        {
          kind: "size",
          key: "large",
          ingredients: [{ name: "Dough", weightGrams: 320 }],
        },
      ],
    };
    await call("post", `inventory-recipes/${itemId}`, "customer", body).expect(
      403,
    );
    await call("post", `inventory-recipes/${itemId}`, "admin", body).expect(
      201,
    );
    await call("post", `inventory-recipes/${itemId}`, "admin", body).expect(
      409,
    );
    const row = (
      await call("get", "inventory-recipes", "admin").expect(200)
    ).body.find((r: { id: string }) => r.id === itemId);
    expect(row.choices[0].ingredients[0].weightGrams).toBe(320);
  });
  it("versions reward policies and rejects stale or unauthorized edits", async () => {
    const current = (
      await call("get", "growth/reward-policy", "admin").expect(200)
    ).body.current;
    const body = {
      version: current.version,
      ordersPerReward: 3,
      rewardCents: 700,
      minimumOrderCents: 1500,
    };
    await call("post", "growth/reward-policy", "customer", body).expect(403);
    const saved = (
      await call("post", "growth/reward-policy", "admin", body).expect(201)
    ).body;
    expect(saved.version).toBe(current.version + 1);
    await call("post", "growth/reward-policy", "admin", body).expect(409);
  });

  it("restricts chat attachments to participants and detects changed retries", async () => {
    const courier = await users.create({
      firstName: "Chat",
      lastName: "Courier",
      roles: [UserRole.COURIER],
      activeRole: UserRole.COURIER,
    });
    tokens.chatCourier = app
      .get(JwtService)
      .sign({
        sub: courier.id,
        roles: [UserRole.COURIER],
        activeRole: UserRole.COURIER,
      });
    const order = (
      await call(
        "post",
        "orders",
        "customer",
        checkout({ idempotencyKey: randomUUID() }),
      ).expect(201)
    ).body;
    await orders.updateOne(
      { _id: order.id },
      {
        $set: {
          courierId: courier._id,
          status: OrderStatus.ASSIGNED_TO_COURIER,
        },
      },
    );
    const upload = {
      orderId: order.id,
      purpose: "chat",
      contentType: "image/png",
      base64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFaUAAAAASUVORK5CYII=",
    };
    await call("post", "media", "friend", upload).expect(404);
    await call("post", "media", "customer", {
      ...upload,
      contentType: "application/pdf",
    }).expect(400);
    const media = (await call("post", "media", "customer", upload).expect(201))
      .body;
    const message = { text: "", mediaId: media.id, clientId: randomUUID() };
    await call(
      "post",
      `communications/orders/${order.id}/messages`,
      "customer",
      message,
    ).expect(201);
    await call(
      "post",
      `communications/orders/${order.id}/messages`,
      "customer",
      message,
    ).expect(201);
    await call(
      "post",
      `communications/orders/${order.id}/messages`,
      "customer",
      { ...message, text: "Changed" },
    ).expect(409);
    await call(
      "get",
      `communications/orders/${order.id}/messages`,
      "friend",
    ).expect(404);
    const messages = (
      await call(
        "get",
        `communications/orders/${order.id}/messages`,
        "chatCourier",
      ).expect(200)
    ).body;
    expect(messages).toHaveLength(1);
    expect(messages[0].attachment.id).toBe(media.id);
  });
});
