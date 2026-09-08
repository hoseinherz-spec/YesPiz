import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { I18nExceptionFilter } from "./common/filters/i18n-exception.filter";
import {
  assertProductionSecurity,
  parseCorsOrigins,
} from "./common/security/production-guards";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  assertProductionSecurity(config);
  app.enableShutdownHooks();
  (
    app as import("@nestjs/platform-express").NestExpressApplication
  ).useBodyParser("json", { limit: "8mb" });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(incoming)
        ? incoming
        : randomUUID();
    res.setHeader("X-Request-Id", requestId);
    const started = Date.now();
    res.on("finish", () =>
      console.log(
        JSON.stringify({
          type: "http",
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: parseCorsOrigins(config),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new I18nExceptionFilter());

  if (config.get<string>("SEED_ON_BOOT") === "true") {
    const { seedApplication } = await import("./scripts/seed");
    await seedApplication(app);
  }

  const isProd = config.get<string>("NODE_ENV") === "production";
  const swaggerEnabled =
    config.get<string>("SWAGGER_ENABLED") === "true" || !isProd;
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Yespizz API")
      .setDescription("Blind-marketplace pizza delivery API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = Number(config.get("PORT") || 8058);
  await app.listen(port);

  console.log(`Yespizz API listening on http://localhost:${port}/api/v1`);
  if (swaggerEnabled) {
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
  console.log(
    `Realtime namespace ws://localhost:${port}/realtime (join rooms via "join")`,
  );
  console.log(
    "Token storage: clients must keep JWTs in memory or secure storage; never localStorage for production Capacitor/web without XSS review (see docs/DEMO.md).",
  );
}

bootstrap();
