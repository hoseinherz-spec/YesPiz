import { OperationsModule } from "./operations/operations.module";
import { InsightsModule } from "./insights/insights.module";
import { GroupsModule } from "./groups/groups.module";
import { RewardsModule } from "./rewards/rewards.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { FinanceModule } from "./finance/finance.module";
import { CareModule } from "./care/care.module";
import { CommunicationsModule } from "./communications/communications.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { MediaModule } from "./media/media.module";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
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
import { SlaModule } from "./sla/sla.module";

@Module({
  imports: [
    ReferralsModule,
    RewardsModule,
    GroupsModule,
    InsightsModule,
    OperationsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
    ]),
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
    CareModule,
    FinanceModule,
    MediaModule,
    CommunicationsModule,
    DeliveryModule,
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
    SlaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
