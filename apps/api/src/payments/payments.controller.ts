import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { InitiatePaymentDto } from "./dto/payment.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("cash-availability")
  cashAvailability(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.cashAvailability(user.userId);
  }

  @Post("initiate")
  initiate(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.payments.initiate(user.userId, dto);
  }
}
