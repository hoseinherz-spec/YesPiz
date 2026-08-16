import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { I18nExceptionFilter } from '../src/common/filters/i18n-exception.filter';

describe('Happy path (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let customerToken = '';
  let providerToken = '';
  let menuVersion = 0;
  let menuItemId = '';
  let addressId = '';
  let orderId = '';
  let providerUserId = '';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = 'test-secret';
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

  it('registers admin, publishes menu, customer orders, provider accepts', async () => {
    const server = app.getHttpServer();

    const adminBoot = await request(server)
      .post('/api/v1/account/auth/bootstrap-admin')
      .send({
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@test.local',
        password: 'Admin123!',
      })
      .expect(201);
    const adminToken = adminBoot.body.accessToken as string;

    await request(server)
      .post('/api/v1/account/auth/register')
      .send({
        firstName: 'Evil',
        lastName: 'Admin',
        email: 'evil@test.local',
        password: 'Evil123!',
        role: 'admin',
      })
      .expect(400);

    const invite = await request(server)
      .post('/api/v1/account/admin/invites')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'provider', email: 'provider@test.local' })
      .expect(201);

    const providerAccepted = await request(server)
      .post('/api/v1/account/auth/invites/accept')
      .send({
        token: invite.body.token,
        firstName: 'Kitchen',
        lastName: 'Demo',
        email: 'provider@test.local',
        password: 'Provider123!',
      })
      .expect(201);
    providerToken = providerAccepted.body.accessToken;
    providerUserId = providerAccepted.body.user.id;

    await request(server)
      .post('/api/v1/providers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: providerUserId,
        name: 'Test Kitchen',
        address: 'Marienplatz 1, München',
        longitude: 11.5755,
        latitude: 48.1374,
        rating: 4.5,
      })
      .expect(201);

    const versionRes = await request(server)
      .post('/api/v1/catalog/versions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'e2e menu' })
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
        name: 'Margherita',
        description: 'Classic',
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
    expect(menu.body.items.length).toBeGreaterThan(0);

    await request(server)
      .post('/api/v1/account/auth/register')
      .send({
        firstName: 'Cust',
        lastName: 'Omer',
        email: 'customer@test.local',
        password: 'Customer123!',
        role: 'client',
      })
      .expect(201);

    const customerLogin = await request(server)
      .post('/api/v1/account/auth/client/login')
      .send({
        method: 'password',
        email: 'customer@test.local',
        password: 'Customer123!',
      })
      .expect(201);
    customerToken = customerLogin.body.accessToken;

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
    orderId = String(orderRes.body.id ?? orderRes.body._id);
    expect(orderRes.body.providerId).toBeUndefined();
    expect(orderRes.body.customerStatus).toBeTruthy();

    const payRes = await request(server)
      .post('/api/v1/payments/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, method: 'card' })
      .expect(201);
    expect(payRes.body.mock).toBe(true);

    const offers = await request(server)
      .get('/api/v1/dispatch/offers')
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(200);
    expect(Array.isArray(offers.body)).toBe(true);
    expect(offers.body.length).toBeGreaterThan(0);

    await request(server)
      .post(`/api/v1/dispatch/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${providerToken}`)
      .expect(201);

    const tracked = await request(server)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(tracked.body.providerId).toBeUndefined();
    expect(tracked.body.providerName).toBeUndefined();
    expect(['kitchen', 'preparing', 'received']).toContain(
      tracked.body.customerStatus,
    );
  }, 120_000);
});
