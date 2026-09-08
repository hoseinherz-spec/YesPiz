import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { I18nExceptionFilter } from "../src/common/filters/i18n-exception.filter";

/**
 * Multi-role survey: admin → customer → payment → wave → kitchen quality →
 * batch → courier proof chain through COMPLETED + RBAC + exception path +
 * capacity (86/pause) + incident workflow.
 */
describe("Multiple customers, kitchens and couriers (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.24" },
      instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
    });
    process.env.MONGODB_URI = mongo.getUri();
    process.env.MEDIA_LOCAL_DIR = "/tmp/yespiz-test-media";
    process.env.JWT_SECRET = "qa-full-lifecycle-secret";
    process.env.OTP_DEV_BYPASS = "true";
    process.env.STRIPE_SECRET_KEY = "";
    process.env.STRIPE_MODE = "";
    process.env.REDIS_URL = "";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new I18nExceptionFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  async function bootstrapAdmin(email: string, password: string) {
    const server = app.getHttpServer();
    const res = await request(server)
      .post("/api/v1/account/auth/bootstrap-admin")
      .send({
        firstName: "Admin",
        lastName: "QA",
        email,
        password,
      })
      .expect(201);
    return {
      token: res.body.accessToken as string,
      userId: res.body.user.id as string,
    };
  }

  async function inviteAndRegister(
    adminToken: string,
    role: "provider" | "courier" | "admin",
    email: string,
    password: string,
  ) {
    const server = app.getHttpServer();
    const invite = await request(server)
      .post("/api/v1/account/admin/invites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role, email })
      .expect(201);

    const accepted = await request(server)
      .post("/api/v1/account/auth/invites/accept")
      .send({
        token: invite.body.token,
        firstName: role,
        lastName: "QA",
        email,
        password,
      })
      .expect(201);

    return {
      token: accepted.body.accessToken as string,
      userId: accepted.body.user.id as string,
    };
  }

  async function registerCustomer(email: string, password: string) {
    const server = app.getHttpServer();
    await request(server)
      .post("/api/v1/account/auth/register")
      .send({
        firstName: "Customer",
        lastName: "QA",
        email,
        password,
      })
      .expect(201);

    const login = await request(server)
      .post("/api/v1/account/auth/client/login")
      .send({ method: "password", email, password })
      .expect(201);

    return {
      token: login.body.accessToken as string,
      userId: login.body.user.id as string,
    };
  }

  it("isolates three customers, two kitchens and two couriers through a multi-stop card/cash delivery", async () => {
    const server = app.getHttpServer();
    const call = (
      method: "get" | "post" | "patch",
      path: string,
      token: string,
      data?: object,
    ) => {
      const req = request(server)
        [method](`/api/v1/${path}`)
        .set("Authorization", `Bearer ${token}`);
      return data ? req.send(data) : req;
    };
    const id = (body: any): string => String(body.id ?? body._id);
    const admin = await bootstrapAdmin("multi.admin@test.local", "Admin123!");
    const kitchens = [] as { token: string; userId: string; id: string }[];
    const riders = [] as { token: string; userId: string }[];
    const clients = [] as { token: string; userId: string; address: string }[];
    for (let i = 0; i < 2; i++) {
      const p = await inviteAndRegister(
        admin.token,
        "provider",
        `multi.kitchen${i}@test.local`,
        "Provider123!",
      );
      const entity = await call("post", "providers", admin.token, {
        userId: p.userId,
        name: `Kitchen ${i}`,
        address: "Munich",
        longitude: 11.5755,
        latitude: 48.1374,
      }).expect(201);
      kitchens.push({ ...p, id: id(entity.body) });
      const rider = await inviteAndRegister(
        admin.token,
        "courier",
        `multi.rider${i}@test.local`,
        "Courier123!",
      );
      riders.push(rider);
      const code = await call("post", "couriers/sessions/code", admin.token, {
        courierId: rider.userId,
        action: "start",
      }).expect(201);
      await call("post", "couriers/sessions/start", rider.token, {
        code: code.body.code,
      }).expect(201);
    }
    for (let i = 0; i < 3; i++) {
      const c = await registerCustomer(
        `multi.customer${i}@test.local`,
        "Customer123!",
      );
      const address = await call("post", "orders/addresses", c.token, {
        label: `Home ${i}`,
        street: `Test street ${i}`,
        longitude: 11.58 + i * 0.0001,
        latitude: 48.14,
      }).expect(201);
      clients.push({ ...c, address: id(address.body) });
    }
    const empty = await call("post", "catalog/versions", admin.token, {
      notes: "Empty draft",
    }).expect(201);
    await call(
      "post",
      `catalog/versions/${id(empty.body)}/publish`,
      admin.token,
    ).expect(400);
    const v = await call("post", "catalog/versions", admin.token, {
      notes: "Multi-user menu",
    }).expect(201);
    const version = id(v.body);
    const cat = await call(
      "post",
      `catalog/versions/${version}/categories`,
      admin.token,
      { name: "Pizzas" },
    ).expect(201);
    const item = await call(
      "post",
      `catalog/versions/${version}/items`,
      admin.token,
      {
        categoryId: id(cat.body),
        name: "Multi-user pizza",
        priceCents: 999,
        requiresReadyPhoto: false,
        requiresNumberedSeal: true,
        checklistTemplate: ["Packaging seal"],
      },
    ).expect(201);
    const itemId = id(item.body);
    await call(
      "post",
      `catalog/versions/${version}/publish`,
      kitchens[0]!.token,
    ).expect(403);
    await call(
      "post",
      `catalog/versions/${version}/publish`,
      admin.token,
    ).expect(201);
    const menu = await call("get", "catalog/menu", "").expect(200);
    const orders = [] as {
      id: string;
      customer: number;
      kitchen: number;
      cash: boolean;
      total: number;
    }[];
    // Different customers cannot submit against each other's saved addresses.
    await call("post", "orders", clients[1]!.token, {
      menuVersion: menu.body.version.version,
      addressId: clients[0]!.address,
      paymentMethod: "card",
      lines: [{ menuItemId: itemId, quantity: 1 }],
    }).expect(404);
    for (let i = 0; i < 3; i++) {
      const k = i === 2 ? 1 : 0;
      for (let j = 0; j < 2; j++)
        await call("patch", `providers/${kitchens[j]!.id}`, admin.token, {
          acceptingOrders: j === k,
        }).expect(200);
      const c = clients[i]!;
      const data = {
        menuVersion: menu.body.version.version,
        addressId: c.address,
        paymentMethod: i === 1 ? "cash" : "card",
        idempotencyKey: `multi-order-${i}`,
        lines: [{ menuItemId: itemId, quantity: 1 }],
      };
      const created = await call("post", "orders", c.token, data).expect(201);
      const orderId = id(created.body);
      const retry = await call("post", "orders", c.token, data).expect(201);
      expect(id(retry.body)).toBe(orderId);
      await call(
        "get",
        `orders/${orderId}`,
        clients[(i + 1) % 3]!.token,
      ).expect(404);
      await call("post", "payments/initiate", clients[(i + 1) % 3]!.token, {
        orderId,
        method: data.paymentMethod,
      }).expect(403);
      await call("post", "payments/initiate", c.token, {
        orderId,
        method: data.paymentMethod,
      }).expect(201);
      const foreignOffers = await call(
        "get",
        "dispatch/offers",
        kitchens[1 - k]!.token,
      ).expect(200);
      expect(foreignOffers.body.some((o: any) => o.orderId === orderId)).toBe(
        false,
      );
      await call(
        "post",
        `dispatch/orders/${orderId}/accept`,
        kitchens[k]!.token,
      ).expect(201);
      await call(
        "patch",
        `orders/${orderId}/kitchen-status`,
        kitchens[1 - k]!.token,
        { status: "PREPARING" },
      ).expect(403);
      await call(
        "get",
        `proof/orders/${orderId}/codes`,
        kitchens[1 - k]!.token,
      ).expect(403);
      await call(
        "patch",
        `orders/${orderId}/kitchen-status`,
        kitchens[k]!.token,
        { status: "PREPARING" },
      ).expect(200);
      await call(
        "post",
        `quality/orders/${orderId}/checklist`,
        kitchens[k]!.token,
        { answers: [{ item: "Packaging seal", ok: true }] },
      ).expect(201);
      await call("post", `quality/orders/${orderId}/seal`, kitchens[k]!.token, {
        sealId: `SEAL-${i}`,
      }).expect(201);
      await call(
        "patch",
        `orders/${orderId}/kitchen-status`,
        kitchens[k]!.token,
        { status: "READY_FOR_PICKUP" },
      ).expect(200);
      orders.push({
        id: orderId,
        customer: i,
        kitchen: k,
        cash: i === 1,
        total: created.body.totalCents,
      });
    }
    // A menu price change must not rewrite already purchased orders.
    await call("patch", `catalog/items/${itemId}`, admin.token, {
      priceCents: 1499,
    }).expect(200);
    await call("patch", `catalog/items/${itemId}`, admin.token, {
      priceCents: 1.5,
    }).expect(400);
    await call("patch", `catalog/items/${itemId}`, admin.token, {
      prepWeight: -1,
    }).expect(400);
    const changedMenu = await call("get", "catalog/menu", "").expect(200);
    expect(changedMenu.body.items[0].priceCents).toBe(1499);
    const snapshot = await call(
      "get",
      `orders/${orders[0]!.id}`,
      clients[0]!.token,
    ).expect(200);
    expect(snapshot.body.totalCents).toBe(orders[0]!.total);
    await call("post", "batches", kitchens[0]!.token, {
      providerId: kitchens[0]!.id,
      orderIds: [orders[0]!.id, orders[2]!.id],
    }).expect(400);
    const batches = [] as string[];
    for (let k = 0; k < 2; k++) {
      const batch = await call("post", "batches", kitchens[k]!.token, {
        providerId: kitchens[k]!.id,
        orderIds: orders.filter((o) => o.kitchen === k).map((o) => o.id),
      }).expect(201);
      const batchId = id(batch.body);
      batches.push(batchId);
      await call(
        "post",
        `batches/${batchId}/assign-courier`,
        kitchens[1 - k]!.token,
        { courierId: riders[1 - k]!.userId },
      ).expect(403);
      await call(
        "post",
        `batches/${batchId}/assign-courier`,
        kitchens[k]!.token,
        { courierId: riders[k]!.userId },
      ).expect(201);
      await call("get", `batches/${batchId}`, riders[1 - k]!.token).expect(403);
      const assigned = await call(
        "get",
        "batches/assigned",
        riders[k]!.token,
      ).expect(200);
      expect(assigned.body.map(id)).toEqual([batchId]);
    }
    for (const o of orders) {
      const k = o.kitchen;
      const codes = await call(
        "get",
        `proof/orders/${o.id}/codes`,
        kitchens[k]!.token,
      ).expect(200);
      const pickup = {
        code: codes.body.pickupCode,
        sealId: codes.body.sealId,
        longitude: 11.5755,
        latitude: 48.1374,
      };
      await call(
        "post",
        `proof/orders/${o.id}/pickup`,
        riders[1 - k]!.token,
        pickup,
      ).expect(403);
      await call(
        "post",
        `proof/orders/${o.id}/pickup`,
        riders[k]!.token,
        pickup,
      ).expect(201);
    }
    // All pickups happen first; one courier then visits two separate customers.
    for (const o of orders) {
      const c = clients[o.customer]!;
      const rider = riders[o.kitchen]!;
      const tracking = await call("get", `orders/${o.id}`, c.token).expect(200);
      expect(tracking.body.customerStatus).toBe("onway");
      expect(tracking.body.providerId).toBeUndefined();
      const proof = await call(
        "get",
        `proof/orders/${o.id}`,
        rider.token,
      ).expect(200);
      expect(proof.body.doorPin).toBeUndefined();
      await call("post", `proof/orders/${o.id}/en-route`, rider.token, {
        longitude: 11.578,
        latitude: 48.139,
      }).expect(201);
      const delivery = {
        pin: tracking.body.deliveryPin,
        longitude: 11.58 + o.customer * 0.0001,
        latitude: 48.14,
      };
      await call(
        "post",
        `proof/orders/${o.id}/deliver`,
        riders[1 - o.kitchen]!.token,
        delivery,
      ).expect(403);
      const wrongPin = delivery.pin === "0000" ? "1111" : "0000";
      await call("post", `proof/orders/${o.id}/deliver`, rider.token, {
        ...delivery,
        pin: wrongPin,
      }).expect(400);
      await call(
        "post",
        `proof/orders/${o.id}/deliver`,
        rider.token,
        delivery,
      ).expect(201);
      if (o.cash) {
        await call("post", `proof/orders/${o.id}/complete`, rider.token).expect(
          400,
        );
        await call("post", `proof/orders/${o.id}/cash-receipt`, rider.token, {
          amountCents: o.total - 1,
        }).expect(400);
        await call("post", `proof/orders/${o.id}/cash-receipt`, rider.token, {
          amountCents: o.total,
        }).expect(201);
      }
      await call("post", `proof/orders/${o.id}/complete`, rider.token).expect(
        201,
      );
      const final = await call("get", `orders/${o.id}`, c.token).expect(200);
      expect(final.body.customerStatus).toBe("delivered");
      // Completing one stop must never mark another customer's order delivered.
      const pending = orders.filter((x) => x.customer > o.customer);
      for (const other of pending) {
        const stillActive = await call(
          "get",
          `orders/${other.id}`,
          clients[other.customer]!.token,
        ).expect(200);
        expect(stillActive.body.customerStatus).toBe("onway");
      }
    }
    for (let i = 0; i < 3; i++) {
      const mine = await call("get", "orders", clients[i]!.token).expect(200);
      expect(mine.body.map(id)).toEqual([orders[i]!.id]);
    }

    for (const rider of riders) {
      const activeBatches = await call(
        "get",
        "batches/assigned",
        rider.token,
      ).expect(200);
      expect(activeBatches.body).toEqual([]);
    }
    // Both restaurants bid concurrently; only one owns the resulting order.
    for (const kitchen of kitchens)
      await call("patch", `providers/${kitchen.id}`, admin.token, {
        acceptingOrders: true,
      }).expect(200);
    const race = await call("post", "orders", clients[0]!.token, {
      menuVersion: menu.body.version.version,
      addressId: clients[0]!.address,
      paymentMethod: "card",
      lines: [{ menuItemId: itemId, quantity: 1 }],
    }).expect(201);
    const raceId = id(race.body);
    await call("post", "payments/initiate", clients[0]!.token, {
      orderId: raceId,
      method: "card",
    }).expect(201);
    const responses = await Promise.all(
      kitchens.map((k) =>
        call("post", `dispatch/orders/${raceId}/respond`, k.token, {
          ready: true,
          quotedPrepMinutes: 20,
        }),
      ),
    );
    for (const response of responses)
      expect([201, 409]).toContain(response.status);
    await call(
      "post",
      `dispatch/orders/${raceId}/resolve-wave`,
      admin.token,
    ).expect(201);
    const kitchenOrders = await Promise.all(
      kitchens.map((k) => call("get", "orders/kitchen", k.token).expect(200)),
    );
    const owners = kitchenOrders
      .map((result, index) =>
        result.body.some((o: any) => id(o) === raceId) ? index : -1,
      )
      .filter((index) => index >= 0);
    expect(owners).toHaveLength(1);
    const winner = kitchens[owners[0]!]!;
    const loser = kitchens.find((k) => k.id !== winner.id)!;
    await call("patch", `orders/${raceId}/kitchen-status`, loser.token, {
      status: "PREPARING",
    }).expect(403);
    const loserList = await call("get", "orders/kitchen", loser.token).expect(
      200,
    );
    expect(loserList.body.map(id)).not.toContain(raceId);
    const nextVersion = await call("post", "catalog/versions", admin.token, {
      notes: "Next menu",
    }).expect(201);
    const nextId = id(nextVersion.body);
    await call("post", `catalog/versions/${nextId}/items`, admin.token, {
      categoryId: id(cat.body),
      name: "Wrong category",
      priceCents: 999,
    }).expect(400);
    const nextCategory = await call(
      "post",
      `catalog/versions/${nextId}/categories`,
      admin.token,
      { name: "New pizzas" },
    ).expect(201);
    await call("post", `catalog/versions/${nextId}/items`, admin.token, {
      categoryId: id(nextCategory.body),
      name: "Next pizza",
      priceCents: 1099,
    }).expect(201);
    await call(
      "post",
      `catalog/versions/${nextId}/publish`,
      admin.token,
    ).expect(201);
    await call("post", "orders", clients[0]!.token, {
      menuVersion: menu.body.version.version,
      addressId: clients[0]!.address,
      paymentMethod: "card",
      lines: [{ menuItemId: itemId, quantity: 1 }],
    }).expect(400);
    const stillSame = await call(
      "get",
      `orders/${orders[0]!.id}`,
      clients[0]!.token,
    ).expect(200);
    expect(stillSame.body.totalCents).toBe(orders[0]!.total);
  }, 180000);
});
