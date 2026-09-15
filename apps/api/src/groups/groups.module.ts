import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CatalogModule } from "../catalog/catalog.module";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { AccountModule } from "../account/account.module";
import { GroupCart, GroupCartSchema } from "./group.schema";
import { GroupsService } from "./groups.service";
import {
  CreateGroupDto,
  GroupContributionDto,
  GroupLockDto,
  GroupRevisionDto,
  GroupSubmitDto,
} from "./group.dto";
@Controller("groups")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
class GroupsController {
  constructor(private readonly service: GroupsService) {}
  @Get() list(@CurrentUser() u: JwtPayloadUser) {
    return this.service.list(u.userId);
  }
  @Post() create(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: CreateGroupDto,
  ) {
    return this.service.create(u.userId, dto);
  }
  @Get(":token") read(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
  ) {
    return this.service.read(u.userId, token);
  }
  @Post(":token/items") items(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
    @Body() dto: GroupContributionDto,
  ) {
    return this.service.contribute(u.userId, token, dto);
  }
  @Post(":token/lock") lock(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
    @Body() dto: GroupLockDto,
  ) {
    return this.service.lock(u.userId, token, dto);
  }
  @Post(":token/share") share(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
  ) {
    return this.service.payShare(u.userId, token);
  }
  @Post(":token/submit") submit(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
    @Body() dto: GroupSubmitDto,
  ) {
    return this.service.submit(u.userId, token, dto);
  }
  @Post(":token/reopen") reopen(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
    @Body() dto: GroupRevisionDto,
  ) {
    return this.service.reopen(u.userId, token, dto.revision);
  }
  @Post(":token/cancel") cancel(
    @CurrentUser() u: JwtPayloadUser,
    @Param("token") token: string,
    @Body() dto: GroupRevisionDto,
  ) {
    return this.service.cancel(u.userId, token, dto.revision);
  }
}
@Module({
  imports: [
    OrdersModule,
    CatalogModule,
    PaymentsModule,
    AccountModule,
    MongooseModule.forFeature([
      { name: GroupCart.name, schema: GroupCartSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
