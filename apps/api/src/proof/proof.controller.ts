import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import {
  CashReceiptDto,
  DeliverProofDto,
  EnRouteDto,
  PickupProofDto,
} from "./dto/proof.dto";
import { ProofService } from "./proof.service";

@ApiTags("proof")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("proof")
export class ProofController {
  constructor(private readonly proof: ProofService) {}

  @Roles(UserRole.COURIER)
  @Get("orders/:orderId")
  get(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
  ) {
    return this.proof.getForCourier(user.userId, orderId);
  }

  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @Get("orders/:orderId/codes")
  codes(@Param("orderId") orderId: string) {
    return this.proof.getPickupCodes(orderId);
  }

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId/pickup")
  pickup(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
    @Body() dto: PickupProofDto,
  ) {
    return this.proof.pickup(user.userId, orderId, dto);
  }

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId/en-route")
  enRoute(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
    @Body() dto: EnRouteDto,
  ) {
    return this.proof.markEnRoute(user.userId, orderId, dto);
  }

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId/deliver")
  deliver(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
    @Body() dto: DeliverProofDto,
  ) {
    return this.proof.deliver(user.userId, orderId, dto);
  }

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId/cash-receipt")
  cashReceipt(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
    @Body() dto: CashReceiptDto,
  ) {
    return this.proof.cashReceipt(user.userId, orderId, dto);
  }

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId/complete")
  complete(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
  ) {
    return this.proof.complete(user.userId, orderId);
  }
}
