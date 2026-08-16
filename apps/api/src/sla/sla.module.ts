import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../account/schemas/user.schema";
import { AppConfigModule } from "../app-config/app-config.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { SlaController } from "./sla.controller";
import { SlaService } from "./sla.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AppConfigModule,
  ],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
