import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EtaModule } from "../eta/eta.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { ProvidersModule } from "../providers/providers.module";
import { DispatchController } from "./dispatch.controller";
import { DispatchService } from "./dispatch.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ProvidersModule,
    EtaModule,
  ],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
