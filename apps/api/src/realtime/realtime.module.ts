import { MongooseModule } from "@nestjs/mongoose";
import { Provider, ProviderSchema } from "../providers/schemas/provider.schema";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeGateway } from "./realtime.gateway";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") || "dev-secret",
      }),
    }),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
