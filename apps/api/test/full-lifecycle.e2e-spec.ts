import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { I18nExceptionFilter } from '../src/common/filters/i18n-exception.filter';

/**
 * QA full-lifecycle: admin → customer → payment → provider kitchen →
 * batch → courier session/location → blind tracking + RBAC isolation +
 * exception/admin-review path.
 */
describe('Full lifecycle all roles (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  let adminToken = '';
  let providerToken = '';
  let providerEntityId = '';
  let providerUserId = '';
  let customerToken = '';
  let courierToken = '';
  let courierUserId = '';
  let menuVersion = 0;
  let menuItemId = '';
  let addressId = '';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = 'qa-full-lifecycle-secret';
    process.env.OTP_DEV_BYPASS = 'true';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.REDIS_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
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
      .post('/api/v1/account/auth/register')
      .send({
        firstName: role,
        lastName: 'QA',
        email,
        password,
        role,
      })
      .expect(201);

    const login = await request(server)
      .post(`/api/v1/account/auth/${loginRole}/login`)
      .send({ method: 'password', email, password })
      .expect(201);

    return {
      token: login.body.accessToken as string,
      userId: login.body.user.id as string,
    };
  }

  it('boots roles, menu, happy path through courier assign + blind view', async () => {
    const server = app.getHttpServer();

    const admin = await registerAndLogin(
      'admin',
      'qa.admin@test.local',
      'Admin123!',
      'admin',
    );
    adminToken = admin.token;

    const provider = await registerAndLogin(
      'provider',
      'qa.provider@test.local',
      'Provider123!',
      'provider',
    );
    providerToken = provider.token;
    providerUserId = provider.userId;

    const customer = await registerAndLogin(
      'client',
      'qa.customer@test.local',
      'Customer123!',
      'client',
    );
    customerToken = customer.token;

    const courier = await registerAndLogin(
      'courier',
      'qa.courier@test.local',
      'Courier123!',
      'courier',
    );
    courierToken = courier.token;
    courierUserId = courier.userId;

    const providerRes = await request(server)
      .post('/api/v1/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: providerUserId,
        name: 'QA Kitchen',
        address: 'Marienplatz 1, München',
        longitude: 11.5755,
        latitude: 48.1374,
        rating: 4.7,
      })
      .expect(201);
    providerEntityId = String(providerRes.body.id ?? providerRes.body._id);

    const versionRes = await request(server)
      .post('/api/v1/catalog/versions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'qa menu' })
      .expect(201);
    const versionId = versionRes.body.id ?? versionRes.body._id;

    const categoryRes = await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/categories`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Pizzas', sortOrder: 1 })
      .expect(201);
    const categoryId = categoryRes.body.id ?? categoryRes.body._id;

    const itemRes = await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: 'QA Margherita',
        description: 'Test pizza',
        priceCents: 999,
        prepWeight: 1,
      })
      .expect(201);
    menuItemId = String(itemRes.body.id ?? itemRes.body._id);

    await request(server)
      .post(`/api/v1/catalog/versions/${versionId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    const menu = await request(server).get('/api/v1/catalog/menu').expect(200);
    menuVersion = menu.body.version.version;

    const addressRes = await request(server)
      .post('/api/v1/orders/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        label: 'Home',
        street: 'Maximilianstrasse 12',
        city: 'Munich',
        zipcode: '80539',
        country: 'DE',
        longitude: 11.58,
        latitude: 48.14,
        isDefault: true,
      })
      .expect(201);
    addressId = String(addressRes.body.id ?? addressRes.body._id);

    const orderRes = await request(server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: 'card',
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);
    expect(orderRes.body.providerId).toBeUndefined();
    expect(orderRes.body.providerName).toBeUndefined();

    await request(server)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, method: 'card' })
      .expect(201);

    const offers = await request(server)
      .get('/api/v1/dispatch/offers')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(offers.body.length).toBeGreaterThan(0);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(201);

    let tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.providerId).toBeUndefined();
    expect(tracked.body.providerName).toBeUndefined();
    expect(['kitchen', 'preparing', 'received']).toContain(
      tracked.body.customerStatus,
    );

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'PREPARING' })
      .expect(200);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe('preparing');

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'READY_FOR_PICKUP' })
      .expect(200);

    const suggest = await request(server)
      .post('/api/v1/batches/suggest')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId })
      .expect(201);
    expect(suggest.body.suggestedOrderIds).toContain(orderId);

    const batchRes = await request(server)
      .post('/api/v1/batches')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ providerId: providerEntityId, orderIds: [orderId] })
      .expect(201);
    const batchId = String(batchRes.body.id ?? batchRes.body._id);

    await request(server)
      .post('/api/v1/couriers/sessions/start')
      .set('Authorization', `Bearer ${courierToken}`)
      .send({ code: 'QA-START-001' })
      .expect(201);

    await request(server)
      .post(`/api/v1/batches/${batchId}/assign-courier`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ courierId: courierUserId })
      .expect(201);

    const assigned = await request(server)
      .get('/api/v1/batches/assigned')
      .set('Authorization', `Bearer ${courierToken}`)
      .expect(200);
    expect(assigned.body.some((b: { _id?: string; id?: string }) => String(b.id ?? b._id) === batchId)).toBe(
      true,
    );

    await request(server)
      .post('/api/v1/couriers/me/location')
      .set('Authorization', `Bearer ${courierToken}`)
      .send({ longitude: 11.581, latitude: 48.141 })
      .expect(201);

    tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe('driver');
    expect(tracked.body.providerId).toBeUndefined();
    expect(tracked.body.courierId).toBeUndefined();

    const loc = await request(server)
      .get(`/api/v1/orders/${orderId}/courier-location`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(loc.body.longitude).toBeCloseTo(11.581, 3);
    expect(loc.body.latitude).toBeCloseTo(48.141, 3);

    // Delivery statuses PICKED_UP / ON_THE_WAY / DELIVERED have no public
    // courier transition API in phase-1 — stop at ASSIGNED_TO_COURIER.
  }, 180_000);

  it('enforces RBAC isolation across roles', async () => {
    const server = app.getHttpServer();

    await request(server)
      .get('/api/v1/dispatch/offers')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/orders/kitchen')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/orders/admin/review')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/dispatch/offers')
      .set('Authorization', `Bearer ${courierToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/batches/assigned')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/couriers/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/app-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  }, 60_000);

  it('exception stays blind for customer and admin can resolve', async () => {
    const server = app.getHttpServer();

    const orderRes = await request(server)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        menuVersion,
        addressId,
        paymentMethod: 'card',
        lines: [{ menuItemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = String(orderRes.body.id ?? orderRes.body._id);

    await request(server)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, method: 'card' })
      .expect(201);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(201);

    await request(server)
      .patch(`/api/v1/orders/${orderId}/kitchen-status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'EXCEPTION_REPORTED' })
      .expect(200);

    const tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.customerStatus).toBe('kitchen');
    expect(tracked.body.status).toBeUndefined();

    const review = await request(server)
      .get('/api/v1/orders/admin/review')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      review.body.some(
        (o: { _id?: string; id?: string }) => String(o.id ?? o._id) === orderId,
      ),
    ).toBe(true);

    await request(server)
      .patch(`/api/v1/orders/admin/review/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PREPARING' })
      .expect(200);

    const after = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(after.body.customerStatus).toBe('preparing');
  }, 120_000);

  it('rejects wrong-role password login as unauthenticated', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/api/v1/account/auth/admin/login')
      .send({
        method: 'password',
        email: 'qa.customer@test.local',
        password: 'Customer123!',
      })
      .expect(401);
  });
});
