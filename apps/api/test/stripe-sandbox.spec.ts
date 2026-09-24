/** Real Stripe sandbox + CLI webhook delivery. Never runs in the default suite. */
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { execFile, spawn, ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { promisify, parseEnv } from "node:util";
import request from "supertest";
import Stripe from "stripe";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../src/account/schemas/user.schema";
import { GroupCart, GroupCartDocument } from "../src/groups/group.schema";
import { AppModule } from "../src/app.module";
import { I18nExceptionFilter } from "../src/common/filters/i18n-exception.filter";

const root = resolve(__dirname, "../../..");
const envFile = resolve(root, ".env.stripe-sandbox");
if (existsSync(envFile)) {
  const values = parseEnv(readFileSync(envFile, "utf8"));
  for (const name of ["STRIPE_SANDBOX_SECRET_KEY", "STRIPE_CLI_BIN"]) {
    if (!process.env[name] && values[name]) process.env[name] = values[name];
  }
}
const key = process.env.STRIPE_SANDBOX_SECRET_KEY;
if (!key || !/^(sk|rk|rkcs)_test_/.test(key)) {
  throw new Error(
    "Set STRIPE_SANDBOX_SECRET_KEY in .env.stripe-sandbox to a Stripe sandbox key. Live keys and mock mode are refused.",
  );
}
const stripe = new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 });
const secret = key;
const intents = new Set<string>();
const subscriptions = new Set<string>();
const checkoutSessions = new Set<string>();
let app: INestApplication;
let mongo: MongoMemoryServer;
let listener: ChildProcess | undefined;
let customerToken = "";
let adminToken = "";
let providerToken = "";
let menuVersion: number;
let menuItemId = "";
let addressId = "";
let webhookSecret = "";

async function poll<T>(
  read: () => Promise<T>,
  accept: (value: T) => boolean,
): Promise<T> {
  const deadline = Date.now() + 45000;
  do {
    const value = await read();
    if (accept(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 500));
  } while (Date.now() < deadline);
  throw new Error("Sandbox state did not converge within 45 seconds.");
}
function post(path: string, data: object, token = customerToken) {
  return request(app.getHttpServer())
    .post(`/api/v1/${path}`)
    .set("Authorization", `Bearer ${token}`)
    .send(data);
}
function readOrder(id: string) {
  return request(app.getHttpServer())
    .get(`/api/v1/orders/${id}`)
    .set("Authorization", `Bearer ${customerToken}`)
    .expect(200)
    .then((r) => r.body);
}
async function createPayment() {
  const order = await post("orders", {
    menuVersion,
    addressId,
    paymentMethod: "card",
    idempotencyKey: randomBytes(16).toString("hex"),
    lines: [
      { menuItemId, quantity: 1, size: "large", extras: ["extra-cheese"] },
    ],
  }).expect(201);
  const orderId = order.body.id;
  const payment = await post("payments/initiate", {
    orderId,
    method: "card",
  }).expect(201);
  expect(payment.body.mock).toBe(false);
  const intentId =
    payment.body.paymentIntentId ?? payment.body.payment.providerRef;
  intents.add(intentId);
  const intent = await stripe.paymentIntents.retrieve(intentId);
  expect(intent.livemode).toBe(false);
  expect(intent.amount).toBe(order.body.totalCents);
  return { orderId, intentId };
}

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: "test",
    STRIPE_MODE: "sandbox",
    STRIPE_SECRET_KEY: secret,
    STRIPE_WEBHOOK_SECRET: "pending-cli-listener",
    JWT_SECRET: randomBytes(32).toString("hex"),
    REDIS_URL: "",
    FCM_PROJECT_ID: "",
    S3_BUCKET: "",
    TWILIO_ACCOUNT_SID: "",
    SERVICE_AREA_LATITUDE: "",
    SERVICE_AREA_LONGITUDE: "",
    SERVICE_AREA_RADIUS_METERS: "",
  });
  const prices = await stripe.prices.list({
    lookup_keys: ["yespiz_plus_30_days_v1"],
    active: true,
    limit: 1,
  });
  if (!prices.data[0])
    throw new Error("Run scripts/setup-stripe-sandbox.cjs first.");
  process.env.STRIPE_MEMBERSHIP_PRICE_ID = prices.data[0].id;
  // Test credentials before creating a database. Do not echo the key or Stripe response body.
  try {
    await stripe.balance.retrieve();
  } catch {
    throw new Error("Stripe sandbox authentication or network access failed.");
  }
  mongo = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION || "7.0.24" },
    instance: { args: ["--wiredTigerCacheSizeGB", "0.25"] },
  });
  process.env.MONGODB_URI = mongo.getUri();
  await promisify(execFile)(
    process.execPath,
    [
      "-r",
      "ts-node/register",
      "-r",
      "tsconfig-paths/register",
      "src/scripts/seed.ts",
    ],
    {
      cwd: resolve(root, "apps/api"),
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true" },
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = module.createNestApplication({ rawBody: true, logger: false });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new I18nExceptionFilter());
  await app.listen(0, "127.0.0.1");
  const url = await app.getUrl();
  listener = spawn(
    process.env.STRIPE_CLI_BIN || "stripe",
    [
      "listen",
      "--events",
      "payment_intent.succeeded,checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed",
      "--forward-to",
      `${url}/api/v1/payments/webhook/stripe`,
    ],
    {
      env: { ...process.env, STRIPE_API_KEY: secret },
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error("Stripe CLI webhook listener did not become ready.")),
      45000,
    );
    let buffer = "";
    const read = (chunk: Buffer) => {
      buffer = (buffer + chunk.toString()).slice(-16000);
      const match = buffer.match(/whsec_[A-Za-z0-9]+/);
      if (match) {
        webhookSecret = match[0];
        process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
        clearTimeout(timer);
        resolve();
      }
    };
    listener!.stdout!.on("data", read);
    listener!.stderr!.on("data", read);
    listener!.once("error", () => {
      clearTimeout(timer);
      reject(
        new Error("Install the official Stripe CLI or set STRIPE_CLI_BIN."),
      );
    });
    listener!.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("Stripe CLI exited before webhook setup."));
    });
  });
  for (const role of ["client", "admin"]) {
    const login = await post(
      `account/auth/${role}/login`,
      {
        method: "password",
        email:
          role === "client" ? "customer@yespizz.local" : "admin@yespizz.local",
        password: role === "client" ? "Customer123!" : "Admin123!",
      },
      "",
    ).expect(201);
    if (role === "client") customerToken = login.body.accessToken;
    else adminToken = login.body.accessToken;
  }
  const providerLogin = await post(
    "account/auth/provider/login",
    {
      method: "password",
      email: "provider.munich@yespizz.local",
      password: "Provider123!",
    },
    "",
  ).expect(201);
  providerToken = providerLogin.body.accessToken;
  const menu = await request(app.getHttpServer())
    .get("/api/v1/catalog/menu")
    .expect(200);
  menuVersion = menu.body.version.version;
  menuItemId = menu.body.items[0].id ?? menu.body.items[0]._id;
  const address = await post("orders/addresses", {
    label: "Sandbox",
    street: "Test delivery",
    longitude: 11.58,
    latitude: 48.14,
  }).expect(201);
  addressId = address.body.id ?? address.body._id;
}, 180000);

afterAll(async () => {
  for (const id of subscriptions) {
    try {
      await stripe.subscriptions.cancel(id);
    } catch {
      console.warn(`Subscription cleanup requires review: ${id}`);
    }
  }
  for (const id of checkoutSessions) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      if (session.status === "open") await stripe.checkout.sessions.expire(id);
    } catch {
      console.warn(`Checkout cleanup requires review: ${id}`);
    }
  }
  // Clean up only intents created by this run, even when an assertion failed.
  for (const id of intents) {
    try {
      const intent = await stripe.paymentIntents.retrieve(id);
      if (intent.livemode) throw new Error("Unexpected live object");
      if (intent.status === "succeeded") {
        const charge =
          typeof intent.latest_charge === "string"
            ? await stripe.charges.retrieve(intent.latest_charge)
            : intent.latest_charge;
        if (charge && !charge.refunded)
          await stripe.refunds.create(
            { payment_intent: id },
            { idempotencyKey: `sandbox-cleanup:${id}` },
          );
      } else if (intent.status !== "canceled")
        await stripe.paymentIntents.cancel(id);
    } catch {
      console.warn(`Sandbox cleanup requires review for ${id}`);
    }
  }
  if (listener?.pid && process.platform !== "win32") {
    try {
      process.kill(-listener.pid, "SIGTERM");
    } catch {
      // The listener may already have exited.
    }
  } else listener?.kill("SIGTERM");
  listener?.stdout?.destroy();
  listener?.stderr?.destroy();
  await app?.close();
  await mongo?.stop();
}, 120000);

test("sandbox success arrives through a real signed webhook, survives replay and refunds once", async () => {
  const { orderId, intentId } = await createPayment();
  const retry = await post("payments/initiate", { orderId }).expect(201);
  expect(retry.body.payment.providerRef).toBe(intentId);
  await stripe.paymentIntents.confirm(intentId, {
    payment_method: "pm_card_visa",
  });
  // No application confirm call: only Stripe CLI delivery can advance the order here.
  await poll(
    () => readOrder(orderId),
    (o) =>
      o.paymentStatus === "captured" && o.orderState !== "awaiting_payment",
  );
  const offers = await request(app.getHttpServer())
    .get("/api/v1/dispatch/offers")
    .set("Authorization", `Bearer ${providerToken}`)
    .expect(200);
  expect(offers.body).toEqual(
    expect.arrayContaining([expect.objectContaining({ orderId, wave: true })]),
  );
  await request(app.getHttpServer())
    .get("/api/v1/dispatch/offers")
    .set("Authorization", `Bearer ${customerToken}`)
    .expect(403);
  const event = await poll(async () => {
    const events = await stripe.events.list({
      type: "payment_intent.succeeded",
      limit: 100,
    });
    return events.data.find(
      (e) =>
        e.type === "payment_intent.succeeded" && e.data.object.id === intentId,
    );
  }, Boolean);
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  await request(app.getHttpServer())
    .post("/api/v1/payments/webhook/stripe")
    .set("Content-Type", "application/json")
    .set("stripe-signature", "invalid")
    .send(payload)
    .expect(400);
  for (let i = 0; i < 2; i++)
    await request(app.getHttpServer())
      .post("/api/v1/payments/webhook/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload)
      .expect(201);
  await post("payments/cancel-order", {
    orderId,
    reason: "Sandbox acceptance test",
  }).expect(201);
  await poll(
    async () => {
      await post("payments/refunds/reconcile", { orderId }, adminToken).expect(
        201,
      );
      return readOrder(orderId);
    },
    (o) => o.refundStatus === "succeeded",
  );
  await post("payments/refunds/reconcile", { orderId }, adminToken).expect(201);
  const refunds = await stripe.refunds.list({ payment_intent: intentId });
  expect(refunds.data).toHaveLength(1);
  expect(refunds.data[0]!.status).toBe("succeeded");
}, 120000);

test("a declined card never dispatches and can retry on the same intent", async () => {
  const { orderId, intentId } = await createPayment();
  await expect(
    stripe.paymentIntents.confirm(intentId, {
      payment_method: "pm_card_visa_chargeDeclined",
    }),
  ).rejects.toMatchObject({ type: "StripeCardError" });
  expect((await readOrder(orderId)).orderState).toBe("awaiting_payment");
  await post("payments/confirm", { orderId }).expect(400);
  const retry = await post("payments/initiate", { orderId }).expect(201);
  expect(retry.body.payment.providerRef).toBe(intentId);
  await stripe.paymentIntents.confirm(intentId, {
    payment_method: "pm_card_visa",
  });
  await poll(
    () => readOrder(orderId),
    (o) => o.paymentStatus === "captured",
  );
  await post("payments/cancel-order", {
    orderId,
    reason: "Sandbox cleanup",
  }).expect(201);
}, 90000);

test("3DS remains unpaid until authentication and can be cancelled without charging", async () => {
  const { orderId, intentId } = await createPayment();
  const intent = await stripe.paymentIntents.confirm(intentId, {
    payment_method: "pm_card_threeDSecure2Required",
    return_url: "http://localhost:8051/payment/",
  });
  expect(intent.status).toBe("requires_action");
  await post("payments/confirm", { orderId }).expect(400);
  expect((await readOrder(orderId)).orderState).toBe("awaiting_payment");
  await post("payments/cancel-order", {
    orderId,
    reason: "Abandoned authentication",
  }).expect(201);
  expect((await stripe.paymentIntents.retrieve(intentId)).status).toBe(
    "canceled",
  );
}, 60000);

test("Plus creates reusable checkout, activates from a real paid invoice, and cancels renewal", async () => {
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const user = (await users
    .findOne({ email: "customer@yespizz.local" })
    .exec())!;
  const requestId = randomUUID();
  await post("rewards/membership", { requestId }).expect(201);
  const checkoutUser = (await users.findById(user.id).exec())!;
  checkoutSessions.add(checkoutUser.membershipCheckoutId!);
  await post("rewards/membership", { requestId: randomUUID() }).expect(201);
  expect((await users.findById(user.id).exec())!.membershipCheckoutId).toBe(
    checkoutUser.membershipCheckoutId,
  );
  expect(checkoutUser.membershipUntil).toBeUndefined();
  const method = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(method.id, {
    customer: checkoutUser.stripeCustomerId!,
  });
  const subscription = await stripe.subscriptions.create({
    customer: checkoutUser.stripeCustomerId!,
    items: [{ price: process.env.STRIPE_MEMBERSHIP_PRICE_ID! }],
    default_payment_method: method.id,
    metadata: { purpose: "membership", userId: user.id },
    expand: ["latest_invoice"],
  });
  subscriptions.add(subscription.id);
  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const invoicePayments = await stripe.invoicePayments.list({
    invoice: invoice.id,
  });
  for (const payment of invoicePayments.data) {
    const pi = payment.payment.payment_intent;
    if (pi) intents.add(typeof pi === "string" ? pi : pi.id);
  }
  const active = await poll(
    () => users.findById(user.id).exec(),
    (u) => !!u?.membershipUntil && u.membershipUntil.getTime() > Date.now(),
  );
  const until = active!.membershipUntil!.getTime();
  const cancelled = await post("rewards/membership/cancel", {}).expect(201);
  expect(cancelled.body.membership.active).toBe(true);
  expect(cancelled.body.membership.cancelled).toBe(true);
  await post("rewards/membership/cancel", {}).expect(201);
  expect(
    (await users.findById(user.id).exec())!.membershipUntil!.getTime(),
  ).toBe(until);
  expect(
    (await stripe.subscriptions.retrieve(subscription.id)).cancel_at_period_end,
  ).toBe(true);
}, 90000);

test("real group shares settle exactly once and cancellation refunds each payer", async () => {
  const groups = app.get<Model<GroupCartDocument>>(
    getModelToken(GroupCart.name),
  );
  const users = app.get<Model<UserDocument>>(getModelToken(User.name));
  const user = (await users
    .findOne({ email: "customer@yespizz.local" })
    .exec())!;
  let group = (
    await post("groups", {
      title: "Sandbox shared order",
      menuVersion,
      split: true,
      deadline: new Date(Date.now() + 1800000).toISOString(),
    }).expect(201)
  ).body;
  group = (
    await post(`groups/${group.token}/items`, {
      revision: group.revision,
      lines: [{ menuItemId, quantity: 1, size: "large" }],
    }).expect(201)
  ).body;
  const friendLogin = await post(
    "account/auth/register",
    {
      firstName: "Sandbox",
      lastName: "Friend",
      email: `group-${randomUUID()}@example.test`,
      password: "TestPassword123!",
    },
    "",
  ).expect(201);
  const friendToken = friendLogin.body.accessToken;
  group = (
    await post(
      `groups/${group.token}/items`,
      {
        revision: group.revision,
        lines: [{ menuItemId, quantity: 2, size: "large" }],
      },
      friendToken,
    ).expect(201)
  ).body;
  group = (
    await post(`groups/${group.token}/lock`, {
      revision: group.revision,
      addressId,
    }).expect(201)
  ).body;
  const checkout = await post(`groups/${group.token}/share`, {}).expect(201);
  expect(typeof checkout.body.checkoutUrl).toBe("string");
  const row = (await groups.findOne({ token: group.token }).exec())!;
  const sessionId = row.members[0].checkoutId!;
  checkoutSessions.add(sessionId);
  await stripe.checkout.sessions.expire(sessionId);
  // Exercise actual server settlement independently of the hosted browser form.
  const shareIntents: string[] = [];
  for (const member of row.members) {
    const intent = await stripe.paymentIntents.create({
      amount: member.shareCents,
      currency: "eur",
      payment_method: "pm_card_visa",
      confirm: true,
      payment_method_types: ["card"],
      metadata: {
        purpose: "group_share",
        token: group.token,
        round: String(row.paymentRound),
        userId: member.userId,
      },
    });
    intents.add(intent.id);
    shareIntents.push(intent.id);
    member.checkoutId = undefined;
    member.paid = true;
    member.intentId = intent.id;
  }
  row.markModified("members");
  await row.save();
  const submitted = await post(`groups/${group.token}/submit`, {
    revision: group.revision,
    expectedTotalCents: group.quote.totalCents,
  }).expect(201);
  const orderId = submitted.body.orderId;
  await post(`groups/${group.token}/submit`, {
    revision: group.revision,
    expectedTotalCents: group.quote.totalCents,
  }).expect(201);
  expect((await readOrder(orderId)).paymentStatus).toBe("captured");
  await post("payments/cancel-order", {
    orderId,
    reason: "Sandbox acceptance cleanup",
  }).expect(201);
  await post("payments/refunds/reconcile", { orderId }, adminToken).expect(201);
  for (const intentId of shareIntents) {
    const refunds = await stripe.refunds.list({ payment_intent: intentId });
    expect(refunds.data.length).toBe(1);
    expect(refunds.data[0].status).toBe("succeeded");
  }
}, 90000);
