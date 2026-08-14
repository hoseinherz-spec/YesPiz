import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { writeFileSync } from "fs";
import { dump } from "js-yaml";
import { join } from "path";
import { AppModule } from "../app.module";

async function exportSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Yespizz API")
    .setDescription("Phase-1 blind-marketplace pizza delivery API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const out = join(process.cwd(), "openapi.yaml");
  writeFileSync(out, dump(document));
  console.log(`Wrote ${out}`);
  await app.close();
}

exportSwagger().catch((err) => {
  console.error(err);
  process.exit(1);
});
