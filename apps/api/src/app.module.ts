import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountModule } from "./account/account.module";
import { AppConfigModule } from "./app-config/app-config.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BatchesModule } from "./batches/batches.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CouriersModule } from "./couriers/couriers.module";
import { DispatchModule } from "./dispatch/dispatch.module";
import { EtaModule } from "./eta/eta.module";
import { IncidentsModule } from "./incidents/incidents.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { ProofModule } from "./proof/proof.module";
import { ProvidersModule } from "./providers/providers.module";
import { PushModule } from "./push/push.module";
import { QualityModule } from "./quality/quality.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>("MONGODB_URI") ||
          "mongodb://127.0.0.1:27017/yespizz",
      }),
    }),
    RedisModule,
    RealtimeModule,
    PushModule,
    AppConfigModule,
    AccountModule,
    CatalogModule,
    ProvidersModule,
    OrdersModule,
    QualityModule,
    EtaModule,
    DispatchModule,
    PaymentsModule,
    CouriersModule,
    ProofModule,
    BatchesModule,
    IncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
