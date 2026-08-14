import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ProvidersService } from "../providers/providers.service";
import { DispatchService } from "./dispatch.service";

@ApiTags("dispatch")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("dispatch")
export class DispatchController {
  constructor(
    private readonly dispatch: DispatchService,
    private readonly providers: ProvidersService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Post("orders/:orderId/broadcast")
  broadcast(@Param("orderId") orderId: string) {
    return this.dispatch.startDispatch(orderId);
  }

  @Roles(UserRole.PROVIDER)
  @Get("offers")
  async myOffers(@CurrentUser() user: JwtPayloadUser) {
    const provider = await this.providers.getSelf(user.userId);
    return this.dispatch.listOffersForProvider(provider.id);
  }

  @Roles(UserRole.PROVIDER)
  @Post("orders/:orderId/accept")
  async accept(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.dispatch.acceptOffer(orderId, provider.id);
  }

  @Roles(UserRole.PROVIDER)
  @Post("orders/:orderId/reject")
  async reject(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.dispatch.rejectOffer(orderId, provider.id);
  }
}
