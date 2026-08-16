import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import {
  CreateProviderDto,
  EightySixDto,
  PauseOrdersDto,
  ProviderSelfUpdateDto,
  UpdateProviderDto,
} from "./dto/provider.dto";
import { ProvidersService } from "./providers.service";

@ApiTags("providers")
@ApiBearerAuth()
@Controller("providers")
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateProviderDto) {
    return this.providers.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.providers.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Get("me/profile")
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.providers.getSelf(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Patch("me/profile")
  updateMe(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ProviderSelfUpdateDto,
  ) {
    return this.providers.updateSelf(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post("me/eighty-six")
  async eightySix(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: EightySixDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.providers.eightySix(provider.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Delete("me/eighty-six")
  async clearEightySix(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: EightySixDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.providers.clearEightySix(provider.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post("me/pause")
  async pause(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: PauseOrdersDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.providers.pauseOrders(provider.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post("me/resume")
  async resume(@CurrentUser() user: JwtPayloadUser) {
    const provider = await this.providers.getSelf(user.userId);
    return this.providers.resumeOrders(provider.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":id")
  get(@Param("id") id: string) {
    return this.providers.getById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateProviderDto) {
    return this.providers.update(id, dto);
  }
}
