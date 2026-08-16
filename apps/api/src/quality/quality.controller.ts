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
import { ProvidersService } from "../providers/providers.service";
import {
  CreateTestOrderDto,
  RecordQualityIncidentDto,
  SubmitChecklistDto,
  SubmitReadyPhotoDto,
  SubmitSealDto,
  UnsuspendProviderDto,
} from "./dto/quality.dto";
import { QualityService } from "./quality.service";

@ApiTags("quality")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("quality")
export class QualityController {
  constructor(
    private readonly quality: QualityService,
    private readonly providers: ProvidersService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Get("providers/:id")
  getProvider(@Param("id") id: string) {
    return this.quality.getProviderQuality(id);
  }

  @Roles(UserRole.PROVIDER)
  @Get("me")
  async getSelf(@CurrentUser() user: JwtPayloadUser) {
    const provider = await this.providers.getSelf(user.userId);
    return this.quality.getProviderQuality(provider.id);
  }

  @Roles(UserRole.PROVIDER)
  @Post("orders/:id/checklist")
  async checklist(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: SubmitChecklistDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.quality.submitChecklist(provider.id, id, dto);
  }

  @Roles(UserRole.PROVIDER)
  @Post("orders/:id/seal")
  async seal(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: SubmitSealDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.quality.submitSeal(provider.id, id, dto);
  }

  @Roles(UserRole.PROVIDER)
  @Post("orders/:id/ready-photo")
  async readyPhoto(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: SubmitReadyPhotoDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.quality.submitReadyPhoto(provider.id, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post("providers/:id/incidents")
  recordIncident(
    @Param("id") id: string,
    @Body() dto: RecordQualityIncidentDto,
  ) {
    return this.quality.recordIncident(id, dto.kind);
  }

  @Roles(UserRole.ADMIN)
  @Post("providers/:id/unsuspend")
  unsuspend(@Param("id") id: string, @Body() dto: UnsuspendProviderDto) {
    return this.quality.unsuspend(id, dto.reason);
  }

  @Roles(UserRole.ADMIN)
  @Post("test-orders")
  createTestOrder(@Body() dto: CreateTestOrderDto) {
    return this.quality.createTestOrder(dto);
  }
}
