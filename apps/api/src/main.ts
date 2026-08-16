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
