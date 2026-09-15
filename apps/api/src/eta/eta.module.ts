import { Provider, ProviderSchema } from "../providers/schemas/provider.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { RoutingService } from "./routing.service";
import { EtaService } from "./eta.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Provider.name, schema: ProviderSchema },
    ]),
  ],
  providers: [EtaService, RoutingService],
  exports: [EtaService],
})
export class EtaModule {}
