import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common";
import { IsIn, IsString, MaxLength, MinLength } from "class-validator";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { PushService } from "./push.service";
class DeviceTokenDto {
  @IsString() @MinLength(20) @MaxLength(4096) token!: string;
}
class RegisterDeviceDto extends DeviceTokenDto {
  @IsIn(["web", "android", "ios"]) platform!: string;
}
@Controller("push")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PushController {
  constructor(private readonly push: PushService) {}
  @Post("devices") register(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.push.register(
      user.userId,
      dto.token,
      dto.platform,
      user.tokenExpiresAt,
    );
  }
  @Delete("devices") unregister(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: DeviceTokenDto,
  ) {
    return this.push.unregister(user.userId, dto.token);
  }
  @Roles(UserRole.ADMIN) @Get("failures") failures() {
    return this.push.failures();
  }
}
