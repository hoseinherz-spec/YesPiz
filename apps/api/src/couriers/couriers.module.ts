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
    MongooseModule.forFeature([
      { name: CourierProfile.name, schema: CourierProfileSchema },
      { name: CourierSession.name, schema: CourierSessionSchema },
    ]),
  ],
  controllers: [CouriersController],
  providers: [CouriersService],
  exports: [CouriersService],
})
export class CouriersModule {}
