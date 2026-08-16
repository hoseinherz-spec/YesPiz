import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import { CatalogModule } from "../catalog/catalog.module";
import {
  CourierSession,
  CourierSessionSchema,
} from "../couriers/schemas/courier.schema";
import { EtaModule } from "../eta/eta.module";
import { ProvidersModule } from "../providers/providers.module";
import { QualityModule } from "../quality/quality.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import {
  DeliveryAddress,
  DeliveryAddressSchema,
} from "./schemas/address.schema";
import { Order, OrderSchema } from "./schemas/order.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: DeliveryAddress.name, schema: DeliveryAddressSchema },
      { name: CourierSession.name, schema: CourierSessionSchema },
    ]),
    AccountModule,
    CatalogModule,
    ProvidersModule,
    QualityModule,
    EtaModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}
