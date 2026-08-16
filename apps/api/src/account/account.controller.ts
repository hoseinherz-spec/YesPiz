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
import { AccountService } from "./account.service";
import { RestoreCashDto } from "./dto/admin-cash.dto";
import {
  ConfirmOtpDto,
  LoginDto,
  RegisterDto,
  RoleLoginDto,
  SendOtpDto,
} from "./dto/auth.dto";

@ApiTags("account")
@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Post("auth/register")
  register(@Body() dto: RegisterDto) {
    return this.account.register(dto);
  }

  @Post("auth/otp")
  sendOtp(@Body() dto: SendOtpDto) {
    return this.account.sendOtp(dto);
  }

  @Post("auth/otp/confirm")
  confirmOtp(@Body() dto: ConfirmOtpDto) {
    return this.account.confirmOtp(dto);
  }

  @Post("auth/login")
  login(@Body() dto: LoginDto) {
    return this.account.login(dto);
  }

  @Post("auth/:role/login")
  roleLogin(@Param("role") role: string, @Body() dto: RoleLoginDto) {
    return this.account.login({ ...dto, role });
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
  restoreCash(@Param("id") id: string, @Body() dto: RestoreCashDto) {
    return this.account.restoreCash(id, dto.reason);
  }
}
