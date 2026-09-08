import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { AccountModule } from "../account/account.module";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CouriersController } from "./couriers.controller";
import { CouriersService } from "./couriers.service";
import {
  CourierProfile,
  CourierProfileSchema,
  CourierSession,
  CourierSessionSchema,
} from "./schemas/courier.schema";

@Module({
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: CourierProfile.name, schema: CourierProfileSchema },
      { name: CourierSession.name, schema: CourierSessionSchema },
    ]),
  ],
  controllers: [CouriersController],
  providers: [CouriersService],
  exports: [CouriersService],
})
export class CouriersModule {}
