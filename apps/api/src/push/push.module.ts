import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PushService } from "./push.service";
import {
  PushNotification,
  PushNotificationSchema,
} from "./schemas/push-notification.schema";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PushNotification.name, schema: PushNotificationSchema },
    ]),
  ],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
