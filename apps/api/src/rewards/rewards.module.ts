import { BillingModule } from "../billing/billing.module";
import { BillingService } from "../billing/billing.service";
import { RewardPolicyModule } from "./policy.module";
import { Body, Controller, Get, Module, Post, UseGuards } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IsUUID } from "class-validator";
import { User, UserSchema } from "../account/schemas/user.schema";
import { Order, OrderSchema } from "../orders/schemas/order.schema";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { WalletModule } from "../wallet/wallet.module";
import { RewardsService } from "./rewards.service";
class MembershipDto {
  @IsUUID() requestId!: string;
}
@Controller("rewards")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
class RewardsController {
  constructor(
    private readonly service: RewardsService,
    private readonly billing: BillingService,
  ) {}
  @Get() summary(@CurrentUser() u: JwtPayloadUser) {
    return this.service.summary(u.userId);
  }
  @Post("claim") claim(@CurrentUser() u: JwtPayloadUser) {
    return this.service.claim(u.userId);
  }
  @Post("membership") enroll(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: MembershipDto,
  ) {
    return this.billing.checkout(u.userId, dto.requestId);
  }
  @Post("membership/refresh") async refresh(@CurrentUser() u: JwtPayloadUser) {
    await this.billing.refresh(u.userId);
    return this.service.summary(u.userId);
  }
  @Post("membership/portal") portal(@CurrentUser() u: JwtPayloadUser) {
    return this.billing.portal(u.userId);
  }
  @Post("membership/cancel") async cancel(@CurrentUser() u: JwtPayloadUser) {
    await this.billing.cancel(u.userId);
    return this.service.summary(u.userId);
  }
}
@Module({
  imports: [
    WalletModule,
    BillingModule,
    RewardPolicyModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
