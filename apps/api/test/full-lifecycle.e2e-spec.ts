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
describe("Full lifecycle all roles (e2e)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  let adminToken = "";
  let providerToken = "";
  let providerEntityId = "";
  let providerUserId = "";
  let customerToken = "";
  let courierToken = "";
  let courierUserId = "";
  let menuVersion = 0;
  let menuItemId = "";
  let addressId = "";

  const kitchenLng = 11.5755;
  const kitchenLat = 48.1374;
  const customerLng = 11.58;
  const customerLat = 48.14;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = "qa-full-lifecycle-secret";
    process.env.OTP_DEV_BYPASS = "true";
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.REDIS_URL;

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

  async function registerAndLogin(
    role: string,
    email: string,
    password: string,
    loginRole: string,
  ) {
    const server = app.getHttpServer();
    await request(server)
      .post("/api/v1/account/auth/register")
      .send({
        firstName: role,
        lastName: "QA",
        email,
        password,
        role,
      })
      .expect(201);

    const login = await request(server)
      .post(`/api/v1/account/auth/${loginRole}/login`)
      .send({ method: "password", email, password })
      .expect(201);

    return {
      token: login.body.accessToken as string,
      userId: login.body.user.id as string,
    };
  }

  async function completeQualityHandoff(orderId: string) {
    const server = app.getHttpServer();
    await request(server)
      .post(`/api/v1/quality/orders/${orderId}/checklist`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        answers: [
          { item: "Weight check", ok: true },
          { item: "Packaging seal", ok: true },
          { item: "Temperature", ok: true },
        ],
      })
      .expect(201);

    await request(server)
      .post(`/api/v1/quality/orders/${orderId}/seal`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ sealId: `SEAL-${orderId.slice(-6)}` })
      .expect(201);
  }

  it("boots roles, menu, happy path through COMPLETED + ETA + proof", async () => {
    const server = app.getHttpServer();

    const admin = await registerAndLogin(
      "admin",
      "qa.admin@test.local",
      "Admin123!",
      "admin",
    );
    adminToken = admin.token;

    const provider = await registerAndLogin(
      "provider",
      "qa.provider@test.local",
      "Provider123!",
      "provider",
    );
    providerToken = provider.token;
    providerUserId = provider.userId;

    const customer = await registerAndLogin(
      "client",
      "qa.customer@test.local",
      "Customer123!",
      "client",
    );
    customerToken = customer.token;

    const courier = await registerAndLogin(
      "courier",
      "qa.courier@test.local",
      "Courier123!",
      "courier",
    );
    courierToken = courier.token;
    courierUserId = courier.userId;

    const providerRes = await request(server)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: providerUserId,
        name: "QA Kitchen",
        address: "Marienplatz 1, München",
        longitude: kitchenLng,
        latitude: kitchenLat,
        rating: 4.7,
      })
      .expect(201);
    providerEntityId = String(providerRes.body.id ?? providerRes.body._id);

    const versionRes = await request(server)
      .post("/api/v1/catalog/versions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ notes: "qa menu" })
      .expect(201);
    const versionId = versionRes.body.id ?? versionRes.body._id;

    const categoryRes = await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/categories`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Pizzas", sortOrder: 1 })
      .expect(201);
    const categoryId = categoryRes.body.id ?? categoryRes.body._id;

    const itemRes = await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/items`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: "QA Margherita",
        description: "Test pizza",
        priceCents: 999,
        prepWeight: 1,
        cookTimeSeconds: 480,
        requiresNumberedSeal: true,
        requiresReadyPhoto: false,
        checklistTemplate: ["Weight check", "Packaging seal", "Temperature"],
      })
      .expect(201);
    menuItemId = String(itemRes.body.id ?? itemRes.body._id);

    await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(201);

    const menu = await request(server).get("/api/v1/catalog/menu").expect(200);
    menuVersion = menu.body.version.version;

    // Admin can read config (wave knobs)
    const cfg = await request(server)
      .get("/api/v1/app-config")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(cfg.body.waveSize).toBeGreaterThanOrEqual(1);
    expect(cfg.body.bidWindowSeconds).toBeGreaterThanOrEqual(5);

    const addressRes = await request(server)
      .post("/api/v1/orders/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        label: "Home",
        street: "Maximilianstrasse 12",
        city: "Munich",
        zipcode: "80539",
        country: "DE",
        longitude: customerLng,
        latitude: customerLat,
        isDefault: true,
      })
      .expect(201);
    addressId = String(addressRes.body.id ?? addressRes.body._id);

    const orderRes = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);
    expect(orderRes.body.providerId).toBeUndefined();
    expect(orderRes.body.providerName).toBeUndefined();
    expect(orderRes.body.status).toBeUndefined();

    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, method: "card" })
      .expect(201);

    const offers = await request(server)
      .get("/api/v1/dispatch/offers")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    expect(offers.body.length).toBeGreaterThan(0);
    expect(offers.body[0].wave).toBe(true);

    // Wave respond (preferred) — single kitchen resolves immediately
    const wave = await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/respond`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ ready: true, quotedPrepMinutes: 18 })
      .expect(201);
    expect(wave.body.status).toBe("ACCEPTED_BY_PROVIDER");
    expect(wave.body.eta).toBeDefined();
    expect(wave.body.eta.prepMin).toBeLessThan(wave.body.eta.prepMax);

    let tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.providerId).toBeUndefined();
    expect(tracked.body.status).toBeUndefined();
    expect(["kitchen", "preparing", "received"]).toContain(
      tracked.body.customerStatus,
    );
    expect(tracked.body.etaPrepMin).toBeDefined();
    expect(tracked.body.etaPrepMax).toBeGreaterThan(tracked.body.etaPrepMin);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/prep-override`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ prepOverrideMinutes: 22 })
      .expect(200);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "PREPARING" })
      .expect(200);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("preparing");

    // Cannot mark ready without quality handoff
    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "READY_FOR_PICKUP" })
      .expect(400);

    await completeQualityHandoff(orderId);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "READY_FOR_PICKUP" })
      .expect(200);

    const suggest = await request(server)
      .post("/api/v1/batches/suggest")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId })
      .expect(201);
    expect(suggest.body.suggestedOrderIds).toContain(orderId);

    const batchRes = await request(server)
      .post("/api/v1/batches")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId, orderIds: [orderId] })
      .expect(201);
    const batchId = String(batchRes.body.id ?? batchRes.body._id);

    await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ code: "QA-START-001" })
      .expect(201);

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect(201);

    const assigned = await request(server)
      .get("/api/v1/batches/assigned")
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    expect(
      assigned.body.some(
        (b: { _id?: string; id?: string }) =>
          String(b.id ?? b._id) === batchId,
      ),
    ).toBe(true);

    await request(server)
      .post("/api/v1/couriers/me/location")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ longitude: kitchenLng, latitude: kitchenLat })
      .expect(201);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("driver");
    expect(tracked.body.providerId).toBeUndefined();
    expect(tracked.body.courierId).toBeUndefined();
    expect(tracked.body.pickupCode).toBeUndefined();
    expect(tracked.body.doorPin).toBeUndefined();

    const loc = await request(server)
      .get(`/api/v1/orders/${orderId}/courier-location`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(loc.body.longitude).toBeCloseTo(kitchenLng, 3);
    expect(loc.body.latitude).toBeCloseTo(kitchenLat, 3);

    // Provider can read pickup codes; customer cannot
    const codes = await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    expect(codes.body.pickupCode).toMatch(/^\d{6}$/);
    expect(codes.body.doorPin).toMatch(/^\d{4}$/);

    await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    const courierProof = await request(server)
      .get(`/api/v1/proof/orders/${orderId}`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    expect(courierProof.body.pickupCode).toBe(codes.body.pickupCode);

    // Pickup with wrong geo should fail
    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: codes.body.pickupCode,
        longitude: 10.0,
        latitude: 50.0,
        sealId: codes.body.sealId,
      })
      .expect(400);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: codes.body.pickupCode,
        longitude: kitchenLng,
        latitude: kitchenLat,
        sealId: codes.body.sealId,
      })
      .expect(201);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("onway");

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/en-route`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ longitude: 11.578, latitude: 48.139 })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        pin: codes.body.doorPin,
        longitude: customerLng,
        latitude: customerLat,
      })
      .expect(201);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("delivered");

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/complete`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(201);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("delivered");
  }, 180_000);

  it("enforces RBAC isolation across roles", async () => {
    const server = app.getHttpServer();

    await request(server)
      .get("/api/v1/dispatch/offers")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/orders/kitchen")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/orders/admin/review")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/dispatch/offers")
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/batches/assigned")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/couriers/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/incidents")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(403);

    await request(server)
      .get("/api/v1/app-config")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  }, 60_000);

  it("exception stays blind for customer and admin can resolve", async () => {
    const server = app.getHttpServer();

    const orderRes = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);

    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, method: "card" })
      .expect(201);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/respond`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ ready: true, quotedPrepMinutes: 15 })
      .expect(201);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "EXCEPTION_REPORTED" })
      .expect(200);

    const tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe("kitchen");
    expect(tracked.body.status).toBeUndefined();

    const review = await request(server)
      .get("/api/v1/orders/admin/review")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      review.body.some(
        (o: { _id?: string; id?: string }) => String(o.id ?? o._id) === orderId,
      ),
    ).toBe(true);

    await request(server)
      .patch(`/api/v1/orders/admin/review/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "PREPARING" })
      .expect(200);

    const after = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(after.body.customerStatus).toBe("preparing");
  }, 120_000);

  it("capacity 86/pause + courier incident workflow", async () => {
    const server = app.getHttpServer();

    // Pause kitchen
    await request(server)
      .post("/api/v1/providers/me/pause")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ reason: "rush cleanup" })
      .expect(201);

    const paused = await request(server)
      .get("/api/v1/providers/me/profile")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    expect(paused.body.acceptingOrders).toBe(false);

    // Order while paused should still create, but dispatch finds no kitchen
    const pausedOrder = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const pausedOrderId = String(pausedOrder.body.id ?? pausedOrder.body._id);

    const payPaused = await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: pausedOrderId, method: "card" })
      .expect(201);
    // No nearby accepting kitchen → empty wave
    expect(payPaused.body.dispatch?.offerCount ?? 0).toBe(0);

    await request(server)
      .post("/api/v1/providers/me/resume")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(201);

    // 86 the menu item — kitchen excluded from wave for that item
    await request(server)
      .post("/api/v1/providers/me/eighty-six")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ menuItemIds: [menuItemId] })
      .expect(201);

    const eightysixedOrder = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const eightyId = String(
      eightysixedOrder.body.id ?? eightysixedOrder.body._id,
    );
    const payEighty = await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: eightyId, method: "card" })
      .expect(201);
    expect(payEighty.body.dispatch?.offerCount ?? 0).toBe(0);

    await request(server)
      .delete("/api/v1/providers/me/eighty-six")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ menuItemIds: [menuItemId] })
      .expect(200);

    // Fresh order through assign for incident
    const orderRes = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);

    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, method: "card" })
      .expect(201);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/respond`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ ready: true, quotedPrepMinutes: 16 })
      .expect(201);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "PREPARING" })
      .expect(200);
    await completeQualityHandoff(orderId);
    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "READY_FOR_PICKUP" })
      .expect(200);

    const batchRes = await request(server)
      .post("/api/v1/batches")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId, orderIds: [orderId] })
      .expect(201);
    const batchId = String(batchRes.body.id ?? batchRes.body._id);

    // Courier may already have active session from previous test
    const sessionStart = await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ code: "QA-START-002" });
    expect([201, 400]).toContain(sessionStart.status);

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect(201);

    const incident = await request(server)
      .post(`/api/v1/incidents/orders/${orderId}`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        kind: "no_answer",
        notes: "buzzer no response",
        longitude: customerLng,
        latitude: customerLat,
      })
      .expect(201);
    expect(incident.body.kind).toBe("no_answer");
    expect(incident.body.status).toBe("waiting");
    expect(incident.body.workflow.steps).toContain("wait_timer_5m");

    const open = await request(server)
      .get("/api/v1/incidents")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      open.body.some(
        (i: { _id?: string; id?: string }) =>
          String(i.id ?? i._id) === String(incident.body.id ?? incident.body._id),
      ),
    ).toBe(true);

    await request(server)
      .patch(`/api/v1/incidents/${incident.body.id ?? incident.body._id}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved", notes: "customer opened" })
      .expect(200);
  }, 180_000);

  it("cash order requires cash receipt before complete", async () => {
    const server = app.getHttpServer();

    const orderRes = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "cash",
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);

    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId, method: "cash" })
      .expect(201);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/respond`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ ready: true, quotedPrepMinutes: 14 })
      .expect(201);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "PREPARING" })
      .expect(200);
    await completeQualityHandoff(orderId);
    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "READY_FOR_PICKUP" })
      .expect(200);

    const batchRes = await request(server)
      .post("/api/v1/batches")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId, orderIds: [orderId] })
      .expect(201);
    const batchId = String(batchRes.body.id ?? batchRes.body._id);

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect(201);

    const codes = await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: "000000",
        longitude: kitchenLng,
        latitude: kitchenLat,
      })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/en-route`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({})
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        pin: "0000",
        photoUrl: "https://cdn.yespizz.local/dropoff.jpg",
        longitude: customerLng,
        latitude: customerLat,
      })
      .expect(201);

    // Cash without receipt cannot complete
    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/complete`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(400);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/cash-receipt`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ amountCents: 1298 })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/complete`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(201);

    // unused but keeps lint quiet if codes needed later
    expect(codes.body.pickupCode).toBeDefined();
  }, 180_000);

  it("rejects wrong-role password login as unauthenticated", async () => {
    const server = app.getHttpServer();
    await request(server)
      .post("/api/v1/account/auth/admin/login")
      .send({
        method: "password",
        email: "qa.customer@test.local",
        password: "Customer123!",
      })
      .expect(401);
  });
});
