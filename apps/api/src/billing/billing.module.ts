import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../account/schemas/user.schema";
import { BillingService } from "./billing.service";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
