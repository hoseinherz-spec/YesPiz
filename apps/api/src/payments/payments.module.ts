import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import { DispatchModule } from "../dispatch/dispatch.module";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { Payment, PaymentSchema } from "./schemas/payment.schema";
import { StripeWebhookController } from "./stripe-webhook.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    AccountModule,
    DispatchModule,
  ],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
