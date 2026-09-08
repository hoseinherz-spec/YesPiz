import { getConnectionToken } from "@nestjs/mongoose";
import { RedisService } from "../src/redis/redis.service";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppController } from "../src/app.controller";
import { AppService } from "../src/app.service";
import { I18nExceptionFilter } from "../src/common/filters/i18n-exception.filter";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: {
            readyState: 1,
            db: { admin: () => ({ ping: async () => ({ ok: 1 }) }) },
          },
        },
        { provide: RedisService, useValue: { ready: async () => true } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new I18nExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1 returns Yespizz API hello payload", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1").expect(200);
    expect(res.body.message).toBe("Yespizz API");
    expect(typeof res.body.hello).toBe("string");
  });
});
