import { CouriersModule } from "../couriers/couriers.module";
import { Batch, BatchSchema } from "../batches/schemas/batch.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import { IncidentsController } from "./incidents.controller";
import { IncidentsService } from "./incidents.service";
import { Incident, IncidentSchema } from "./schemas/incident.schema";

@Module({
  imports: [
    CouriersModule,
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
