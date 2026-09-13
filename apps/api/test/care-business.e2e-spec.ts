import { SchedulerRegistry } from "@nestjs/schedule";
jest.setTimeout(30000);
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { User, UserDocument } from "../src/account/schemas/user.schema";
import { Order, OrderDocument } from "../src/orders/schemas/order.schema";
import {
  Provider,
  ProviderDocument,
} from "../src/providers/schemas/provider.schema";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from "../src/common/enums";
import { WalletService } from "../src/wallet/wallet.module";
import { SlaService } from "../src/sla/sla.service";
import { DispatchService } from "../src/dispatch/dispatch.service";
import { CatalogService } from "../src/catalog/catalog.service";
import { PaymentsService } from "../src/payments/payments.service";

describe("Private care, wallet, settlements and growth (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let orders: Model<OrderDocument>;
  let users: Model<UserDocument>;
  let order: OrderDocument;
  let customer: UserDocument;
  let providerId: string;
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  const call = (
    method: "get" | "post" | "patch",
    path: string,
    role: string,
    body?: object,
  ) => {
    const req = request(app.getHttpServer())
      [method](`/api/v1/${path}`)
      .set("Authorization", `Bearer ${tokens[role]}`);
    return body ? req.send(body) : req;
  };
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.24" },
      instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
    });
    Object.assign(process.env, {
      MONGODB_URI: mongo.getUri(),
      JWT_SECRET: "care-business-test-secret",
      STRIPE_SECRET_KEY: "",
      STRIPE_MODE: "",
      REDIS_URL: "",
      MEDIA_LOCAL_DIR: "/tmp/yespizz-care-media",
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DispatchService)
      .useValue({
        startDispatch: jest.fn().mockResolvedValue({ offerCount: 1 }),
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
    app.get(SchedulerRegistry).getCronJob("catalog-publication").stop();
    users = app.get(getModelToken(User.name));
    orders = app.get(getModelToken(Order.name));
    for (const role of [
      "customer",
      "other",
      "provider",
      "courier",
      "admin",
      "admin2",
    ]) {
      const actual =
        role === "other"
          ? UserRole.CUSTOMER
          : role === "admin2"
            ? UserRole.ADMIN
            : (role as UserRole);
      const user = await users.create({
        firstName: role,
        lastName: "Test",
        roles: [actual],
        activeRole: actual,
      });
      ids[role] = user.id;
      tokens[role] = app
        .get(JwtService)
        .sign({ sub: user.id, roles: [actual], activeRole: actual });
      if (role === "customer") customer = user;
    }
    const providers: Model<ProviderDocument> = app.get(
      getModelToken(Provider.name),
    );
    const provider = await providers.create({
      userId: ids.provider,
      name: "Secret source",
      address: "Never public 42",
      longitude: 16.37,
      latitude: 48.2,
      location: { type: "Point", coordinates: [16.37, 48.2] },
    });
    providerId = provider.id;
    order = await orders.create({
      customerId: customer._id,
      providerId: provider._id,
      courierId: ids.courier,
      menuVersion: 1,
      lines: [
        {
          menuItemId: new Types.ObjectId(),
          name: "Margherita",
          unitPriceCents: 1000,
          quantity: 1,
          prepWeight: 1,
        },
      ],
      subtotalCents: 1000,
      deliveryFeeCents: 200,
      totalCents: 1200,
      addressId: new Types.ObjectId(),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.CAPTURED,
      completedAt: new Date(),
    });
  }, 120000);
  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });
  it("only publishes and prices items explicitly classified as pizza", async () => {
    const catalog = app.get(CatalogService);
    const version = await catalog.createVersion({ notes: "Pizza-only test" });
    const category = await catalog.addCategory(version.id, { name: "Pizzas" });
    const pizza = await catalog.addItem(version.id, {
      categoryId: category.id,
      name: "Margherita",
      priceCents: 1000,
    });
    const legacy = await catalog.addItem(version.id, {
      categoryId: category.id,
      name: "Legacy drink",
      priceCents: 200,
    });
    await catalog.updateItem(legacy.id, { productType: "unclassified" });
    await catalog.publish(version.id);
    const menu = await call("get", "catalog/menu", "customer").expect(200);
    expect(menu.body.items.map((item: { id: string }) => item.id)).toEqual([
      pizza.id,
    ]);
    const priced = await catalog.getActiveItemsByIds(
      [pizza.id, legacy.id],
      version.version,
    );
    expect(priced.items.map((item) => item.id)).toEqual([pizza.id]);
  });
  it("accepts exactly one verified private survey and guards every internal endpoint", async () => {
    const dto = {
      taste: 4,
      temperature: 3,
      packaging: 5,
      delivery: 2,
      wouldOrderAgain: true,
      comment: "Arrived a little cool.",
    };
    await call("post", `care/orders/${order.id}/feedback`, "other", dto).expect(
      404,
    );
    await call("post", `care/orders/${order.id}/feedback`, "customer", {
      ...dto,
      providerId,
    }).expect(400);
    await call("post", `care/orders/${order.id}/feedback`, "customer", {
      ...dto,
      taste: 9,
    }).expect(400);
    const replies = await Promise.all([
      call("post", `care/orders/${order.id}/feedback`, "customer", dto).expect(
        201,
      ),
      call("post", `care/orders/${order.id}/feedback`, "customer", dto).expect(
        201,
      ),
    ]);
    for (const reply of replies)
      expect(reply.body).toEqual({ submitted: true });
    for (const role of ["customer", "provider", "courier"]) {
      for (const route of [
        "care/admin/feedback",
        "care/admin/requests",
        "finance/admin",
        "growth",
        "growth/tasks",
        `quality/providers/${providerId}`,
      ])
        await call("get", route, role).expect(403);
    }
    const metrics = await call("get", "care/admin/feedback", "admin").expect(
      200,
    );
    expect(metrics.body.providers[0]).toMatchObject({
      responses: 1,
      score: 80,
      name: "Secret source",
      delivery: 2,
    });
    expect(metrics.body.recent).toHaveLength(1);
    const view = await call("get", `orders/${order.id}`, "customer").expect(
      200,
    );
    expect(JSON.stringify(view.body)).not.toMatch(
      /Secret source|Never public|providerId|qualityScore|rating/,
    );
    const state = await call(
      "get",
      `care/orders/${order.id}/feedback`,
      "customer",
    ).expect(200);
    expect(state.body).toEqual({
      submitted: true,
      eligible: true,
      allowPublication: false,
    });
  });
  it("publishes only permitted exact excerpts on a purchased pizza and supports revocation", async () => {
    const otherOrder = await orders.create({
      ...order.toObject(),
      _id: new Types.ObjectId(),
    });
    const pizzaId = String(otherOrder.lines[0].menuItemId);
    const dto = {
      taste: 4,
      temperature: 4,
      packaging: 4,
      delivery: 4,
      wouldOrderAgain: true,
      comment: "Great crust. Secret source made it.",
      allowPublication: true,
    };
    await call(
      "post",
      `care/orders/${otherOrder.id}/feedback`,
      "customer",
      dto,
    ).expect(201);
    const metrics = await call("get", "care/admin/feedback", "admin").expect(
      200,
    );
    const row = metrics.body.recent.find(
      (value: { orderId: string }) => value.orderId === otherOrder.id,
    );
    const publication = {
      revision: 0,
      published: true,
      pizzaId,
      text: "Great crust.",
    };
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${pizzaId}`)
          .expect(200)
      ).body,
    ).toEqual([]);
    await call(
      "patch",
      `care/admin/feedback/${row._id}/publication`,
      "customer",
      publication,
    ).expect(403);
    await call("patch", `care/admin/feedback/${row._id}/publication`, "admin", {
      ...publication,
      pizzaId: new Types.ObjectId().toString(),
    }).expect(400);
    await call("patch", `care/admin/feedback/${row._id}/publication`, "admin", {
      ...publication,
      text: "Invented praise",
    }).expect(400);
    await call("patch", `care/admin/feedback/${row._id}/publication`, "admin", {
      ...publication,
      text: dto.comment,
    }).expect(400);
    const privateRow = metrics.body.recent.find(
      (value: { orderId: string }) => value.orderId === order.id,
    );
    await call(
      "patch",
      `care/admin/feedback/${privateRow._id}/publication`,
      "admin",
      { ...publication, text: "Arrived a little cool." },
    ).expect(400);
    await call(
      "patch",
      `care/admin/feedback/${row._id}/publication`,
      "admin",
      publication,
    ).expect(200);
    const visible = await request(app.getHttpServer())
      .get(`/api/v1/pizza-comments/${pizzaId}`)
      .expect(200);
    expect(visible.body).toHaveLength(1);
    expect(visible.body[0].text).toBe("Great crust.");
    expect(Object.keys(visible.body[0]).sort()).toEqual([
      "id",
      "publishedAt",
      "text",
    ]);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${new Types.ObjectId()}`)
          .expect(200)
      ).body,
    ).toEqual([]);
    await call(
      "patch",
      `care/admin/feedback/${row._id}/publication`,
      "admin2",
      publication,
    ).expect(409);
    await call("patch", `care/admin/feedback/${row._id}/publication`, "admin", {
      ...publication,
      revision: 1,
      published: false,
    }).expect(200);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${pizzaId}`)
          .expect(200)
      ).body,
    ).toEqual([]);
    expect(
      (
        await call("get", "care/admin/feedback", "admin").expect(200)
      ).body.recent.find((value: { _id: string }) => value._id === row._id)
        .comment,
    ).toBe(dto.comment);
  });
  it("lets only the author withdraw publication permission without deleting feedback", async () => {
    const metrics = await call("get", "care/admin/feedback", "admin").expect(
      200,
    );
    const row = metrics.body.recent.find(
      (value: { allowPublication: boolean }) => value.allowPublication,
    );
    await call(
      "patch",
      `care/orders/${row.orderId}/publication-permission`,
      "other",
      { allowPublication: false },
    ).expect(404);
    await call("patch", `care/admin/feedback/${row._id}/publication`, "admin", {
      revision: row.moderationRevision,
      published: true,
      pizzaId: row.pizzaItems[0].id,
      text: "Great crust.",
    }).expect(200);
    await call(
      "patch",
      `care/orders/${row.orderId}/publication-permission`,
      "customer",
      { allowPublication: false },
    ).expect(200);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${row.pizzaItems[0].id}`)
          .expect(200)
      ).body,
    ).toEqual([]);
    const state = await call(
      "get",
      `care/orders/${row.orderId}/feedback`,
      "customer",
    ).expect(200);
    expect(state.body).toMatchObject({
      submitted: true,
      allowPublication: false,
    });
    await call(
      "patch",
      `care/orders/${row.orderId}/publication-permission`,
      "customer",
      { allowPublication: true },
    ).expect(200);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${row.pizzaItems[0].id}`)
          .expect(200)
      ).body,
    ).toEqual([]);
  });
  it("keeps support notes private and prevents two operators from claiming the same request", async () => {
    const input = {
      orderId: order.id,
      category: "quality",
      message: "My pizza was cold.",
      requestKey: "care-request-001",
    };
    const created = await call(
      "post",
      "care/requests",
      "customer",
      input,
    ).expect(201);
    const retried = await call(
      "post",
      "care/requests",
      "customer",
      input,
    ).expect(201);
    expect(retried.body.id).toBe(created.body.id);
    const claimed = await call(
      "post",
      `care/admin/requests/${created.body.id}/claim`,
      "admin",
    ).expect(201);
    await call(
      "post",
      `care/admin/requests/${created.body.id}/claim`,
      "admin2",
    ).expect(409);
    await call("patch", `care/admin/requests/${created.body.id}`, "admin", {
      revision: claimed.body.revision,
      status: "resolved",
      response: "resolved",
      internalNote: "Secret source review, not for customer.",
    }).expect(200);
    const customerRequests = await call(
      "get",
      "care/requests",
      "customer",
    ).expect(200);
    expect(customerRequests.body[0].status).toBe("resolved");
    expect(JSON.stringify(customerRequests.body)).not.toMatch(
      /Secret source|providerId|ownerId|internalNote|events/,
    );
    expect(
      (await call("get", "care/requests", "other").expect(200)).body,
    ).toEqual([]);
  });
  it("grants SLA credit once against the original promise even after ETA changes", async () => {
    const now = Date.now();
    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          promisedDeliveryAt: new Date(now - 600000),
          deliveredAt: new Date(now - 1000),
          etaComputedAt: new Date(now),
          etaDeliveryMax: 60,
        },
      },
    );
    await Promise.all([
      app.get(SlaService).evaluateOrder(order.id),
      app.get(SlaService).evaluateOrder(order.id),
    ]);
    const after = await users.findById(customer._id).orFail();
    expect(
      after.creditEntries.filter((e) => e.key === `sla:${order.id}`),
    ).toHaveLength(1);
    expect(after.creditCents).toBeGreaterThan(0);
  });
  it("atomically prevents duplicate and overspent wallet payments, and recovers an interrupted debit", async () => {
    const wallet = app.get(WalletService);
    await wallet.change(customer.id, "test:fund", 5000, order.id);
    const balance = (await wallet.statement(customer.id)).balanceCents;
    const outcomes = await Promise.allSettled([
      wallet.change(customer.id, "payment:one", -balance, "one"),
      wallet.change(customer.id, "payment:two", -balance, "two"),
    ]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await wallet.statement(customer.id)).balanceCents).toBe(0);
    const winner = outcomes[0].status === "fulfilled" ? "one" : "two";
    await wallet.change(customer.id, `payment:${winner}`, -balance, winner);
    await wallet.refundPurchase(customer.id, winner);
    await wallet.refundPurchase(customer.id, winner);
    expect((await wallet.statement(customer.id)).balanceCents).toBe(balance);
    const pending = await orders.create({
      customerId: customer._id,
      menuVersion: 1,
      lines: [],
      totalCents: 1200,
      subtotalCents: 1000,
      deliveryFeeCents: 200,
      addressId: new Types.ObjectId(),
      paymentMethod: PaymentMethod.WALLET,
      status: OrderStatus.PENDING_PAYMENT,
    });
    await wallet.change(
      customer.id,
      `payment:${pending.id}`,
      -1200,
      pending.id,
    );
    await app.get(PaymentsService).initiate(customer.id, {
      orderId: pending.id,
      method: PaymentMethod.WALLET,
    });
    expect((await wallet.statement(customer.id)).balanceCents).toBe(
      balance - 1200,
    );
    await app
      .get(PaymentsService)
      .cancel(customer.id, pending.id, "Changed my mind");
    expect((await wallet.statement(customer.id)).balanceCents).toBe(balance);
  });
  it("isolates partner statements and records an auditable manual transfer", async () => {
    const recorded = await call("post", "finance/admin/settlements", "admin", {
      orderId: order.id,
      party: "provider",
      amountCents: 700,
      dueAt: new Date().toISOString(),
      note: "Agreed recipe production cost",
    }).expect(201);
    await call("post", "finance/admin/settlements", "admin", {
      orderId: order.id,
      party: "provider",
      amountCents: 700,
      dueAt: new Date().toISOString(),
      note: "Duplicate record not permitted",
    }).expect(409);
    expect(
      (await call("get", "finance/provider", "provider").expect(200)).body
        .pendingCents,
    ).toBe(700);
    expect(
      (await call("get", "finance/courier", "courier").expect(200)).body
        .entries,
    ).toHaveLength(0);
    await call(
      "post",
      `finance/admin/settlements/${recorded.body._id}/paid`,
      "admin",
      { paymentReference: "BANK-TEST-001" },
    ).expect(201);
    const statement = await call("get", "finance/provider", "provider").expect(
      200,
    );
    expect(statement.body.paidCents).toBe(700);
    expect(JSON.stringify(statement.body)).not.toMatch(/createdBy|paidBy|note/);
  });
  it("persists marketing campaigns and prevents stale task updates", async () => {
    const campaign = await call("post", "growth/campaigns", "admin", {
      name: "Neighbourhood pizza night",
      code: "pizza-night",
      channel: "local",
      audience: "new",
      startAt: new Date(Date.now() - 60000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
      budgetCents: 10000,
    }).expect(201);
    await call("patch", `growth/campaigns/${campaign.body._id}`, "admin", {
      status: "active",
      spendCents: 2000,
    }).expect(200);
    const task = await call("post", "growth/tasks", "admin", {
      title: "Review kitchen readiness for dinner",
      area: "operations",
      dueAt: new Date().toISOString(),
    }).expect(201);
    await call("patch", `growth/tasks/${task.body._id}`, "admin", {
      revision: 0,
      status: "doing",
    }).expect(200);
    await call("patch", `growth/tasks/${task.body._id}`, "admin2", {
      revision: 0,
      status: "done",
    }).expect(409);
  });
  it("records referral terms, restricts reward approval and credits both accounts once", async () => {
    await call("patch", "referrals/admin/settings", "admin", {
      rewardCents: 300,
    }).expect(200);
    const inviter = await call("get", "referrals/me", "customer").expect(200);
    await call("post", "referrals/apply", "customer", {
      code: inviter.body.code,
    }).expect(400);
    await call("post", "referrals/apply", "other", {
      code: inviter.body.code,
    }).expect(201);
    await call("post", "referrals/apply", "other", {
      code: inviter.body.code,
    }).expect(201);
    await call("patch", "referrals/admin/settings", "admin", {
      rewardCents: 700,
    }).expect(200);
    const row = (await call("get", "referrals/admin", "admin").expect(200))
      .body[0];
    expect(row.rewardCents).toBe(300);
    await call("post", `referrals/admin/${row._id}/approve`, "customer").expect(
      403,
    );
    await call("post", `referrals/admin/${row._id}/approve`, "admin").expect(
      400,
    );
    const delivered = await orders.create({
      ...order.toObject(),
      _id: new Types.ObjectId(),
      customerId: ids.other,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.CAPTURED,
    });
    const before = (await call("get", "wallet", "customer").expect(200)).body
      .balanceCents;
    await Promise.all([
      call("post", `referrals/admin/${row._id}/approve`, "admin").expect(201),
      call("post", `referrals/admin/${row._id}/approve`, "admin2").expect(201),
    ]);
    const friend = await call("get", "wallet", "other").expect(200);
    expect(friend.body.balanceCents).toBe(300);
    const sponsor = await call("get", "wallet", "customer").expect(200);
    expect(sponsor.body.balanceCents).toBe(before + 300);
    expect(sponsor.body.entries[0]).toMatchObject({
      kind: "referral",
      orderId: "",
    });
    expect(JSON.stringify(sponsor.body)).not.toContain(delivered.id);
    const own = await call("get", "referrals/me", "other").expect(200);
    expect(own.body).toMatchObject({
      applied: true,
      agreedRewardCents: 300,
      ownStatus: "rewarded",
    });
  });

  it("reserves withdrawals, requires admin review, and records manual payment exactly once", async () => {
    await call("post", "finance/admin/payout-accounts", "admin", {
      party: "courier",
      payeeId: ids.courier,
      accountId: "acct_testcourier",
    }).expect(400);
    await call("post", "finance/admin/settlements", "admin", {
      orderId: order.id,
      party: "courier",
      amountCents: 250,
      dueAt: new Date(Date.now() - 1000).toISOString(),
      note: "Agreed courier fee",
      autoTransfer: true,
    }).expect(400);
    const settlement = await call(
      "post",
      "finance/admin/settlements",
      "admin",
      {
        orderId: order.id,
        party: "courier",
        amountCents: 250,
        dueAt: new Date(Date.now() - 1000).toISOString(),
        note: "Agreed courier fee",
      },
    ).expect(201);
    await call("post", "finance/courier/withdrawals", "customer", {
      requestKey: "withdraw-once",
      payoutDetails: "Private test bank account",
    }).expect(403);
    const requested = await call(
      "post",
      "finance/courier/withdrawals",
      "courier",
      {
        requestKey: "withdraw-once",
        payoutDetails: "Private test bank account",
      },
    ).expect(201);
    const id = requested.body.id;
    expect(requested.body.amountCents).toBe(250);
    expect(
      (
        await call("post", "finance/courier/withdrawals", "courier", {
          requestKey: "withdraw-once",
          payoutDetails: "Private test bank account",
        }).expect(201)
      ).body.id,
    ).toBe(id);
    await call("post", "finance/courier/withdrawals", "courier", {
      requestKey: "withdraw-twice",
      payoutDetails: "Private test bank account",
    }).expect(409);
    await call(
      "post",
      `finance/admin/settlements/${settlement.body._id}/paid`,
      "admin",
      { paymentReference: "BYPASS-BLOCKED" },
    ).expect(409);
    await call("post", `finance/admin/withdrawals/${id}/review`, "admin", {
      revision: 0,
      status: "paid",
      note: "Payment should fail",
      paymentReference: "MANUAL-001",
    }).expect(409);
    await call("post", `finance/admin/withdrawals/${id}/review`, "courier", {
      revision: 0,
      status: "approved",
      note: "Self approval blocked",
    }).expect(403);
    await call("post", `finance/admin/withdrawals/${id}/review`, "admin", {
      revision: 0,
      status: "approved",
      note: "Bank details checked",
    }).expect(201);
    await call("post", `finance/admin/withdrawals/${id}/review`, "admin2", {
      revision: 0,
      status: "rejected",
      note: "Stale revision blocked",
    }).expect(409);
    const payment = {
      revision: 1,
      status: "paid",
      note: "Manual bank transfer completed",
      paymentReference: "MANUAL-001",
    };
    await call(
      "post",
      `finance/admin/withdrawals/${id}/review`,
      "admin",
      payment,
    ).expect(201);
    await call(
      "post",
      `finance/admin/withdrawals/${id}/review`,
      "admin",
      payment,
    ).expect(201);
    expect(
      (await call("get", "finance/courier", "courier").expect(200)).body,
    ).toMatchObject({ pendingCents: 0, paidCents: 250, transferredCents: 0 });
    const own = await call(
      "get",
      "finance/courier/withdrawals",
      "courier",
    ).expect(200);
    expect(own.body[0].status).toBe("paid");
    expect(JSON.stringify(own.body)).not.toContain("actor");
    expect(
      (
        await call("get", "finance/provider/withdrawals", "provider").expect(
          200,
        )
      ).body,
    ).toEqual([]);
    await call("get", "finance/admin/withdrawals", "customer").expect(403);
  });

  it("validates and persists scheduled start times while allowing cancellation before preparation", async () => {
    const address = await call("post", "orders/addresses", "customer", {
      label: "Home",
      street: "Example 12",
      city: "Vienna",
      zipcode: "1010",
      country: "AT",
      longitude: 16.37,
      latitude: 48.2,
    }).expect(201);
    const menu = await app.get(CatalogService).getPublishedMenu();
    const dto = {
      menuVersion: menu.version!.version,
      addressId: address.body._id ?? address.body.id,
      paymentMethod: "card",
      lines: [{ menuItemId: menu.items[0].id, quantity: 1 }],
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    };
    await call("post", "orders", "customer", {
      ...dto,
      scheduledAt: new Date(0).toISOString(),
    }).expect(400);
    await call("post", "orders", "customer", {
      ...dto,
      scheduledAt: new Date(Date.now() + 8 * 86400000).toISOString(),
    }).expect(400);
    const created = await call("post", "orders", "customer", dto).expect(201);
    expect(created.body.scheduledAt).toBe(dto.scheduledAt);
    await orders.updateOne(
      { _id: created.body.id },
      { $set: { status: OrderStatus.SCHEDULED } },
    );
    const view = await call(
      "get",
      `orders/${created.body.id}`,
      "customer",
    ).expect(200);
    expect(view.body).toMatchObject({
      canCancel: true,
      customerStatus: "received",
    });
    await app
      .get(PaymentsService)
      .cancel(customer.id, created.body.id, "Changed planned time");
    expect((await orders.findById(created.body.id).orFail()).status).toBe(
      OrderStatus.CANCELLED,
    );
  });
  it("configures pizza choices through admin, enforces prices, and preserves cloned identity", async () => {
    const catalog = app.get(CatalogService);
    const version = await catalog.createVersion({ notes: "Dynamic test" });
    const category = await catalog.addCategory(version.id, {
      name: "Custom pizzas",
    });
    const customization = {
      variants: [
        { id: "regular", name: "26 cm", priceCents: 1100, isActive: true },
        { id: "large", name: "40 cm", priceCents: 1600, isActive: true },
      ],
      groups: [
        {
          id: "crust",
          name: "Crust",
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
            {
              id: "filled",
              name: "Filled",
              priceCents: 250,
              isActive: true,
              variantIds: ["large"],
            },
          ],
        },
      ],
    };
    await call("post", `catalog/versions/${version.id}/items`, "customer", {
      categoryId: category.id,
      name: "Pizza",
      priceCents: 1100,
      customization,
    }).expect(403);
    const item = await call(
      "post",
      `catalog/versions/${version.id}/items`,
      "admin",
      {
        categoryId: category.id,
        name: "Custom pizza",
        priceCents: 1100,
        customization,
        recipeIngredients: [{ name: "Flour", weightGrams: 180 }],
      },
    ).expect(201);
    const itemId = item.body._id;
    await catalog.publish(version.id);
    const address = await call("post", "orders/addresses", "customer", {
      label: "Home",
      street: "Test 1",
      longitude: 16.37,
      latitude: 48.2,
    }).expect(201);
    const body = {
      menuVersion: version.version,
      addressId: address.body._id ?? address.body.id,
      paymentMethod: "card",
      lines: [
        {
          menuItemId: itemId,
          quantity: 2,
          variantId: "large",
          selections: [{ groupId: "crust", optionIds: ["filled"] }],
        },
      ],
    };
    const quote = await call("post", "orders/quote", "customer", body).expect(
      201,
    );
    expect(quote.body.subtotalCents).toBe(3700);
    expect(quote.body.lines[0].selectionLabels).toEqual([
      "40 cm",
      "Crust: Filled",
    ]);
    expect(JSON.stringify(quote.body)).not.toContain("recipeSnapshot");
    await call("post", "orders/quote", "customer", {
      ...body,
      lines: [{ ...body.lines[0], variantId: "regular" }],
    }).expect(400);
    await call("post", "orders/quote", "customer", {
      ...body,
      lines: [{ ...body.lines[0], selections: [] }],
    }).expect(400);
    await call("post", "growth/coupons", "customer", {
      code: "PIZZA20",
      name: "Pizza promotion",
      kind: "percent",
      value: 20,
      minSubtotalCents: 1000,
      maxDiscountCents: 500,
      startAt: new Date(Date.now() - 60000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
    }).expect(403);
    const coupon = await call("post", "growth/coupons", "admin", {
      code: "PIZZA20",
      name: "Pizza promotion",
      kind: "percent",
      value: 20,
      minSubtotalCents: 1000,
      maxDiscountCents: 500,
      startAt: new Date(Date.now() - 60000).toISOString(),
      endAt: new Date(Date.now() + 86400000).toISOString(),
    }).expect(201);
    const discounted = await call("post", "orders/quote", "customer", {
      ...body,
      couponCode: "PIZZA20",
    }).expect(201);
    expect(discounted.body.discountCents).toBe(500);
    expect(discounted.body.totalCents).toBe(quote.body.totalCents - 500);
    await call("patch", `growth/coupons/${coupon.body._id}`, "admin", {
      active: false,
    }).expect(200);
    await call("post", "orders/quote", "customer", {
      ...body,
      couponCode: "PIZZA20",
    }).expect(400);
    const created = await call("post", "orders", "customer", body).expect(201);
    const saved = await orders
      .findById(created.body.id ?? created.body._id)
      .exec();
    expect(
      saved?.lines[0].recipeSnapshot?.recipeIngredients[0].weightGrams,
    ).toBe(180);
    await catalog.updateItem(itemId, {
      recipeIngredients: [{ name: "Flour", weightGrams: 250 }],
    });
    expect(
      (await orders.findById(saved!._id).exec())?.lines[0].recipeSnapshot
        ?.recipeIngredients[0].weightGrams,
    ).toBe(180);
    const cloned = await call(
      "post",
      `catalog/versions/${version.id}/clone`,
      "admin",
    ).expect(201);
    const detail = await catalog.getVersionDetail(
      cloned.body._id ?? cloned.body.id,
    );
    expect(detail.items[0].pizzaId).toBe(item.body.pizzaId);
    expect(detail.items[0].customization).toEqual(customization);
    await orders
      .updateOne(
        { _id: saved!._id },
        {
          $set: {
            status: OrderStatus.COMPLETED,
            paymentStatus: PaymentStatus.CAPTURED,
            providerId,
          },
        },
      )
      .exec();
    await call("post", `care/orders/${saved!.id}/feedback`, "customer", {
      taste: 5,
      temperature: 5,
      packaging: 5,
      delivery: 5,
      wouldOrderAgain: true,
      comment: "Excellent dough.",
      allowPublication: true,
    }).expect(201);
    const feedback = (
      await call("get", "care/admin/feedback", "admin").expect(200)
    ).body.recent.find((row: { orderId: string }) => row.orderId === saved!.id);
    await call(
      "patch",
      `care/admin/feedback/${feedback._id}/publication`,
      "admin",
      {
        revision: 0,
        published: true,
        pizzaId: itemId,
        text: "Excellent dough.",
      },
    ).expect(200);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/v1/pizza-comments/${detail.items[0].id}`)
          .expect(200)
      ).body[0].text,
    ).toBe("Excellent dough.");

    const visible = await call("get", "catalog/menu", "customer").expect(200);
    expect(visible.body.items[0]).not.toHaveProperty("recipeIngredients");
    await call("patch", `catalog/categories/${category.id}`, "admin", {
      isActive: false,
    }).expect(200);
    expect(
      (await call("get", "catalog/menu", "customer").expect(200)).body.items,
    ).toEqual([]);
    await call("post", "orders/quote", "customer", body).expect(400);
  });
  it("releases rejected withdrawals and recovers interrupted manual payment recording", async () => {
    const copy = await orders.create({
      ...order.toObject(),
      _id: new Types.ObjectId(),
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.CAPTURED,
    });
    await call("post", "finance/admin/settlements", "admin", {
      orderId: copy.id,
      party: "provider",
      amountCents: 450,
      dueAt: new Date(Date.now() - 1000).toISOString(),
      note: "Approved kitchen earnings",
    }).expect(201);
    const first = (
      await call("post", "finance/provider/withdrawals", "provider", {
        requestKey: "provider-reject-1",
        payoutDetails: "Provider bank account test",
      }).expect(201)
    ).body;
    await call(
      "post",
      `finance/admin/withdrawals/${first.id}/review`,
      "admin",
      { revision: 0, status: "rejected", note: "Please verify bank details" },
    ).expect(201);
    const next = (
      await call("post", "finance/provider/withdrawals", "provider", {
        requestKey: "provider-retry-2",
        payoutDetails: "Verified provider bank account",
      }).expect(201)
    ).body;
    expect(next.amountCents).toBe(450);
    await call("post", `finance/admin/withdrawals/${next.id}/review`, "admin", {
      revision: 0,
      status: "approved",
      note: "Bank details checked",
    }).expect(201);
    const settlements = app.get<Model<object>>(getModelToken("Settlement"));
    const interrupted = jest
      .spyOn(settlements, "updateMany")
      .mockImplementationOnce(() => {
        throw new Error("Simulated database interruption");
      });
    const paid = {
      revision: 1,
      status: "paid",
      note: "Manual bank payment made",
      paymentReference: "BANK-PROVIDER-RECOVER",
    };
    try {
      await call(
        "post",
        `finance/admin/withdrawals/${next.id}/review`,
        "admin",
        paid,
      ).expect(500);
    } finally {
      interrupted.mockRestore();
    }
    await call("post", `finance/admin/withdrawals/${next.id}/review`, "admin", {
      ...paid,
      paymentReference: "WRONG-REFERENCE",
    }).expect(409);
    await call(
      "post",
      `finance/admin/withdrawals/${next.id}/review`,
      "admin",
      paid,
    ).expect(201);
    expect(
      (
        await call("get", "finance/provider/withdrawals", "provider").expect(
          200,
        )
      ).body[0],
    ).toMatchObject({ status: "paid", amountCents: 450 });
  });

  it("supports multiple categories and scheduled menu publication without exposing internal fields", async () => {
    const catalog = app.get(CatalogService);
    const version = await catalog.createVersion({ notes: "Publication test" });
    const a = await catalog.addCategory(version.id, { name: "Classic" });
    const b = await catalog.addCategory(version.id, { name: "Dinner" });
    const item = await catalog.addItem(version.id, {
      categoryId: a.id,
      additionalCategoryIds: [b.id],
      name: "Scheduled pizza",
      priceCents: 1000,
      presentation: {
        gallery: [],
        fields: [
          { name: "Serving", type: "number", value: "2", visibility: "public" },
          {
            name: "Private cost",
            type: "number",
            value: "3",
            visibility: "internal",
          },
        ],
        availability: {
          enabled: false,
          timezone: "UTC",
          periods: [],
          closedDates: [],
        },
      },
    });
    await catalog.updateCategory(a.id, { isActive: false });
    await catalog.schedulePublish(
      version.id,
      new Date(Date.now() + 60000).toISOString(),
    );
    await catalog.schedulePublish(version.id);
    await catalog.publishScheduled();
    expect(
      (await catalog.listVersions()).find((v) => v.id === version.id)
        ?.published,
    ).toBe(false);
    const versions = app.get<Model<object>>(getModelToken("MenuVersion"));
    await versions
      .updateOne(
        { _id: version._id },
        { $set: { scheduledPublishAt: new Date(Date.now() - 1000) } },
      )
      .exec();
    await catalog.publishScheduled();
    const menu = await catalog.getPublishedMenu();
    expect(menu.version?.version).toBe(version.version);
    expect(menu.items[0].id).toBe(item.id);
    expect(menu.categories.map((c) => c.name)).toEqual(["Dinner"]);
    expect(JSON.stringify(menu)).not.toContain("Private cost");
    await catalog.updateCategory(b.id, { isActive: false });
    expect(
      (await catalog.getActiveItemsByIds([item.id], version.version)).items,
    ).toEqual([]);
  });
});
