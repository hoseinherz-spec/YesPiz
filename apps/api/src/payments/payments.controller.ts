import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CancelPaymentOrderDto, InitiatePaymentDto } from "./dto/payment.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("cards")
  cards(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.savedCards(user.userId);
  }

  @Post("cards/setup")
  setupCard(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.setupCard(user.userId);
  }

  @Delete("cards/:id")
  removeCard(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.payments.removeCard(user.userId, id);
  }

  @Post("cancel-order")
  cancel(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CancelPaymentOrderDto,
  ) {
    return this.payments.cancel(user.userId, dto.orderId, dto.reason);
  }

  @Roles(UserRole.ADMIN)
  @Get("refunds")
  refunds() {
    return this.payments.listRefunds();
  }

  @Roles(UserRole.ADMIN)
  @Post("refunds/reconcile")
  reconcile(@Body() dto: InitiatePaymentDto) {
    return this.payments.reconcileRefund(dto.orderId);
  }

  @Get("cash-availability")
  cashAvailability(@CurrentUser() user: JwtPayloadUser) {
    return this.payments.cashAvailability(user.userId);
  }

  @Post("confirm")
  confirm(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.payments.confirm(user.userId, dto.orderId);
  }

  @Post("initiate")
  initiate(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.payments.initiate(user.userId, dto);
  }
}
