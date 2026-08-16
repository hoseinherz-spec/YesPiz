import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CatalogModule } from "../catalog/catalog.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { ProvidersModule } from "../providers/providers.module";
import { QualityController } from "./quality.controller";
import { QualityService } from "./quality.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CatalogModule,
    ProvidersModule,
  ],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
