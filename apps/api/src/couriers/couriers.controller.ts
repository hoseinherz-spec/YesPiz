import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CouriersService } from "./couriers.service";
import {
  IssueSessionCodeDto,
  SessionCodeDto,
  UpdateCourierLocationDto,
  UpdateCourierProfileDto,
} from "./dto/courier.dto";

@ApiTags("couriers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COURIER)
@Controller("couriers")
export class CouriersController {
  constructor(private readonly couriers: CouriersService) {}

  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @Get("available")
  available() {
    return this.couriers.listAvailable();
  }

  @Roles(UserRole.ADMIN)
  @Get("operations")
  operations() {
    return this.couriers.listForOperations();
  }

  @Roles(UserRole.ADMIN)
  @Post("sessions/code")
  issue(@CurrentUser() user: JwtPayloadUser, @Body() dto: IssueSessionCodeDto) {
    return this.couriers.issueSessionCode(
      user.userId,
      dto.courierId,
      dto.action,
    );
  }

  @Get("sessions/current")
  current(@CurrentUser() user: JwtPayloadUser) {
    return this.couriers.currentSession(user.userId);
  }

  @Get("me")
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.couriers.getOrCreateProfile(user.userId);
  }

  @Patch("me")
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateCourierProfileDto,
  ) {
    return this.couriers.updateProfile(user.userId, dto);
  }

  @Post("me/location")
  location(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateCourierLocationDto,
  ) {
    return this.couriers.updateLocation(user.userId, dto);
  }

  @Post("sessions/start")
  start(@CurrentUser() user: JwtPayloadUser, @Body() dto: SessionCodeDto) {
    return this.couriers.startSession(user.userId, dto);
  }

  @Post("sessions/end")
  end(@CurrentUser() user: JwtPayloadUser, @Body() dto: SessionCodeDto) {
    return this.couriers.endSession(user.userId, dto);
  }
}
