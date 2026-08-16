import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AccountService } from "./account.service";
import { RestoreCashDto } from "./dto/admin-cash.dto";
import {
  AcceptInviteDto,
  BootstrapAdminDto,
  ConfirmOtpDto,
  CreateInviteDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  RoleLoginDto,
  SendOtpDto,
} from "./dto/auth.dto";

@ApiTags("account")
@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("auth/register")
  register(@Body() dto: RegisterDto) {
    return this.account.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("auth/otp")
  sendOtp(@Body() dto: SendOtpDto) {
    return this.account.sendOtp(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("auth/otp/confirm")
  confirmOtp(@Body() dto: ConfirmOtpDto) {
    return this.account.confirmOtp(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("auth/login")
  login(@Body() dto: LoginDto) {
    return this.account.login(dto);
  }

  @Post("auth/bootstrap-admin")
  bootstrapAdmin(@Body() dto: BootstrapAdminDto) {
    return this.account.bootstrapAdmin(dto);
  }

  @Post("auth/invites/accept")
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.account.acceptInvite(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("auth/password/forgot")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.account.requestPasswordReset(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("auth/password/reset")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.account.confirmPasswordReset(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post("auth/:role/login")
  roleLogin(@Param("role") role: string, @Body() dto: RoleLoginDto) {
    return this.account.login({ ...dto, role });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("admin/invites")
  createInvite(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateInviteDto,
  ) {
    return this.account.createInvite(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile/me")
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.account.getProfile(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("admin/users/:id/cash-restore")
  restoreCash(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: RestoreCashDto,
  ) {
    return this.account.restoreCash(id, dto.reason, user.userId);
  }
}
