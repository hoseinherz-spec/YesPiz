import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { ProvidersModule } from "../providers/providers.module";
import { BatchesController } from "./batches.controller";
import { BatchesService } from "./batches.service";
import { Batch, BatchSchema } from "./schemas/batch.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Batch.name, schema: BatchSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    ProvidersModule,
  ],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
