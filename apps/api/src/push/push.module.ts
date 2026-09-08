import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PushController } from "./push.controller";
import { Provider, ProviderSchema } from "../providers/schemas/provider.schema";
import { PushDevice, PushDeviceSchema } from "./schemas/push-device.schema";
import { PushService } from "./push.service";
import {
  PushNotification,
  PushNotificationSchema,
} from "./schemas/push-notification.schema";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: PushDevice.name, schema: PushDeviceSchema },
      { name: PushNotification.name, schema: PushNotificationSchema },
    ]),
  ],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
