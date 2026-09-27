import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import request from "supertest";
import { RealtimeGateway } from "../src/realtime/realtime.gateway";
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
    mongo = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || "7.0.24" },
    });
    process.env.MONGODB_URI = mongo.getUri();
    process.env.MEDIA_LOCAL_DIR = "/tmp/yespiz-test-media";
    process.env.JWT_SECRET = "qa-full-lifecycle-secret";
    process.env.OTP_DEV_BYPASS = "true";
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_MODE = "";
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

    const admin = await bootstrapAdmin("qa.admin@test.local", "Admin123!");
    adminToken = admin.token;

    const provider = await inviteAndRegister(
      adminToken,
      "provider",
      "qa.provider@test.local",
      "Provider123!",
    );
    providerToken = provider.token;
    providerUserId = provider.userId;

    const customer = await registerCustomer(
      "qa.customer@test.local",
      "Customer123!",
    );
    customerToken = customer.token;

    const courier = await inviteAndRegister(
      adminToken,
      "courier",
      "qa.courier@test.local",
      "Courier123!",
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

    await request(server)
      .post(`/api/v1/quality/orders/${orderId}/checklist`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ answers: [{ item: "Unrelated check", ok: true }] })
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

    const shiftCode = await request(server)
      .post("/api/v1/couriers/sessions/code")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courierId: courierUserId, action: "start" })
      .expect(201);
    await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ code: shiftCode.body.code })
      .expect(201);
    const profileCheck = await request(server)
      .get("/api/v1/couriers/me")
      .set("Authorization", `Bearer ${courierToken}`);
    expect(profileCheck.body.onDuty).toBe(true);
    const currentCheck = await request(server)
      .get("/api/v1/couriers/sessions/current")
      .set("Authorization", `Bearer ${courierToken}`);
    expect(currentCheck.body.status).toBe("active");
    const availableCheck = await request(server)
      .get("/api/v1/couriers/available")
      .set("Authorization", `Bearer ${providerToken}`);
    expect(availableCheck.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: courierUserId }),
      ]),
    );

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: providerUserId })
      .expect(400);

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect((res) => {
        if (res.status !== 201) throw new Error(JSON.stringify(res.body));
      })
      .expect(201);

    const assigned = await request(server)
      .get("/api/v1/batches/assigned")
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    expect(
      assigned.body.some(
        (b: { _id?: string; id?: string }) => String(b.id ?? b._id) === batchId,
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
    expect(loc.body.longitude).toBeNull();
    expect(loc.body.latitude).toBeNull();

    const message = {
      text: "Please ring once",
      clientId: "b2f63193-1654-4e60-8a23-dc534301e597",
    };
    await request(server)
      .post(`/api/v1/communications/orders/${orderId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send(message)
      .expect(201);
    await request(server)
      .post(`/api/v1/communications/orders/${orderId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send(message)
      .expect(201);
    const messages = await request(server)
      .get(`/api/v1/communications/orders/${orderId}/messages`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    expect(messages.body).toHaveLength(1);
    expect(messages.body[0]).toEqual(
      expect.objectContaining({ text: message.text, mine: false }),
    );
    expect(messages.body[0].senderId).toBeUndefined();
    await request(server)
      .get(`/api/v1/communications/orders/${orderId}/messages`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(404);

    // Pickup coordination stays private to the assigned kitchen and courier.
    const pickupMessage = { text: "Your sealed order is at counter two", clientId: "12f63193-1654-4e60-8a23-dc534301e597" };
    const kitchenEvents = jest.spyOn(app.get(RealtimeGateway), "emitToUser");
    for (let retry = 0; retry < 2; retry++) await request(server)
      .post(`/api/v1/communications/orders/${orderId}/kitchen-messages`)
      .set("Authorization", `Bearer ${providerToken}`).send(pickupMessage).expect(201);
    expect(kitchenEvents).toHaveBeenCalledTimes(2);
    expect(kitchenEvents).toHaveBeenCalledWith(providerUserId, "messages.updated", { orderId, channel: "kitchen" });
    expect(kitchenEvents).toHaveBeenCalledWith(courierUserId, "messages.updated", { orderId, channel: "kitchen" });
    kitchenEvents.mockRestore();
    const kitchenMessages = await request(server)
      .get(`/api/v1/communications/orders/${orderId}/kitchen-messages`)
      .set("Authorization", `Bearer ${courierToken}`).expect(200);
    expect(kitchenMessages.body).toHaveLength(1);
    expect(kitchenMessages.body[0]).toMatchObject({ text: pickupMessage.text, senderRole: "kitchen", mine: false });
    await request(server).get(`/api/v1/communications/orders/${orderId}/kitchen-messages`)
      .set("Authorization", `Bearer ${customerToken}`).expect(404);
    const customerMessages = await request(server).get(`/api/v1/communications/orders/${orderId}/messages`)
      .set("Authorization", `Bearer ${customerToken}`).expect(200);
    expect(customerMessages.body).toHaveLength(1);
    expect(customerMessages.body[0].text).toBe(message.text);

    // Provider can read pickup codes; customer cannot
    const codes = await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    expect(codes.body.pickupCode).toMatch(/^\d{6}$/);
    expect(codes.body.doorPin).toBeUndefined();
    expect(tracked.body.deliveryPin).toMatch(/^\d{4}$/);

    await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    const courierProof = await request(server)
      .get(`/api/v1/proof/orders/${orderId}`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    expect(courierProof.body.pickupCode).toBeUndefined();

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: "000000",
        sealId: codes.body.sealId,
        longitude: kitchenLng,
        latitude: kitchenLat,
      })
      .expect(400);
    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: codes.body.pickupCode,
        longitude: kitchenLng,
        latitude: kitchenLat,
      })
      .expect(400);

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
    const movingBatches = await request(server).get("/api/v1/batches/assigned")
      .set("Authorization", `Bearer ${courierToken}`).expect(200);
    expect(movingBatches.body.find((batch: { id?: string; _id?: string }) => String(batch.id ?? batch._id) === batchId).status).toBe("in_progress");
    // A lost assignment response must never rewind an already collected order.
    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect(201);
    const afterRetry = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(afterRetry.body.customerStatus).toBe("onway");

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/en-route`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ longitude: 11.578, latitude: 48.139 })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ pin: "0000", longitude: customerLng, latitude: customerLat })
      .expect(400);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        pin: tracked.body.deliveryPin,
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
      .expect((res) => {
        if (res.status !== 201) throw new Error(JSON.stringify(res.body));
      })
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
          String(i.id ?? i._id) ===
          String(incident.body.id ?? incident.body._id),
      ),
    ).toBe(true);

    await request(server)
      .patch(
        `/api/v1/incidents/${incident.body.id ?? incident.body._id}/resolve`,
      )
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
      .expect((res) => {
        if (res.status !== 201) throw new Error(JSON.stringify(res.body));
      })
      .expect(201);

    const codes = await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/pickup`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        code: codes.body.pickupCode,
        sealId: codes.body.sealId,
        longitude: kitchenLng,
        latitude: kitchenLat,
      })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/en-route`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({})
      .expect(201);

    const media = await request(server)
      .post("/api/v1/media")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        orderId,
        purpose: "dropoff",
        contentType: "image/png",
        base64:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      })
      .expect(201);
    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        photoUrl: "https://example.com/untrusted-proof.jpg",
        longitude: customerLng,
        latitude: customerLat,
      })
      .expect(400);
    await request(server)
      .get(`/api/v1/media/${media.body.id}`)
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(404);
    await request(server)
      .get(`/api/v1/media/${media.body.id}`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(200);
    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/deliver`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({
        photoUrl: media.body.reference,
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
      .send({ amountCents: orderRes.body.totalCents })
      .expect(201);

    await request(server)
      .post(`/api/v1/proof/orders/${orderId}/complete`)
      .set("Authorization", `Bearer ${courierToken}`)
      .expect(201);

    // unused but keeps lint quiet if codes needed later
    expect(codes.body.pickupCode).toBeDefined();
  }, 180_000);

  it("rejects a changed reviewed price before persistence and accepts a reviewed retry", async () => {
    const server = app.getHttpServer();
    const body = {
      menuVersion,
      addressId,
      paymentMethod: "card",
      lines: [{ menuItemId, quantity: 1 }],
      idempotencyKey: "reviewed-price-001",
    };
    const quote = await request(server)
      .post("/api/v1/orders/quote")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body)
      .expect(201);
    const collection = app
      .get<Connection>(getConnectionToken())
      .collection("orders");
    const rejected = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...body, expectedTotalCents: quote.body.totalCents - 1 })
      .expect(409);
    expect(rejected.body.message).toContain("price changed");
    expect(
      await collection.countDocuments({ idempotencyKey: body.idempotencyKey }),
    ).toBe(0);
    const accepted = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...body, expectedTotalCents: quote.body.totalCents })
      .expect(201);
    const retry = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...body, expectedTotalCents: quote.body.totalCents })
      .expect(201);
    expect(retry.body.id).toBe(accepted.body.id);
    expect(
      await collection.countDocuments({ idempotencyKey: body.idempotencyKey }),
    ).toBe(1);
  });

  it("blocks invalid orders but allows outside-area addresses with a delivery hint", async () => {
    const server = app.getHttpServer();
    const body = {
      menuVersion,
      addressId,
      paymentMethod: "card",
      lines: [{ menuItemId, quantity: 1 }],
    };
    const post = (payload: object) =>
      request(server)
        .post("/api/v1/orders/quote")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(payload);
    const expired = await post({
      ...body,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
    }).expect(400);
    expect(expired.body.message).toContain("start time");
    const stale = await post({ ...body, menuVersion: 99999 }).expect(400);
    expect(stale.body.message).toContain("menu has changed");
    const missing = await post({
      ...body,
      lines: [{ menuItemId: new Types.ObjectId().toString(), quantity: 1 }],
    }).expect(400);
    expect(missing.body.message).toContain("no longer available");
    const keys = [
      "SERVICE_AREA_RADIUS_METERS",
      "SERVICE_AREA_LATITUDE",
      "SERVICE_AREA_LONGITUDE",
    ];
    const previous = keys.map((key) => process.env[key]);
    try {
      process.env.SERVICE_AREA_RADIUS_METERS = "1000";
      process.env.SERVICE_AREA_LATITUDE = "0";
      process.env.SERVICE_AREA_LONGITUDE = "0";
      const outside = await post(body).expect(201);
      expect(outside.body.outsideDeliveryArea).toBe(true);
      const order = await request(server)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(body)
        .expect(201);
      expect(order.body.id).toBeDefined();
    } finally {
      keys.forEach((key, index) => {
        if (previous[index] === undefined) delete process.env[key];
        else process.env[key] = previous[index];
      });
    }
    const inside = await post(body).expect(201);
    expect(inside.body.outsideDeliveryArea).toBe(false);
  });

  it("quotes options, preserves delivery details and makes checkout retries idempotent", async () => {
    const server = app.getHttpServer();
    const body = {
      menuVersion,
      addressId,
      paymentMethod: "card",
      idempotencyKey: "checkout-retry-001",
      lines: [
        {
          menuItemId,
          quantity: 2,
          size: "large",
          extras: ["extra-cheese", "olives"],
        },
      ],
      deliveryEntrance: "B",
      deliveryFloor: "3",
      deliveryUnit: "12",
      deliveryDoorCode: "4567",
      deliveryInstructions: "Ring once",
    };
    const quote = await request(server)
      .post("/api/v1/orders/quote")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body)
      .expect(201);
    expect(quote.body.deliveryFeeCents).toBe(0);
    expect(quote.body.totalCents).toBe((999 + 300 + 150 + 100) * 2);
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(server)
          .post("/api/v1/orders")
          .set("Authorization", `Bearer ${customerToken}`)
          .send(body)
          .expect(201),
      ),
    );
    expect(responses[0].body.id).toBe(responses[1].body.id);
    const order = responses[0].body;
    expect(order.orderState).toBe("awaiting_payment");
    expect(order.totalCents).toBe(quote.body.totalCents);
    expect(order.lines[0]).toMatchObject({
      size: "large",
      extras: ["extra-cheese", "olives"],
      quantity: 2,
    });
    expect(order.deliveryFloor).toBe("3");
    await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...body, lines: [{ menuItemId, quantity: 1 }] })
      .expect(409);
    const pay = await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: order.id, method: "card" })
      .expect(201);
    expect(pay.body.dispatch.offers).toBeUndefined();
    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: order.id, method: "card" })
      .expect(201);
    const tracked = await request(server)
      .get(`/api/v1/orders/${order.id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.orderState).toBe("active");
    for (const line of [
      { menuItemId, quantity: 1.5 },
      { menuItemId, quantity: 1, extras: ["unknown"] },
      { menuItemId, quantity: 1, extras: ["olives", "olives"] },
    ]) {
      await request(server)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ ...body, idempotencyKey: undefined, lines: [line] })
        .expect(400);
    }
    await request(server)
      .post("/api/v1/orders/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ label: "Wrong", street: "Test", longitude: 181, latitude: 48 })
      .expect(400);
    await request(server)
      .post("/api/v1/orders/quote")
      .set("Authorization", `Bearer ${providerToken}`)
      .send(body)
      .expect(403);
  });

  it("isolates provider batches and handoff codes from other kitchens", async () => {
    const server = app.getHttpServer();
    const other = await inviteAndRegister(
      adminToken,
      "provider",
      "other.kitchen@test.local",
      "Other123!",
    );
    await request(server)
      .post("/api/v1/providers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: other.userId,
        name: "Other Kitchen",
        address: "Other road",
        longitude: kitchenLng,
        latitude: kitchenLat,
      })
      .expect(201);
    const batches = await request(server)
      .get("/api/v1/batches/provider")
      .set("Authorization", `Bearer ${providerToken}`)
      .expect(200);
    const batch = batches.body[0];
    const batchId = String(batch.id ?? batch._id);
    const orderId = String(batch.orderIds[0]);
    await request(server)
      .get(`/api/v1/batches/${batchId}`)
      .set("Authorization", `Bearer ${other.token}`)
      .expect(403);
    await request(server)
      .post("/api/v1/batches/suggest")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ providerId: providerEntityId })
      .expect(403);
    await request(server)
      .post("/api/v1/batches")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ providerId: providerEntityId, orderIds: [orderId] })
      .expect(403);
    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ courierId: courierUserId })
      .expect(403);
    await request(server)
      .get(`/api/v1/proof/orders/${orderId}/codes`)
      .set("Authorization", `Bearer ${other.token}`)
      .expect(403);
    await request(server)
      .get("/api/v1/couriers/available")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("cancels a paid order, refunds once, and preserves reorder options", async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: "card",
        lines: [{ menuItemId, quantity: 1, size: "large", extras: ["olives"] }],
      })
      .expect(201);
    const id = created.body.id;
    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: id })
      .expect(201);
    const cancel = await request(server)
      .post("/api/v1/payments/cancel-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: id, reason: "Changed delivery plans" })
      .expect(201);
    expect(cancel.body.orderState).toBe("cancelled");
    expect(cancel.body.paymentStatus).toBe("refunded");
    expect(cancel.body.refundStatus).toBe("succeeded");
    const repeated = await request(server)
      .post("/api/v1/payments/cancel-order")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: id, reason: "Retry after disconnect" })
      .expect(201);
    expect(repeated.body.paymentStatus).toBe("refunded");
    await request(server)
      .post("/api/v1/payments/initiate")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ orderId: id })
      .expect(400);
    const preview = await request(server)
      .post(`/api/v1/orders/reorder/${id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(201);
    expect(preview.body.cartLines[0]).toEqual(
      expect.objectContaining({
        size: "large",
        extras: ["olives"],
        unitPriceCents: created.body.lines[0].unitPriceCents,
      }),
    );
    const refunds = await request(server)
      .get("/api/v1/payments/refunds")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(
      refunds.body.filter((row: { orderId: string }) => row.orderId === id),
    ).toHaveLength(1);
    await request(server)
      .get("/api/v1/payments/refunds")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  it("uses dispatch-issued, expiring, single-use shift codes", async () => {
    const server = app.getHttpServer();
    const worker = await inviteAndRegister(
      adminToken,
      "courier",
      "secure.shift@test.local",
      "Courier123!",
    );
    await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: "000000" })
      .expect(400);
    await request(server)
      .post("/api/v1/couriers/sessions/code")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ courierId: worker.userId, action: "start" })
      .expect(403);
    const expired = await request(server)
      .post("/api/v1/couriers/sessions/code")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courierId: worker.userId, action: "start" })
      .expect(201);
    const connection = app.get<Connection>(getConnectionToken());
    await connection
      .collection("courier_sessions")
      .updateOne(
        { courierId: new Types.ObjectId(worker.userId), status: "pending" },
        { $set: { codeExpiresAt: new Date(Date.now() - 1_000) } },
      );
    await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: expired.body.code })
      .expect(400);
    const issued = await request(server)
      .post("/api/v1/couriers/sessions/code")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courierId: worker.userId, action: "start" })
      .expect(201);
    const started = await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: issued.body.code })
      .expect(201);
    expect(started.body.startCode).toBeUndefined();
    expect(started.body.endCode).toBeUndefined();
    await request(server)
      .post("/api/v1/couriers/sessions/start")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: issued.body.code })
      .expect(400);
    const current = await request(server)
      .get("/api/v1/couriers/sessions/current")
      .set("Authorization", `Bearer ${worker.token}`)
      .expect(200);
    expect(current.body.status).toBe("active");
    await request(server)
      .post("/api/v1/couriers/sessions/end")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: "000000" })
      .expect(400);
    const end = await request(server)
      .post("/api/v1/couriers/sessions/code")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courierId: worker.userId, action: "end" })
      .expect(201);
    await request(server)
      .post("/api/v1/couriers/sessions/end")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: end.body.code })
      .expect(201);
    await request(server)
      .post("/api/v1/couriers/sessions/end")
      .set("Authorization", `Bearer ${worker.token}`)
      .send({ code: end.body.code })
      .expect(400);
  });

  it("registers notification devices without accepting malformed or anonymous tokens", async () => {
    const server = app.getHttpServer();
    await request(server)
      .post("/api/v1/push/devices")
      .send({ token: "device-token-for-test-123", platform: "web" })
      .expect(401);
    await request(server)
      .post("/api/v1/push/devices")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ token: "short", platform: "web" })
      .expect(400);
    await request(server)
      .post("/api/v1/push/devices")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ token: "device-token-for-test-123", platform: "web" })
      .expect(201);
    await request(server)
      .delete("/api/v1/push/devices")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ token: "device-token-for-test-123" })
      .expect(200);
  });

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
