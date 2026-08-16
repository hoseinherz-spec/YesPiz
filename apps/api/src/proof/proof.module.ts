import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { ProvidersModule } from "../providers/providers.module";
import { ProofController } from "./proof.controller";
import { ProofService } from "./proof.service";
import {
  DeliveryProof,
  DeliveryProofSchema,
} from "./schemas/delivery-proof.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliveryProof.name, schema: DeliveryProofSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    ProvidersModule,
  ],
  controllers: [ProofController],
  providers: [ProofService],
  exports: [ProofService],
})
export class ProofModule {}
